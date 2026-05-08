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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    service;
    constructor(service) {
        this.service = service;
    }
    kpis() { return this.service.kpis(); }
    scoreParZone() { return this.service.scoreParZone(); }
    performanceCollecteurs() { return this.service.performanceCollecteurs(); }
    tauxRemboursement() { return this.service.tauxRemboursement(); }
    evolutionRevenus() { return this.service.evolutionRevenus(); }
    clientsEligibles() { return this.service.clientsEligibles(); }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('kpis'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "kpis", null);
__decorate([
    (0, common_1.Get)('scores-par-zone'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "scoreParZone", null);
__decorate([
    (0, common_1.Get)('performance-collecteurs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "performanceCollecteurs", null);
__decorate([
    (0, common_1.Get)('taux-remboursement'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "tauxRemboursement", null);
__decorate([
    (0, common_1.Get)('evolution-revenus'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "evolutionRevenus", null);
__decorate([
    (0, common_1.Get)('clients-eligibles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "clientsEligibles", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERVISEUR),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map