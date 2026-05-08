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
exports.CronController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const cron_service_1 = require("./cron.service");
const class_validator_1 = require("class-validator");
class DeclencherScoringDto {
    clientId;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeclencherScoringDto.prototype, "clientId", void 0);
let CronController = class CronController {
    service;
    constructor(service) {
        this.service = service;
    }
    scoring(dto) {
        return this.service.declencherScoringManuellement(dto.clientId);
    }
    remboursements() {
        return this.service.declencherRemboursementsManuellement();
    }
};
exports.CronController = CronController;
__decorate([
    (0, common_1.Post)('scoring'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DeclencherScoringDto]),
    __metadata("design:returntype", void 0)
], CronController.prototype, "scoring", null);
__decorate([
    (0, common_1.Post)('remboursements'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CronController.prototype, "remboursements", null);
exports.CronController = CronController = __decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('cron'),
    __metadata("design:paramtypes", [cron_service_1.CronService])
], CronController);
//# sourceMappingURL=cron.controller.js.map