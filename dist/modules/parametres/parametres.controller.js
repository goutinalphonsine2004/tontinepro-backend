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
exports.ParametresController = void 0;
const common_1 = require("@nestjs/common");
const parametres_service_1 = require("./parametres.service");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const set_parametre_dto_1 = require("./dto/set-parametre.dto");
const client_1 = require("@prisma/client");
let ParametresController = class ParametresController {
    service;
    constructor(service) {
        this.service = service;
    }
    lister() {
        return this.service.lister();
    }
    get(cle) {
        return this.service.get(cle);
    }
    set(cle, dto, u) {
        return this.service.set(cle, dto, u.id);
    }
    maintenance(dto, u) {
        return this.service.maintenance(dto, u.id);
    }
};
exports.ParametresController = ParametresController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ParametresController.prototype, "lister", null);
__decorate([
    (0, common_1.Get)(':cle'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('cle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParametresController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(':cle'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('cle')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_parametre_dto_1.SetParametreDto, Object]),
    __metadata("design:returntype", void 0)
], ParametresController.prototype, "set", null);
__decorate([
    (0, common_1.Post)('maintenance'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [set_parametre_dto_1.MaintenanceDto, Object]),
    __metadata("design:returntype", void 0)
], ParametresController.prototype, "maintenance", null);
exports.ParametresController = ParametresController = __decorate([
    (0, common_1.Controller)('parametres'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [parametres_service_1.ParametresService])
], ParametresController);
//# sourceMappingURL=parametres.controller.js.map