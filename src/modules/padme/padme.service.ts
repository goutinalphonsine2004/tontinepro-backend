import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, StatutDossierPADME } from '@prisma/client';
import { readFile } from 'fs/promises';
import { basename, join, normalize } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { BUSINESS } from '../../common/constants/business.constants';
import { FiltrerDossiersDto } from './dto/filtrer-dossiers.dto';
import { ResultatPadmeDto } from './dto/resultat-padme.dto';

@Injectable()
export class PadmeService {
  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
  ) {}

  private async journaliser(adminId: string, action: string, details: string) {
    await this.prisma.journalAudit.create({
      data: { utilisateurId: adminId, action, details },
    });
  }

  // ─── GET /padme/mes-dossiers (Client) ─────────────
  async mesDossiers(clientId: string) {
    const dossiers = await this.prisma.dossierPADME.findMany({
      where: { clientId },
      include: { scoreCredit: { select: { score: true } } },
      orderBy: { creeLe: 'desc' },
    });
    return {
      succes: true,
      message: `${dossiers.length} dossier(s) PADME.`,
      donnees: dossiers,
    };
  }

  // ─── GET /padme/tous (Admin) ───────────────────────
  async tous(dto: FiltrerDossiersDto) {
    const skip = ((dto.page ?? 1) - 1) * (dto.limite ?? 20);
    const where = dto.statut ? { statut: dto.statut } : {};

    const [total, dossiers] = await Promise.all([
      this.prisma.dossierPADME.count({ where }),
      this.prisma.dossierPADME.findMany({
        where,
        include: {
          client: {
            select: { id: true, nom: true, telephone: true, kycVerifie: true },
          },
          scoreCredit: { select: { score: true, tauxRegularite: true } },
        },
        skip,
        take: dto.limite ?? 20,
        orderBy: { creeLe: 'desc' },
      }),
    ]);

    return {
      succes: true,
      message: `${total} dossier(s) PADME.`,
      donnees: {
        dossiers,
        total,
        page: dto.page ?? 1,
        pages: Math.ceil(total / (dto.limite ?? 20)),
      },
    };
  }

  // ─── GET /padme/:id (Admin) ────────────────────────
  async getById(dossierId: string) {
    const dossier = await this.prisma.dossierPADME.findUnique({
      where: { id: dossierId },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            kycVerifie: true,
            creeLe: true,
          },
        },
        scoreCredit: true,
      },
    });
    if (!dossier) throw new NotFoundException('Dossier PADME introuvable');
    return { succes: true, message: 'Dossier récupéré.', donnees: dossier };
  }

  // ─── GET /padme/:id/pdf ───────────────────────────
  async pdf(dossierId: string, utilisateurId: string, role: Role) {
    const dossier = await this.prisma.dossierPADME.findUnique({
      where: { id: dossierId },
      select: { id: true, clientId: true, urlPDF: true },
    });
    if (!dossier) throw new NotFoundException('Dossier PADME introuvable');

    const estAdmin = role === Role.ADMIN || role === Role.SUPERVISEUR;
    if (!estAdmin && dossier.clientId !== utilisateurId) {
      throw new ForbiddenException('Accès refusé à ce dossier PADME');
    }

    if (!dossier.urlPDF) {
      throw new NotFoundException('PDF PADME non généré pour ce dossier');
    }

    const cheminNormalise = normalize(dossier.urlPDF);
    if (cheminNormalise.startsWith('..') || cheminNormalise.startsWith('/')) {
      throw new BadRequestException('Chemin PDF invalide');
    }

    const chemin = join(process.cwd(), cheminNormalise);
    try {
      const buffer = await readFile(chemin);
      return { buffer, filename: basename(chemin) };
    } catch {
      throw new NotFoundException('Fichier PDF PADME introuvable');
    }
  }

  // ─── PUT /padme/:id/valider (Admin) ───────────────
  async valider(dossierId: string, adminId: string) {
    const dossier = await this.prisma.dossierPADME.findUnique({
      where: { id: dossierId },
    });
    if (!dossier) throw new NotFoundException('Dossier introuvable');
    if (dossier.statut !== StatutDossierPADME.GENERE) {
      throw new BadRequestException({
        message: `Statut actuel: ${dossier.statut}. Attendu: GENERE`,
        code: 'STATUT_INVALIDE',
      });
    }

    const maj = await this.prisma.dossierPADME.update({
      where: { id: dossierId },
      data: { statut: StatutDossierPADME.VALIDE_ADMIN, examineLE: new Date() },
    });

    await this.journaliser(
      adminId,
      'PADME_VALIDE',
      `Dossier ${dossierId} validé par Admin`,
    );
    return {
      succes: true,
      message: 'Dossier PADME validé par Admin.',
      donnees: maj,
    };
  }

  // ─── PUT /padme/:id/soumettre (Admin) ─────────────
  async soumettre(dossierId: string, adminId: string) {
    const dossier = await this.prisma.dossierPADME.findUnique({
      where: { id: dossierId },
      include: { client: { select: { telephone: true, nom: true } } },
    });
    if (!dossier) throw new NotFoundException('Dossier introuvable');
    if (dossier.statut !== StatutDossierPADME.VALIDE_ADMIN) {
      throw new BadRequestException({
        message: `Statut actuel: ${dossier.statut}. Attendu: VALIDE_ADMIN`,
        code: 'STATUT_INVALIDE',
      });
    }

    const maj = await this.prisma.dossierPADME.update({
      where: { id: dossierId },
      data: { statut: StatutDossierPADME.SOUMIS_PADME, soumisLe: new Date() },
    });

    await this.journaliser(
      adminId,
      'PADME_SOUMIS',
      `Dossier ${dossierId} soumis à PADME`,
    );

    await this.sms.envoyer(
      dossier.client.telephone,
      `TontineBénin: Votre dossier PADME a été soumis. Vous serez contacté par PADME sous 72h. Score: ${dossier.scoreAuMoment}/100.`,
    );

    return {
      succes: true,
      message: 'Dossier soumis à PADME. Client notifié.',
      donnees: maj,
    };
  }

  // ─── PUT /padme/:id/resultat (Admin) ──────────────
  async resultat(dossierId: string, adminId: string, dto: ResultatPadmeDto) {
    const dossier = await this.prisma.dossierPADME.findUnique({
      where: { id: dossierId },
      include: { client: { select: { id: true, telephone: true, nom: true } } },
    });
    if (!dossier) throw new NotFoundException('Dossier introuvable');
    if (dossier.statut !== StatutDossierPADME.SOUMIS_PADME) {
      throw new BadRequestException({
        message: `Statut actuel: ${dossier.statut}. Attendu: SOUMIS_PADME`,
        code: 'STATUT_INVALIDE',
      });
    }

    const nouveauStatut =
      dto.statut === 'ACCEPTE'
        ? StatutDossierPADME.ACCEPTE
        : StatutDossierPADME.REJETE;

    const maj = await this.prisma.dossierPADME.update({
      where: { id: dossierId },
      data: { statut: nouveauStatut },
    });

    await this.journaliser(
      adminId,
      `PADME_${dto.statut}`,
      `Dossier ${dossierId} — ${dto.statut}${dto.montantAccorde ? ` — ${dto.montantAccorde} FCFA` : ''}`,
    );

    if (
      dto.statut === 'ACCEPTE' &&
      dto.montantAccorde &&
      dto.montantAccorde > 0
    ) {
      const commission = BUSINESS.calculerCommissionPADME(dto.montantAccorde);
      await this.prisma.commission
        .create({
          data: {
            agentId: adminId,
            transactionId:
              (
                await this.prisma.transaction.findFirst({
                  where: { utilisateurId: dossier.client.id },
                })
              )?.id ?? adminId,
            montant: commission,
            type: 'PADME',
          },
        })
        .catch(() => {}); // Ne pas bloquer si pas de transaction

      await this.sms.envoyer(
        dossier.client.telephone,
        `TontineBénin: 🎉 Félicitations ${dossier.client.nom} ! PADME a accepté votre dossier. Montant accordé: ${dto.montantAccorde.toLocaleString('fr-FR')} FCFA. Vous serez contacté prochainement.`,
      );
    } else if (dto.statut === 'REJETE') {
      await this.sms.envoyer(
        dossier.client.telephone,
        `TontineBénin: Votre dossier PADME n'a pas été retenu. ${dto.motif ? `Motif: ${dto.motif}.` : ''} Continuez à épargner pour renforcer votre dossier.`,
      );
    }

    return {
      succes: true,
      message: `Dossier PADME ${dto.statut}.${dto.montantAccorde ? ` Commission TontineBénin: ${BUSINESS.calculerCommissionPADME(dto.montantAccorde)} FCFA` : ''}`,
      donnees: maj,
    };
  }
}
