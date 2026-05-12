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
exports.AlertesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AlertesService = class AlertesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async lister(dto) {
        const page = dto.page ?? 1;
        const limite = Math.min(dto.limite ?? 20, 100);
        const skip = (page - 1) * limite;
        const where = {};
        if (dto.type)
            where.type = dto.type;
        if (dto.severite)
            where.severite = dto.severite;
        if (dto.statut)
            where.statut = dto.statut;
        if (dto.resourceType)
            where.resourceType = dto.resourceType;
        if (dto.resourceId)
            where.resourceId = dto.resourceId;
        if (dto.dateDebut || dto.dateFin) {
            where.detecteeLe = {
                ...(dto.dateDebut && { gte: new Date(dto.dateDebut) }),
                ...(dto.dateFin && { lte: this.finDeJournee(dto.dateFin) }),
            };
        }
        const [total, alertes] = await Promise.all([
            this.prisma.alerteSysteme.count({ where }),
            this.prisma.alerteSysteme.findMany({
                where,
                orderBy: [{ statut: 'asc' }, { detecteeLe: 'desc' }],
                skip,
                take: limite,
            }),
        ]);
        return {
            succes: true,
            message: `${total} alerte(s) système.`,
            donnees: {
                alertes,
                total,
                page,
                limite,
                pages: Math.ceil(total / limite),
            },
        };
    }
    async statistiques() {
        const [parStatut, parSeverite, critiquesOuvertes, dernieres] = await Promise.all([
            this.prisma.alerteSysteme.groupBy({ by: ['statut'], _count: true }),
            this.prisma.alerteSysteme.groupBy({ by: ['severite'], _count: true }),
            this.prisma.alerteSysteme.count({
                where: { statut: 'OUVERTE', severite: 'CRITIQUE' },
            }),
            this.prisma.alerteSysteme.findMany({
                where: { statut: 'OUVERTE' },
                orderBy: { detecteeLe: 'desc' },
                take: 5,
            }),
        ]);
        return {
            succes: true,
            message: 'Statistiques des alertes système.',
            donnees: { parStatut, parSeverite, critiquesOuvertes, dernieres },
        };
    }
    async detail(id) {
        const alerte = await this.prisma.alerteSysteme.findUnique({
            where: { id },
        });
        if (!alerte)
            throw new common_1.NotFoundException('Alerte introuvable');
        return { succes: true, message: 'Alerte récupérée.', donnees: alerte };
    }
    async resoudre(id, adminId, dto) {
        const alerte = await this.prisma.alerteSysteme.findUnique({
            where: { id },
        });
        if (!alerte)
            throw new common_1.NotFoundException('Alerte introuvable');
        if (alerte.statut === 'RESOLUE') {
            throw new common_1.BadRequestException({
                message: 'Cette alerte est déjà résolue',
                code: 'ALERTE_DEJA_RESOLUE',
            });
        }
        const metadata = this.ajouterResolutionMetadata(alerte.metadata, adminId, dto.commentaire);
        const maj = await this.prisma.alerteSysteme.update({
            where: { id },
            data: {
                statut: 'RESOLUE',
                resolueLe: new Date(),
                metadata,
            },
        });
        await this.prisma.journalAudit.create({
            data: {
                utilisateurId: adminId,
                action: 'ALERTE_RESOLUE',
                details: JSON.stringify({
                    alerteId: id,
                    type: alerte.type,
                    commentaire: dto.commentaire ?? null,
                }),
            },
        });
        return { succes: true, message: 'Alerte résolue.', donnees: maj };
    }
    async rouvrir(id, adminId, dto) {
        const alerte = await this.prisma.alerteSysteme.findUnique({
            where: { id },
        });
        if (!alerte)
            throw new common_1.NotFoundException('Alerte introuvable');
        if (alerte.statut === 'OUVERTE') {
            throw new common_1.BadRequestException({
                message: 'Cette alerte est déjà ouverte',
                code: 'ALERTE_DEJA_OUVERTE',
            });
        }
        const metadata = this.ajouterReouvertureMetadata(alerte.metadata, adminId, dto.commentaire);
        const maj = await this.prisma.alerteSysteme.update({
            where: { id },
            data: {
                statut: 'OUVERTE',
                resolueLe: null,
                metadata,
            },
        });
        await this.prisma.journalAudit.create({
            data: {
                utilisateurId: adminId,
                action: 'ALERTE_ROUVERTE',
                details: JSON.stringify({
                    alerteId: id,
                    type: alerte.type,
                    commentaire: dto.commentaire ?? null,
                }),
            },
        });
        return { succes: true, message: 'Alerte rouverte.', donnees: maj };
    }
    ajouterResolutionMetadata(metadata, adminId, commentaire) {
        return JSON.stringify({
            ...this.parseMetadata(metadata),
            resolution: {
                adminId,
                commentaire: commentaire ?? null,
                date: new Date().toISOString(),
            },
        });
    }
    ajouterReouvertureMetadata(metadata, adminId, commentaire) {
        return JSON.stringify({
            ...this.parseMetadata(metadata),
            reouverture: {
                adminId,
                commentaire: commentaire ?? null,
                date: new Date().toISOString(),
            },
        });
    }
    parseMetadata(metadata) {
        if (!metadata)
            return {};
        try {
            return JSON.parse(metadata);
        }
        catch {
            return { metadataOriginale: metadata };
        }
    }
    finDeJournee(date) {
        const fin = new Date(date);
        fin.setHours(23, 59, 59, 999);
        return fin;
    }
};
exports.AlertesService = AlertesService;
exports.AlertesService = AlertesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AlertesService);
//# sourceMappingURL=alertes.service.js.map