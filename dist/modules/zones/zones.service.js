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
exports.ZonesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const SELECT_ZONE = { id: true, nom: true, ville: true, description: true, creeLe: true };
let ZonesService = class ZonesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async creer(dto) {
        const zone = await this.prisma.zone.create({ data: dto, select: SELECT_ZONE });
        return { succes: true, message: 'Zone créée.', donnees: zone };
    }
    async lister() {
        const zones = await this.prisma.zone.findMany({
            select: { ...SELECT_ZONE, _count: { select: { agents: true } } },
            orderBy: { ville: 'asc' },
        });
        return { succes: true, message: `${zones.length} zone(s).`, donnees: zones };
    }
    async modifier(zoneId, dto) {
        const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
        if (!zone)
            throw new common_1.NotFoundException('Zone introuvable');
        const maj = await this.prisma.zone.update({
            where: { id: zoneId },
            data: dto,
            select: SELECT_ZONE,
        });
        return { succes: true, message: 'Zone mise à jour.', donnees: maj };
    }
    async agentsDeLaZone(zoneId) {
        const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
        if (!zone)
            throw new common_1.NotFoundException('Zone introuvable');
        const agents = await this.prisma.utilisateur.findMany({
            where: { zoneId },
            select: { id: true, nom: true, telephone: true, role: true, statut: true, kycVerifie: true },
        });
        return {
            succes: true,
            message: `${agents.length} agent(s) dans la zone "${zone.nom}".`,
            donnees: { zone: { id: zone.id, nom: zone.nom, ville: zone.ville }, agents },
        };
    }
};
exports.ZonesService = ZonesService;
exports.ZonesService = ZonesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ZonesService);
//# sourceMappingURL=zones.service.js.map