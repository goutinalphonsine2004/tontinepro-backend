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
exports.CollecteurTerrainController = void 0;
const common_1 = require("@nestjs/common");
const collecteur_terrain_service_1 = require("./collecteur-terrain.service");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const check_in_dto_1 = require("./dto/check-in.dto");
const client_1 = require("@prisma/client");
let CollecteurTerrainController = class CollecteurTerrainController {
    service;
    constructor(service) {
        this.service = service;
    }
    checkIn(u, dto) {
        return this.service.checkIn(u.id, dto);
    }
    clientsDuJour(u) {
        return this.service.clientsDuJour(u.id);
    }
    carteClients(u) {
        return this.service.carteClients(u.id);
    }
    mesPresences(u, page, limite) {
        return this.service.mesPresences(u.id, page ? parseInt(page) : 1, limite ? parseInt(limite) : 20);
    }
    dashboardIndependant(u) {
        return this.service.dashboardIndependant(u.id);
    }
    contactWhatsApp(u, clientId) {
        return this.service.contactWhatsApp(u.id, clientId);
    }
    monCollecteur(u) {
        return this.service.monCollecteur(u.id);
    }
};
exports.CollecteurTerrainController = CollecteurTerrainController;
__decorate([
    (0, common_1.Post)('check-in'),
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT, client_1.Role.INDEPENDANT),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, check_in_dto_1.CheckInDto]),
    __metadata("design:returntype", void 0)
], CollecteurTerrainController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Get)('clients-du-jour'),
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT, client_1.Role.INDEPENDANT),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CollecteurTerrainController.prototype, "clientsDuJour", null);
__decorate([
    (0, common_1.Get)('carte-clients'),
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT, client_1.Role.INDEPENDANT),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CollecteurTerrainController.prototype, "carteClients", null);
__decorate([
    (0, common_1.Get)('mes-presences'),
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT, client_1.Role.INDEPENDANT),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limite')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], CollecteurTerrainController.prototype, "mesPresences", null);
__decorate([
    (0, common_1.Get)('dashboard-independant'),
    (0, roles_decorator_1.Roles)(client_1.Role.INDEPENDANT),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CollecteurTerrainController.prototype, "dashboardIndependant", null);
__decorate([
    (0, common_1.Get)('contact-whatsapp/:clientId'),
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT, client_1.Role.INDEPENDANT),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Param)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CollecteurTerrainController.prototype, "contactWhatsApp", null);
__decorate([
    (0, common_1.Get)('mon-collecteur'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CollecteurTerrainController.prototype, "monCollecteur", null);
exports.CollecteurTerrainController = CollecteurTerrainController = __decorate([
    (0, common_1.Controller)('collecteur'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [collecteur_terrain_service_1.CollecteurTerrainService])
], CollecteurTerrainController);
//# sourceMappingURL=collecteur-terrain.controller.js.map