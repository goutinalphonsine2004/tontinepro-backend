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
exports.RetraitsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const retraits_service_1 = require("./retraits.service");
const demander_retrait_dto_1 = require("./dto/demander-retrait.dto");
const rejeter_retrait_dto_1 = require("./dto/rejeter-retrait.dto");
let RetraitsController = class RetraitsController {
    service;
    constructor(service) {
        this.service = service;
    }
    demander(u, dto) {
        return this.service.demander(u.id, dto);
    }
    mesRetraits(u) {
        return this.service.mesRetraits(u.id);
    }
    enAttente() {
        return this.service.enAttente();
    }
    valider(id, u) {
        return this.service.valider(id, u.id);
    }
    rejeter(id, u, dto) {
        return this.service.rejeter(id, u.id, dto);
    }
};
exports.RetraitsController = RetraitsController;
__decorate([
    (0, common_1.Post)('demander'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, demander_retrait_dto_1.DemanderRetraitDto]),
    __metadata("design:returntype", void 0)
], RetraitsController.prototype, "demander", null);
__decorate([
    (0, common_1.Get)('mes-retraits'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RetraitsController.prototype, "mesRetraits", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERVISEUR),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Get)('en-attente'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RetraitsController.prototype, "enAttente", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Put)(':id/valider'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RetraitsController.prototype, "valider", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Put)(':id/rejeter'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, rejeter_retrait_dto_1.RejeterRetraitDto]),
    __metadata("design:returntype", void 0)
], RetraitsController.prototype, "rejeter", null);
exports.RetraitsController = RetraitsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('retraits'),
    __metadata("design:paramtypes", [retraits_service_1.RetraitsService])
], RetraitsController);
//# sourceMappingURL=retraits.controller.js.map