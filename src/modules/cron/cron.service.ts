import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Role, StatutCompte, StatutCredit, StatutDossierPADME, StatutMembreGroupe, StatutTontine, FrequenceTontine, TypeNotification, TypeTransaction, StatutTransaction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { PdfService } from '../../common/services/pdf.service';
import { SmsService } from '../notifications/sms.service';
import { WhatsappService } from '../notifications/whatsapp.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadgesService } from '../badges/badges.service';
import { BUSINESS } from '../../common/constants/business.constants';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
    @Inject(forwardRef(() => SmsService))
    private sms: SmsService,
    private whatsapp: WhatsappService,
    private pdf: PdfService,
    @Inject(forwardRef(() => NotificationsService))
    private notifications: NotificationsService,
    private badges: BadgesService,
    private config: ConfigService,
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
        description: 'Remboursement micro-crédit TontineBénin',
      });

      await this.prisma.remboursementCredit.create({
        data: {
          microCreditId: credit.id,
          montant: credit.paiementJournalier,
          statut: 'EN_ATTENTE',
          refKKiaPay: transfert.refKKiaPay,
        },
      });

      // ✅ CORRECTION : Si le crédit était EN_DEFAUT et que le paiement réussit,
      // on remet le statut à ACTIF (le client a rechargé son compte).
      if (credit.statut === StatutCredit.EN_DEFAUT) {
        await this.prisma.microCredit.update({
          where: { id: credit.id },
          data: { statut: StatutCredit.ACTIF },
        });
        this.logger.log(`[CRON] Crédit réactivé (ACTIF) après paiement réussi: ${credit.id} — ${credit.client.nom}`);
        await this.sms.envoyer(
          credit.client.telephone,
          `TontineBénin: ✅ Votre prélèvement de ${credit.paiementJournalier} FCFA a réussi. Votre micro-crédit est de nouveau actif.`,
        );
      } else {
        await this.sms.envoyer(
          credit.client.telephone,
          `TontineBénin: Prélèvement de ${credit.paiementJournalier} FCFA initié pour votre micro-crédit. Confirmation en cours.`,
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

    // ✅ CORRECTION : Compter seulement les échecs CONSÉCUTIFS.
    // On récupère tous les remboursements récents (triés du plus récent au plus ancien)
    // et on s'arrête dès qu'on trouve un paiement SUCCES ou EN_ATTENTE entre deux échecs.
    const remboursementsRecents = await this.prisma.remboursementCredit.findMany({
      where: { microCreditId: credit.id },
      orderBy: { payeLe: 'desc' },
      take: 10, // On prend les 10 derniers pour détecter les consécutifs
    });

    let echecsConsecutifs = 0;
    for (const remb of remboursementsRecents) {
      if (remb.statut === 'ECHEC') {
        echecsConsecutifs++;
      } else {
        // Dès qu'on trouve un SUCCES ou EN_ATTENTE, on arrête de compter
        break;
      }
    }

    if (echecsConsecutifs >= 3) {
      await this.prisma.microCredit.update({
        where: { id: credit.id },
        data: { statut: StatutCredit.EN_DEFAUT },
      });
      this.logger.warn(`[CRON] Crédit EN_DEFAUT (${echecsConsecutifs} échecs consécutifs): ${credit.id} — ${credit.client.nom}`);
      await this.sms.envoyer(
        credit.client.telephone,
        `TontineBénin: 🚨 Votre micro-crédit est en défaut après ${echecsConsecutifs} échecs consécutifs. Contactez votre collecteur.`,
      );
    } else {
      await this.sms.envoyer(
        credit.client.telephone,
        `TontineBénin: ⚠️ Prélèvement échoué (${echecsConsecutifs}/3). Assurez-vous d'avoir ${credit.paiementJournalier} FCFA sur votre compte Mobile Money.`,
      );
    }

    if (credit.client.collecteurId) {
      const collecteur = await this.prisma.utilisateur.findUnique({
        where: { id: credit.client.collecteurId },
        select: { telephone: true },
      });
      if (collecteur) {
        await this.sms.envoyer(
          collecteur.telephone,
          `TontineBénin: Alerte — prélèvement échoué pour ${credit.client.nom} (${echecsConsecutifs}/3 échecs consécutifs). Crédit: ${credit.montantPrincipal} FCFA.`,
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

    // Enregistrer snapshot dans l'historique du score
    const scoreCreditRecord = await this.prisma.scoreCredit.findUnique({ where: { utilisateurId: clientId } });
    if (scoreCreditRecord) {
      await this.prisma.historiqueScore.create({
        data: {
          scoreCreditId: scoreCreditRecord.id,
          score: scoreFinal,
          tauxRegularite,
          scoreRemboursement,
        },
      });
    }

    if (eligiblePADME) {
      await this.genererDossierPADME(clientId, scoreFinal, tauxRegularite);
    }

    // Attribution badges après scoring
    await this.badges.attribuerBadgesSiEligible(clientId);

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
      this.prisma.utilisateur.findUnique({ where: { id: clientId }, select: { telephone: true, nom: true } }),
      this.prisma.transaction.aggregate({
        where: { utilisateurId: clientId, type: TypeTransaction.COTISATION, statut: StatutTransaction.SUCCES },
        _sum: { montantNet: true },
      }),
      this.prisma.microCredit.count({ where: { clientId, statut: StatutCredit.TERMINE } }),
    ]);

    if (!scoreCredit) return;

    const dossier = await this.prisma.dossierPADME.create({
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
      const urlPDF = await this.pdf.genererEtSauverDossierPadme({
        dossierId: dossier.id,
        clientNom: client.nom,
        clientTelephone: client.telephone,
        score,
        totalEpargne: totalEpargne._sum.montantNet ?? 0,
        tauxRegularite,
        creditsRembourses,
        genereLe: dossier.creeLe,
      });

      await this.prisma.dossierPADME.update({
        where: { id: dossier.id },
        data: { urlPDF },
      });
    }

    if (client) {
      await this.sms.envoyer(
        client.telephone,
        `TontineBénin: 🎉 Félicitations ! Votre dossier PADME a été généré automatiquement (score: ${score}/100). L'administration va vous contacter prochainement.`,
      );
    }

    await this.notifierAdminsDossierPADME(dossier.id, client?.nom ?? clientId, score);
    this.logger.log(`[CRON PADME] Dossier généré pour client ${clientId} — score ${score}`);
  }

  private async notifierAdminsDossierPADME(dossierId: string, clientNom: string, score: number) {
    const admins = await this.prisma.utilisateur.findMany({
      where: { role: Role.ADMIN, statut: StatutCompte.ACTIF },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notifications.envoyerAUtilisateur(
        admin.id,
        'Dossier PADME prêt',
        `Un dossier PADME est prêt pour ${clientNom}. Score: ${score}/100. Dossier: ${dossierId}.`,
        'PUSH',
        TypeNotification.DOSSIER_PADME_SOUMIS,
      );
    }
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

  // ─────────────────────────────────────────────────
  // CRON HORAIRE — DÉBLOCAGE AUTOMATIQUE PIN
  // ─────────────────────────────────────────────────
  @Cron('0 * * * *', { name: 'deblocage-auto-pin' })
  async debloquerPINAutomatiquement() {
    this.logger.log('[CRON Horaire] Déblocage automatique PIN...');
    const result = await this.prisma.utilisateur.updateMany({
      where: {
        bloqueLe: { 
          lt: new Date(),
          not: null,
        },
      },
      data: {
        bloqueLe: null,
        tentativesEchouees: 0,
      },
    });
    if (result.count > 0) {
      this.logger.log(`[CRON] ${result.count} PIN(s) débloqué(s) automatiquement`);
    }
  }

  async declencherDeblocagePINManuellement() {
    await this.debloquerPINAutomatiquement();
    return { succes: true, message: 'Déblocage PIN déclenché manuellement.' };
  }

  // ─────────────────────────────────────────────────
  // CRON 8H — ALERTE SOLDE FAIBLE
  // ─────────────────────────────────────────────────
  @Cron('0 8 * * *', { name: 'alerte-solde-faible' })
  async envoyerAlertesSoldeFaible() {
    this.logger.log('[CRON 8h] Alerte solde faible...');
    const seuilAlerte = parseInt(this.config.get('SEUIL_ALERTE_SOLDE_FAIBLE', '5000'));

    const clients = await this.prisma.utilisateur.findMany({
      where: {
        role: Role.CLIENT,
        statut: StatutCompte.ACTIF,
      },
      select: {
        id: true,
        telephone: true,
        nom: true,
        tontines: {
          select: { soldeActuel: true },
        },
      },
    });

    let alertesEnvoyees = 0;
    for (const client of clients) {
      // Calculer solde total (toutes tontines)
      const soldeTotal = client.tontines.reduce((acc, t) => acc + (t.soldeActuel || 0), 0);

      if (soldeTotal > 0 && soldeTotal < seuilAlerte) {
        await this.sms.envoyer(
          client.telephone,
          `TontineBénin: ⚠️ ${client.nom}, votre solde actuel est faible (${soldeTotal} FCFA). Cotisez pour rester régulier.`,
        );
        this.logger.log(`[Alerte solde] ${client.nom} — solde: ${soldeTotal} FCFA`);
        alertesEnvoyees++;
      }
    }
    this.logger.log(`[CRON 8h] ${alertesEnvoyees} alerte(s) solde faible envoyée(s)`);
  }

  async declencherAlertesSoldeFaibleManuellement() {
    await this.envoyerAlertesSoldeFaible();
    return { succes: true, message: 'Alertes solde faible déclenchées manuellement.' };
  }

  // ─────────────────────────────────────────────────
  // CRON 8H — RAPPELS COTISATION (basé sur dateProchaineCotisation)
  // ─────────────────────────────────────────────────
  @Cron('0 8 * * *', { name: 'rappels-cotisation' })
  async envoyerRappelsCotisation() {
    this.logger.log('[CRON 8h] Rappels cotisation (dateProchaineCotisation)...');
    const maintenant = new Date();
    // Horizon : tontines ACTIVES dont la prochaine cotisation est dans ≤ 3 jours
    const horizon = new Date(maintenant.getTime() + 3 * 24 * 60 * 60 * 1000);

    const tontines = await this.prisma.tontine.findMany({
      where: {
        statut: StatutTontine.ACTIVE,
        dateProchaineCotisation: { not: null, lte: horizon },
      },
      include: {
        proprietaire: { select: { id: true, telephone: true, nom: true } },
        membres: {
          where: { statut: StatutMembreGroupe.ACTIF },
          include: { utilisateur: { select: { id: true, telephone: true, nom: true } } },
        },
      },
    });

    let rappelsEnvoyes = 0;
    for (const tontine of tontines) {
      if (!tontine.dateProchaineCotisation) continue;

      const msRestants = tontine.dateProchaineCotisation.getTime() - maintenant.getTime();
      const joursRestants = Math.ceil(msRestants / (24 * 60 * 60 * 1000));

      // Message adapté aux téléphones basiques (court et clair)
      const suffixeFrequence = this.libelleMontantFrequence(tontine.frequence, tontine.montantJournalier);
      let message: string;
      if (joursRestants <= 0) {
        message = `TontineBénin: Ton Gando "${tontine.nom}" attend ta cotisation ${suffixeFrequence} AUJOURD'HUI.`;
      } else if (joursRestants === 1) {
        message = `TontineBénin: Ta cotisation ${suffixeFrequence} pour "${tontine.nom}" est due DEMAIN.`;
      } else {
        message = `TontineBénin: Rappel — Ta cotisation ${suffixeFrequence} pour "${tontine.nom}" est dans ${joursRestants}j.`;
      }

      const destinataires = [
        { id: tontine.proprietaire.id, telephone: tontine.proprietaire.telephone },
        ...tontine.membres.map((m) => ({ id: m.utilisateur.id, telephone: m.utilisateur.telephone })),
      ];
      
      for (const dest of destinataires) {
        // notifications.envoyerAUtilisateur gère le SMS Automatique si pas de Smartphone
        await this.notifications.envoyerAUtilisateur(
          dest.id,
          'Rappel cotisation',
          message,
          'TOUS',
          TypeNotification.RAPPEL_COTISATION,
        );
        rappelsEnvoyes++;
      }
    }
    this.logger.log(`[CRON 8h] ${rappelsEnvoyes} rappel(s) envoyé(s) pour ${tontines.length} tontine(s)`);
  }

  // ─────────────────────────────────────────────────
  // CRON 7H — DÉTECTION DÉFAILLANCES GROUPE
  // ─────────────────────────────────────────────────
  @Cron('30 7 * * *', { name: 'defaillances-groupe' })
  async detecterDefaillancesGroupe() {
    this.logger.log('[CRON 7h30] Détection défaillances groupe...');
    const il24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Tontines de groupe avec membres actifs ou déjà en première défaillance.
    const tontines = await this.prisma.tontine.findMany({
      where: { type: 'GROUPE' },
      include: {
        membres: {
          where: { statut: { in: [StatutMembreGroupe.ACTIF, StatutMembreGroupe.DEFAILLANT] } },
          include: {
            utilisateur: {
              select: { id: true, telephone: true, nom: true, soldeCommission: true },
            },
          },
        },
        transactions: {
          where: {
            creeLe: { gte: il24h },
            type: TypeTransaction.COTISATION,
            statut: StatutTransaction.SUCCES,
          },
          select: { utilisateurId: true },
        },
      },
    });

    let defaillances = 0;
    for (const tontine of tontines) {
      const membresAyantCotise = new Set(tontine.transactions.map((t) => t.utilisateurId));

      for (const membre of tontine.membres) {
        if (membresAyantCotise.has(membre.utilisateurId)) {
          if (membre.statut === StatutMembreGroupe.DEFAILLANT || membre.nombreDefaillances > 0) {
            await this.prisma.membreTontineGroupe.update({
              where: { id: membre.id },
              data: {
                statut: StatutMembreGroupe.ACTIF,
                nombreDefaillances: 0,
                derniereDefaillanceLe: null,
              },
            });
          }
          continue;
        }

        if (!membresAyantCotise.has(membre.utilisateurId) && tontine.montantJournalier > 0) {
          // Utiliser la caution si disponible
          let cautionUtilisee = 0;
          if (membre.montantCaution > 0) {
            cautionUtilisee = Math.min(membre.montantCaution, tontine.montantJournalier);
            await this.prisma.membreTontineGroupe.update({
              where: { id: membre.id },
              data: { montantCaution: { decrement: cautionUtilisee } },
            });
            this.logger.warn(`[Défaillance] Caution prélevée pour ${membre.utilisateur.nom} dans ${tontine.nom}: ${cautionUtilisee} FCFA`);
          }

          const nombreDefaillances = membre.nombreDefaillances + 1;

          // Marquer DEFAILLANT ou EXCLU selon les défauts consécutifs.
          const nouveauStatut = nombreDefaillances >= 2
            ? StatutMembreGroupe.EXCLU
            : StatutMembreGroupe.DEFAILLANT;

          await this.prisma.$transaction([
            this.prisma.defaillanceGroupe.create({
              data: {
                tontineId: tontine.id,
                membreId: membre.id,
                montantManquant: Math.max(0, tontine.montantJournalier - cautionUtilisee),
                cautionUtilisee,
                statut: nouveauStatut === StatutMembreGroupe.EXCLU ? 'EXCLU' : 'EN_COURS',
                ...(nouveauStatut === StatutMembreGroupe.EXCLU && { resoluLe: new Date() }),
              },
            }),
            this.prisma.membreTontineGroupe.update({
              where: { id: membre.id },
              data: {
                statut: nouveauStatut,
                nombreDefaillances,
                derniereDefaillanceLe: new Date(),
                ...(nouveauStatut === StatutMembreGroupe.EXCLU && {
                  excluLe: new Date(),
                  motifExclusion: '2 défaillances consécutives',
                }),
              },
            }),
          ]);

          await this.sms.envoyer(
            membre.utilisateur.telephone,
            `TontineBénin: ⚠️ ${membre.utilisateur.nom}, vous n'avez pas cotisé dans "${tontine.nom}" aujourd'hui. ${nouveauStatut === StatutMembreGroupe.EXCLU ? 'Vous êtes exclu du groupe.' : 'Attention : 2ème défaillance = exclusion.'}`,
          );

          defaillances++;
        }
      }
    }
    this.logger.log(`[CRON 7h30] ${defaillances} défaillance(s) traitée(s)`);
  }

  // ─────────────────────────────────────────────────
  // CRON 1ER DU MOIS 9H — FACTURATION COLLECTEURS
  // ─────────────────────────────────────────────────
  @Cron('0 9 1 * *', { name: 'facturation-mensuelle' })
  async facturerAbonnementsCollecteurs() {
    this.logger.log('[CRON 1er/mois] Facturation abonnements collecteurs...');
    const facturations = await this.prisma.facturationAgent.findMany({
      where: { actif: true },
      include: {
        agent: { 
          select: { 
            id: true, 
            telephone: true, 
            nom: true,
            _count: { select: { clients: { where: { statut: 'ACTIF' } } } }
          } 
        },
      },
    });

    let succes = 0;
    let echecs = 0;
    for (const fact of facturations) {
      const nbClients = fact.agent._count.clients;
      const fraisGestion = nbClients * BUSINESS.FRAIS_PAR_CLIENT_MENSUEL;
      const totalAFacturer = fact.fraisMensuels + fraisGestion;

      try {
        await this.kkiapay.initierPaiement({
          montant: totalAFacturer,
          telephone: fact.agent.telephone,
          reference: `abonnement_${fact.agentId}_${new Date().toISOString().slice(0, 7)}`,
          description: `Abonnement TontinePro ${fact.plan} (+ ${nbClients} clients) — ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
        });

        await this.prisma.facturationAgent.update({
          where: { id: fact.id },
          data: {
            dernierPaiement: new Date(),
            prochainPaiement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            totalClients: nbClients, // Mise à jour stat
          },
        });

        await this.sms.envoyer(
          fact.agent.telephone,
          `TontinePro: ✅ Abonnement ${fact.plan} prélevé: ${totalAFacturer} FCFA (${fact.fraisMensuels}F base + ${fraisGestion}F pour ${nbClients} clients). Merci !`,
        );
        succes++;
      } catch (err) {
        this.logger.error(`Erreur facturation agent ${fact.agentId}: ${err.message}`);
        await this.sms.envoyer(
          fact.agent.telephone,
          `TontinePro: ⚠️ Échec prélèvement abonnement ${fact.plan} (${totalAFacturer} FCFA). Vérifiez votre solde Mobile Money pour éviter la suspension.`,
        );
        echecs++;
      }
    }
    this.logger.log(`[CRON Facturation] ${succes} succès / ${echecs} échecs`);
  }

  // ─────────────────────────────────────────────────
  // CRON 6H — RÉGÉNÉRATION QR CODES EXPIRÉS
  // ─────────────────────────────────────────────────
  @Cron('0 6 * * *', { name: 'regenerer-qrcodes' })
  async regenererQRCodesExpires() {
    const maintenant = new Date();
    const expires = await this.prisma.qRCodeCollecteur.findMany({
      where: { expireLe: { lt: maintenant }, actif: true },
      select: { id: true, collecteurId: true },
    });

    for (const qr of expires) {
      const { randomUUID } = await import('crypto');
      await this.prisma.qRCodeCollecteur.update({
        where: { id: qr.id },
        data: {
          codeQR: randomUUID(),
          expireLe: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }
    if (expires.length > 0) {
      this.logger.log(`[CRON 6h] ${expires.length} QR code(s) régénéré(s)`);
    }
  }

  // ─────────────────────────────────────────────────
  // CRON MINUIT — VÉRIFICATION COHÉRENCE COMPTABLE
  // ─────────────────────────────────────────────────
  @Cron('30 0 * * *', { name: 'coherence-comptable' })
  async verifierCoherenceComptable() {
    this.logger.log('[CRON 0h30] Vérification cohérence comptable...');
    const tontines = await this.prisma.tontine.findMany({
      select: { id: true, nom: true, soldeActuel: true },
    });

    let anomalies = 0;

    // ─── VÉRIF 1 : Soldes internes ───────────────────
    for (const tontine of tontines) {
      const totalTransactions = await this.prisma.transaction.aggregate({
        where: {
          tontineId: tontine.id,
          type: TypeTransaction.COTISATION,
          statut: StatutTransaction.SUCCES,
        },
        _sum: { montantNet: true },
      } as any);

      const totalRetraits = await this.prisma.retrait.aggregate({
        where: {
          tontineId: tontine.id,
          statut: 'EXECUTE',
        },
        _sum: { montant: true },
      });

      const totalDistributions = await this.prisma.transaction.aggregate({
        where: {
          tontineId: tontine.id,
          type: TypeTransaction.DISTRIBUTION_GROUPE,
        },
        _sum: { montant: true },
      });

      const soldeCalcule =
        ((totalTransactions._sum as any).montantNet ?? 0) -
        ((totalRetraits._sum as any).montant ?? 0) -
        ((totalDistributions._sum as any).montant ?? 0);
      const ecart = Math.abs(soldeCalcule - tontine.soldeActuel);

      if (ecart > 1) {
        this.logger.warn(
          `[Cohérence] Tontine ${tontine.nom}: solde BD=${tontine.soldeActuel} FCFA, calculé=${soldeCalcule} FCFA, écart=${ecart} FCFA`,
        );
        await this.creerOuMettreAJourAlerteCoherence(tontine, soldeCalcule, ecart);
        anomalies++;
      } else {
        await this.resoudreAlerteCoherence(tontine.id);
      }
    }

    // ─── VÉRIF 2 : Solde KKiaPay (à activer quand l'API expose un endpoint de solde) ─
    // Note : KKiaPay ne propose pas encore d'endpoint de consultation de solde marchand
    // dans leur API publique. Cette vérification sera activée dès qu'elle sera disponible.
    // Structure prévue :
    //   const soldeKKiaPay = await this.kkiapay.consulterSolde();
    //   const totalPlatforme = somme des montantsNet des cotisations réussies;
    //   if (Math.abs(soldeKKiaPay - totalPlateforme) > SEUIL) → alerte CRITIQUE + suspend retraits
    this.logger.log('[CRON 0h30] Vérif2 KKiaPay : en attente endpoint API marchand KKiaPay.');

    // ─── VÉRIF 3 : Intégrité de la chaîne de hachage ─
    const txsRecentes = await this.prisma.transaction.findMany({
      where: { statut: StatutTransaction.SUCCES },
      orderBy: { creeLe: 'asc' },
      take: 500, // On vérifie les 500 dernières pour la performance
      select: { id: true, utilisateurId: true, hashPrecedent: true, hashActuel: true, creeLe: true },
    });

    let chaineBrisee = 0;
    for (let i = 1; i < txsRecentes.length; i++) {
      const txCourante = txsRecentes[i];
      const txPrecedente = txsRecentes[i - 1];

      // Si même utilisateur, vérifier que hashPrecedent de la tx courante = hashActuel de la précédente
      if (txCourante.utilisateurId === txPrecedente.utilisateurId) {
        if (txCourante.hashPrecedent !== null && txCourante.hashPrecedent !== txPrecedente.hashActuel) {
          chaineBrisee++;
          this.logger.error(
            `[CHAÎNE HASH] Rupture détectée — tx: ${txCourante.id} | attendu: ${txPrecedente.hashActuel} | reçu: ${txCourante.hashPrecedent}`,
          );
        }
      }
    }

    if (chaineBrisee > 0) {
      anomalies += chaineBrisee;
      await this.prisma.alerteSysteme.create({
        data: {
          type: 'INTEGRITE_CHAINE',
          severite: 'CRITIQUE',
          statut: 'OUVERTE',
          titre: `Intégrité chaîne de hachage compromise — ${chaineBrisee} rupture(s)`,
          message: `La vérification nocturne a détecté ${chaineBrisee} rupture(s) dans la chaîne de hachage des transactions. Une modification directe de la base de données est suspectée.`,
          resourceType: 'SYSTEME',
          resourceId: 'HASH_CHAIN',
          metadata: JSON.stringify({ chaineBrisee, txsVerifiees: txsRecentes.length }),
        },
      });
    }

    this.logger.log(
      `[CRON 0h30] Triple-check terminé — Vérif1: ${anomalies - chaineBrisee} anomalie(s) solde | Vérif3: ${chaineBrisee} rupture(s) chaîne`,
    );
  }

  private async creerOuMettreAJourAlerteCoherence(
    tontine: { id: string; nom: string; soldeActuel: number },
    soldeCalcule: number,
    ecart: number,
  ) {
    const metadata = JSON.stringify({
      soldeBase: tontine.soldeActuel,
      soldeCalcule,
      ecart,
      detectePar: 'cron.coherence-comptable',
    });

    const existante = await this.prisma.alerteSysteme.findFirst({
      where: {
        type: 'COHERENCE_COMPTABLE',
        resourceType: 'TONTINE',
        resourceId: tontine.id,
        statut: 'OUVERTE',
      },
    });

    if (existante) {
      await this.prisma.alerteSysteme.update({
        where: { id: existante.id },
        data: {
          severite: 'CRITIQUE',
          titre: `Solde incohérent: ${tontine.nom}`,
          message: `Solde BD ${tontine.soldeActuel} FCFA, solde calculé ${soldeCalcule} FCFA, écart ${ecart} FCFA.`,
          metadata,
        },
      });
      return;
    }

    await this.prisma.alerteSysteme.create({
      data: {
        type: 'COHERENCE_COMPTABLE',
        severite: 'CRITIQUE',
        statut: 'OUVERTE',
        titre: `Solde incohérent: ${tontine.nom}`,
        message: `Solde BD ${tontine.soldeActuel} FCFA, solde calculé ${soldeCalcule} FCFA, écart ${ecart} FCFA.`,
        resourceType: 'TONTINE',
        resourceId: tontine.id,
        metadata,
      },
    });
  }

  private async resoudreAlerteCoherence(tontineId: string) {
    await this.prisma.alerteSysteme.updateMany({
      where: {
        type: 'COHERENCE_COMPTABLE',
        resourceType: 'TONTINE',
        resourceId: tontineId,
        statut: 'OUVERTE',
      },
      data: {
        statut: 'RESOLUE',
        resolueLe: new Date(),
      },
    });
  }

  async declencherFacturationManuellement() {
    await this.facturerAbonnementsCollecteurs();
    return { succes: true, message: 'Facturation mensuelle déclenchée manuellement.' };
  }

  async declencherRappelsManuellement() {
    await this.envoyerRappelsCotisation();
    return { succes: true, message: 'Rappels cotisation déclenchés manuellement.' };
  }

  // ─────────────────────────────────────────────────
  // CRON 6H — DISSOLUTION AUTOMATIQUE TONTINES PROJET ÉCHÉES
  // ─────────────────────────────────────────────────
  @Cron('0 6 * * *', { name: 'dissolution-projets-echus' })
  async dissoudreProjetsEchus() {
    this.logger.log('[CRON 6h] Vérification tontines PROJET échées...');
    const maintenant = new Date();

    const projetsEchus = await this.prisma.tontine.findMany({
      where: {
        type: 'PROJET',
        statut: StatutTontine.ACTIVE,
        dateFin: { lte: maintenant },
      },
      include: {
        proprietaire: { select: { id: true, telephone: true, nom: true } },
      },
    });

    if (projetsEchus.length === 0) {
      this.logger.log('[CRON 6h] Aucune tontine PROJET échée.');
      return;
    }

    let dissouts = 0;
    for (const tontine of projetsEchus) {
      try {
        await this.prisma.tontine.update({
          where: { id: tontine.id },
          data: { statut: StatutTontine.TERMINEE },
        });

        // SMS/Push optimisé (court pour feature phones)
        const message = `TontineBénin: Votre projet "${tontine.nom}" est arrivé à échéance et a été clôturé. Contactez votre agent pour le retrait.`;
        await this.notifications.envoyerAUtilisateur(
          tontine.proprietaire.id,
          'Projet clôturé',
          message,
          'TOUS',
          TypeNotification.TOUR_TONTINE,
        );

        this.logger.log(`[CRON 6h] Tontine PROJET clôturée: ${tontine.nom} (${tontine.id})`);
        dissouts++;
      } catch (err: any) {
        this.logger.error(`[CRON 6h] Erreur dissolution tontine ${tontine.id}: ${err.message}`);
      }
    }
    this.logger.log(`[CRON 6h] ${dissouts}/${projetsEchus.length} projet(s) dissous.`);
  }

  async declencherDissolutionProjetsManuellement() {
    await this.dissoudreProjetsEchus();
    return { succes: true, message: 'Dissolution projets échés déclenchée manuellement.' };
  }

  // ─────────────────────────────────────────────────
  // CRON 8H05 — RAPPORT JOURNALIER SUPERVISEURS
  // ─────────────────────────────────────────────────
  @Cron('5 8 * * *', { name: 'rapport-journalier-superviseurs' })
  async rapportJournalierSuperviseurs() {
    this.logger.log('[CRON 8h05] Génération des rapports superviseurs...');
    
    const superviseurs = await this.prisma.utilisateur.findMany({
      where: { role: Role.SUPERVISEUR, statut: StatutCompte.ACTIF },
    });

    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    hier.setHours(0, 0, 0, 0);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    for (const sup of superviseurs) {
      // 1. Total collecté par ses agents hier
      const stats = await this.prisma.transaction.aggregate({
        where: {
          statut: StatutTransaction.SUCCES,
          type: TypeTransaction.COTISATION,
          creeLe: { gte: hier, lt: aujourdhui },
          utilisateur: {
            collecteur: { superviseurId: sup.id },
          },
        },
        _sum: { montant: true },
        _count: { id: true },
      });

      // 2. Nouveaux clients recrutés dans la zone hier
      const nouveauxClients = await this.prisma.utilisateur.count({
        where: {
          role: Role.CLIENT,
          creeLe: { gte: hier, lt: aujourdhui },
          collecteur: { superviseurId: sup.id },
        },
      });

      const total = stats._sum.montant ?? 0;
      if (total > 0 || nouveauxClients > 0) {
        await this.notifications.envoyerAUtilisateur(
          sup.id,
          'Rapport Journalier Zone',
          `Hier, votre zone a collecté ${total.toLocaleString('fr-FR')} F (${stats._count.id} dépôts). Nouveaux clients : ${nouveauxClients}.`,
          'PUSH',
        );
      }
    }
  }

  async declencherRapportSuperviseurManuellement() {
    await this.rapportJournalierSuperviseurs();
    return { succes: true, message: 'Rapport superviseurs déclenché.' };
  }

  private libelleMontantFrequence(frequence: FrequenceTontine, montant: number): string {
    const fmt = `${montant.toLocaleString('fr-FR')} F`;
    switch (frequence) {
      case FrequenceTontine.JOURNALIER:   return `journalière de ${fmt}`;
      case FrequenceTontine.HEBDOMADAIRE: return `hebdo de ${fmt}`;
      case FrequenceTontine.DATE_FIXE:
      case FrequenceTontine.MENSUEL:      return `mensuelle de ${fmt}`;
      default: return `de ${fmt}`;
    }
  }

  // ─────────────────────────────────────────────────
  // CRON HORAIRE — REVOCATION SESSIONS EXPIRÉES
  // ─────────────────────────────────────────────────
  @Cron('0 * * * *', { name: 'revoquer-sessions-expirees' })
  async revoquerSessionsExpirees() {
    this.logger.log('[CRON Horaire] Révocation sessions expirées...');
    const maintenant = new Date();

    const result = await this.prisma.sessionUtilisateur.updateMany({
      where: {
        expireLe: { lt: maintenant },
        revoqueLe: null,
        actif: true,
      },
      data: {
        revoqueLe: maintenant,
        actif: false,
      },
    });

    if (result.count > 0) {
      this.logger.log(`[CRON] ${result.count} session(s) expirée(s) révoquée(s) automatiquement`);
    }
  }

  async declencherRevocationManuellement() {
    await this.revoquerSessionsExpirees();
    return { succes: true, message: 'Révocation sessions expirées déclenchée manuellement.' };
  }
}
