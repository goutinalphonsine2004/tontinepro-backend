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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LitigesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const sms_service_1 = require("../notifications/sms.service");
const client_1 = require("@prisma/client");
let LitigesService = class LitigesService {
    prisma;
    sms;
    constructor(prisma, sms) {
        this.prisma = prisma;
        this.sms = sms;
    }
    async ouvrirLitige(clientId, dto) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: dto.transactionId },
            select: { id: true, utilisateurId: true, montantFcfa: true },
        });
        if (!transaction)
            throw new common_1.NotFoundException('Transaction introuvable');
        if (transaction.utilisateurId !== clientId) {
            throw new common_1.ForbiddenException('Cette transaction ne vous appartient pas');
        }
        const litigeExistant = await this.prisma.litige.findFirst({
            where: {
                transactionId: dto.transactionId,
                clientId,
                statut: { in: [client_1.StatutLitige.OUVERT, client_1.StatutLitige.EN_EXAMEN] },
            },
        });
        if (litigeExistant) {
            throw new common_1.BadRequestException('Un litige est déjà ouvert pour cette transaction');
        }
        const litige = await this.prisma.litige.create({
            data: {
                transactionId: dto.transactionId,
                clientId,
                motif: dto.motif,
                statut: client_1.StatutLitige.OUVERT,
            },
            include: {
                transaction: {
                    select: { id: true, montantFcfa: true, type: true, creeLe: true },
                },
            },
        });
        return {
            succes: true,
            message: 'Litige ouvert avec succès. Notre équipe va examiner votre dossier.',
            donnees: { litige },
        };
    }
    async mesList(clientId) {
        const litiges = await this.prisma.litige.findMany({
            where: { clientId },
            include: {
                transaction: {
                    select: { id: true, montantFcfa: true, type: true, creeLe: true },
                },
            },
            orderBy: { creeLe: 'desc' },
        });
        return { succes: true, message: 'Litiges récupérés', donnees: { litiges } };
    }
    async listeEnCours(page = 1, limite = 20) {
        const skip = (page - 1) * limite;
        const [litiges, total] = await this.prisma.$transaction([
            this.prisma.litige.findMany({
                where: {
                    statut: { in: [client_1.StatutLitige.OUVERT, client_1.StatutLitige.EN_EXAMEN] },
                },
                include: {
                    client: { select: { id: true, nom: true, telephone: true } },
                    transaction: {
                        select: { id: true, montantFcfa: true, type: true, creeLe: true },
                    },
                },
                orderBy: { creeLe: 'asc' },
                skip,
                take: limite,
            }),
            this.prisma.litige.count({
                where: {
                    statut: { in: [client_1.StatutLitige.OUVERT, client_1.StatutLitige.EN_EXAMEN] },
                },
            }),
        ]);
        return {
            succes: true,
            message: 'Litiges en cours',
            donnees: { litiges, total, page, totalPages: Math.ceil(total / limite) },
        };
    }
    async examiner(litigeId, adminId) {
        const litige = await this.prisma.litige.findUnique({
            where: { id: litigeId },
            include: { client: { select: { telephone: true, nom: true } } },
        });
        if (!litige)
            throw new common_1.NotFoundException('Litige introuvable');
        if (litige.statut !== client_1.StatutLitige.OUVERT) {
            throw new common_1.BadRequestException(`Ce litige est déjà en statut ${litige.statut}`);
        }
        const litigeMaj = await this.prisma.litige.update({
            where: { id: litigeId },
            data: { statut: client_1.StatutLitige.EN_EXAMEN, resoluPar: adminId },
        });
        await this.sms.envoyer(litige.client.telephone, `TontineBénin: Votre litige est en cours d'examen par notre équipe. Nous reviendrons vers vous sous 48h.`);
        return {
            succes: true,
            message: 'Litige pris en charge',
            donnees: { litige: litigeMaj },
        };
    }
    async resoudre(litigeId, adminId, dto) {
        const litige = await this.prisma.litige.findUnique({
            where: { id: litigeId },
            include: { client: { select: { telephone: true, nom: true } } },
        });
        if (!litige)
            throw new common_1.NotFoundException('Litige introuvable');
        if (litige.statut === client_1.StatutLitige.RESOLU ||
            litige.statut === client_1.StatutLitige.REJETE) {
            throw new common_1.BadRequestException('Ce litige est déjà clôturé');
        }
        const litigeMaj = await this.prisma.litige.update({
            where: { id: litigeId },
            data: {
                statut: client_1.StatutLitige.RESOLU,
                resolution: dto.resolution,
                resoluPar: adminId,
                resoluLe: new Date(),
            },
        });
        await this.sms.envoyer(litige.client.telephone, `TontineBénin: ✅ Votre litige a été résolu. ${dto.resolution}`);
        return {
            succes: true,
            message: 'Litige résolu avec succès',
            donnees: { litige: litigeMaj },
        };
    }
    async rejeter(litigeId, adminId, dto) {
        const litige = await this.prisma.litige.findUnique({
            where: { id: litigeId },
            include: { client: { select: { telephone: true, nom: true } } },
        });
        if (!litige)
            throw new common_1.NotFoundException('Litige introuvable');
        if (litige.statut === client_1.StatutLitige.RESOLU ||
            litige.statut === client_1.StatutLitige.REJETE) {
            throw new common_1.BadRequestException('Ce litige est déjà clôturé');
        }
        const litigeMaj = await this.prisma.litige.update({
            where: { id: litigeId },
            data: {
                statut: client_1.StatutLitige.REJETE,
                resolution: dto.motifRejet,
                resoluPar: adminId,
                resoluLe: new Date(),
            },
        });
        await this.sms.envoyer(litige.client.telephone, `TontineBénin: Votre litige a été rejeté. Motif: ${dto.motifRejet}. Pour toute question, contactez notre support.`);
        return {
            succes: true,
            message: 'Litige rejeté',
            donnees: { litige: litigeMaj },
        };
    }
    async detail(litigeId, userId, role) {
        const litige = await this.prisma.litige.findUnique({
            where: { id: litigeId },
            include: {
                client: { select: { id: true, nom: true, telephone: true } },
                transaction: {
                    select: { id: true, montantFcfa: true, type: true, creeLe: true },
                },
                commentaires: { orderBy: { creeLe: 'asc' } },
            },
        });
        if (!litige)
            throw new common_1.NotFoundException('Litige introuvable');
        const isAdmin = ['ADMIN', 'SUPERVISEUR'].includes(role);
        if (!isAdmin && litige.clientId !== userId) {
            throw new common_1.ForbiddenException('Accès refusé');
        }
        return { succes: true, message: 'Détail du litige', donnees: { litige } };
    }
    async ajouterCommentaire(litigeId, auteurId, dto, role) {
        const litige = await this.prisma.litige.findUnique({
            where: { id: litigeId },
            select: { id: true, clientId: true, statut: true },
        });
        if (!litige)
            throw new common_1.NotFoundException('Litige introuvable');
        const isAdmin = ['ADMIN', 'SUPERVISEUR'].includes(role);
        if (!isAdmin && litige.clientId !== auteurId) {
            throw new common_1.ForbiddenException('Accès refusé au litige');
        }
        if (['RESOLU', 'REJETE'].includes(litige.statut)) {
            throw new common_1.BadRequestException({
                message: 'Impossible de commenter un litige clôturé',
                code: 'LITIGE_CLOTURE',
            });
        }
        const commentaire = await this.prisma.commentaireLitige.create({
            data: {
                litigeId,
                auteurId,
                message: dto.message,
                pieceJointeUrl: dto.pieceJointeUrl,
            },
        });
        return {
            succes: true,
            message: 'Commentaire ajouté.',
            donnees: commentaire,
        };
    }
    async commentaires(litigeId, userId, role) {
        const litige = await this.prisma.litige.findUnique({
            where: { id: litigeId },
            select: { id: true, clientId: true },
        });
        if (!litige)
            throw new common_1.NotFoundException('Litige introuvable');
        const isAdmin = ['ADMIN', 'SUPERVISEUR'].includes(role);
        if (!isAdmin && litige.clientId !== userId) {
            throw new common_1.ForbiddenException('Accès refusé');
        }
        const commentaires = await this.prisma.commentaireLitige.findMany({
            where: { litigeId },
            orderBy: { creeLe: 'asc' },
        });
        return {
            succes: true,
            message: `${commentaires.length} commentaire(s).`,
            donnees: commentaires,
        };
    }
};
exports.LitigesService = LitigesService;
exports.LitigesService = LitigesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sms_service_1.SmsService])
], LitigesService);
//# sourceMappingURL=litiges.service.js.map