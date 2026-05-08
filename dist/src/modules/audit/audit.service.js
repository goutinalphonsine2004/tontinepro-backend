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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async lister(dto) {
        const page = dto.page ?? 1;
        const limite = dto.limite ?? 20;
        const skip = (page - 1) * limite;
        const where = {};
        if (dto.utilisateurId)
            where.utilisateurId = dto.utilisateurId;
        if (dto.action)
            where.action = { contains: dto.action, mode: 'insensitive' };
        if (dto.dateDebut || dto.dateFin) {
            where.creeLe = {
                ...(dto.dateDebut && { gte: new Date(dto.dateDebut) }),
                ...(dto.dateFin && { lte: new Date(dto.dateFin) }),
            };
        }
        const [total, journaux] = await Promise.all([
            this.prisma.journalAudit.count({ where }),
            this.prisma.journalAudit.findMany({
                where,
                skip,
                take: limite,
                orderBy: { creeLe: 'desc' },
                include: {
                    utilisateur: {
                        select: { id: true, nom: true, telephone: true, role: true },
                    },
                },
            }),
        ]);
        return {
            succes: true,
            message: `${total} journal(aux) d’audit.`,
            donnees: { journaux, total, page, limite, pages: Math.ceil(total / limite) },
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map