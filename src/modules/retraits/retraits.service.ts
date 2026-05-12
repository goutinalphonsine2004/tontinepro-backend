import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PolitiqueRetrait, StatutRetrait } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { BUSINESS } from '../../common/constants/business.constants';
import { DemanderRetraitDto } from './dto/demander-retrait.dto';
import { ConfirmerRetraitDto } from './dto/confirmer-retrait.dto';
import { RejeterRetraitDto } from './dto/rejeter-retrait.dto';

import { NotificationsService } from '../notifications/notifications.service';
import { Inject, forwardRef } from '@nestjs/common';

const OTP_TYPE_RETRAIT = 'RETRAIT';
const DUREE_OTP_RETRAIT_MINUTES = 10;

@Injectable()
export class RetraitsService {
  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
    @Inject(forwardRef(() => SmsService))
    private sms: SmsService,
    @Inject(forwardRef(() => NotificationsService))
    private notifications: NotificationsService,
  ) {}

  // ─── POST /retraits/demander-otp ───────────────────
  async demanderOtp(utilisateurId: string, dto: DemanderRetraitDto) {
    const [utilisateur, tontine] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } }),
      this.prisma.tontine.findUnique({ where: { id: dto.tontineId } }),
    ]);
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');
    if (!tontine) throw new NotFoundException('Tontine introuvable');
    await this.verifierRetraitPossible(utilisateurId, tontine, dto.montant);

    const telephone = dto.telephone ?? utilisateur.telephone;
    const { code, expireLe } = await this.creerOtpRetrait(utilisateurId, telephone, dto.tontineId, dto.montant);

    await this.sms.envoyer(
      telephone,
      `TontineBénin: Code retrait ${code}. Montant: ${dto.montant} FCFA. Valable ${DUREE_OTP_RETRAIT_MINUTES} min.`,
    );

    // Notifier l'équipe (Collecteur + Superviseur) si existant
    if (utilisateur.collecteurId) {
      await this.notifications.envoyerAEquipe(
        utilisateur.collecteurId,
        'Demande de retrait client',
        `Votre client ${utilisateur.nom} a initié un retrait de ${dto.montant} F sur ${tontine.nom}. Code OTP envoyé.`,
      );
    }

    return {
      succes: true,
      message: 'Code OTP de confirmation envoyé par SMS.',
      donnees: { tontineId: tontine.id, montant: dto.montant, telephone, expireLe },
    };
  }

  // ─── POST /retraits/confirmer ──────────────────────
  async confirmer(utilisateurId: string, dto: ConfirmerRetraitDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');

    const telephone = dto.telephone ?? utilisateur.telephone;
    const otp = await this.prisma.codeOTP.findFirst({
      where: {
        utilisateurId,
        telephone,
        type: this.typeOtpRetrait(dto.tontineId, dto.montant),
        utilise: false,
        expireLe: { gt: new Date() },
      },
      orderBy: { creeLe: 'desc' },
    });

    if (!otp || !(await this.verifierCodeOtp(dto.code, otp.code))) {
      throw new BadRequestException({ message: 'Code OTP de retrait invalide ou expiré', code: 'OTP_RETRAIT_INVALIDE' });
    }

    await this.prisma.codeOTP.update({ where: { id: otp.id }, data: { utilise: true } });
    return this.demander(utilisateurId, dto);
  }

  // ─── Ancienne logique d'exécution, appelée après OTP ─
  async demander(utilisateurId: string, dto: DemanderRetraitDto) {
    const [utilisateur, tontine] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } }),
      this.prisma.tontine.findUnique({ where: { id: dto.tontineId } }),
    ]);
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');
    if (!tontine) throw new NotFoundException('Tontine introuvable');
    await this.verifierRetraitPossible(utilisateurId, tontine, dto.montant);

    const seuilAdmin = BUSINESS.SEUIL_RETRAIT_ADMIN;
    const needsAdmin = dto.montant >= seuilAdmin;

    const retrait = await this.prisma.retrait.create({
      data: {
        utilisateurId,
        tontineId: tontine.id,
        montant: dto.montant,
        statut: needsAdmin ? StatutRetrait.EN_ATTENTE : StatutRetrait.VALIDE,
      },
    });

    if (!needsAdmin) {
      // Validation et exécution automatique
      await this.executer(retrait.id, utilisateur.telephone, tontine.id, dto.montant);
    }

    return {
      succes: true,
      message: needsAdmin
        ? `Retrait de ${dto.montant} FCFA en attente de validation Admin (seuil: ${seuilAdmin} FCFA).`
        : `Retrait de ${dto.montant} FCFA validé automatiquement et en cours d'exécution.`,
      donnees: retrait,
    };
  }

  private async verifierRetraitPossible(
    utilisateurId: string,
    tontine: { id: string; proprietaireId: string; soldeActuel: number; politique: PolitiqueRetrait; dateDeverrouillage: Date | null },
    montant: number,
  ) {
    await this.verifierAucuneAlerteBloquante(tontine.id);

    if (tontine.proprietaireId !== utilisateurId) {
      throw new ForbiddenException({ message: 'Seul le propriétaire peut demander un retrait', code: 'ACCES_REFUSE' });
    }
    if (tontine.soldeActuel < montant) {
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
  }

  private async verifierAucuneAlerteBloquante(tontineId: string) {
    const alerte = await this.prisma.alerteSysteme.findFirst({
      where: {
        type: 'COHERENCE_COMPTABLE',
        severite: 'CRITIQUE',
        statut: 'OUVERTE',
        resourceType: 'TONTINE',
        resourceId: tontineId,
      },
      select: { id: true, titre: true },
    });

    if (alerte) {
      throw new ForbiddenException({
        message: 'Retrait temporairement bloqué: anomalie comptable en cours de vérification.',
        code: 'CIRCUIT_BREAKER_COMPTABLE',
        alerteId: alerte.id,
      });
    }
  }

  private async executer(retraitId: string, telephone: string, tontineId: string, montant: number) {
    const fraisRetrait = BUSINESS.calculerFraisRetrait(montant);
    const montantNet = montant - fraisRetrait;

    const transfert = await this.kkiapay.initierTransfert({
      montant: montantNet,
      telephone,
      reference: `retrait_${retraitId}`,
      motif: 'Retrait tontine',
    });

    const retrait = await this.prisma.retrait.findUnique({
      where: { id: retraitId },
      include: { utilisateur: { select: { id: true, nom: true, collecteurId: true } }, tontine: { select: { nom: true } } },
    });

    await this.prisma.$transaction([
      this.prisma.retrait.update({
        where: { id: retraitId },
        data: { 
          statut: StatutRetrait.EXECUTE, 
          executeLe: new Date(), 
          refKKiaPay: transfert.refKKiaPay,
        },
      }),
      this.prisma.tontine.update({
        where: { id: tontineId },
        data: { soldeActuel: { decrement: montant } },
      }),
    ]);

    await this.sms.envoyer(
      telephone,
      `TontineBénin: Retrait de ${montantNet} FCFA (après ${fraisRetrait}F de frais) exécuté avec succès. Réf: ${transfert.refKKiaPay}.`,
    );

    // Notifier l'équipe (Collecteur + Superviseur) si existant
    if (retrait?.utilisateur.collecteurId) {
      await this.notifications.envoyerAEquipe(
        retrait.utilisateur.collecteurId,
        'Retrait effectué',
        `Le retrait de ${montant} F pour votre client ${retrait.utilisateur.nom} sur ${retrait.tontine.nom} a été payé.`,
      );
    }
  }

  // ─── GET /retraits/mes-retraits ────────────────────
  async mesRetraits(utilisateurId: string) {
    const retraits = await this.prisma.retrait.findMany({
      where: { utilisateurId },
      include: { tontine: { select: { id: true, nom: true } } },
      orderBy: { creeLe: 'desc' },
    });
    return { succes: true, message: `${retraits.length} retrait(s).`, donnees: retraits };
  }

  // ─── GET /retraits/en-attente (Admin) ──────────────
  async enAttente() {
    const retraits = await this.prisma.retrait.findMany({
      where: { statut: StatutRetrait.EN_ATTENTE },
      include: {
        utilisateur: { select: { id: true, nom: true, telephone: true } },
        tontine: { select: { id: true, nom: true, soldeActuel: true } },
      },
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

    const tontine = await this.prisma.tontine.findUnique({ where: { id: retrait.tontineId } });
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

  private async creerOtpRetrait(utilisateurId: string, telephone: string, tontineId: string, montant: number) {
    await this.prisma.codeOTP.updateMany({
      where: { utilisateurId, type: { startsWith: OTP_TYPE_RETRAIT }, utilise: false },
      data: { utilise: true },
    });

    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expireLe = new Date(Date.now() + DUREE_OTP_RETRAIT_MINUTES * 60 * 1000);

    await this.prisma.codeOTP.create({
      data: { utilisateurId, telephone, code: codeHash, type: this.typeOtpRetrait(tontineId, montant), expireLe },
    });

    return { code, expireLe };
  }

  private typeOtpRetrait(tontineId: string, montant: number) {
    return `${OTP_TYPE_RETRAIT}:${tontineId}:${montant}`;
  }

  private async verifierCodeOtp(codeRecu: string, codeStocke: string) {
    if (codeStocke.startsWith('$2')) {
      return bcrypt.compare(codeRecu, codeStocke);
    }

    return codeRecu === codeStocke;
  }
}
