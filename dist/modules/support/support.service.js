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
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SupportService = class SupportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listerFAQ(categorie) {
        const faq = await this.prisma.articleFAQ.findMany({
            where: { actif: true, ...(categorie ? { categorie } : {}) },
            orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }],
        });
        const categories = [...new Set(faq.map((a) => a.categorie))];
        return {
            succes: true,
            message: `${faq.length} article(s) FAQ.`,
            donnees: { categories, articles: faq },
        };
    }
    async creerFAQ(dto, adminId) {
        const article = await this.prisma.articleFAQ.create({
            data: { ...dto, creePar: adminId },
        });
        return { succes: true, message: 'Article FAQ créé.', donnees: article };
    }
    async modifierFAQ(id, dto) {
        const article = await this.prisma.articleFAQ.findUnique({ where: { id } });
        if (!article)
            throw new common_1.NotFoundException('Article FAQ introuvable');
        const maj = await this.prisma.articleFAQ.update({ where: { id }, data: dto });
        return { succes: true, message: 'Article FAQ mis à jour.', donnees: maj };
    }
    async supprimerFAQ(id) {
        const article = await this.prisma.articleFAQ.findUnique({ where: { id } });
        if (!article)
            throw new common_1.NotFoundException('Article FAQ introuvable');
        await this.prisma.articleFAQ.update({ where: { id }, data: { actif: false } });
        return { succes: true, message: 'Article désactivé.' };
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportService);
//# sourceMappingURL=support.service.js.map