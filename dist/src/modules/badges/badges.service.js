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
exports.BadgesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const sms_service_1 = require("../notifications/sms.service");
const REGLES_BADGES = [
    { mois: 12, regulariteMin: 0.8, niveau: client_1.NiveauBadge.DIAMANT, label: 'DIAMANT 💎' },
    { mois: 6, regulariteMin: 0.7, niveau: client_1.NiveauBadge.OR, label: 'OR 🥇' },
    { mois: 3, regulariteMin: 0.6, niveau: client_1.NiveauBadge.ARGENT, label: 'ARGENT 🥈' },
    { mois: 1, regulariteMin: 0.5, niveau: client_1.NiveauBadge.BRONZE, label: 'BRONZE 🥉' },
];
let BadgesService = class BadgesService {
    prisma;
    sms;
    constructor(prisma, sms) {
        this.prisma = prisma;
        this.sms = sms;
    }
    async attribuerBadgesSiEligible(clientId) {
        const scoreCredit = await this.prisma.scoreCredit.findUnique({
            where: { utilisateurId: clientId },
        });
        const client = await this.prisma.utilisateur.findUnique({
            where: { id: clientId },
            select: { telephone: true, nom: true },
        });
        if (!scoreCredit || !client)
            return;
        const { totalMois, tauxRegularite } = scoreCredit;
        const badgeEligible = REGLES_BADGES.find((r) => totalMois >= r.mois && tauxRegularite >= r.regulariteMin);
        if (!badgeEligible)
            return;
        const badgeExistant = await this.prisma.badgeClient.findFirst({
            where: {
                clientId,
                niveau: { in: REGLES_BADGES.map((r) => r.niveau) },
            },
            orderBy: { obtenuLe: 'desc' },
        });
        const ordreBadge = {
            [client_1.NiveauBadge.BRONZE]: 1,
            [client_1.NiveauBadge.ARGENT]: 2,
            [client_1.NiveauBadge.OR]: 3,
            [client_1.NiveauBadge.DIAMANT]: 4,
        };
        if (badgeExistant &&
            ordreBadge[badgeExistant.niveau] >= ordreBadge[badgeEligible.niveau]) {
            return;
        }
        await this.prisma.badgeClient.create({
            data: { clientId, niveau: badgeEligible.niveau },
        });
        await this.sms.envoyer(client.telephone, `TontineBénin: 🎉 Félicitations ${client.nom} ! Vous venez d'obtenir le badge ${badgeEligible.label} TontineBénin. Continuez à épargner régulièrement !`);
    }
    async attribuerBadgesATous() {
        const clients = await this.prisma.utilisateur.findMany({
            where: { role: client_1.Role.CLIENT, statut: client_1.StatutCompte.ACTIF },
            select: { id: true },
        });
        for (const client of clients) {
            await this.attribuerBadgesSiEligible(client.id);
        }
    }
    async mesBadges(clientId) {
        const badges = await this.prisma.badgeClient.findMany({
            where: { clientId },
            orderBy: { obtenuLe: 'desc' },
        });
        const niveauActuel = badges.length > 0
            ? badges.reduce((best, b) => {
                const ordre = { BRONZE: 1, ARGENT: 2, OR: 3, DIAMANT: 4 };
                return ordre[b.niveau] > ordre[best.niveau] ? b : best;
            })
            : null;
        return {
            succes: true,
            message: `${badges.length} badge(s) obtenu(s).`,
            donnees: { badges, niveauActuel: niveauActuel?.niveau ?? null },
        };
    }
    async classement() {
        const top = await this.prisma.scoreCredit.findMany({
            orderBy: { score: 'desc' },
            take: 10,
            include: {
                utilisateur: {
                    select: {
                        id: true,
                        nom: true,
                        zoneId: true,
                        zone: { select: { nom: true, ville: true } },
                        badges: { orderBy: { obtenuLe: 'desc' }, take: 1 },
                    },
                },
            },
        });
        const classement = top.map((s, index) => ({
            rang: index + 1,
            nom: s.utilisateur.nom,
            score: s.score,
            badge: s.utilisateur.badges[0]?.niveau ?? 'Aucun',
            zone: s.utilisateur.zone?.nom ?? 'N/A',
            ville: s.utilisateur.zone?.ville ?? 'N/A',
        }));
        return { succes: true, message: 'Classement top 10 épargnants.', donnees: classement };
    }
};
exports.BadgesService = BadgesService;
exports.BadgesService = BadgesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sms_service_1.SmsService])
], BadgesService);
//# sourceMappingURL=badges.service.js.map