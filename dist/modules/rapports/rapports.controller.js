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
exports.RapportsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const filtrer_rapport_dto_1 = require("./dto/filtrer-rapport.dto");
const rapports_service_1 = require("./rapports.service");
let RapportsController = class RapportsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async transactionsCsv(dto, res) {
        const { buffer, filename } = await this.service.exportTransactionsCsv(dto);
        return this.envoyerFichier(res, buffer, filename);
    }
    async retraitsCsv(dto, res) {
        const { buffer, filename } = await this.service.exportRetraitsCsv(dto);
        return this.envoyerFichier(res, buffer, filename);
    }
    async microCreditsCsv(dto, res) {
        const { buffer, filename } = await this.service.exportMicroCreditsCsv(dto);
        return this.envoyerFichier(res, buffer, filename);
    }
    async financierPdf(dto, res) {
        const { buffer, filename } = await this.service.rapportFinancierPdf(dto);
        return this.envoyerFichier(res, buffer, filename);
    }
    envoyerFichier(res, buffer, filename) {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(buffer);
    }
};
exports.RapportsController = RapportsController;
__decorate([
    (0, common_1.Get)('exports/transactions.csv'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filtrer_rapport_dto_1.FiltrerRapportDto, Object]),
    __metadata("design:returntype", Promise)
], RapportsController.prototype, "transactionsCsv", null);
__decorate([
    (0, common_1.Get)('exports/retraits.csv'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filtrer_rapport_dto_1.FiltrerRapportDto, Object]),
    __metadata("design:returntype", Promise)
], RapportsController.prototype, "retraitsCsv", null);
__decorate([
    (0, common_1.Get)('exports/micro-credits.csv'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filtrer_rapport_dto_1.FiltrerRapportDto, Object]),
    __metadata("design:returntype", Promise)
], RapportsController.prototype, "microCreditsCsv", null);
__decorate([
    (0, common_1.Get)('financier.pdf'),
    (0, common_1.Header)('Content-Type', 'application/pdf'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filtrer_rapport_dto_1.FiltrerRapportDto, Object]),
    __metadata("design:returntype", Promise)
], RapportsController.prototype, "financierPdf", null);
exports.RapportsController = RapportsController = __decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('rapports'),
    __metadata("design:paramtypes", [rapports_service_1.RapportsService])
], RapportsController);
//# sourceMappingURL=rapports.controller.js.map