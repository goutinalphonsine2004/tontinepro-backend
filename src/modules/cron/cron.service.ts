import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Role, StatutCompte, StatutCredit, StatutDossierPADME, StatutMembreGroupe, TypeTransaction, StatutTransaction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { BadgesService } from '../badges/badges.service';
import { BUSINESS } from '../../common/constants/business.constants';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
    private sms: SmsService,
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
          `TontineBénin: 🎉 Bravo ${credit.client.nom} ! Votre micro-crédit de ${credit.montantPrincipal} FCFA est entièrement remboursé. Votre score de crédit va augmenter.`,
        );
        this.logger.log(`[CRON] Crédit TERMINÉ: ${credit.id} — ${credit.client.nom}`);
      } else {
        await this.sms.envoyer(
          credit.client.telephone,
          `TontineBénin: Prélèvement ${credit.paiementJournalier} FCFA effectué ✅. Restant: ${montantRestant} FCFA (${joursPayes}/${credit.totalJours} jours).`,
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
      `TontineBénin: ⚠️ Prélèvement échoué. Assurez-vous d'avoir ${credit.paiementJournalier} FCFA sur votre compte Mobile Money.`,
    );

    if (credit.client.collecteurId) {
      const collecteur = await this.prisma.utilisateur.findUnique({
        where: { id: credit.client.collecteurId },
        select: { telephone: true },
      });
      if (collecteur) {
        await this.sms.envoyer(
          collecteur.telephone,
          `TontineBénin: Alerte — prélèvement échoué pour ${credit.client.nom}. Crédit: ${credit.montantPrincipal} FCFA.`,
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
        `TontineBénin: 🎉 Félicitations ! Votre dossier PADME a été généré automatiquement (score: ${score}/100). L'administration va vous contacter prochainement.`,
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
  // CRON 8H — RAPPELS COTISATION (J-3, J-1, JOUR J)
  // ─────────────────────────────────────────────────
  @Cron('0 8 * * *', { name: 'rappels-cotisation' })
  async envoyerRappelsCotisation() {
    this.logger.log('[CRON 8h] Rappels cotisation...');
    const maintenant = new Date();
    const tontines = await this.prisma.tontine.findMany({
      where: { dateDeverrouillage: { not: null } },
      include: {
        proprietaire: { select: { telephone: true, nom: true } },
        membres: {
          where: { statut: StatutMembreGroupe.ACTIF },
          include: { utilisateur: { select: { telephone: true, nom: true } } },
        },
      },
    });

    let rappelsEnvoyes = 0;
    for (const tontine of tontines) {
      if (!tontine.dateDeverrouillage) continue;
      const joursRestants = Math.ceil(
        (tontine.dateDeverrouillage.getTime() - maintenant.getTime()) / (24 * 60 * 60 * 1000),
      );

      let message: string | null = null;
      if (joursRestants === 3) {
        message = `TontineBénin: ⏰ Rappel — votre tontine "${tontine.nom}" se débloque dans 3 jours. Pensez à cotiser !`;
      } else if (joursRestants === 1) {
        message = `TontineBénin: ⏰ Rappel — votre tontine "${tontine.nom}" se débloque demain ! Dernière chance de cotiser.`;
      } else if (joursRestants === 0) {
        message = `TontineBénin: 🎉 Aujourd'hui est le jour J pour votre tontine "${tontine.nom}" ! Cotisez maintenant.`;
      }

      if (message) {
        const destinataires = [
          tontine.proprietaire.telephone,
          ...tontine.membres.map((m) => m.utilisateur.telephone),
        ];
        for (const tel of destinataires) {
          await this.sms.envoyer(tel, message);
          rappelsEnvoyes++;
        }
      }
    }
    this.logger.log(`[CRON 8h] ${rappelsEnvoyes} rappel(s) cotisation envoyé(s)`);
  }

  // ─────────────────────────────────────────────────
  // CRON 7H — DÉTECTION DÉFAILLANCES GROUPE
  // ─────────────────────────────────────────────────
  @Cron('30 7 * * *', { name: 'defaillances-groupe' })
  async detecterDefaillancesGroupe() {
    this.logger.log('[CRON 7h30] Détection défaillances groupe...');
    const il24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Tontines de groupe avec au moins un membre actif
    const tontines = await this.prisma.tontine.findMany({
      where: { type: 'GROUPE' },
      include: {
        membres: {
          where: { statut: StatutMembreGroupe.ACTIF },
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
        if (!membresAyantCotise.has(membre.utilisateurId) && tontine.montantJournalier > 0) {
          // Utiliser la caution si disponible
          if (membre.montantCaution > 0) {
            const montantPreleveCalution = Math.min(membre.montantCaution, tontine.montantJournalier);
            await this.prisma.membreTontineGroupe.update({
              where: { id: membre.id },
              data: { montantCaution: { decrement: montantPreleveCalution } },
            });
            this.logger.warn(`[Défaillance] Caution prélevée pour ${membre.utilisateur.nom} dans ${tontine.nom}: ${montantPreleveCalution} FCFA`);
          }

          // Comptabiliser les défaillances
          const defaillancesActuelles = await this.prisma.membreTontineGroupe.count({
            where: {
              tontineId: tontine.id,
              utilisateurId: membre.utilisateurId,
              statut: StatutMembreGroupe.DEFAILLANT,
            },
          });

          // Marquer DEFAILLANT ou EXCLU selon historique
          const nouveauStatut = defaillancesActuelles >= 1
            ? StatutMembreGroupe.EXCLU
            : StatutMembreGroupe.DEFAILLANT;

          await this.prisma.membreTontineGroupe.update({
            where: { id: membre.id },
            data: {
              statut: nouveauStatut,
              ...(nouveauStatut === StatutMembreGroupe.EXCLU && {
                excluLe: new Date(),
                motifExclusion: '2 défaillances consécutives',
              }),
            },
          });

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
        agent: { select: { id: true, telephone: true, nom: true } },
      },
    });

    let succes = 0;
    let echecs = 0;
    for (const fact of facturations) {
      try {
        await this.kkiapay.initierPaiement({
          montant: fact.fraisMensuels,
          telephone: fact.agent.telephone,
          reference: `abonnement_${fact.agentId}_${new Date().toISOString().slice(0, 7)}`,
          description: `Abonnement TontineBénin ${fact.plan} — ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
        });

        await this.prisma.facturationAgent.update({
          where: { id: fact.id },
          data: {
            dernierPaiement: new Date(),
            prochainPaiement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        await this.sms.envoyer(
          fact.agent.telephone,
          `TontineBénin: ✅ Abonnement ${fact.plan} (${fact.fraisMensuels} FCFA) prélevé avec succès. Merci !`,
        );
        succes++;
      } catch {
        await this.sms.envoyer(
          fact.agent.telephone,
          `TontineBénin: ⚠️ Impossible de prélever votre abonnement ${fact.plan} (${fact.fraisMensuels} FCFA). Vérifiez votre solde Mobile Money.`,
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
          expireLe: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
          utilisateur: { tontines: { some: { id: tontine.id } } },
          statut: 'EXECUTE',
        },
        _sum: { montant: true },
      });

      const soldeCalcule =
        ((totalTransactions._sum as any).montantNet ?? 0) - ((totalRetraits._sum as any).montant ?? 0);
      const ecart = Math.abs(soldeCalcule - tontine.soldeActuel);

      if (ecart > 1) {
        this.logger.warn(
          `[Cohérence] Tontine ${tontine.nom}: solde BD=${tontine.soldeActuel} FCFA, calculé=${soldeCalcule} FCFA, écart=${ecart} FCFA`,
        );
        anomalies++;
      }
    }
    this.logger.log(`[CRON 0h30] Cohérence vérifiée — ${anomalies} anomalie(s) détectée(s)`);
  }

  async declencherFacturationManuellement() {
    await this.facturerAbonnementsCollecteurs();
    return { succes: true, message: 'Facturation mensuelle déclenchée manuellement.' };
  }

  async declencherRappelsManuellement() {
    await this.envoyerRappelsCotisation();
    return { succes: true, message: 'Rappels cotisation déclenchés manuellement.' };
  }
}
