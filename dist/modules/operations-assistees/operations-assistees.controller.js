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
exports.OperationsAssisteesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const operations_assistees_service_1 = require("./operations-assistees.service");
const enroler_client_terrain_dto_1 = require("./dto/enroler-client-terrain.dto");
const initier_operation_assistee_dto_1 = require("./dto/initier-operation-assistee.dto");
const confirmer_operation_assistee_dto_1 = require("./dto/confirmer-operation-assistee.dto");
let OperationsAssisteesController = class OperationsAssisteesController {
    service;
    constructor(service) {
        this.service = service;
    }
    enrolerClientSansSmartphone(u, dto) {
        return this.service.enrolerClientSansSmartphone(u.id, u.role, dto);
    }
    ficheTerrain(u, clientId) {
        return this.service.ficheTerrain(u.id, u.role, clientId);
    }
    initierCotisation(u, dto) {
        return this.service.initierCotisationAssistee(u.id, u.role, dto);
    }
    initierRetrait(u, dto) {
        return this.service.initierRetraitAssiste(u.id, u.role, dto);
    }
    confirmerClient(id, dto) {
        return this.service.confirmerParClient(id, dto);
    }
    statut(u, id) {
        return this.service.statut(u.id, u.role, id);
    }
};
exports.OperationsAssisteesController = OperationsAssisteesController;
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT, client_1.Role.INDEPENDANT),
    (0, common_1.Post)('clients-sans-smartphone'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, enroler_client_terrain_dto_1.EnrolerClientTerrainDto]),
    __metadata("design:returntype", void 0)
], OperationsAssisteesController.prototype, "enrolerClientSansSmartphone", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT, client_1.Role.INDEPENDANT, client_1.Role.SUPERVISEUR),
    (0, common_1.Get)('clients/:clientId/fiche-terrain'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Param)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OperationsAssisteesController.prototype, "ficheTerrain", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT, client_1.Role.INDEPENDANT),
    (0, common_1.Post)('cotisations/initier'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, initier_operation_assistee_dto_1.InitierOperationAssisteeDto]),
    __metadata("design:returntype", void 0)
], OperationsAssisteesController.prototype, "initierCotisation", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT, client_1.Role.INDEPENDANT),
    (0, common_1.Post)('retraits/initier'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, initier_operation_assistee_dto_1.InitierOperationAssisteeDto]),
    __metadata("design:returntype", void 0)
], OperationsAssisteesController.prototype, "initierRetrait", null);
__decorate([
    (0, common_1.Post)(':id/confirmer-client'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, confirmer_operation_assistee_dto_1.ConfirmerOperationAssisteeDto]),
    __metadata("design:returntype", void 0)
], OperationsAssisteesController.prototype, "confirmerClient", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT, client_1.Role.INDEPENDANT, client_1.Role.SUPERVISEUR),
    (0, common_1.Get)(':id/statut'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OperationsAssisteesController.prototype, "statut", null);
exports.OperationsAssisteesController = OperationsAssisteesController = __decorate([
    (0, common_1.Controller)('operations-assistees'),
    __metadata("design:paramtypes", [operations_assistees_service_1.OperationsAssisteesService])
], OperationsAssisteesController);
//# sourceMappingURL=operations-assistees.controller.js.map