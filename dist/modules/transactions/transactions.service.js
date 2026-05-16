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
var TransactionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const pdf_service_1 = require("../../common/services/pdf.service");
const sms_service_1 = require("../notifications/sms.service");
const whatsapp_service_1 = require("../notifications/whatsapp.service");
const business_constants_1 = require("../../common/constants/business.constants");
const notifications_service_1 = require("../notifications/notifications.service");
let TransactionsService = TransactionsService_1 = class TransactionsService {
    prisma;
    kkiapay;
    sms;
    pdf;
    whatsapp;
    notifications;
    logger = new common_1.Logger(TransactionsService_1.name);
    constructor(prisma, kkiapay, sms, pdf, whatsapp, notifications) {
        this.prisma = prisma;
        this.kkiapay = kkiapay;
        this.sms = sms;
        this.pdf = pdf;
        this.whatsapp = whatsapp;
        this.notifications = notifications;
    }
    async cotiser(requesterId, dto) {
        if (dto.idempotencyKey) {
            const existante = await this.prisma.transaction.findUnique({
                where: { idempotencyKey: dto.idempotencyKey },
            });
            if (existante) {
                return {
                    succes: true,
                    message: 'Transaction déjà initiée.',
                    donnees: existante,
                };
            }
        }
        const requester = await this.prisma.utilisateur.findUnique({
            where: { id: requesterId },
        });
        if (!requester)
            throw new common_1.NotFoundException('Requérant introuvable');
        let targetUserId = requesterId;
        let targetUser = requester;
        if (dto.clientId && dto.clientId !== requesterId) {
            const rolesAutorises = [client_1.Role.AGENT, client_1.Role.INDEPENDANT];
            if (!rolesAutorises.includes(requester.role)) {
                throw new common_1.ForbiddenException('Seuls les collecteurs peuvent initier une cotisation pour un tiers.');
            }
            const client = await this.prisma.utilisateur.findUnique({
                where: { id: dto.clientId },
            });
            if (!client)
                throw new common_1.NotFoundException('Client introuvable');
            if (client.collecteurId !== requesterId) {
                throw new common_1.ForbiddenException("Ce client n'est pas dans votre portefeuille.");
            }
            targetUserId = dto.clientId;
            targetUser = client;
        }
        const tontine = await this.prisma.tontine.findUnique({
            where: { id: dto.tontineId },
        });
        if (!tontine)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (tontine.proprietaireId !== targetUserId) {
            throw new common_1.ForbiddenException("La tontine spécifiée n'appartient pas au client.");
        }
        if (tontine.montantJournalierFcfa &&
            Number(tontine.montantJournalierFcfa) > 0) {
            const requis = Number(tontine.montantJournalierFcfa);
            if (Math.abs(dto.montant - requis) > 0.01) {
                throw new common_1.BadRequestException({
                    message: `Cette tontine exige exactement ${requis.toLocaleString('fr-FR')} FCFA par cotisation.`,
                    code: 'MONTANT_INCORRECT',
                    donnees: { montantFcfaRequis: requis },
                });
            }
        }
        const telephone = dto.telephone ?? targetUser.telephone;
        const badgeDiamant = await this.prisma.badgeClient.findFirst({
            where: { clientId: targetUserId, niveau: 'DIAMANT' },
        });
        const fraisPlateformeFcfa = business_constants_1.BUSINESS.calculerFraisPlateforme(dto.montant, !!badgeDiamant);
        const montantNetFcfa = dto.montant - fraisPlateformeFcfa;
        let estIndependant = false;
        if (targetUser.collecteurId) {
            const collecteur = await this.prisma.utilisateur.findUnique({
                where: { id: targetUser.collecteurId },
                select: { role: true },
            });
            estIndependant = collecteur?.role === 'INDEPENDANT';
        }
        const fraisAgentFcfa = business_constants_1.BUSINESS.calculerCommissionAgent(dto.montant, estIndependant);
        if (targetUser.collecteurId) {
            const collecteur = await this.prisma.utilisateur.findUnique({
                where: { id: targetUser.collecteurId },
                select: { id: true, role: true },
            });
            if (collecteur?.role === 'INDEPENDANT') {
                const facturation = await this.prisma.facturationAgent.findFirst({
                    where: { agentId: collecteur.id },
                });
                const caution = facturation?.cautionMontantFcfa ?? 0;
                if (caution > 0) {
                    const debutMois = new Date();
                    debutMois.setDate(1);
                    debutMois.setHours(0, 0, 0, 0);
                    const totalMois = await this.prisma.transaction.aggregate({
                        where: {
                            utilisateur: { collecteurId: collecteur.id },
                            type: client_1.TypeTransaction.COTISATION,
                            statut: client_1.StatutTransaction.SUCCES,
                            creeLe: { gte: debutMois },
                        },
                        _sum: { montantFcfa: true },
                    });
                    const collecteMois = (totalMois._sum.montantFcfa ?? 0) + dto.montant;
                    const pourcentage = (collecteMois / caution) * 100;
                    if (collecteMois >= caution) {
                        throw new common_1.ForbiddenException({
                            message: `Plafond de caution atteint pour ce collecteur (${caution.toLocaleString()} FCFA/mois). Le client doit payer directement via Mobile Money.`,
                            code: 'PLAFOND_CAUTION_ATTEINT',
                            donnees: {
                                caution,
                                collecteMois: collecteMois - dto.montant,
                                pourcentage: Math.round(pourcentage),
                            },
                        });
                    }
                    if (pourcentage >= 80) {
                        this.logger.warn(`[CAUTION] Collecteur ${collecteur.id} à ${Math.round(pourcentage)}% de sa caution (${collecteMois.toLocaleString()}/${caution.toLocaleString()} FCFA)`);
                        const alerteExistante = await this.prisma.alerteSysteme.findFirst({
                            where: {
                                type: 'SEUIL_CAUTION',
                                resourceType: 'UTILISATEUR',
                                resourceId: collecteur.id,
                                statut: 'OUVERTE',
                            },
                        });
                        if (!alerteExistante) {
                            await this.prisma.alerteSysteme.create({
                                data: {
                                    type: 'SEUIL_CAUTION',
                                    severite: 'AVERTISSEMENT',
                                    statut: 'OUVERTE',
                                    titre: `Collecteur indépendant à ${Math.round(pourcentage)}% de sa caution`,
                                    message: `Le collecteur ${collecteur.id} a atteint ${Math.round(pourcentage)}% de sa caution mensuelle (${collecteMois.toLocaleString()} / ${caution.toLocaleString()} FCFA). Blocage automatique à 100%.`,
                                    resourceType: 'UTILISATEUR',
                                    resourceId: collecteur.id,
                                    metadata: JSON.stringify({
                                        caution,
                                        collecteMois,
                                        pourcentage: Math.round(pourcentage),
                                    }),
                                },
                            });
                        }
                    }
                }
            }
        }
        const lastTransaction = await this.prisma.transaction.findFirst({
            where: { utilisateurId: targetUserId },
            orderBy: { creeLe: 'desc' },
        });
        const transaction = await this.prisma.transaction.create({
            data: {
                montantFcfa: dto.montant,
                montantNetFcfa,
                type: client_1.TypeTransaction.COTISATION,
                statut: client_1.StatutTransaction.EN_ATTENTE,
                fraisPlateformeFcfa,
                fraisAgentFcfa,
                operateur: dto.operateur,
                tontineId: dto.tontineId,
                utilisateurId: targetUserId,
                idempotencyKey: dto.idempotencyKey,
                hashPrecedent: lastTransaction?.hashActuel || 'GENESIS',
            },
        });
        const paiement = await this.kkiapay.initierPaiement({
            montant: dto.montant,
            telephone,
            reference: transaction.reference,
            description: `Cotisation tontine ${tontine.nom}`,
            operateur: dto.operateur,
        });
        await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: { refKKiaPay: paiement.refKKiaPay },
        });
        if (this.kkiapay.estSandbox) {
            const txComplete = await this.prisma.transaction.findUnique({
                where: { id: transaction.id },
                include: {
                    tontine: true,
                    utilisateur: {
                        include: {
                            badges: { where: { niveau: 'DIAMANT' }, take: 1 },
                            collecteur: { select: { role: true } },
                        },
                    },
                },
            });
            if (txComplete) {
                try {
                    await this.traiterSucces(txComplete);
                }
                catch (err) {
                    this.logger.warn(`[SANDBOX] Auto-confirm partiel: ${err.message}`);
                }
            }
        }
        return {
            succes: true,
            message: this.kkiapay.estSandbox
                ? 'Cotisation validée (mode développement).'
                : 'Paiement initié. Complétez sur votre téléphone.',
            donnees: {
                transactionId: transaction.id,
                reference: transaction.reference,
                refKKiaPay: paiement.refKKiaPay,
                paymentUrl: paiement.paymentUrl,
                montant: dto.montant,
                fraisPlateformeFcfa,
                montantNetFcfa,
                confirme: this.kkiapay.estSandbox,
            },
        };
    }
    simuler(dto) {
        const fraisOperateur = Math.ceil(dto.montant * 0.01);
        const fraisPlateforme = business_constants_1.BUSINESS.calculerFraisPlateforme(dto.montant);
        return {
            succes: true,
            message: 'Simulation calculée.',
            donnees: {
                montantBrut: dto.montant,
                fraisOperateur,
                fraisPlateforme,
                montantNet: dto.montant - fraisOperateur - fraisPlateforme,
                canal: dto.canal,
            },
        };
    }
    async traiterWebhook(body, rawBody, signatureRecue) {
        const signatureValide = this.kkiapay.verifierSignature(rawBody.toString(), signatureRecue ?? '');
        if (!signatureValide) {
            this.logger.warn(`Webhook rejeté — signature invalide: ${signatureRecue}`);
            throw new common_1.UnauthorizedException({
                message: 'Signature webhook invalide',
                code: 'SIGNATURE_INVALIDE',
            });
        }
        this.logger.log(`Webhook KKiaPay: ${body.transactionId} — ${body.status}`);
        const transaction = await this.prisma.transaction.findFirst({
            where: { refKKiaPay: body.transactionId },
            include: {
                tontine: true,
                utilisateur: {
                    include: {
                        badges: { where: { niveau: 'DIAMANT' }, take: 1 },
                        collecteur: { select: { role: true } },
                    },
                },
            },
        });
        if (!transaction) {
            const remboursementTraite = await this.traiterWebhookRemboursement(body);
            if (remboursementTraite) {
                return { succes: true, message: 'Webhook remboursement traité' };
            }
            this.logger.warn(`Transaction inconnue pour refKKiaPay: ${body.transactionId}`);
            return { succes: true, message: 'Webhook reçu' };
        }
        if (transaction.statut !== client_1.StatutTransaction.EN_ATTENTE) {
            this.logger.log(`Transaction déjà traitée: ${body.transactionId} (${transaction.statut})`);
            return { succes: true, message: 'Transaction déjà traitée' };
        }
        if (body.status === 'SUCCESS') {
            await this.traiterSucces(transaction);
        }
        else {
            await this.prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    statut: client_1.StatutTransaction.ECHOUE,
                    motifEchec: body.reason ?? 'Paiement refusé',
                },
            });
            const FENETRE_MS = 60_000;
            const SEUIL_ECHECS = 10;
            const depuis = new Date(Date.now() - FENETRE_MS);
            const nbEchouees = await this.prisma.transaction.count({
                where: {
                    utilisateurId: transaction.utilisateur.id,
                    statut: client_1.StatutTransaction.ECHOUE,
                    creeLe: { gte: depuis },
                },
            });
            if (nbEchouees >= SEUIL_ECHECS) {
                this.logger.error(`[CIRCUIT BREAKER] Compte ${transaction.utilisateur.id} — ${nbEchouees} échecs en <60s → SUSPENSION`);
                await this.prisma.utilisateur.update({
                    where: { id: transaction.utilisateur.id },
                    data: { statut: 'SUSPENDU' },
                });
                await this.prisma.alerteSysteme.create({
                    data: {
                        type: 'CIRCUIT_BREAKER',
                        severite: 'CRITIQUE',
                        statut: 'OUVERTE',
                        titre: `Circuit breaker déclenché — ${transaction.utilisateur.nom}`,
                        message: `${nbEchouees} transactions échouées en moins d'une minute sur le compte ${transaction.utilisateur.telephone}. Compte suspendu automatiquement.`,
                        resourceType: 'UTILISATEUR',
                        resourceId: transaction.utilisateur.id,
                        metadata: JSON.stringify({
                            nbEchouees,
                            fenetreMs: FENETRE_MS,
                            telephone: transaction.utilisateur.telephone,
                            declencheLe: new Date().toISOString(),
                        }),
                    },
                });
            }
            this.logger.log(`Transaction échouée: ${body.transactionId}`);
        }
        return { succes: true, message: 'Webhook traité avec succès' };
    }
    async traiterSucces(transaction) {
        const estDiamant = transaction.utilisateur.badges.length > 0;
        const fraisPlateformeFcfa = business_constants_1.BUSINESS.calculerFraisPlateforme(transaction.montantFcfa, estDiamant);
        const montantNetFcfa = transaction.montantFcfa - fraisPlateformeFcfa;
        const estIndependant = transaction.utilisateur.collecteur?.role === 'INDEPENDANT';
        const fraisAgentFcfa = business_constants_1.BUSINESS.calculerCommissionAgent(transaction.montantFcfa, estIndependant);
        const collecteurId = transaction.utilisateur.collecteurId;
        const derniereTx = await this.prisma.transaction.findFirst({
            where: {
                utilisateurId: transaction.utilisateur.id,
                statut: client_1.StatutTransaction.SUCCES,
            },
            orderBy: { creeLe: 'desc' },
            select: { hashActuel: true },
        });
        const hashPrecedent = derniereTx?.hashActuel ?? null;
        const hashActuel = (0, crypto_1.createHash)('sha256')
            .update(`${transaction.id}|${transaction.montantFcfa}|${transaction.type}|${Date.now()}|${hashPrecedent}`)
            .digest('hex');
        await this.prisma.$transaction([
            this.prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    statut: client_1.StatutTransaction.SUCCES,
                    montantNetFcfa,
                    fraisPlateformeFcfa,
                    fraisAgentFcfa,
                    hashPrecedent,
                    hashActuel,
                },
            }),
            ...(transaction.tontineId
                ? [
                    this.prisma.tontine.update({
                        where: { id: transaction.tontineId },
                        data: { soldeActuelFcfa: { increment: montantNetFcfa } },
                    }),
                ]
                : []),
            ...(collecteurId && fraisAgentFcfa > 0
                ? [
                    this.prisma.commission.create({
                        data: {
                            agentId: collecteurId,
                            transactionId: transaction.id,
                            montantFcfa: fraisAgentFcfa,
                            type: 'COTISATION',
                        },
                    }),
                    this.prisma.utilisateur.update({
                        where: { id: collecteurId },
                        data: { soldeCommissionFcfa: { increment: fraisAgentFcfa } },
                    }),
                ]
                : []),
        ]);
        await this.sms.envoyer(transaction.utilisateur.telephone, `TontineBénin: Cotisation de ${transaction.montantFcfa} FCFA reçue ✅. Frais: ${fraisPlateformeFcfa} FCFA. Net crédité: ${montantNetFcfa} FCFA.`);
        if (collecteurId) {
            await this.notifications.envoyerAEquipe(collecteurId, 'Cotisation reçue', `Votre client ${transaction.utilisateur.nom} a cotisé ${transaction.montantFcfa} F sur ${transaction.tontine.nom}.`);
        }
        this.logger.log(`Cotisation traitée: ${transaction.montantFcfa} FCFA pour ${transaction.utilisateur.nom}`);
    }
    async traiterWebhookRemboursement(body) {
        const remboursement = await this.prisma.remboursementCredit.findFirst({
            where: { refKKiaPay: body.transactionId },
            include: {
                microCredit: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                nom: true,
                                telephone: true,
                                collecteurId: true,
                            },
                        },
                    },
                },
            },
        });
        if (!remboursement)
            return false;
        if (remboursement.statut !== 'EN_ATTENTE') {
            this.logger.log(`Remboursement déjà traité: ${body.transactionId} (${remboursement.statut})`);
            return true;
        }
        if (body.status === 'SUCCESS') {
            await this.confirmerRemboursementSucces(remboursement);
            return true;
        }
        await this.confirmerRemboursementEchec(remboursement, body.reason ?? 'Paiement refusé');
        return true;
    }
    async confirmerRemboursementSucces(remboursement) {
        const credit = remboursement.microCredit;
        const montantRestantFcfa = Math.max(0, credit.montantRestantFcfa - remboursement.montantFcfa);
        const joursPayes = credit.joursPayes + 1;
        const termine = montantRestantFcfa <= 0;
        await this.prisma.$transaction([
            this.prisma.remboursementCredit.update({
                where: { id: remboursement.id },
                data: { statut: 'SUCCES' },
            }),
            this.prisma.microCredit.update({
                where: { id: credit.id },
                data: {
                    joursPayes,
                    montantRestantFcfa,
                    statut: termine ? client_1.StatutCredit.TERMINE : client_1.StatutCredit.ACTIF,
                    ...(termine && { termineLe: new Date() }),
                },
            }),
        ]);
        if (termine) {
            await this.sms.envoyer(credit.client.telephone, `TontineBénin: Bravo ${credit.client.nom} ! Votre micro-crédit de ${credit.montantPrincipalFcfa} FCFA est entièrement remboursé. Votre score de crédit va augmenter.`);
            this.logger.log(`[Webhook remboursement] Crédit terminé: ${credit.id} — ${credit.client.nom}`);
            return;
        }
        await this.sms.envoyer(credit.client.telephone, `TontineBénin: Prélèvement ${remboursement.montantFcfa} FCFA confirmé. Restant: ${montantRestantFcfa} FCFA (${joursPayes}/${credit.totalJours} jours).`);
    }
    async confirmerRemboursementEchec(remboursement, motif) {
        const credit = remboursement.microCredit;
        await this.prisma.remboursementCredit.update({
            where: { id: remboursement.id },
            data: { statut: 'ECHEC' },
        });
        const echecsRecents = await this.prisma.remboursementCredit.findMany({
            where: { microCreditId: credit.id, statut: 'ECHEC' },
            orderBy: { payeLe: 'desc' },
            take: 3,
        });
        if (echecsRecents.length === 3) {
            await this.prisma.microCredit.update({
                where: { id: credit.id },
                data: { statut: client_1.StatutCredit.EN_DEFAUT },
            });
            this.logger.warn(`[Webhook remboursement] Crédit en défaut: ${credit.id} — ${credit.client.nom}`);
        }
        await this.sms.envoyer(credit.client.telephone, `TontineBénin: Prélèvement micro-crédit échoué (${motif}). Assurez-vous d'avoir ${remboursement.montantFcfa} FCFA sur votre compte Mobile Money.`);
        if (!credit.client.collecteurId)
            return;
        const collecteur = await this.prisma.utilisateur.findUnique({
            where: { id: credit.client.collecteurId },
            select: { telephone: true },
        });
        if (collecteur) {
            await this.sms.envoyer(collecteur.telephone, `TontineBénin: Alerte remboursement échoué pour ${credit.client.nom}. Crédit: ${credit.montantPrincipalFcfa} FCFA.`);
        }
    }
    async historique(utilisateurId, filtres, collecteurId) {
        if (collecteurId) {
            const client = await this.prisma.utilisateur.findFirst({
                where: { id: utilisateurId, collecteurId },
            });
            if (!client)
                throw new common_1.ForbiddenException('Ce client ne fait pas partie de votre portefeuille.');
        }
        const page = filtres.page ?? 1;
        const limite = Math.min(filtres.limite ?? 20, 100);
        const skip = (page - 1) * limite;
        const where = { utilisateurId };
        if (filtres.type)
            where.type = filtres.type;
        if (filtres.statut)
            where.statut = filtres.statut;
        if (filtres.tontineId)
            where.tontineId = filtres.tontineId;
        if (filtres.dateDebut || filtres.dateFin) {
            where.creeLe = {
                ...(filtres.dateDebut && { gte: new Date(filtres.dateDebut) }),
                ...(filtres.dateFin && { lte: this.finDeJournee(filtres.dateFin) }),
            };
        }
        const [total, transactions] = await Promise.all([
            this.prisma.transaction.count({ where }),
            this.prisma.transaction.findMany({
                where,
                include: { tontine: { select: { id: true, nom: true } } },
                orderBy: { creeLe: 'desc' },
                skip,
                take: limite,
            }),
        ]);
        return {
            succes: true,
            message: `${total} transaction(s).`,
            donnees: {
                transactions,
                total,
                page,
                limite,
                pages: Math.ceil(total / limite),
            },
        };
    }
    async recu(transactionId, utilisateurId) {
        const recu = await this.donneesRecu(transactionId, utilisateurId);
        return {
            succes: true,
            message: 'Reçu de transaction.',
            donnees: recu,
        };
    }
    async recuPdf(transactionId, utilisateurId) {
        const recu = await this.donneesRecu(transactionId, utilisateurId);
        const buffer = await this.pdf.genererRecuTransaction(recu);
        return { buffer, filename: `recu-${recu.reference}.pdf` };
    }
    async partagerRecuWhatsapp(transactionId, utilisateurId, telephone) {
        const recu = await this.donneesRecu(transactionId, utilisateurId);
        const destinataire = telephone ?? recu.telephone;
        const message = [
            'TontineBénin - Recu de transaction',
            `Reference: ${recu.reference}`,
            `Date: ${recu.date.toLocaleString('fr-FR')}`,
            `Client: ${recu.client}`,
            `Tontine: ${recu.tontine}`,
            `Type: ${recu.type}`,
            `Statut: ${recu.statut}`,
            `Montant: ${recu.montantNetFcfa.toLocaleString('fr-FR')} FCFA`,
            `Frais: ${recu.fraisPlateformeFcfa.toLocaleString('fr-FR')} FCFA`,
            `Net: ${recu.montantNetFcfa.toLocaleString('fr-FR')} FCFA`,
            `Ref KKiaPay: ${recu.refKKiaPay}`,
        ].join('\n');
        const resultat = await this.whatsapp.envoyerMessage(destinataire, message);
        return {
            succes: resultat.success,
            message: resultat.success
                ? 'Reçu partagé via WhatsApp.'
                : 'Échec du partage WhatsApp.',
            donnees: { destinataire, resultat },
        };
    }
    async donneesRecu(transactionId, utilisateurId) {
        const tx = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                utilisateur: { select: { nom: true, telephone: true } },
                tontine: { select: { nom: true } },
            },
        });
        if (!tx)
            throw new common_1.NotFoundException('Transaction introuvable');
        if (tx.utilisateurId !== utilisateurId)
            throw new common_1.UnauthorizedException('Accès refusé');
        return {
            reference: tx.reference,
            date: tx.creeLe,
            type: tx.type,
            statut: tx.statut,
            client: tx.utilisateur.nom,
            telephone: tx.utilisateur.telephone,
            tontine: tx.tontine?.nom ?? 'N/A',
            montant: tx.montantFcfa,
            fraisPlateformeFcfa: tx.fraisPlateformeFcfa,
            montantNetFcfa: tx.montantNetFcfa,
            operateur: tx.operateur ?? 'N/A',
            refKKiaPay: tx.refKKiaPay ?? 'N/A',
            hashIntegrite: tx.hashActuel ?? 'En attente',
        };
    }
    finDeJournee(date) {
        const fin = new Date(date);
        fin.setHours(23, 59, 59, 999);
        return fin;
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = TransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => sms_service_1.SmsService))),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kkiapay_service_1.KkiapayService,
        sms_service_1.SmsService,
        pdf_service_1.PdfService,
        whatsapp_service_1.WhatsappService,
        notifications_service_1.NotificationsService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map