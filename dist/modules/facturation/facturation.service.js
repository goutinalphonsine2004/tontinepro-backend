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
exports.FacturationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const business_constants_1 = require("../../common/constants/business.constants");
const MONTANTS = {
    STANDARD: business_constants_1.BUSINESS.ABONNEMENT_STANDARD,
    PRO: business_constants_1.BUSINESS.ABONNEMENT_PRO,
};
let FacturationService = class FacturationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async monStatut(utilisateurId, role) {
        if (![client_1.Role.AGENT, client_1.Role.INDEPENDANT].includes(role)) {
            throw new common_1.BadRequestException({
                message: 'Seuls les collecteurs ont une facturation',
                code: 'ROLE_INSUFFISANT',
            });
        }
        const facturation = await this.prisma.facturationAgent.findUnique({
            where: { agentId: utilisateurId },
        });
        if (!facturation) {
            const prochainPaiement = new Date();
            prochainPaiement.setMonth(prochainPaiement.getMonth() + 1);
            const fact = await this.prisma.facturationAgent.create({
                data: {
                    agentId: utilisateurId,
                    plan: 'STANDARD',
                    fraisMensuelsFcfa: business_constants_1.BUSINESS.ABONNEMENT_STANDARD,
                    fraisParClientFcfa: 10,
                    prochainPaiement,
                    actif: true,
                },
            });
            return {
                succes: true,
                message: 'Facturation STANDARD initialisée.',
                donnees: fact,
            };
        }
        return {
            succes: true,
            message: 'Statut de facturation récupéré.',
            donnees: facturation,
        };
    }
    async payerAbonnement(utilisateurId, dto) {
        const montantFcfa = MONTANTS[dto.plan];
        const prochainPaiement = new Date();
        prochainPaiement.setMonth(prochainPaiement.getMonth() + 1);
        const facturation = await this.prisma.facturationAgent.upsert({
            where: { agentId: utilisateurId },
            create: {
                agentId: utilisateurId,
                plan: dto.plan,
                fraisMensuelsFcfa: montantFcfa,
                fraisParClientFcfa: 10,
                dernierPaiement: new Date(),
                prochainPaiement,
                actif: true,
            },
            update: {
                plan: dto.plan,
                fraisMensuelsFcfa: montantFcfa,
                dernierPaiement: new Date(),
                prochainPaiement,
                actif: true,
            },
        });
        return {
            succes: true,
            message: `Abonnement ${dto.plan} payé — ${montantFcfa} FCFA. Prochain paiement: ${prochainPaiement.toLocaleDateString('fr-FR')}.`,
            donnees: facturation,
        };
    }
    async upgrader(utilisateurId) {
        const facturation = await this.prisma.facturationAgent.findUnique({
            where: { agentId: utilisateurId },
        });
        if (!facturation)
            throw new common_1.NotFoundException("Aucune facturation trouvée. Payez d'abord un abonnement.");
        if (facturation.plan === 'PRO') {
            throw new common_1.BadRequestException({
                message: 'Vous êtes déjà sur le plan PRO',
                code: 'DEJA_PRO',
            });
        }
        const prochainPaiement = new Date();
        prochainPaiement.setMonth(prochainPaiement.getMonth() + 1);
        const maj = await this.prisma.facturationAgent.update({
            where: { agentId: utilisateurId },
            data: {
                plan: 'PRO',
                fraisMensuelsFcfa: business_constants_1.BUSINESS.ABONNEMENT_PRO,
                dernierPaiement: new Date(),
                prochainPaiement,
            },
        });
        return {
            succes: true,
            message: `Passage au plan PRO — ${business_constants_1.BUSINESS.ABONNEMENT_PRO} FCFA/mois.`,
            donnees: maj,
        };
    }
    async tous() {
        const facturations = await this.prisma.facturationAgent.findMany({
            include: {
                agent: { select: { id: true, nom: true, telephone: true, role: true } },
            },
            orderBy: { prochainPaiement: 'asc' },
        });
        const totalMensuel = facturations.reduce((s, f) => s + f.fraisMensuelsFcfa, 0);
        return {
            succes: true,
            message: `${facturations.length} facturation(s). Total mensuel: ${totalMensuel} FCFA.`,
            donnees: { facturations, totalMensuel },
        };
    }
};
exports.FacturationService = FacturationService;
exports.FacturationService = FacturationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FacturationService);
//# sourceMappingURL=facturation.service.js.map