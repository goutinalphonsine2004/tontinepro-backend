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
exports.BadgesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const badges_service_1 = require("./badges.service");
let BadgesController = class BadgesController {
    service;
    constructor(service) {
        this.service = service;
    }
    mesBadges(u) {
        return this.service.mesBadges(u.id);
    }
    classement() {
        return this.service.classement();
    }
};
exports.BadgesController = BadgesController;
__decorate([
    (0, common_1.Get)('mes-badges'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BadgesController.prototype, "mesBadges", null);
__decorate([
    (0, common_1.Get)('classement'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BadgesController.prototype, "classement", null);
exports.BadgesController = BadgesController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('badges'),
    __metadata("design:paramtypes", [badges_service_1.BadgesService])
], BadgesController);
//# sourceMappingURL=badges.controller.js.map