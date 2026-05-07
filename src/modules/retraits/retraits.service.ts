import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PolitiqueRetrait, StatutRetrait, TypeTransaction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { BUSINESS } from '../../common/constants/business.constants';
import { DemanderRetraitDto } from './dto/demander-retrait.dto';
import { RejeterRetraitDto } from './dto/rejeter-retrait.dto';

@Injectable()
export class RetraitsService {
  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
  ) {}

  // ─── POST /retraits/demander ───────────────────────
  async demander(utilisateurId: string, dto: DemanderRetraitDto) {
    const [utilisateur, tontine] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } }),
      this.prisma.tontine.findUnique({ where: { id: dto.tontineId } }),
    ]);
    if (!tontine) throw new NotFoundException('Tontine introuvable');
    if (tontine.proprietaireId !== utilisateurId) {
      throw new ForbiddenException({ message: 'Seul le propriétaire peut demander un retrait', code: 'ACCES_REFUSE' });
    }
    if (tontine.soldeActuel < dto.montant) {
      throw new BadRequestException({
        message: `Solde insuffisant. Disponible: ${tontine.soldeActuel} FCFA`,
        code: 'SOLDE_INSUFFISANT',
      });
    }

    // Vérifier politique de retrait
    if (tontine.politique === PolitiqueRetrait.BLOQUE) {
      if (!tontine.dateDeverrouillage || tontine.dateDeverrouillage > new Date()) {
        throw new BadRequestException({
          message: `Retrait bloqué jusqu'au ${tontine.dateDeverrouillage?.toLocaleDateString('fr-FR') ?? 'date indéfinie'}`,
          code: 'TONTINE_BLOQUEE',
        });
      }
    }
    if (tontine.politique === PolitiqueRetrait.PROGRAMME) {
      if (!tontine.dateDeverrouillage || tontine.dateDeverrouillage > new Date()) {
        throw new BadRequestException({ message: 'Date de retrait programmée non atteinte', code: 'DATE_NON_ATTEINTE' });
      }
    }

    const seuilAdmin = BUSINESS.SEUIL_RETRAIT_ADMIN;
    const needsAdmin = dto.montant >= seuilAdmin;

    const retrait = await this.prisma.retrait.create({
      data: {
        utilisateurId,
        montant: dto.montant,
        statut: needsAdmin ? StatutRetrait.EN_ATTENTE : StatutRetrait.VALIDE,
      },
    });

    if (!needsAdmin) {
      // Validation et exécution automatique
      await this.executer(retrait.id, utilisateur!.telephone, tontine.id, dto.montant);
    }

    return {
      succes: true,
      message: needsAdmin
        ? `Retrait de ${dto.montant} FCFA en attente de validation Admin (seuil: ${seuilAdmin} FCFA).`
        : `Retrait de ${dto.montant} FCFA validé automatiquement et en cours d'exécution.`,
      donnees: retrait,
    };
  }

  private async executer(retraitId: string, telephone: string, tontineId: string, montant: number) {
    const transfert = await this.kkiapay.initierTransfert({
      montant,
      telephone,
      reference: `retrait_${retraitId}`,
      motif: 'Retrait tontine',
    });

    await this.prisma.$transaction([
      this.prisma.retrait.update({
        where: { id: retraitId },
        data: { statut: StatutRetrait.EXECUTE, executeLe: new Date(), refKKiaPay: transfert.refKKiaPay },
      }),
      this.prisma.tontine.update({
        where: { id: tontineId },
        data: { soldeActuel: { decrement: montant } },
      }),
    ]);
  }

  // ─── GET /retraits/mes-retraits ────────────────────
  async mesRetraits(utilisateurId: string) {
    const retraits = await this.prisma.retrait.findMany({
      where: { utilisateurId },
      orderBy: { creeLe: 'desc' },
    });
    return { succes: true, message: `${retraits.length} retrait(s).`, donnees: retraits };
  }

  // ─── GET /retraits/en-attente (Admin) ──────────────
  async enAttente() {
    const retraits = await this.prisma.retrait.findMany({
      where: { statut: StatutRetrait.EN_ATTENTE },
      include: { utilisateur: { select: { id: true, nom: true, telephone: true } } },
      orderBy: { creeLe: 'asc' },
    });
    const total = retraits.reduce((s, r) => s + r.montant, 0);
    return { succes: true, message: `${retraits.length} retrait(s) en attente. Total: ${total} FCFA.`, donnees: retraits };
  }

  // ─── PUT /retraits/:id/valider (Admin) ─────────────
  async valider(retraitId: string, adminId: string) {
    const retrait = await this.prisma.retrait.findUnique({
      where: { id: retraitId },
      include: { utilisateur: true },
    });
    if (!retrait) throw new NotFoundException('Retrait introuvable');
    if (retrait.statut !== StatutRetrait.EN_ATTENTE) {
      throw new BadRequestException({ message: 'Ce retrait n\'est plus en attente', code: 'STATUT_INVALIDE' });
    }

    const tontine = await this.prisma.tontine.findFirst({
      where: { proprietaireId: retrait.utilisateurId },
    });
    if (!tontine || tontine.soldeActuel < retrait.montant) {
      throw new BadRequestException({ message: 'Solde tontine insuffisant', code: 'SOLDE_INSUFFISANT' });
    }

    await this.prisma.retrait.update({
      where: { id: retraitId },
      data: { statut: StatutRetrait.VALIDE, validePar: adminId },
    });
    await this.executer(retraitId, retrait.utilisateur.telephone, tontine.id, retrait.montant);

    return { succes: true, message: `Retrait de ${retrait.montant} FCFA validé et exécuté.` };
  }

  // ─── PUT /retraits/:id/rejeter (Admin) ─────────────
  async rejeter(retraitId: string, adminId: string, dto: RejeterRetraitDto) {
    const retrait = await this.prisma.retrait.findUnique({ where: { id: retraitId } });
    if (!retrait) throw new NotFoundException('Retrait introuvable');
    if (retrait.statut !== StatutRetrait.EN_ATTENTE) {
      throw new BadRequestException({ message: 'Ce retrait n\'est plus en attente', code: 'STATUT_INVALIDE' });
    }
    await this.prisma.retrait.update({
      where: { id: retraitId },
      data: { statut: StatutRetrait.REJETE, validePar: adminId, motifRejet: dto.motif },
    });
    return { succes: true, message: 'Retrait rejeté.' };
  }
}
