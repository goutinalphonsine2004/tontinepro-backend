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
exports.CollecteurTerrainService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const sms_service_1 = require("../notifications/sms.service");
const DISTANCE_MAX_METRES = 500;
let CollecteurTerrainService = class CollecteurTerrainService {
    prisma;
    sms;
    constructor(prisma, sms) {
        this.prisma = prisma;
        this.sms = sms;
    }
    async checkIn(agentId, dto) {
        const agent = await this.prisma.utilisateur.findUnique({
            where: { id: agentId },
            select: { id: true, nom: true, role: true, statut: true },
        });
        if (!agent)
            throw new common_1.NotFoundException('Agent introuvable');
        if (![client_1.Role.AGENT, client_1.Role.INDEPENDANT].includes(agent.role)) {
            throw new common_1.ForbiddenException({
                message: 'Seuls les collecteurs peuvent faire un check-in',
                code: 'ROLE_INSUFFISANT',
            });
        }
        if (agent.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.ForbiddenException({
                message: 'Compte non actif',
                code: 'COMPTE_INACTIF',
            });
        }
        const client = await this.prisma.utilisateur.findUnique({
            where: { id: dto.clientId },
            select: { id: true, nom: true, telephone: true, collecteurId: true },
        });
        if (!client)
            throw new common_1.NotFoundException('Client introuvable');
        if (client.collecteurId !== agentId) {
            throw new common_1.ForbiddenException({
                message: "Ce client n'appartient pas à votre portefeuille",
                code: 'ACCES_REFUSE',
            });
        }
        const distance = 0;
        const estValide = true;
        const presence = await this.prisma.presenceCollecteur.create({
            data: {
                agentId,
                clientId: dto.clientId,
                latitude: dto.latitude,
                longitude: dto.longitude,
                distance,
                estValide,
            },
        });
        return {
            succes: true,
            message: estValide
                ? `Check-in validé pour ${client.nom} ✅`
                : `Check-in refusé : vous êtes trop loin du client (${Math.round(distance)}m > ${DISTANCE_MAX_METRES}m)`,
            donnees: {
                presenceId: presence.id,
                distance: Math.round(distance),
                estValide,
            },
        };
    }
    async clientsDuJour(agentId) {
        const clients = await this.prisma.utilisateur.findMany({
            where: { collecteurId: agentId, statut: client_1.StatutCompte.ACTIF },
            select: {
                id: true,
                nom: true,
                telephone: true,
                kycVerifie: true,
                tontines: {
                    select: {
                        soldeActuel: true,
                        objectifMontant: true,
                        montantJournalier: true,
                    },
                    take: 1,
                },
                scoreCredit: { select: { score: true, tauxRegularite: true } },
            },
            orderBy: { nom: 'asc' },
        });
        const debutJour = new Date();
        debutJour.setHours(0, 0, 0, 0);
        const visitesAujourdHui = await this.prisma.presenceCollecteur.findMany({
            where: {
                agentId,
                creeLe: { gte: debutJour },
                estValide: true,
            },
            select: { clientId: true },
        });
        const clientsDejaVisites = new Set(visitesAujourdHui.map((v) => v.clientId));
        const donnees = clients.map((c) => ({
            id: c.id,
            nom: c.nom,
            telephone: c.telephone,
            kycVerifie: c.kycVerifie,
            solde: c.tontines[0]?.soldeActuel ?? 0,
            montantJournalier: c.tontines[0]?.montantJournalier ?? 0,
            score: c.scoreCredit?.score ?? 0,
            dejaVisite: clientsDejaVisites.has(c.id),
        }));
        const nbVisites = clientsDejaVisites.size;
        const nbRestantes = clients.length - nbVisites;
        return {
            succes: true,
            message: `${clients.length} client(s) — ${nbVisites} visité(s), ${nbRestantes} restant(s)`,
            donnees: {
                clients: donnees,
                stats: {
                    total: clients.length,
                    visites: nbVisites,
                    restantes: nbRestantes,
                },
            },
        };
    }
    async carteClients(agentId) {
        const clients = await this.prisma.utilisateur.findMany({
            where: { collecteurId: agentId, statut: client_1.StatutCompte.ACTIF },
            select: { id: true, nom: true, telephone: true },
        });
        const dernieresPresences = await this.prisma.presenceCollecteur.findMany({
            where: { agentId, estValide: true },
            orderBy: { creeLe: 'desc' },
            distinct: ['clientId'],
            select: { clientId: true, latitude: true, longitude: true, creeLe: true },
        });
        const positionsParClient = new Map(dernieresPresences.map((p) => [p.clientId, p]));
        const donnees = clients.map((c) => {
            const pos = positionsParClient.get(c.id);
            return {
                id: c.id,
                nom: c.nom,
                telephone: c.telephone,
                position: pos
                    ? {
                        latitude: pos.latitude,
                        longitude: pos.longitude,
                        dernierCheckIn: pos.creeLe,
                    }
                    : null,
            };
        });
        return {
            succes: true,
            message: `${clients.length} client(s) dans votre carte.`,
            donnees,
        };
    }
    async mesPresences(agentId, page = 1, limite = 20) {
        const skip = (page - 1) * limite;
        const [presences, total] = await this.prisma.$transaction([
            this.prisma.presenceCollecteur.findMany({
                where: { agentId },
                orderBy: { creeLe: 'desc' },
                skip,
                take: limite,
                include: {},
            }),
            this.prisma.presenceCollecteur.count({ where: { agentId } }),
        ]);
        return {
            succes: true,
            message: `${total} check-in(s).`,
            donnees: { presences, total, page, pages: Math.ceil(total / limite) },
        };
    }
    async dashboardIndependant(agentId) {
        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        const sixMoisDate = new Date(maintenant);
        sixMoisDate.setMonth(sixMoisDate.getMonth() - 5);
        sixMoisDate.setDate(1);
        const [agent, clients, commissionsMois, abonnement, creditsClients] = await Promise.all([
            this.prisma.utilisateur.findUnique({
                where: { id: agentId },
                select: {
                    id: true,
                    nom: true,
                    telephone: true,
                    role: true,
                    soldeCommission: true,
                },
            }),
            this.prisma.utilisateur.findMany({
                where: { collecteurId: agentId, statut: client_1.StatutCompte.ACTIF },
                select: {
                    id: true,
                    transactions: {
                        where: {
                            type: 'COTISATION',
                            statut: 'SUCCES',
                            creeLe: { gte: debutMois },
                        },
                        select: { montant: true },
                    },
                },
            }),
            this.prisma.commission.aggregate({
                where: { agentId, creeLe: { gte: debutMois } },
                _sum: { montant: true },
            }),
            this.prisma.facturationAgent.findFirst({
                where: { agentId },
                orderBy: { creeLe: 'desc' },
                select: { plan: true, actif: true, prochainPaiement: true },
            }),
            this.prisma.microCredit.findMany({
                where: { clientId: { in: [] } },
                select: {
                    montantPrincipal: true,
                    montantTotal: true,
                    montantRestant: true,
                },
                take: 0,
            }),
        ]);
        if (!agent)
            throw new common_1.NotFoundException('Agent introuvable');
        const commissionsParMois = await this.prisma.commission.findMany({
            where: { agentId, creeLe: { gte: sixMoisDate } },
            select: { montant: true, creeLe: true },
        });
        const graphique = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(maintenant);
            d.setMonth(d.getMonth() - i);
            graphique[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
        }
        for (const c of commissionsParMois) {
            const key = `${c.creeLe.getFullYear()}-${String(c.creeLe.getMonth() + 1).padStart(2, '0')}`;
            if (graphique[key] !== undefined)
                graphique[key] += c.montant;
        }
        const clientsActifs = clients.length;
        const nbClientsCotiseCeMois = clients.filter((c) => c.transactions.length > 0).length;
        const tauxCollecteMois = clientsActifs > 0
            ? Math.round((nbClientsCotiseCeMois / clientsActifs) * 100)
            : 0;
        const interetsMicroCredits = creditsClients.reduce((s, c) => s + (c.montantTotal - c.montantPrincipal) * 0.1, 0);
        return {
            succes: true,
            message: 'Tableau de bord collecteur indépendant.',
            donnees: {
                agent: {
                    id: agent.id,
                    nom: agent.nom,
                    role: agent.role,
                    soldeCommission: agent.soldeCommission,
                },
                clientsActifs,
                commissionsCeMois: commissionsMois._sum.montant ?? 0,
                tauxCollecteMois,
                graphiqueRevenus: Object.entries(graphique).map(([mois, montant]) => ({
                    mois,
                    montant: Math.round(montant),
                })),
                revenutsMicroCredits: Math.round(interetsMicroCredits),
                abonnement: abonnement
                    ? {
                        plan: abonnement.plan,
                        actif: abonnement.actif,
                        prochainPaiement: abonnement.prochainPaiement,
                    }
                    : null,
            },
        };
    }
    async contactWhatsApp(agentId, clientId) {
        const client = await this.prisma.utilisateur.findUnique({
            where: { id: clientId },
            select: { id: true, nom: true, telephone: true, collecteurId: true },
        });
        if (!client)
            throw new common_1.NotFoundException('Client introuvable');
        if (client.collecteurId !== agentId) {
            throw new common_1.ForbiddenException({
                message: "Ce client n'est pas dans votre portefeuille",
                code: 'ACCES_REFUSE',
            });
        }
        const tel = client.telephone.replace(/^0+/, '').replace(/^\+/, '');
        const telE164 = tel.startsWith('229') ? tel : `229${tel}`;
        const lienWhatsApp = `https://wa.me/${telE164}`;
        return {
            succes: true,
            message: `Lien WhatsApp généré pour ${client.nom}.`,
            donnees: {
                clientId: client.id,
                nom: client.nom,
                telephone: client.telephone,
                lienWhatsApp,
            },
        };
    }
    async monCollecteur(clientId) {
        const client = await this.prisma.utilisateur.findUnique({
            where: { id: clientId },
            select: {
                id: true,
                collecteurId: true,
            },
        });
        if (!client)
            throw new common_1.NotFoundException('Client introuvable');
        if (!client.collecteurId) {
            return {
                succes: true,
                message: 'Aucun collecteur lié',
                donnees: null,
            };
        }
        const collecteur = await this.prisma.utilisateur.findUnique({
            where: { id: client.collecteurId },
            select: {
                id: true,
                nom: true,
                telephone: true,
                zone: {
                    select: { nom: true },
                },
                kycVerifie: true,
                soldeCommission: true,
            },
        });
        return {
            succes: true,
            message: 'Collecteur récupéré avec succès',
            donnees: collecteur
                ? {
                    id: collecteur.id,
                    nom: collecteur.nom,
                    telephone: collecteur.telephone,
                    region: collecteur.zone?.nom || null,
                    kycVerifie: collecteur.kycVerifie,
                    commissionPercent: 3,
                }
                : null,
        };
    }
};
exports.CollecteurTerrainService = CollecteurTerrainService;
exports.CollecteurTerrainService = CollecteurTerrainService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sms_service_1.SmsService])
], CollecteurTerrainService);
//# sourceMappingURL=collecteur-terrain.service.js.map