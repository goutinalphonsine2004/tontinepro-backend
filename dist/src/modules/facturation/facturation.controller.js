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
exports.FacturationController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const facturation_service_1 = require("./facturation.service");
const payer_abonnement_dto_1 = require("./dto/payer-abonnement.dto");
let FacturationController = class FacturationController {
    service;
    constructor(service) {
        this.service = service;
    }
    monStatut(u) {
        return this.service.monStatut(u.id, u.role);
    }
    payerAbonnement(u, dto) {
        return this.service.payerAbonnement(u.id, dto);
    }
    upgrader(u) {
        return this.service.upgrader(u.id);
    }
    tous() {
        return this.service.tous();
    }
};
exports.FacturationController = FacturationController;
__decorate([
    (0, common_1.Get)('mon-statut'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FacturationController.prototype, "monStatut", null);
__decorate([
    (0, common_1.Post)('payer-abonnement'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payer_abonnement_dto_1.PayerAbonnementDto]),
    __metadata("design:returntype", void 0)
], FacturationController.prototype, "payerAbonnement", null);
__decorate([
    (0, common_1.Put)('upgrader'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FacturationController.prototype, "upgrader", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Get)('tous'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FacturationController.prototype, "tous", null);
exports.FacturationController = FacturationController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('facturation'),
    __metadata("design:paramtypes", [facturation_service_1.FacturationService])
], FacturationController);
//# sourceMappingURL=facturation.controller.js.map