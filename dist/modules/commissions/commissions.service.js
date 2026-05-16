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
            select: { id: true, nom: true, soldeCommissionFcfa: true },
        });
        const totalCommissions = await this.prisma.commission.aggregate({
            where: { agentId: utilisateurId },
            _sum: { montantFcfa: true },
            _count: true,
        });
        return {
            succes: true,
            message: 'Solde de commission récupéré.',
            donnees: this.presenterFinancesParRole(role, {
                nom: u?.nom,
                soldeDisponible: u?.soldeCommissionFcfa ?? 0,
                totalGagne: totalCommissions._sum.montantFcfa ?? 0,
                nombreTransactions: totalCommissions._count,
                tauxCommission: `${business_constants_1.BUSINESS.TAUX_COMMISSION_COTISATION * 100 * 0.5}% (50% des frais plateforme)`,
            }),
        };
    }
    async historique(utilisateurId, role) {
        this.verifierRoleFinanceTerrain(role);
        const commissions = await this.prisma.commission.findMany({
            where: { agentId: utilisateurId },
            include: {
                transaction: {
                    select: {
                        reference: true,
                        montantFcfa: true,
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
            message: role === client_1.Role.INDEPENDANT
                ? `${commissions.length} commission(s).`
                : `${commissions.length} élément(s) de performance.`,
            donnees: {
                peutRetirer: role === client_1.Role.INDEPENDANT,
                libelle: role === client_1.Role.INDEPENDANT
                    ? 'Historique des gains'
                    : role === client_1.Role.AGENT
                        ? 'Historique des primes estimées'
                        : 'Historique bonus/statistiques',
                commissions,
            },
        };
    }
    async retirer(utilisateurId, role, dto) {
        if (role !== client_1.Role.INDEPENDANT) {
            throw new common_1.ForbiddenException({
                message: role === client_1.Role.AGENT
                    ? "Les agents salariés ne peuvent pas retirer de primes dans l'application. Le paiement est traité par l'administration."
                    : 'Les superviseurs ne peuvent pas effectuer de retrait de commissions.',
                code: 'CASHOUT_NON_AUTORISE',
                donnees: {
                    peutRetirer: false,
                    role,
                    paiement: 'ADMINISTRATION',
                },
            });
        }
        const agent = await this.prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
            select: {
                id: true,
                nom: true,
                role: true,
                telephone: true,
                soldeCommissionFcfa: true,
            },
        });
        if (!agent)
            throw new common_1.BadRequestException('Agent introuvable');
        if (agent.role !== client_1.Role.INDEPENDANT) {
            throw new common_1.ForbiddenException({
                message: 'Seul un collecteur indépendant peut retirer ses commissions.',
                code: 'ROLE_CASHOUT_INVALIDE',
            });
        }
        if (agent.soldeCommissionFcfa < dto.montant) {
            throw new common_1.BadRequestException({
                message: `Solde insuffisant. Disponible: ${agent.soldeCommissionFcfa} FCFA`,
                code: 'SOLDE_INSUFFISANT',
            });
        }
        const telephone = dto.telephone ?? agent.telephone;
        const transfert = this.kkiapay.initierTransfert({
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
            data: { soldeCommissionFcfa: { decrement: dto.montant } },
        });
        return {
            succes: true,
            message: `${dto.montant} FCFA transférés vers ${telephone}.`,
            donnees: {
                montant: dto.montant,
                telephone,
                refKKiaPay: transfert.refKKiaPay,
                soldeRestant: agent.soldeCommissionFcfa - dto.montant,
            },
        };
    }
    verifierRoleFinanceTerrain(role) {
        if (![client_1.Role.AGENT, client_1.Role.INDEPENDANT, client_1.Role.SUPERVISEUR].includes(role)) {
            throw new common_1.ForbiddenException({
                message: 'Accès réservé aux rôles terrain',
                code: 'ROLE_INSUFFISANT',
            });
        }
    }
    prochainePaieEstimee() {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        date.setDate(5);
        date.setHours(9, 0, 0, 0);
        return date;
    }
    presenterFinancesParRole(role, base) {
        this.verifierRoleFinanceTerrain(role);
        if (role === client_1.Role.INDEPENDANT) {
            return {
                ...base,
                type: 'COMMISSIONS_INDEPENDANT',
                peutRetirer: true,
                modePaiement: 'MOBILE_MONEY',
                libellePrincipal: 'Commissions disponibles',
            };
        }
        if (role === client_1.Role.AGENT) {
            return {
                nom: base.nom,
                type: 'PRIME_AGENT',
                peutRetirer: false,
                soldeDisponible: 0,
                primeEstimee: base.totalGagne,
                totalGagne: base.totalGagne,
                nombreTransactions: base.nombreTransactions,
                paiementAdministration: true,
                prochainePaieEstimee: this.prochainePaieEstimee(),
                libellePrincipal: 'Prime estimée',
                messagePaie: "Paiement traité par l'administration selon validation mensuelle.",
            };
        }
        return {
            nom: base.nom,
            type: 'BONUS_SUPERVISEUR',
            peutRetirer: false,
            soldeDisponible: 0,
            bonusEstime: base.totalGagne,
            totalGagne: base.totalGagne,
            nombreTransactions: base.nombreTransactions,
            paiementAdministration: true,
            prochainePaieEstimee: this.prochainePaieEstimee(),
            libellePrincipal: 'Bonus/statistiques superviseur',
            messagePaie: "Bonus traité par l'administration. Aucun cashout superviseur dans l'application.",
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