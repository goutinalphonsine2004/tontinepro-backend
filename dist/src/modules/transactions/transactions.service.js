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
const sms_service_1 = require("../notifications/sms.service");
const business_constants_1 = require("../../common/constants/business.constants");
let TransactionsService = TransactionsService_1 = class TransactionsService {
    prisma;
    kkiapay;
    sms;
    logger = new common_1.Logger(TransactionsService_1.name);
    constructor(prisma, kkiapay, sms) {
        this.prisma = prisma;
        this.kkiapay = kkiapay;
        this.sms = sms;
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
    async historique(utilisateurId) {
        const transactions = await this.prisma.transaction.findMany({
            where: { utilisateurId },
            include: { tontine: { select: { id: true, nom: true } } },
            orderBy: { creeLe: 'desc' },
            take: 50,
        });
        return { succes: true, message: `${transactions.length} transaction(s).`, donnees: transactions };
    }
    async recu(transactionId, utilisateurId) {
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
            succes: true,
            message: 'Reçu de transaction.',
            donnees: {
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
            },
        };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = TransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kkiapay_service_1.KkiapayService,
        sms_service_1.SmsService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map