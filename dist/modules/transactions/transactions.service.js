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
let TransactionsService = TransactionsService_1 = class TransactionsService {
    prisma;
    kkiapay;
    sms;
    pdf;
    whatsapp;
    logger = new common_1.Logger(TransactionsService_1.name);
    constructor(prisma, kkiapay, sms, pdf, whatsapp) {
        this.prisma = prisma;
        this.kkiapay = kkiapay;
        this.sms = sms;
        this.pdf = pdf;
        this.whatsapp = whatsapp;
    }
    async cotiser(utilisateurId, dto) {
        const [utilisateur, tontine] = await Promise.all([
            this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } }),
            this.prisma.tontine.findUnique({ where: { id: dto.tontineId } }),
        ]);
        if (!utilisateur)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (!tontine)
            throw new common_1.NotFoundException('Tontine introuvable');
        const telephone = dto.telephone ?? utilisateur.telephone;
        const fraisPlateforme = business_constants_1.BUSINESS.calculerFraisPlateforme(dto.montant);
        const montantNet = dto.montant - fraisPlateforme;
        const fraisAgent = utilisateur.collecteurId
            ? business_constants_1.BUSINESS.calculerCommissionAgent(dto.montant)
            : 0;
        const transaction = await this.prisma.transaction.create({
            data: {
                montant: dto.montant,
                montantNet,
                type: client_1.TypeTransaction.COTISATION,
                fraisPlateforme,
                fraisAgent,
                operateur: dto.operateur,
                tontineId: dto.tontineId,
                utilisateurId,
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
        return {
            succes: true,
            message: 'Paiement initié. Complétez sur votre téléphone.',
            donnees: {
                transactionId: transaction.id,
                reference: transaction.reference,
                refKKiaPay: paiement.refKKiaPay,
                paymentUrl: paiement.paymentUrl,
                montant: dto.montant,
                fraisPlateforme,
                montantNet,
            },
        };
    }
    async traiterWebhook(body, rawBody, signatureRecue) {
        const signatureValide = this.kkiapay.verifierSignature(rawBody.toString(), signatureRecue ?? '');
        if (!signatureValide) {
            this.logger.warn(`Webhook rejeté — signature invalide: ${signatureRecue}`);
            throw new common_1.UnauthorizedException({ message: 'Signature webhook invalide', code: 'SIGNATURE_INVALIDE' });
        }
        this.logger.log(`Webhook KKiaPay: ${body.transactionId} — ${body.status}`);
        const transaction = await this.prisma.transaction.findFirst({
            where: { refKKiaPay: body.transactionId },
            include: {
                tontine: true,
                utilisateur: { select: { id: true, telephone: true, nom: true, collecteurId: true } },
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
                data: { statut: client_1.StatutTransaction.ECHOUE, motifEchec: body.reason ?? 'Paiement refusé' },
            });
            this.logger.log(`Transaction échouée: ${body.transactionId}`);
        }
        return { succes: true, message: 'Webhook traité avec succès' };
    }
    async traiterSucces(transaction) {
        const fraisPlateforme = business_constants_1.BUSINESS.calculerFraisPlateforme(transaction.montant);
        const montantNet = transaction.montant - fraisPlateforme;
        const collecteurId = transaction.utilisateur.collecteurId;
        const fraisAgent = collecteurId ? business_constants_1.BUSINESS.calculerCommissionAgent(transaction.montant) : 0;
        const derniereTx = await this.prisma.transaction.findFirst({
            where: { utilisateurId: transaction.utilisateur.id, statut: client_1.StatutTransaction.SUCCES },
            orderBy: { creeLe: 'desc' },
            select: { hashActuel: true },
        });
        const hashPrecedent = derniereTx?.hashActuel ?? null;
        const hashActuel = (0, crypto_1.createHash)('sha256')
            .update(`${transaction.id}|${transaction.montant}|${transaction.type}|${Date.now()}|${hashPrecedent}`)
            .digest('hex');
        await this.prisma.$transaction([
            this.prisma.transaction.update({
                where: { id: transaction.id },
                data: { statut: client_1.StatutTransaction.SUCCES, montantNet, fraisPlateforme, fraisAgent, hashPrecedent, hashActuel },
            }),
            ...(transaction.tontineId
                ? [this.prisma.tontine.update({
                        where: { id: transaction.tontineId },
                        data: { soldeActuel: { increment: montantNet } },
                    })]
                : []),
            ...(collecteurId && fraisAgent > 0
                ? [
                    this.prisma.commission.create({
                        data: { agentId: collecteurId, transactionId: transaction.id, montant: fraisAgent, type: 'COTISATION' },
                    }),
                    this.prisma.utilisateur.update({
                        where: { id: collecteurId },
                        data: { soldeCommission: { increment: fraisAgent } },
                    }),
                ]
                : []),
        ]);
        await this.sms.envoyer(transaction.utilisateur.telephone, `TontineBénin: Cotisation de ${transaction.montant} FCFA reçue ✅. Frais: ${fraisPlateforme} FCFA. Net crédité: ${montantNet} FCFA.`);
        this.logger.log(`Cotisation traitée: ${transaction.montant} FCFA pour ${transaction.utilisateur.nom}`);
    }
    async traiterWebhookRemboursement(body) {
        const remboursement = await this.prisma.remboursementCredit.findFirst({
            where: { refKKiaPay: body.transactionId },
            include: {
                microCredit: {
                    include: {
                        client: { select: { id: true, nom: true, telephone: true, collecteurId: true } },
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
        const montantRestant = Math.max(0, credit.montantRestant - remboursement.montant);
        const joursPayes = credit.joursPayes + 1;
        const termine = montantRestant <= 0;
        await this.prisma.$transaction([
            this.prisma.remboursementCredit.update({
                where: { id: remboursement.id },
                data: { statut: 'SUCCES' },
            }),
            this.prisma.microCredit.update({
                where: { id: credit.id },
                data: {
                    joursPayes,
                    montantRestant,
                    statut: termine ? client_1.StatutCredit.TERMINE : client_1.StatutCredit.ACTIF,
                    ...(termine && { termineLe: new Date() }),
                },
            }),
        ]);
        if (termine) {
            await this.sms.envoyer(credit.client.telephone, `TontineBénin: Bravo ${credit.client.nom} ! Votre micro-crédit de ${credit.montantPrincipal} FCFA est entièrement remboursé. Votre score de crédit va augmenter.`);
            this.logger.log(`[Webhook remboursement] Crédit terminé: ${credit.id} — ${credit.client.nom}`);
            return;
        }
        await this.sms.envoyer(credit.client.telephone, `TontineBénin: Prélèvement ${remboursement.montant} FCFA confirmé. Restant: ${montantRestant} FCFA (${joursPayes}/${credit.totalJours} jours).`);
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
        await this.sms.envoyer(credit.client.telephone, `TontineBénin: Prélèvement micro-crédit échoué (${motif}). Assurez-vous d'avoir ${remboursement.montant} FCFA sur votre compte Mobile Money.`);
        if (!credit.client.collecteurId)
            return;
        const collecteur = await this.prisma.utilisateur.findUnique({
            where: { id: credit.client.collecteurId },
            select: { telephone: true },
        });
        if (collecteur) {
            await this.sms.envoyer(collecteur.telephone, `TontineBénin: Alerte remboursement échoué pour ${credit.client.nom}. Crédit: ${credit.montantPrincipal} FCFA.`);
        }
    }
    async historique(utilisateurId, filtres) {
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
            donnees: { transactions, total, page, limite, pages: Math.ceil(total / limite) },
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
            'TontineBenin - Recu de transaction',
            `Reference: ${recu.reference}`,
            `Date: ${recu.date.toLocaleString('fr-FR')}`,
            `Client: ${recu.client}`,
            `Tontine: ${recu.tontine}`,
            `Type: ${recu.type}`,
            `Statut: ${recu.statut}`,
            `Montant: ${recu.montant.toLocaleString('fr-FR')} FCFA`,
            `Frais: ${recu.fraisPlateforme.toLocaleString('fr-FR')} FCFA`,
            `Net: ${recu.montantNet.toLocaleString('fr-FR')} FCFA`,
            `Ref KKiaPay: ${recu.refKKiaPay}`,
        ].join('\n');
        const resultat = await this.whatsapp.envoyerMessage(destinataire, message);
        return {
            succes: resultat.success,
            message: resultat.success ? 'Reçu partagé via WhatsApp.' : 'Échec du partage WhatsApp.',
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
            montant: tx.montant,
            fraisPlateforme: tx.fraisPlateforme,
            montantNet: tx.montantNet,
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kkiapay_service_1.KkiapayService,
        sms_service_1.SmsService,
        pdf_service_1.PdfService,
        whatsapp_service_1.WhatsappService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map