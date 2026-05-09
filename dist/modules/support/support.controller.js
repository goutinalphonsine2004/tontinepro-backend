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
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const support_service_1 = require("./support.service");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const client_1 = require("@prisma/client");
let SupportController = class SupportController {
    service;
    constructor(service) {
        this.service = service;
    }
    listerFAQ(categorie) {
        return this.service.listerFAQ(categorie);
    }
    creerFAQ(dto, u) {
        return this.service.creerFAQ(dto, u.id);
    }
    modifierFAQ(id, dto) {
        return this.service.modifierFAQ(id, dto);
    }
    supprimerFAQ(id) {
        return this.service.supprimerFAQ(id);
    }
};
exports.SupportController = SupportController;
__decorate([
    (0, common_1.Get)('faq'),
    __param(0, (0, common_1.Query)('categorie')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "listerFAQ", null);
__decorate([
    (0, common_1.Post)('faq'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "creerFAQ", null);
__decorate([
    (0, common_1.Put)('faq/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "modifierFAQ", null);
__decorate([
    (0, common_1.Delete)('faq/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "supprimerFAQ", null);
exports.SupportController = SupportController = __decorate([
    (0, common_1.Controller)('support'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [support_service_1.SupportService])
], SupportController);
//# sourceMappingURL=support.controller.js.map