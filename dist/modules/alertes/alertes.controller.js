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
exports.AlertesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const alertes_service_1 = require("./alertes.service");
const filtrer_alertes_dto_1 = require("./dto/filtrer-alertes.dto");
const resoudre_alerte_dto_1 = require("./dto/resoudre-alerte.dto");
let AlertesController = class AlertesController {
    service;
    constructor(service) {
        this.service = service;
    }
    lister(dto) {
        return this.service.lister(dto);
    }
    statistiques() {
        return this.service.statistiques();
    }
    detail(id) {
        return this.service.detail(id);
    }
    resoudre(id, u, dto) {
        return this.service.resoudre(id, u.id, dto);
    }
    rouvrir(id, u, dto) {
        return this.service.rouvrir(id, u.id, dto);
    }
};
exports.AlertesController = AlertesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filtrer_alertes_dto_1.FiltrerAlertesDto]),
    __metadata("design:returntype", void 0)
], AlertesController.prototype, "lister", null);
__decorate([
    (0, common_1.Get)('statistiques'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AlertesController.prototype, "statistiques", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AlertesController.prototype, "detail", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Put)(':id/resoudre'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, resoudre_alerte_dto_1.ResoudreAlerteDto]),
    __metadata("design:returntype", void 0)
], AlertesController.prototype, "resoudre", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Put)(':id/rouvrir'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, resoudre_alerte_dto_1.ResoudreAlerteDto]),
    __metadata("design:returntype", void 0)
], AlertesController.prototype, "rouvrir", null);
exports.AlertesController = AlertesController = __decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERVISEUR),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('alertes'),
    __metadata("design:paramtypes", [alertes_service_1.AlertesService])
], AlertesController);
//# sourceMappingURL=alertes.controller.js.map