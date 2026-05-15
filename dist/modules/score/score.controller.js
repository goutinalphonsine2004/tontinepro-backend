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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const score_service_1 = require("./score.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let ScoreController = class ScoreController {
    service;
    prisma;
    constructor(service, prisma) {
        this.service = service;
        this.prisma = prisma;
    }
    async resoudreClientId(u, clientId) {
        const estCollecteur = u.role === client_1.Role.AGENT || u.role === client_1.Role.INDEPENDANT;
        if (!estCollecteur || !clientId)
            return u.id;
        const client = await this.prisma.utilisateur.findFirst({
            where: { id: clientId, collecteurId: u.id },
        });
        if (!client)
            throw new common_1.ForbiddenException('Ce client ne fait pas partie de votre portefeuille.');
        return clientId;
    }
    async monScore(u, clientId) {
        const id = await this.resoudreClientId(u, clientId);
        return this.service.monScore(id);
    }
    async evolution(u, clientId) {
        const id = await this.resoudreClientId(u, clientId);
        return this.service.evolution(id);
    }
    async conseils(u, clientId) {
        const id = await this.resoudreClientId(u, clientId);
        return this.service.conseils(id);
    }
    async projection(u, clientId) {
        const id = await this.resoudreClientId(u, clientId);
        return this.service.projection(id);
    }
    async calendrierRegularite(u, clientId) {
        const id = await this.resoudreClientId(u, clientId);
        return this.service.calendrierRegularite(id);
    }
};
exports.ScoreController = ScoreController;
__decorate([
    (0, common_1.Get)('mon-score'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ScoreController.prototype, "monScore", null);
__decorate([
    (0, common_1.Get)('evolution'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ScoreController.prototype, "evolution", null);
__decorate([
    (0, common_1.Get)('conseils'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ScoreController.prototype, "conseils", null);
__decorate([
    (0, common_1.Get)('projection'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ScoreController.prototype, "projection", null);
__decorate([
    (0, common_1.Get)('calendrier-regularite'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ScoreController.prototype, "calendrierRegularite", null);
exports.ScoreController = ScoreController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('score'),
    __metadata("design:paramtypes", [score_service_1.ScoreService,
        prisma_service_1.PrismaService])
], ScoreController);
//# sourceMappingURL=score.controller.js.map