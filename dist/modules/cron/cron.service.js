"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const pdf_service_1 = require("../../common/services/pdf.service");
const sms_service_1 = require("../notifications/sms.service");
const whatsapp_service_1 = require("../notifications/whatsapp.service");
const notifications_service_1 = require("../notifications/notifications.service");
const badges_service_1 = require("../badges/badges.service");
const business_constants_1 = require("../../common/constants/business.constants");
let CronService = CronService_1 = class CronService {
    prisma;
    kkiapay;
    sms;
    whatsapp;
    pdf;
    notifications;
    badges;
    config;
    logger = new common_1.Logger(CronService_1.name);
    constructor(prisma, kkiapay, sms, whatsapp, pdf, notifications, badges, config) {
        this.prisma = prisma;
        this.kkiapay = kkiapay;
        this.sms = sms;
        this.whatsapp = whatsapp;
        this.pdf = pdf;
        this.notifications = notifications;
        this.badges = badges;
        this.config = config;
    }
    async preleverRemboursementsJournaliers() {
        this.logger.log('[CRON 7h] Prélèvement remboursements journaliers...');
        const credits = await this.prisma.microCredit.findMany({
            where: { statut: client_1.StatutCredit.ACTIF },
            include: { client: { select: { id: true, nom: true, telephone: true, collecteurId: true } } },
        });
        this.logger.log(`[CRON 7h] ${credits.length} crédit(s) actif(s) à traiter`);
        for (const credit of credits) {
            await this.preleverUnCredit(credit);
        }
    }
    async preleverUnCredit(credit) {
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
            await this.sms.envoyer(credit.client.telephone, `TontineBénin: Prélèvement de ${credit.paiementJournalier} FCFA initié pour votre micro-crédit. Confirmation en cours.`);
        }
        catch {
            await this.gererEchecRemboursement(credit);
        }
    }
    async gererEchecRemboursement(credit) {
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
                data: { statut: client_1.StatutCredit.EN_DEFAUT },
            });
            this.logger.warn(`[CRON] Crédit EN_DEFAUT: ${credit.id} — ${credit.client.nom}`);
        }
        await this.sms.envoyer(credit.client.telephone, `TontineBénin: ⚠️ Prélèvement échoué. Assurez-vous d'avoir ${credit.paiementJournalier} FCFA sur votre compte Mobile Money.`);
        if (credit.client.collecteurId) {
            const collecteur = await this.prisma.utilisateur.findUnique({
                where: { id: credit.client.collecteurId },
                select: { telephone: true },
            });
            if (collecteur) {
                await this.sms.envoyer(collecteur.telephone, `TontineBénin: Alerte — prélèvement échoué pour ${credit.client.nom}. Crédit: ${credit.montantPrincipal} FCFA.`);
            }
        }
    }
    async scoringNocturne() {
        this.logger.log('[CRON 0h] Scoring nocturne en cours...');
        const clients = await this.prisma.utilisateur.findMany({
            where: { role: client_1.Role.CLIENT, statut: client_1.StatutCompte.ACTIF },
            select: { id: true },
        });
        this.logger.log(`[CRON 0h] ${clients.length} client(s) à scorer`);
        for (const client of clients) {
            await this.calculerEtMettreAJourScore(client.id);
        }
    }
    async calculerEtMettreAJourScore(clientId) {
        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { id: clientId },
            include: {
                transactions: {
                    where: { type: client_1.TypeTransaction.COTISATION, statut: client_1.StatutTransaction.SUCCES },
                },
                microCredits: {
                    where: { statut: { in: [client_1.StatutCredit.TERMINE, client_1.StatutCredit.ACTIF, client_1.StatutCredit.EN_DEFAUT] } },
                },
                tontines: true,
            },
        });
        if (!utilisateur)
            return 0;
        const ancienneteMs = Date.now() - utilisateur.creeLe.getTime();
        const ancienneteEnMois = Math.floor(ancienneteMs / (30 * 24 * 60 * 60 * 1000));
        const scoreAnciennete = Math.min(ancienneteEnMois * 2, 20);
        const il30Jours = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const joursCotises = new Set(utilisateur.transactions
            .filter((t) => t.creeLe >= il30Jours)
            .map((t) => t.creeLe.toISOString().slice(0, 10))).size;
        const tauxRegularite = Math.min(joursCotises / 30, 1);
        const credits = utilisateur.microCredits;
        let scoreRemboursement = 1;
        if (credits.length > 0) {
            const termines = credits.filter((c) => c.statut === client_1.StatutCredit.TERMINE).length;
            const defauts = credits.filter((c) => c.statut === client_1.StatutCredit.EN_DEFAUT).length;
            scoreRemboursement = termines / credits.length;
            if (defauts > 0)
                scoreRemboursement *= 0.5;
        }
        const bonusObjectif = utilisateur.tontines.some((t) => t.objectifMontant && t.soldeActuel >= t.objectifMontant)
            ? 1
            : 0;
        const score = Math.round(tauxRegularite * 40 + scoreAnciennete + scoreRemboursement * 30 + bonusObjectif * 10);
        const scoreFinal = Math.min(Math.max(score, 0), 100);
        const eligible = scoreFinal >= business_constants_1.BUSINESS.SEUIL_SCORE_MICRO_CREDIT;
        const eligiblePADME = scoreFinal >= business_constants_1.BUSINESS.SEUIL_SCORE_PADME;
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
        await this.badges.attribuerBadgesSiEligible(clientId);
        return scoreFinal;
    }
    async genererDossierPADME(clientId, score, tauxRegularite) {
        const dossierRecent = await this.prisma.dossierPADME.findFirst({
            where: {
                clientId,
                creeLe: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                statut: { in: [client_1.StatutDossierPADME.GENERE, client_1.StatutDossierPADME.VALIDE_ADMIN, client_1.StatutDossierPADME.SOUMIS_PADME] },
            },
        });
        if (dossierRecent)
            return;
        const [scoreCredit, client, totalEpargne, creditsRembourses] = await Promise.all([
            this.prisma.scoreCredit.findUnique({ where: { utilisateurId: clientId } }),
            this.prisma.utilisateur.findUnique({ where: { id: clientId }, select: { telephone: true, nom: true } }),
            this.prisma.transaction.aggregate({
                where: { utilisateurId: clientId, type: client_1.TypeTransaction.COTISATION, statut: client_1.StatutTransaction.SUCCES },
                _sum: { montantNet: true },
            }),
            this.prisma.microCredit.count({ where: { clientId, statut: client_1.StatutCredit.TERMINE } }),
        ]);
        if (!scoreCredit)
            return;
        const dossier = await this.prisma.dossierPADME.create({
            data: {
                clientId,
                scoreCreditId: scoreCredit.id,
                scoreAuMoment: score,
                totalEpargne: totalEpargne._sum.montantNet ?? 0,
                tauxRegularite,
                creditsRembourses,
                statut: client_1.StatutDossierPADME.GENERE,
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
            await this.sms.envoyer(client.telephone, `TontineBénin: 🎉 Félicitations ! Votre dossier PADME a été généré automatiquement (score: ${score}/100). L'administration va vous contacter prochainement.`);
        }
        await this.notifierAdminsDossierPADME(dossier.id, client?.nom ?? clientId, score);
        this.logger.log(`[CRON PADME] Dossier généré pour client ${clientId} — score ${score}`);
    }
    async notifierAdminsDossierPADME(dossierId, clientNom, score) {
        const admins = await this.prisma.utilisateur.findMany({
            where: { role: client_1.Role.ADMIN, statut: client_1.StatutCompte.ACTIF },
            select: { id: true },
        });
        for (const admin of admins) {
            await this.notifications.envoyerAUtilisateur(admin.id, 'Dossier PADME prêt', `Un dossier PADME est prêt pour ${clientNom}. Score: ${score}/100. Dossier: ${dossierId}.`, 'PUSH', client_1.TypeNotification.DOSSIER_PADME_SOUMIS);
        }
    }
    async nettoyerOTPExpires() {
        const result = await this.prisma.codeOTP.deleteMany({
            where: { expireLe: { lt: new Date() } },
        });
        this.logger.log(`[CRON 0h] ${result.count} OTP expirés supprimés`);
    }
    async expirerCreditsConsentementExpires() {
        const limite = new Date(Date.now() - 30 * 60 * 1000);
        const result = await this.prisma.microCredit.updateMany({
            where: {
                statut: client_1.StatutCredit.EN_ATTENTE,
                methodeConsentement: 'SMS',
                consentementObtenu: false,
                creeLe: { lt: limite },
            },
            data: { statut: client_1.StatutCredit.EXPIRE },
        });
        if (result.count > 0) {
            this.logger.log(`[CRON] ${result.count} crédit(s) SMS expiré(s) pour non-réponse`);
        }
    }
    async declencherScoringManuellement(clientId) {
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
    async envoyerAlertesSoldeFaible() {
        this.logger.log('[CRON 8h] Alerte solde faible...');
        const seuilAlerte = parseInt(this.config.get('SEUIL_ALERTE_SOLDE_FAIBLE', '5000'));
        const clients = await this.prisma.utilisateur.findMany({
            where: {
                role: client_1.Role.CLIENT,
                statut: client_1.StatutCompte.ACTIF,
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
            const soldeTotal = client.tontines.reduce((acc, t) => acc + (t.soldeActuel || 0), 0);
            if (soldeTotal > 0 && soldeTotal < seuilAlerte) {
                await this.sms.envoyer(client.telephone, `TontineBénin: ⚠️ ${client.nom}, votre solde actuel est faible (${soldeTotal} FCFA). Cotisez pour rester régulier.`);
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
    async envoyerRappelsCotisation() {
        this.logger.log('[CRON 8h] Rappels cotisation...');
        const maintenant = new Date();
        const tontines = await this.prisma.tontine.findMany({
            where: { dateDeverrouillage: { not: null } },
            include: {
                proprietaire: { select: { telephone: true, nom: true } },
                membres: {
                    where: { statut: client_1.StatutMembreGroupe.ACTIF },
                    include: { utilisateur: { select: { telephone: true, nom: true } } },
                },
            },
        });
        let rappelsEnvoyes = 0;
        for (const tontine of tontines) {
            if (!tontine.dateDeverrouillage)
                continue;
            const joursRestants = Math.ceil((tontine.dateDeverrouillage.getTime() - maintenant.getTime()) / (24 * 60 * 60 * 1000));
            let message = null;
            if (joursRestants === 3) {
                message = `TontineBénin: ⏰ Rappel — votre tontine "${tontine.nom}" se débloque dans 3 jours. Pensez à cotiser !`;
            }
            else if (joursRestants === 1) {
                message = `TontineBénin: ⏰ Rappel — votre tontine "${tontine.nom}" se débloque demain ! Dernière chance de cotiser.`;
            }
            else if (joursRestants === 0) {
                message = `TontineBénin: 🎉 Aujourd'hui est le jour J pour votre tontine "${tontine.nom}" ! Cotisez maintenant.`;
            }
            if (message) {
                const destinataires = [
                    tontine.proprietaire.telephone,
                    ...tontine.membres.map((m) => m.utilisateur.telephone),
                ];
                for (const tel of destinataires) {
                    await this.sms.envoyer(tel, message);
                    this.whatsapp.envoyerMessage(tel, message).catch((err) => this.logger.warn(`[WhatsApp] Échec rappel cotisation → ${tel}: ${err.message}`));
                    rappelsEnvoyes++;
                }
            }
        }
        this.logger.log(`[CRON 8h] ${rappelsEnvoyes} rappel(s) cotisation envoyé(s)`);
    }
    async detecterDefaillancesGroupe() {
        this.logger.log('[CRON 7h30] Détection défaillances groupe...');
        const il24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const tontines = await this.prisma.tontine.findMany({
            where: { type: 'GROUPE' },
            include: {
                membres: {
                    where: { statut: { in: [client_1.StatutMembreGroupe.ACTIF, client_1.StatutMembreGroupe.DEFAILLANT] } },
                    include: {
                        utilisateur: {
                            select: { id: true, telephone: true, nom: true, soldeCommission: true },
                        },
                    },
                },
                transactions: {
                    where: {
                        creeLe: { gte: il24h },
                        type: client_1.TypeTransaction.COTISATION,
                        statut: client_1.StatutTransaction.SUCCES,
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
                    if (membre.statut === client_1.StatutMembreGroupe.DEFAILLANT || membre.nombreDefaillances > 0) {
                        await this.prisma.membreTontineGroupe.update({
                            where: { id: membre.id },
                            data: {
                                statut: client_1.StatutMembreGroupe.ACTIF,
                                nombreDefaillances: 0,
                                derniereDefaillanceLe: null,
                            },
                        });
                    }
                    continue;
                }
                if (!membresAyantCotise.has(membre.utilisateurId) && tontine.montantJournalier > 0) {
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
                    const nouveauStatut = nombreDefaillances >= 2
                        ? client_1.StatutMembreGroupe.EXCLU
                        : client_1.StatutMembreGroupe.DEFAILLANT;
                    await this.prisma.$transaction([
                        this.prisma.defaillanceGroupe.create({
                            data: {
                                tontineId: tontine.id,
                                membreId: membre.id,
                                montantManquant: Math.max(0, tontine.montantJournalier - cautionUtilisee),
                                cautionUtilisee,
                                statut: nouveauStatut === client_1.StatutMembreGroupe.EXCLU ? 'EXCLU' : 'EN_COURS',
                                ...(nouveauStatut === client_1.StatutMembreGroupe.EXCLU && { resoluLe: new Date() }),
                            },
                        }),
                        this.prisma.membreTontineGroupe.update({
                            where: { id: membre.id },
                            data: {
                                statut: nouveauStatut,
                                nombreDefaillances,
                                derniereDefaillanceLe: new Date(),
                                ...(nouveauStatut === client_1.StatutMembreGroupe.EXCLU && {
                                    excluLe: new Date(),
                                    motifExclusion: '2 défaillances consécutives',
                                }),
                            },
                        }),
                    ]);
                    await this.sms.envoyer(membre.utilisateur.telephone, `TontineBénin: ⚠️ ${membre.utilisateur.nom}, vous n'avez pas cotisé dans "${tontine.nom}" aujourd'hui. ${nouveauStatut === client_1.StatutMembreGroupe.EXCLU ? 'Vous êtes exclu du groupe.' : 'Attention : 2ème défaillance = exclusion.'}`);
                    defaillances++;
                }
            }
        }
        this.logger.log(`[CRON 7h30] ${defaillances} défaillance(s) traitée(s)`);
    }
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
                await this.sms.envoyer(fact.agent.telephone, `TontineBénin: ✅ Abonnement ${fact.plan} (${fact.fraisMensuels} FCFA) prélevé avec succès. Merci !`);
                succes++;
            }
            catch {
                await this.sms.envoyer(fact.agent.telephone, `TontineBénin: ⚠️ Impossible de prélever votre abonnement ${fact.plan} (${fact.fraisMensuels} FCFA). Vérifiez votre solde Mobile Money.`);
                echecs++;
            }
        }
        this.logger.log(`[CRON Facturation] ${succes} succès / ${echecs} échecs`);
    }
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
                    type: client_1.TypeTransaction.COTISATION,
                    statut: client_1.StatutTransaction.SUCCES,
                },
                _sum: { montantNet: true },
            });
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
                    type: client_1.TypeTransaction.DISTRIBUTION_GROUPE,
                },
                _sum: { montant: true },
            });
            const soldeCalcule = (totalTransactions._sum.montantNet ?? 0) -
                (totalRetraits._sum.montant ?? 0) -
                (totalDistributions._sum.montant ?? 0);
            const ecart = Math.abs(soldeCalcule - tontine.soldeActuel);
            if (ecart > 1) {
                this.logger.warn(`[Cohérence] Tontine ${tontine.nom}: solde BD=${tontine.soldeActuel} FCFA, calculé=${soldeCalcule} FCFA, écart=${ecart} FCFA`);
                await this.creerOuMettreAJourAlerteCoherence(tontine, soldeCalcule, ecart);
                anomalies++;
            }
            else {
                await this.resoudreAlerteCoherence(tontine.id);
            }
        }
        this.logger.log('[CRON 0h30] Vérif2 KKiaPay : en attente endpoint API marchand KKiaPay.');
        const txsRecentes = await this.prisma.transaction.findMany({
            where: { statut: client_1.StatutTransaction.SUCCES },
            orderBy: { creeLe: 'asc' },
            take: 500,
            select: { id: true, utilisateurId: true, hashPrecedent: true, hashActuel: true, creeLe: true },
        });
        let chaineBrisee = 0;
        for (let i = 1; i < txsRecentes.length; i++) {
            const txCourante = txsRecentes[i];
            const txPrecedente = txsRecentes[i - 1];
            if (txCourante.utilisateurId === txPrecedente.utilisateurId) {
                if (txCourante.hashPrecedent !== null && txCourante.hashPrecedent !== txPrecedente.hashActuel) {
                    chaineBrisee++;
                    this.logger.error(`[CHAÎNE HASH] Rupture détectée — tx: ${txCourante.id} | attendu: ${txPrecedente.hashActuel} | reçu: ${txCourante.hashPrecedent}`);
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
        this.logger.log(`[CRON 0h30] Triple-check terminé — Vérif1: ${anomalies - chaineBrisee} anomalie(s) solde | Vérif3: ${chaineBrisee} rupture(s) chaîne`);
    }
    async creerOuMettreAJourAlerteCoherence(tontine, soldeCalcule, ecart) {
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
    async resoudreAlerteCoherence(tontineId) {
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
};
exports.CronService = CronService;
__decorate([
    (0, schedule_1.Cron)('0 7 * * *', { name: 'prelever-remboursements' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "preleverRemboursementsJournaliers", null);
__decorate([
    (0, schedule_1.Cron)('0 0 * * *', { name: 'scoring-nocturne' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "scoringNocturne", null);
__decorate([
    (0, schedule_1.Cron)('0 0 * * *', { name: 'nettoyage-otp' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "nettoyerOTPExpires", null);
__decorate([
    (0, schedule_1.Cron)('*/30 * * * *', { name: 'expirer-credits-sms' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "expirerCreditsConsentementExpires", null);
__decorate([
    (0, schedule_1.Cron)('0 * * * *', { name: 'deblocage-auto-pin' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "debloquerPINAutomatiquement", null);
__decorate([
    (0, schedule_1.Cron)('0 8 * * *', { name: 'alerte-solde-faible' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "envoyerAlertesSoldeFaible", null);
__decorate([
    (0, schedule_1.Cron)('0 8 * * *', { name: 'rappels-cotisation' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "envoyerRappelsCotisation", null);
__decorate([
    (0, schedule_1.Cron)('30 7 * * *', { name: 'defaillances-groupe' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "detecterDefaillancesGroupe", null);
__decorate([
    (0, schedule_1.Cron)('0 9 1 * *', { name: 'facturation-mensuelle' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "facturerAbonnementsCollecteurs", null);
__decorate([
    (0, schedule_1.Cron)('0 6 * * *', { name: 'regenerer-qrcodes' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "regenererQRCodesExpires", null);
__decorate([
    (0, schedule_1.Cron)('30 0 * * *', { name: 'coherence-comptable' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "verifierCoherenceComptable", null);
__decorate([
    (0, schedule_1.Cron)('0 * * * *', { name: 'revoquer-sessions-expirees' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "revoquerSessionsExpirees", null);
exports.CronService = CronService = CronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kkiapay_service_1.KkiapayService,
        sms_service_1.SmsService,
        whatsapp_service_1.WhatsappService,
        pdf_service_1.PdfService,
        notifications_service_1.NotificationsService,
        badges_service_1.BadgesService,
        config_1.ConfigService])
], CronService);
//# sourceMappingURL=cron.service.js.map