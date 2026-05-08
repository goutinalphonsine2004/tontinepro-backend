import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Role, StatutCompte, StatutCredit, StatutDossierPADME, TypeTransaction, StatutTransaction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { BUSINESS } from '../../common/constants/business.constants';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
    private sms: SmsService,
  ) {}

  // ─────────────────────────────────────────────────
  // CRON 7H — PRÉLÈVEMENT REMBOURSEMENTS JOURNALIERS
  // ─────────────────────────────────────────────────
  @Cron('0 7 * * *', { name: 'prelever-remboursements' })
  async preleverRemboursementsJournaliers() {
    this.logger.log('[CRON 7h] Prélèvement remboursements journaliers...');
    const credits = await this.prisma.microCredit.findMany({
      where: { statut: StatutCredit.ACTIF },
      include: { client: { select: { id: true, nom: true, telephone: true, collecteurId: true } } },
    });
    this.logger.log(`[CRON 7h] ${credits.length} crédit(s) actif(s) à traiter`);
    for (const credit of credits) {
      await this.preleverUnCredit(credit as any);
    }
  }

  async preleverUnCredit(credit: any) {
    try {
      const transfert = await this.kkiapay.initierPaiement({
        montant: credit.paiementJournalier,
        telephone: credit.client.telephone,
        reference: `remb_${credit.id}_${Date.now()}`,
        description: 'Remboursement micro-crédit TontinePro',
      });

      const montantRestant = Math.max(0, credit.montantRestant - credit.paiementJournalier);
      const joursPayes = credit.joursPayes + 1;
      const termine = montantRestant <= 0;

      await this.prisma.$transaction([
        this.prisma.remboursementCredit.create({
          data: {
            microCreditId: credit.id,
            montant: credit.paiementJournalier,
            statut: 'SUCCES',
            refKKiaPay: transfert.refKKiaPay,
          },
        }),
        this.prisma.microCredit.update({
          where: { id: credit.id },
          data: {
            joursPayes,
            montantRestant,
            statut: termine ? StatutCredit.TERMINE : StatutCredit.ACTIF,
            ...(termine && { termineLe: new Date() }),
          },
        }),
      ]);

      if (termine) {
        await this.sms.envoyer(
          credit.client.telephone,
          `TontinePro: 🎉 Bravo ${credit.client.nom} ! Votre micro-crédit de ${credit.montantPrincipal} FCFA est entièrement remboursé. Votre score de crédit va augmenter.`,
        );
        this.logger.log(`[CRON] Crédit TERMINÉ: ${credit.id} — ${credit.client.nom}`);
      } else {
        await this.sms.envoyer(
          credit.client.telephone,
          `TontinePro: Prélèvement ${credit.paiementJournalier} FCFA effectué ✅. Restant: ${montantRestant} FCFA (${joursPayes}/${credit.totalJours} jours).`,
        );
      }
    } catch {
      await this.gererEchecRemboursement(credit);
    }
  }

  private async gererEchecRemboursement(credit: any) {
    await this.prisma.remboursementCredit.create({
      data: { microCreditId: credit.id, montant: credit.paiementJournalier, statut: 'ECHEC' },
    });

    const echecsRecents = await this.prisma.remboursementCredit.findMany({
      where: { microCreditId: credit.id, statut: 'ECHEC' },
      orderBy: { payeLe: 'desc' },
      take: 3,
    });

    const tousEchec = echecsRecents.length === 3;

    if (tousEchec) {
      await this.prisma.microCredit.update({
        where: { id: credit.id },
        data: { statut: StatutCredit.EN_DEFAUT },
      });
      this.logger.warn(`[CRON] Crédit EN_DEFAUT: ${credit.id} — ${credit.client.nom}`);
    }

    await this.sms.envoyer(
      credit.client.telephone,
      `TontinePro: ⚠️ Prélèvement échoué. Assurez-vous d'avoir ${credit.paiementJournalier} FCFA sur votre compte Mobile Money.`,
    );

    if (credit.client.collecteurId) {
      const collecteur = await this.prisma.utilisateur.findUnique({
        where: { id: credit.client.collecteurId },
        select: { telephone: true },
      });
      if (collecteur) {
        await this.sms.envoyer(
          collecteur.telephone,
          `TontinePro: Alerte — prélèvement échoué pour ${credit.client.nom}. Crédit: ${credit.montantPrincipal} FCFA.`,
        );
      }
    }
  }

  // ─────────────────────────────────────────────────
  // CRON MINUIT — RECALCUL SCORES + PADME
  // ─────────────────────────────────────────────────
  @Cron('0 0 * * *', { name: 'scoring-nocturne' })
  async scoringNocturne() {
    this.logger.log('[CRON 0h] Scoring nocturne en cours...');
    const clients = await this.prisma.utilisateur.findMany({
      where: { role: Role.CLIENT, statut: StatutCompte.ACTIF },
      select: { id: true },
    });
    this.logger.log(`[CRON 0h] ${clients.length} client(s) à scorer`);
    for (const client of clients) {
      await this.calculerEtMettreAJourScore(client.id);
    }
  }

  async calculerEtMettreAJourScore(clientId: string): Promise<number> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: clientId },
      include: {
        transactions: {
          where: { type: TypeTransaction.COTISATION, statut: StatutTransaction.SUCCES },
        },
        microCredits: {
          where: { statut: { in: [StatutCredit.TERMINE, StatutCredit.ACTIF, StatutCredit.EN_DEFAUT] } },
        },
        tontines: true,
      },
    });
    if (!utilisateur) return 0;

    // Ancienneté (max 10 mois → 20 pts)
    const ancienneteMs = Date.now() - utilisateur.creeLe.getTime();
    const ancienneteEnMois = Math.floor(ancienneteMs / (30 * 24 * 60 * 60 * 1000));
    const scoreAnciennete = Math.min(ancienneteEnMois * 2, 20);

    // Taux de régularité — cotisations des 30 derniers jours
    const il30Jours = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const joursCotises = new Set(
      utilisateur.transactions
        .filter((t) => t.creeLe >= il30Jours)
        .map((t) => t.creeLe.toISOString().slice(0, 10)),
    ).size;
    const tauxRegularite = Math.min(joursCotises / 30, 1);

    // Score remboursement crédits
    const credits = utilisateur.microCredits;
    let scoreRemboursement = 1; // parfait si aucun crédit
    if (credits.length > 0) {
      const termines = credits.filter((c) => c.statut === StatutCredit.TERMINE).length;
      const defauts = credits.filter((c) => c.statut === StatutCredit.EN_DEFAUT).length;
      scoreRemboursement = termines / credits.length;
      if (defauts > 0) scoreRemboursement *= 0.5;
    }

    // Bonus objectif atteint
    const bonusObjectif = utilisateur.tontines.some(
      (t) => t.objectifMontant && t.soldeActuel >= t.objectifMontant,
    )
      ? 1
      : 0;

    const score = Math.round(
      tauxRegularite * 40 + scoreAnciennete + scoreRemboursement * 30 + bonusObjectif * 10,
    );
    const scoreFinal = Math.min(Math.max(score, 0), 100);

    const eligible = scoreFinal >= BUSINESS.SEUIL_SCORE_MICRO_CREDIT;
    const eligiblePADME = scoreFinal >= BUSINESS.SEUIL_SCORE_PADME;

    await this.prisma.scoreCredit.upsert({
      where: { utilisateurId: clientId },
      create: {
        utilisateurId: clientId,
        score: scoreFinal,
        totalDepots: utilisateur.transactions.length,
        tauxRegularite,
        totalMois: ancienneteEnMois,
        scoreRemboursement,
        eligibleMicroCredit: eligible,
        eligiblePADME,
        dernierCalcul: new Date(),
      },
      update: {
        score: scoreFinal,
        totalDepots: utilisateur.transactions.length,
        tauxRegularite,
        totalMois: ancienneteEnMois,
        scoreRemboursement,
        eligibleMicroCredit: eligible,
        eligiblePADME,
        dernierCalcul: new Date(),
      },
    });

    if (eligiblePADME) {
      await this.genererDossierPADME(clientId, scoreFinal, tauxRegularite);
    }

    return scoreFinal;
  }

  private async genererDossierPADME(clientId: string, score: number, tauxRegularite: number) {
    // Ne pas regénérer si un dossier récent existe (30 jours)
    const dossierRecent = await this.prisma.dossierPADME.findFirst({
      where: {
        clientId,
        creeLe: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        statut: { in: [StatutDossierPADME.GENERE, StatutDossierPADME.VALIDE_ADMIN, StatutDossierPADME.SOUMIS_PADME] },
      },
    });
    if (dossierRecent) return;

    const [scoreCredit, client, totalEpargne, creditsRembourses] = await Promise.all([
      this.prisma.scoreCredit.findUnique({ where: { utilisateurId: clientId } }),
      this.prisma.utilisateur.findUnique({ where: { id: clientId }, select: { telephone: true } }),
      this.prisma.transaction.aggregate({
        where: { utilisateurId: clientId, type: TypeTransaction.COTISATION, statut: StatutTransaction.SUCCES },
        _sum: { montantNet: true },
      }),
      this.prisma.microCredit.count({ where: { clientId, statut: StatutCredit.TERMINE } }),
    ]);

    if (!scoreCredit) return;

    await this.prisma.dossierPADME.create({
      data: {
        clientId,
        scoreCreditId: scoreCredit.id,
        scoreAuMoment: score,
        totalEpargne: totalEpargne._sum.montantNet ?? 0,
        tauxRegularite,
        creditsRembourses,
        statut: StatutDossierPADME.GENERE,
        genereePar: 'SYSTEME',
      },
    });

    if (client) {
      await this.sms.envoyer(
        client.telephone,
        `TontinePro: 🎉 Félicitations ! Votre dossier PADME a été généré automatiquement (score: ${score}/100). L'administration va vous contacter prochainement.`,
      );
    }
    this.logger.log(`[CRON PADME] Dossier généré pour client ${clientId} — score ${score}`);
  }

  // ─────────────────────────────────────────────────
  // CRON MINUIT — NETTOYAGE OTP EXPIRÉS
  // ─────────────────────────────────────────────────
  @Cron('0 0 * * *', { name: 'nettoyage-otp' })
  async nettoyerOTPExpires() {
    const result = await this.prisma.codeOTP.deleteMany({
      where: { expireLe: { lt: new Date() } },
    });
    this.logger.log(`[CRON 0h] ${result.count} OTP expirés supprimés`);
  }

  // ─────────────────────────────────────────────────
  // CRON MINUIT — EXPIRER CRÉDITS SANS CONSENTEMENT
  // ─────────────────────────────────────────────────
  @Cron('*/30 * * * *', { name: 'expirer-credits-sms' })
  async expirerCreditsConsentementExpires() {
    const limite = new Date(Date.now() - 30 * 60 * 1000);
    const result = await this.prisma.microCredit.updateMany({
      where: {
        statut: StatutCredit.EN_ATTENTE,
        methodeConsentement: 'SMS',
        consentementObtenu: false,
        creeLe: { lt: limite },
      },
      data: { statut: StatutCredit.EXPIRE },
    });
    if (result.count > 0) {
      this.logger.log(`[CRON] ${result.count} crédit(s) SMS expiré(s) pour non-réponse`);
    }
  }

  // ─────────────────────────────────────────────────
  // MÉTHODE MANUELLE — pour tester via endpoint
  // ─────────────────────────────────────────────────
  async declencherScoringManuellement(clientId?: string) {
    if (clientId) {
      const score = await this.calculerEtMettreAJourScore(clientId);
      return { succes: true, message: `Score calculé: ${score}/100`, donnees: { score } };
    }
    await this.scoringNocturne();
    return { succes: true, message: 'Scoring global déclenché.' };
  }

  async declencherRemboursementsManuellement() {
    await this.preleverRemboursementsJournaliers();
    return { succes: true, message: 'Prélèvements remboursements déclenchés manuellement.' };
  }
}
