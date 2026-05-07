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
exports.QrcodeService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../prisma/prisma.service");
const DUREE_QR_JOURS = 30;
let QrcodeService = class QrcodeService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async monCode(utilisateurId, role) {
        if (![client_1.Role.AGENT, client_1.Role.INDEPENDANT].includes(role)) {
            throw new common_1.BadRequestException({
                message: 'Seuls les agents et collecteurs indépendants ont un QR code',
                code: 'ROLE_INSUFFISANT',
            });
        }
        let qr = await this.prisma.qRCodeCollecteur.findUnique({ where: { collecteurId: utilisateurId } });
        if (!qr || qr.expireLe < new Date()) {
            const expireLe = new Date(Date.now() + DUREE_QR_JOURS * 24 * 60 * 60 * 1000);
            qr = await this.prisma.qRCodeCollecteur.upsert({
                where: { collecteurId: utilisateurId },
                create: { collecteurId: utilisateurId, codeQR: (0, uuid_1.v4)(), expireLe, actif: true },
                update: { codeQR: (0, uuid_1.v4)(), expireLe, actif: true },
            });
        }
        return { succes: true, message: 'QR code récupéré.', donnees: qr };
    }
    async scanner(code) {
        const qr = await this.prisma.qRCodeCollecteur.findUnique({
            where: { codeQR: code },
            include: {
                collecteur: {
                    select: { id: true, nom: true, telephone: true, role: true, kycVerifie: true, statut: true },
                },
            },
        });
        if (!qr)
            throw new common_1.NotFoundException({ message: 'QR code inconnu', code: 'QR_INVALIDE' });
        if (!qr.actif)
            throw new common_1.BadRequestException({ message: 'QR code désactivé', code: 'QR_DESACTIVE' });
        if (qr.expireLe < new Date()) {
            throw new common_1.BadRequestException({ message: 'QR code expiré', code: 'QR_EXPIRE' });
        }
        return {
            succes: true,
            message: 'Collecteur authentifié.',
            donnees: { collecteur: qr.collecteur, expireLe: qr.expireLe },
        };
    }
    async regenerer(agentId) {
        const agent = await this.prisma.utilisateur.findUnique({
            where: { id: agentId },
            select: { id: true, role: true, nom: true },
        });
        if (!agent)
            throw new common_1.NotFoundException('Agent introuvable');
        if (![client_1.Role.AGENT, client_1.Role.INDEPENDANT].includes(agent.role)) {
            throw new common_1.BadRequestException({ message: 'Cet utilisateur n\'est pas un collecteur', code: 'ROLE_INVALIDE' });
        }
        const expireLe = new Date(Date.now() + DUREE_QR_JOURS * 24 * 60 * 60 * 1000);
        const qr = await this.prisma.qRCodeCollecteur.upsert({
            where: { collecteurId: agentId },
            create: { collecteurId: agentId, codeQR: (0, uuid_1.v4)(), expireLe, actif: true },
            update: { codeQR: (0, uuid_1.v4)(), expireLe, actif: true },
        });
        return { succes: true, message: `QR code régénéré pour ${agent.nom}.`, donnees: qr };
    }
};
exports.QrcodeService = QrcodeService;
exports.QrcodeService = QrcodeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QrcodeService);
//# sourceMappingURL=qrcode.service.js.map