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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
            include: {
                client: {
                    select: { id: true, nom: true, telephone: true, collecteurId: true },
                },
            },
        });
        this.logger.log(`[CRON 7h] ${credits.length} crédit(s) actif(s) à traiter`);
        for (const credit of credits) {
            await this.preleverUnCredit(credit);
        }
    }
    async preleverUnCredit(credit) {
        try {
            const transfert = await this.kkiapay.initierPaiement({
                montant: credit.paiementJournalierFcfa,
                telephone: credit.client.telephone,
                reference: `remb_${credit.id}_${Date.now()}`,
                description: 'Remboursement micro-crédit TontineBénin',
            });
            await this.prisma.remboursementCredit.create({
                data: {
                    microCreditId: credit.id,
                    montantFcfa: credit.paiementJournalierFcfa,
                    statut: 'EN_ATTENTE',
                    refKKiaPay: transfert.refKKiaPay,
                },
            });
            if (credit.statut === client_1.StatutCredit.EN_DEFAUT) {
                await this.prisma.microCredit.update({
                    where: { id: credit.id },
                    data: { statut: client_1.StatutCredit.ACTIF },
                });
                this.logger.log(`[CRON] Crédit réactivé (ACTIF) après paiement réussi: ${credit.id} — ${credit.client.nom}`);
                await this.sms.envoyer(credit.client.telephone, `TontineBénin: ✅ Votre prélèvement de ${credit.paiementJournalierFcfa} FCFA a réussi. Votre micro-crédit est de nouveau actif.`);
            }
            else {
                await this.sms.envoyer(credit.client.telephone, `TontineBénin: Prélèvement de ${credit.paiementJournalierFcfa} FCFA initié pour votre micro-crédit. Confirmation en cours.`);
            }
        }
        catch {
            await this.gererEchecRemboursement(credit);
        }
    }
    async gererEchecRemboursement(credit) {
        await this.prisma.remboursementCredit.create({
            data: {
                microCreditId: credit.id,
                montantFcfa: credit.paiementJournalierFcfa,
                statut: 'ECHEC',
            },
        });
        const remboursementsRecents = await this.prisma.remboursementCredit.findMany({
            where: { microCreditId: credit.id },
            orderBy: { payeLe: 'desc' },
            take: 10,
        });
        let echecsConsecutifs = 0;
        for (const remb of remboursementsRecents) {
            if (remb.statut === 'ECHEC') {
                echecsConsecutifs++;
            }
            else {
                break;
            }
        }
        if (echecsConsecutifs >= 3) {
            await this.prisma.microCredit.update({
                where: { id: credit.id },
                data: { statut: client_1.StatutCredit.EN_DEFAUT },
            });
            this.logger.warn(`[CRON] Crédit EN_DEFAUT (${echecsConsecutifs} échecs consécutifs): ${credit.id} — ${credit.client.nom}`);
            await this.sms.envoyer(credit.client.telephone, `TontineBénin: 🚨 Votre micro-crédit est en défaut après ${echecsConsecutifs} échecs consécutifs. Contactez votre collecteur.`);
        }
        else {
            await this.sms.envoyer(credit.client.telephone, `TontineBénin: ⚠️ Prélèvement échoué (${echecsConsecutifs}/3). Assurez-vous d'avoir ${credit.paiementJournalierFcfa} FCFA sur votre compte Mobile Money.`);
        }
        if (credit.client.collecteurId) {
            const collecteur = await this.prisma.utilisateur.findUnique({
                where: { id: credit.client.collecteurId },
                select: { telephone: true },
            });
            if (collecteur) {
                await this.sms.envoyer(collecteur.telephone, `TontineBénin: Alerte — prélèvement échoué pour ${credit.client.nom} (${echecsConsecutifs}/3 échecs consécutifs). Crédit: ${credit.montantPrincipalFcfa} FCFA.`);
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
                    where: {
                        type: client_1.TypeTransaction.COTISATION,
                        statut: client_1.StatutTransaction.SUCCES,
                    },
                },
                microCredits: {
                    where: {
                        statut: {
                            in: [
                                client_1.StatutCredit.TERMINE,
                                client_1.StatutCredit.ACTIF,
                                client_1.StatutCredit.EN_DEFAUT,
                            ],
                        },
                    },
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
        const bonusObjectif = utilisateur.tontines.some((t) => t.objectifMontantFcfa && t.soldeActuelFcfa >= t.objectifMontantFcfa)
            ? 1
            : 0;
        const score = Math.round(tauxRegularite * 40 +
            scoreAnciennete +
            scoreRemboursement * 30 +
            bonusObjectif * 10);
        const scoreFinal = Math.min(Math.max(score, 0), 100);
        const eligible = scoreFinal >= business_constants_1.BUSINESS.SEUIL_SCORE_MICRO_CREDIT;
        const eligiblePADME = scoreFinal >= business_constants_1.BUSINESS.SEUIL_SCORE_PADME;
        const ancienScore = await this.prisma.scoreCredit.findUnique({
            where: { utilisateurId: clientId },
            select: {
                score: true,
                eligibleMicroCredit: true,
                eligiblePADME: true,
            },
        });
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
        await this.notifierEvolutionScore(utilisateur, scoreFinal, eligible, eligiblePADME, ancienScore);
        const scoreCreditRecord = await this.prisma.scoreCredit.findUnique({
            where: { utilisateurId: clientId },
        });
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
    async notifierEvolutionScore(utilisateur, nouveauScore, eligibleCredit, eligiblePADME, ancienScore) {
        const prenom = utilisateur.nom.split(' ')[0];
        const tel = utilisateur.telephone;
        const ancien = ancienScore?.score ?? 0;
        const progression = nouveauScore - ancien;
        if (eligibleCredit && !ancienScore?.eligibleMicroCredit) {
            await this.sms.envoyer(tel, `TontineBénin: Félicitations ${prenom} ! 🎉 Votre score est ${nouveauScore}/100. Vous êtes maintenant ÉLIGIBLE au micro-crédit. Demandez jusqu'à ${nouveauScore >= 90 ? '100 000' : nouveauScore >= 80 ? '50 000' : nouveauScore >= 70 ? '25 000' : '10 000'} FCFA via votre collecteur.`);
            return;
        }
        if (eligiblePADME && !ancienScore?.eligiblePADME) {
            await this.sms.envoyer(tel, `TontineBénin: Bravo ${prenom} ! Score ${nouveauScore}/100. Votre dossier PADME a été généré automatiquement. Vous êtes éligible à un crédit professionnel. Contactez votre collecteur pour plus d'infos.`);
            return;
        }
        if (progression >= 5) {
            const prochainSeuil = eligibleCredit
                ? eligiblePADME ? null : 70
                : 60;
            const messageProchain = prochainSeuil
                ? ` Plus que ${prochainSeuil - nouveauScore} points pour ${prochainSeuil === 60 ? 'le micro-crédit' : 'le dossier PADME'}.`
                : '';
            await this.sms.envoyer(tel, `TontineBénin: Votre score a progressé de ${progression} points ! Nouveau score : ${nouveauScore}/100.${messageProchain} Continuez à cotiser régulièrement.`);
            return;
        }
        if (progression <= -10) {
            await this.sms.envoyer(tel, `TontineBénin: Attention ${prenom}, votre score a baissé de ${Math.abs(progression)} points. Score actuel : ${nouveauScore}/100. Cotisez régulièrement pour améliorer votre éligibilité au crédit.`);
            return;
        }
        const estPremierDuMois = new Date().getDate() === 1;
        if (estPremierDuMois && !eligibleCredit) {
            const restant = 60 - nouveauScore;
            await this.sms.envoyer(tel, `TontineBénin: Score du mois : ${nouveauScore}/100. Il vous manque ${restant} points pour accéder au micro-crédit. Cotisez chaque semaine pour progresser.`);
        }
    }
    async genererDossierPADME(clientId, score, tauxRegularite) {
        const dossierRecent = await this.prisma.dossierPADME.findFirst({
            where: {
                clientId,
                creeLe: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                statut: {
                    in: [
                        client_1.StatutDossierPADME.GENERE,
                        client_1.StatutDossierPADME.VALIDE_ADMIN,
                        client_1.StatutDossierPADME.SOUMIS_PADME,
                    ],
                },
            },
        });
        if (dossierRecent)
            return;
        const [scoreCredit, client, totalEpargneFcfa, creditsRembourses] = await Promise.all([
            this.prisma.scoreCredit.findUnique({
                where: { utilisateurId: clientId },
            }),
            this.prisma.utilisateur.findUnique({
                where: { id: clientId },
                select: { telephone: true, nom: true },
            }),
            this.prisma.transaction.aggregate({
                where: {
                    utilisateurId: clientId,
                    type: client_1.TypeTransaction.COTISATION,
                    statut: client_1.StatutTransaction.SUCCES,
                },
                _sum: { montantNetFcfa: true },
            }),
            this.prisma.microCredit.count({
                where: { clientId, statut: client_1.StatutCredit.TERMINE },
            }),
        ]);
        if (!scoreCredit)
            return;
        const dossier = await this.prisma.dossierPADME.create({
            data: {
                clientId,
                scoreCreditId: scoreCredit.id,
                scoreAuMoment: score,
                totalEpargneFcfa: totalEpargneFcfa._sum.montantNetFcfa ?? 0,
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
                totalEpargneFcfa: totalEpargneFcfa._sum.montantNetFcfa ?? 0,
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
            return {
                succes: true,
                message: `Score calculé: ${score}/100`,
                donnees: { score },
            };
        }
        await this.scoringNocturne();
        return { succes: true, message: 'Scoring global déclenché.' };
    }
    async declencherRemboursementsManuellement() {
        await this.preleverRemboursementsJournaliers();
        return {
            succes: true,
            message: 'Prélèvements remboursements déclenchés manuellement.',
        };
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
                    select: { soldeActuelFcfa: true },
                },
            },
        });
        let alertesEnvoyees = 0;
        for (const client of clients) {
            const soldeTotal = client.tontines.reduce((acc, t) => acc + (t.soldeActuelFcfa || 0), 0);
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
        return {
            succes: true,
            message: 'Alertes solde faible déclenchées manuellement.',
        };
    }
    async envoyerRappelsCotisation() {
        this.logger.log('[CRON 8h] Rappels cotisation (dateProchaineCotisation)...');
        const maintenant = new Date();
        const horizon = new Date(maintenant.getTime() + 3 * 24 * 60 * 60 * 1000);
        const tontines = await this.prisma.tontine.findMany({
            where: {
                statut: client_1.StatutTontine.ACTIVE,
                dateProchaineCotisation: { not: null, lte: horizon },
            },
            include: {
                proprietaire: { select: { id: true, telephone: true, nom: true } },
                membres: {
                    where: { statut: client_1.StatutMembreGroupe.ACTIF },
                    include: {
                        utilisateur: { select: { id: true, telephone: true, nom: true } },
                    },
                },
            },
        });
        let rappelsEnvoyes = 0;
        for (const tontine of tontines) {
            if (!tontine.dateProchaineCotisation)
                continue;
            const msRestants = tontine.dateProchaineCotisation.getTime() - maintenant.getTime();
            const joursRestants = Math.ceil(msRestants / (24 * 60 * 60 * 1000));
            const suffixeFrequence = this.libelleMontantFrequence(tontine.frequence, tontine.montantJournalierFcfa);
            let message;
            if (joursRestants <= 0) {
                message = `TontineBénin: Ton Gando "${tontine.nom}" attend ta cotisation ${suffixeFrequence} AUJOURD'HUI.`;
            }
            else if (joursRestants === 1) {
                message = `TontineBénin: Ta cotisation ${suffixeFrequence} pour "${tontine.nom}" est due DEMAIN.`;
            }
            else {
                message = `TontineBénin: Rappel — Ta cotisation ${suffixeFrequence} pour "${tontine.nom}" est dans ${joursRestants}j.`;
            }
            const destinataires = [
                {
                    id: tontine.proprietaire.id,
                    telephone: tontine.proprietaire.telephone,
                },
                ...tontine.membres.map((m) => ({
                    id: m.utilisateur.id,
                    telephone: m.utilisateur.telephone,
                })),
            ];
            for (const dest of destinataires) {
                await this.notifications.envoyerAUtilisateur(dest.id, 'Rappel cotisation', message, 'TOUS', client_1.TypeNotification.RAPPEL_COTISATION);
                rappelsEnvoyes++;
            }
        }
        this.logger.log(`[CRON 8h] ${rappelsEnvoyes} rappel(s) envoyé(s) pour ${tontines.length} tontine(s)`);
    }
    async detecterDefaillancesGroupe() {
        this.logger.log('[CRON 7h30] Détection défaillances groupe...');
        const il24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const tontines = await this.prisma.tontine.findMany({
            where: { type: 'GROUPE' },
            include: {
                membres: {
                    where: {
                        statut: {
                            in: [client_1.StatutMembreGroupe.ACTIF, client_1.StatutMembreGroupe.DEFAILLANT],
                        },
                    },
                    include: {
                        utilisateur: {
                            select: {
                                id: true,
                                telephone: true,
                                nom: true,
                                soldeCommissionFcfa: true,
                            },
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
                    if (membre.statut === client_1.StatutMembreGroupe.DEFAILLANT ||
                        membre.nombreDefaillances > 0) {
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
                if (!membresAyantCotise.has(membre.utilisateurId) &&
                    tontine.montantJournalierFcfa > 0) {
                    let cautionUtiliseeFcfa = 0;
                    if (membre.montantCautionFcfa > 0) {
                        cautionUtiliseeFcfa = Math.min(membre.montantCautionFcfa, tontine.montantJournalierFcfa);
                        await this.prisma.membreTontineGroupe.update({
                            where: { id: membre.id },
                            data: { montantCautionFcfa: { decrement: cautionUtiliseeFcfa } },
                        });
                        this.logger.warn(`[Défaillance] Caution prélevée pour ${membre.utilisateur.nom} dans ${tontine.nom}: ${cautionUtiliseeFcfa} FCFA`);
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
                                montantManquantFcfa: Math.max(0, tontine.montantJournalierFcfa - cautionUtiliseeFcfa),
                                cautionUtiliseeFcfa,
                                statut: nouveauStatut === client_1.StatutMembreGroupe.EXCLU
                                    ? 'EXCLU'
                                    : 'EN_COURS',
                                ...(nouveauStatut === client_1.StatutMembreGroupe.EXCLU && {
                                    resoluLe: new Date(),
                                }),
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
                agent: {
                    select: {
                        id: true,
                        telephone: true,
                        nom: true,
                        _count: { select: { clients: { where: { statut: 'ACTIF' } } } },
                    },
                },
            },
        });
        let succes = 0;
        let echecs = 0;
        for (const fact of facturations) {
            const nbClients = fact.agent._count.clients;
            const fraisGestion = nbClients * business_constants_1.BUSINESS.FRAIS_PAR_CLIENT_MENSUEL;
            const totalAFacturer = fact.fraisMensuelsFcfa + fraisGestion;
            try {
                await this.kkiapay.initierPaiement({
                    montant: totalAFacturer,
                    telephone: fact.agent.telephone,
                    reference: `abonnement_${fact.agentId}_${new Date().toISOString().slice(0, 7)}`,
                    description: `Abonnement TontineBénin ${fact.plan} (+ ${nbClients} clients) — ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
                });
                await this.prisma.facturationAgent.update({
                    where: { id: fact.id },
                    data: {
                        dernierPaiement: new Date(),
                        prochainPaiement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        totalClients: nbClients,
                    },
                });
                await this.sms.envoyer(fact.agent.telephone, `TontineBénin: ✅ Abonnement ${fact.plan} prélevé: ${totalAFacturer} FCFA (${fact.fraisMensuelsFcfa}F base + ${fraisGestion}F pour ${nbClients} clients). Merci !`);
                succes++;
            }
            catch (err) {
                this.logger.error(`Erreur facturation agent ${fact.agentId}: ${err.message}`);
                await this.sms.envoyer(fact.agent.telephone, `TontineBénin: ⚠️ Échec prélèvement abonnement ${fact.plan} (${totalAFacturer} FCFA). Vérifiez votre solde Mobile Money pour éviter la suspension.`);
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
            select: { id: true, nom: true, soldeActuelFcfa: true },
        });
        let anomalies = 0;
        for (const tontine of tontines) {
            const totalTransactions = await this.prisma.transaction.aggregate({
                where: {
                    tontineId: tontine.id,
                    type: client_1.TypeTransaction.COTISATION,
                    statut: client_1.StatutTransaction.SUCCES,
                },
                _sum: { montantNetFcfa: true },
            });
            const totalRetraits = await this.prisma.retrait.aggregate({
                where: {
                    tontineId: tontine.id,
                    statut: 'EXECUTE',
                },
                _sum: { montantFcfa: true },
            });
            const totalDistributions = await this.prisma.transaction.aggregate({
                where: {
                    tontineId: tontine.id,
                    type: client_1.TypeTransaction.DISTRIBUTION_GROUPE,
                },
                _sum: { montantFcfa: true },
            });
            const soldeCalcule = (totalTransactions._sum.montantNetFcfa ?? 0) -
                (totalRetraits._sum.montantFcfa ?? 0) -
                (totalDistributions._sum.montantFcfa ?? 0);
            const ecart = Math.abs(soldeCalcule - tontine.soldeActuelFcfa);
            if (ecart > 1) {
                this.logger.warn(`[Cohérence] Tontine ${tontine.nom}: solde BD=${tontine.soldeActuelFcfa} FCFA, calculé=${soldeCalcule} FCFA, écart=${ecart} FCFA`);
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
            select: {
                id: true,
                utilisateurId: true,
                hashPrecedent: true,
                hashActuel: true,
                creeLe: true,
            },
        });
        let chaineBrisee = 0;
        for (let i = 1; i < txsRecentes.length; i++) {
            const txCourante = txsRecentes[i];
            const txPrecedente = txsRecentes[i - 1];
            if (txCourante.utilisateurId === txPrecedente.utilisateurId) {
                if (txCourante.hashPrecedent !== null &&
                    txCourante.hashPrecedent !== txPrecedente.hashActuel) {
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
                    metadata: JSON.stringify({
                        chaineBrisee,
                        txsVerifiees: txsRecentes.length,
                    }),
                },
            });
        }
        this.logger.log(`[CRON 0h30] Triple-check terminé — Vérif1: ${anomalies - chaineBrisee} anomalie(s) solde | Vérif3: ${chaineBrisee} rupture(s) chaîne`);
    }
    async creerOuMettreAJourAlerteCoherence(tontine, soldeCalcule, ecart) {
        const metadata = JSON.stringify({
            soldeBase: tontine.soldeActuelFcfa,
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
                    message: `Solde BD ${tontine.soldeActuelFcfa} FCFA, solde calculé ${soldeCalcule} FCFA, écart ${ecart} FCFA.`,
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
                message: `Solde BD ${tontine.soldeActuelFcfa} FCFA, solde calculé ${soldeCalcule} FCFA, écart ${ecart} FCFA.`,
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
        return {
            succes: true,
            message: 'Facturation mensuelle déclenchée manuellement.',
        };
    }
    async declencherRappelsManuellement() {
        await this.envoyerRappelsCotisation();
        return {
            succes: true,
            message: 'Rappels cotisation déclenchés manuellement.',
        };
    }
    async dissoudreProjetsEchus() {
        this.logger.log('[CRON 6h] Vérification tontines PROJET échées...');
        const maintenant = new Date();
        const projetsEchus = await this.prisma.tontine.findMany({
            where: {
                type: 'PROJET',
                statut: client_1.StatutTontine.ACTIVE,
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
                    data: { statut: client_1.StatutTontine.TERMINEE },
                });
                const message = `TontineBénin: Votre projet "${tontine.nom}" est arrivé à échéance et a été clôturé. Contactez votre agent pour le retrait.`;
                await this.notifications.envoyerAUtilisateur(tontine.proprietaire.id, 'Projet clôturé', message, 'TOUS', client_1.TypeNotification.TOUR_TONTINE);
                this.logger.log(`[CRON 6h] Tontine PROJET clôturée: ${tontine.nom} (${tontine.id})`);
                dissouts++;
            }
            catch (err) {
                this.logger.error(`[CRON 6h] Erreur dissolution tontine ${tontine.id}: ${err.message}`);
            }
        }
        this.logger.log(`[CRON 6h] ${dissouts}/${projetsEchus.length} projet(s) dissous.`);
    }
    async declencherDissolutionProjetsManuellement() {
        await this.dissoudreProjetsEchus();
        return {
            succes: true,
            message: 'Dissolution projets échés déclenchée manuellement.',
        };
    }
    async rapportJournalierSuperviseurs() {
        this.logger.log('[CRON 8h05] Génération des rapports superviseurs...');
        const superviseurs = await this.prisma.utilisateur.findMany({
            where: { role: client_1.Role.SUPERVISEUR, statut: client_1.StatutCompte.ACTIF },
        });
        const hier = new Date();
        hier.setDate(hier.getDate() - 1);
        hier.setHours(0, 0, 0, 0);
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);
        for (const sup of superviseurs) {
            const stats = await this.prisma.transaction.aggregate({
                where: {
                    statut: client_1.StatutTransaction.SUCCES,
                    type: client_1.TypeTransaction.COTISATION,
                    creeLe: { gte: hier, lt: aujourdhui },
                    utilisateur: {
                        collecteur: { superviseurId: sup.id },
                    },
                },
                _sum: { montantFcfa: true },
                _count: { id: true },
            });
            const nouveauxClients = await this.prisma.utilisateur.count({
                where: {
                    role: client_1.Role.CLIENT,
                    creeLe: { gte: hier, lt: aujourdhui },
                    collecteur: { superviseurId: sup.id },
                },
            });
            const total = stats._sum.montantFcfa ?? 0;
            if (total > 0 || nouveauxClients > 0) {
                await this.notifications.envoyerAUtilisateur(sup.id, 'Rapport Journalier Zone', `Hier, votre zone a collecté ${total.toLocaleString('fr-FR')} F (${stats._count.id} dépôts). Nouveaux clients : ${nouveauxClients}.`, 'PUSH');
            }
        }
    }
    async declencherRapportSuperviseurManuellement() {
        await this.rapportJournalierSuperviseurs();
        return { succes: true, message: 'Rapport superviseurs déclenché.' };
    }
    libelleMontantFrequence(frequence, montantFcfa) {
        const fmt = `${montantFcfa.toLocaleString('fr-FR')} F`;
        switch (frequence) {
            case client_1.FrequenceTontine.JOURNALIER:
                return `journalière de ${fmt}`;
            case client_1.FrequenceTontine.HEBDOMADAIRE:
                return `hebdo de ${fmt}`;
            case client_1.FrequenceTontine.DATE_FIXE:
            case client_1.FrequenceTontine.MENSUEL:
                return `mensuelle de ${fmt}`;
            default:
                return `de ${fmt}`;
        }
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
        return {
            succes: true,
            message: 'Révocation sessions expirées déclenchée manuellement.',
        };
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
    (0, schedule_1.Cron)('0 6 * * *', { name: 'dissolution-projets-echus' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "dissoudreProjetsEchus", null);
__decorate([
    (0, schedule_1.Cron)('5 8 * * *', { name: 'rapport-journalier-superviseurs' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "rapportJournalierSuperviseurs", null);
__decorate([
    (0, schedule_1.Cron)('0 * * * *', { name: 'revoquer-sessions-expirees' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "revoquerSessionsExpirees", null);
exports.CronService = CronService = CronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => sms_service_1.SmsService))),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
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