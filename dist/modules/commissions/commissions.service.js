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
exports.CommissionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const business_constants_1 = require("../../common/constants/business.constants");
let CommissionsService = class CommissionsService {
    prisma;
    kkiapay;
    constructor(prisma, kkiapay) {
        this.prisma = prisma;
        this.kkiapay = kkiapay;
    }
    async monSolde(utilisateurId, role) {
        if (![client_1.Role.AGENT, client_1.Role.INDEPENDANT, client_1.Role.SUPERVISEUR].includes(role)) {
            throw new common_1.ForbiddenException({
                message: 'Seuls les collecteurs ont des commissions',
                code: 'ROLE_INSUFFISANT',
            });
        }
        const u = await this.prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
            select: { id: true, nom: true, soldeCommission: true },
        });
        const totalCommissions = await this.prisma.commission.aggregate({
            where: { agentId: utilisateurId },
            _sum: { montant: true },
            _count: true,
        });
        return {
            succes: true,
            message: 'Solde de commission récupéré.',
            donnees: {
                nom: u?.nom,
                soldeDisponible: u?.soldeCommission ?? 0,
                totalGagne: totalCommissions._sum.montant ?? 0,
                nombreTransactions: totalCommissions._count,
                tauxCommission: `${business_constants_1.BUSINESS.TAUX_COMMISSION_COTISATION * 100 * 0.5}% (50% des frais plateforme)`,
            },
        };
    }
    async historique(utilisateurId) {
        const commissions = await this.prisma.commission.findMany({
            where: { agentId: utilisateurId },
            include: {
                transaction: {
                    select: {
                        reference: true,
                        montant: true,
                        type: true,
                        creeLe: true,
                        utilisateur: { select: { nom: true } },
                    },
                },
            },
            orderBy: { creeLe: 'desc' },
            take: 50,
        });
        return {
            succes: true,
            message: `${commissions.length} commission(s).`,
            donnees: commissions,
        };
    }
    async retirer(utilisateurId, dto) {
        const agent = await this.prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
            select: { id: true, nom: true, telephone: true, soldeCommission: true },
        });
        if (!agent)
            throw new common_1.BadRequestException('Agent introuvable');
        if (agent.soldeCommission < dto.montant) {
            throw new common_1.BadRequestException({
                message: `Solde insuffisant. Disponible: ${agent.soldeCommission} FCFA`,
                code: 'SOLDE_INSUFFISANT',
            });
        }
        const telephone = dto.telephone ?? agent.telephone;
        const transfert = await this.kkiapay.initierTransfert({
            montant: dto.montant,
            telephone,
            reference: `comm_${utilisateurId}_${Date.now()}`,
            motif: 'Retrait commission TontineBénin',
        });
        if (!transfert.succes) {
            throw new common_1.BadRequestException({
                message: 'Échec du transfert',
                code: 'TRANSFERT_ECHOUE',
            });
        }
        await this.prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: { soldeCommission: { decrement: dto.montant } },
        });
        return {
            succes: true,
            message: `${dto.montant} FCFA transférés vers ${telephone}.`,
            donnees: {
                montant: dto.montant,
                telephone,
                refKKiaPay: transfert.refKKiaPay,
                soldeRestant: agent.soldeCommission - dto.montant,
            },
        };
    }
};
exports.CommissionsService = CommissionsService;
exports.CommissionsService = CommissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kkiapay_service_1.KkiapayService])
], CommissionsService);
//# sourceMappingURL=commissions.service.js.map