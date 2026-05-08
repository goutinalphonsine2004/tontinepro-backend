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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const business_constants_1 = require("../../common/constants/business.constants");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async kpis() {
        const [volumeTotal, totalClients, totalCollecteurs, revenusCommissions, microCredits, abonnements, creditsTermines, creditsTotal, eligiblesPADME, eligiblesMicroCredit,] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: { type: client_1.TypeTransaction.COTISATION, statut: client_1.StatutTransaction.SUCCES },
                _sum: { montant: true },
            }),
            this.prisma.utilisateur.count({ where: { role: client_1.Role.CLIENT, statut: client_1.StatutCompte.ACTIF } }),
            this.prisma.utilisateur.count({ where: { role: { in: [client_1.Role.AGENT, client_1.Role.INDEPENDANT] }, statut: client_1.StatutCompte.ACTIF } }),
            this.prisma.commission.aggregate({ _sum: { montant: true } }),
            this.prisma.microCredit.findMany({ select: { montantTotal: true, montantPrincipal: true } }),
            this.prisma.facturationAgent.aggregate({ where: { actif: true }, _sum: { fraisMensuels: true } }),
            this.prisma.microCredit.count({ where: { statut: client_1.StatutCredit.TERMINE } }),
            this.prisma.microCredit.count({ where: { statut: { not: client_1.StatutCredit.EN_ATTENTE } } }),
            this.prisma.scoreCredit.count({ where: { eligiblePADME: true } }),
            this.prisma.scoreCredit.count({ where: { eligibleMicroCredit: true } }),
        ]);
        const revenusMicroCredits = microCredits.reduce((sum, c) => sum + (c.montantTotal - c.montantPrincipal), 0);
        const revenusTotal = (revenusCommissions._sum.montant ?? 0) +
            revenusMicroCredits +
            (abonnements._sum.fraisMensuels ?? 0);
        return {
            succes: true,
            message: 'KPIs TontinePro.',
            donnees: {
                volumeTotal: volumeTotal._sum.montant ?? 0,
                totalClients,
                totalCollecteurs,
                revenusCommissions: revenusCommissions._sum.montant ?? 0,
                revenusMicroCredits,
                revenusAbonnements: abonnements._sum.fraisMensuels ?? 0,
                revenusTotal,
                tauxRemboursement: creditsTotal > 0 ? Math.round((creditsTermines / creditsTotal) * 100) : 100,
                clientsEligiblesPADME: eligiblesPADME,
                clientsEligiblesMicroCredit: eligiblesMicroCredit,
                tauxCommission: `${business_constants_1.BUSINESS.TAUX_COMMISSION_COTISATION * 100}%`,
                tauxInteret: `${business_constants_1.BUSINESS.TAUX_INTERET_MICRO_CREDIT * 100}%`,
            },
        };
    }
    async scoreParZone() {
        const zones = await this.prisma.zone.findMany({
            include: {
                agents: {
                    include: {
                        clients: { include: { scoreCredit: { select: { score: true } } } },
                    },
                },
            },
        });
        const stats = zones.map((zone) => {
            const scores = zone.agents.flatMap((a) => a.clients.filter((c) => c.scoreCredit).map((c) => c.scoreCredit.score));
            const scoreMoyen = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
            return {
                zone: zone.nom,
                ville: zone.ville,
                nbClients: scores.length,
                scoreMoyen,
                eligiblesPADME: scores.filter((s) => s >= business_constants_1.BUSINESS.SEUIL_SCORE_PADME).length,
            };
        });
        return { succes: true, message: 'Scores par zone.', donnees: stats };
    }
    async performanceCollecteurs() {
        const collecteurs = await this.prisma.utilisateur.findMany({
            where: { role: { in: [client_1.Role.AGENT, client_1.Role.INDEPENDANT] }, statut: client_1.StatutCompte.ACTIF },
            include: {
                clients: {
                    include: {
                        transactions: {
                            where: { type: client_1.TypeTransaction.COTISATION, statut: client_1.StatutTransaction.SUCCES },
                            select: { montant: true },
                        },
                        scoreCredit: { select: { tauxRegularite: true } },
                    },
                },
                commissions: { select: { montant: true } },
            },
        });
        const perf = collecteurs.map((c) => {
            const totalCotisations = c.clients.flatMap((cl) => cl.transactions).reduce((s, t) => s + t.montant, 0);
            const totalCommissions = c.commissions.reduce((s, com) => s + com.montant, 0);
            const tauxMoyenClients = c.clients.length > 0
                ? c.clients.filter(cl => cl.scoreCredit).reduce((s, cl) => s + (cl.scoreCredit?.tauxRegularite ?? 0), 0) / c.clients.length
                : 0;
            return {
                id: c.id,
                nom: c.nom,
                telephone: c.telephone,
                role: c.role,
                nbClients: c.clients.length,
                totalCotisations,
                totalCommissions: Math.round(totalCommissions),
                tauxRegulariteClients: Math.round(tauxMoyenClients * 100),
            };
        }).sort((a, b) => b.totalCotisations - a.totalCotisations);
        return { succes: true, message: `${perf.length} collecteur(s).`, donnees: perf };
    }
    async tauxRemboursement() {
        const [global, parCollecteur] = await Promise.all([
            this.prisma.microCredit.groupBy({
                by: ['statut'],
                _count: true,
            }),
            this.prisma.utilisateur.findMany({
                where: { role: { in: [client_1.Role.AGENT, client_1.Role.INDEPENDANT] } },
                select: {
                    id: true, nom: true,
                    clients: { select: { microCredits: { select: { statut: true } } } },
                },
            }),
        ]);
        const totGlobal = global.reduce((s, g) => s + g._count, 0);
        const terminesGlobal = global.find((g) => g.statut === client_1.StatutCredit.TERMINE)?._count ?? 0;
        const parColl = parCollecteur.map((col) => {
            const credits = col.clients.flatMap((c) => c.microCredits).filter((cr) => cr.statut !== client_1.StatutCredit.EN_ATTENTE);
            const termines = credits.filter((cr) => cr.statut === client_1.StatutCredit.TERMINE).length;
            return {
                collecteur: col.nom,
                total: credits.length,
                termines,
                taux: credits.length > 0 ? Math.round((termines / credits.length) * 100) : 100,
            };
        }).filter((c) => c.total > 0);
        return {
            succes: true,
            message: 'Taux de remboursement.',
            donnees: {
                global: { total: totGlobal, termines: terminesGlobal, taux: totGlobal > 0 ? Math.round((terminesGlobal / totGlobal) * 100) : 100 },
                parCollecteur: parColl,
            },
        };
    }
    async evolutionRevenus() {
        const sixMoisDate = new Date();
        sixMoisDate.setMonth(sixMoisDate.getMonth() - 5);
        sixMoisDate.setDate(1);
        const commissions = await this.prisma.commission.findMany({
            where: { creeLe: { gte: sixMoisDate } },
            select: { montant: true, type: true, creeLe: true },
        });
        const mois = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            mois[key] = { commissions: 0, padme: 0, abonnements: 0 };
        }
        for (const c of commissions) {
            const key = `${c.creeLe.getFullYear()}-${String(c.creeLe.getMonth() + 1).padStart(2, '0')}`;
            if (!mois[key])
                continue;
            if (c.type === 'COTISATION')
                mois[key].commissions += c.montant;
            else if (c.type === 'PADME')
                mois[key].padme += c.montant;
            else if (c.type === 'ABONNEMENT')
                mois[key].abonnements += c.montant;
        }
        const donnees = Object.entries(mois).map(([m, v]) => ({
            mois: m,
            commissions: Math.round(v.commissions),
            padme: Math.round(v.padme),
            abonnements: Math.round(v.abonnements),
            total: Math.round(v.commissions + v.padme + v.abonnements),
        }));
        return { succes: true, message: 'Évolution des revenus sur 6 mois.', donnees };
    }
    async clientsEligibles() {
        const [eligiblesPADME, eligiblesMicroCredit] = await Promise.all([
            this.prisma.scoreCredit.findMany({
                where: { eligiblePADME: true },
                include: {
                    utilisateur: { select: { id: true, nom: true, telephone: true } },
                    dossiersPADME: {
                        where: { statut: { in: ['GENERE', 'VALIDE_ADMIN', 'SOUMIS_PADME'] } },
                        orderBy: { creeLe: 'desc' },
                        take: 1,
                    },
                },
            }),
            this.prisma.scoreCredit.findMany({
                where: { eligibleMicroCredit: true },
                include: {
                    utilisateur: {
                        select: { id: true, nom: true, telephone: true,
                            microCredits: { where: { statut: client_1.StatutCredit.ACTIF }, take: 1 } },
                    },
                },
            }),
        ]);
        return {
            succes: true,
            message: 'Clients éligibles.',
            donnees: {
                eligiblesPADME: {
                    total: eligiblesPADME.length,
                    sansDossierEnCours: eligiblesPADME.filter((e) => e.dossiersPADME.length === 0)
                        .map((e) => ({ ...e.utilisateur, score: e.score })),
                },
                eligiblesMicroCredit: {
                    total: eligiblesMicroCredit.length,
                    sansCredit: eligiblesMicroCredit
                        .filter((e) => e.utilisateur.microCredits.length === 0)
                        .map((e) => ({ id: e.utilisateur.id, nom: e.utilisateur.nom, telephone: e.utilisateur.telephone, score: e.score })),
                },
            },
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map