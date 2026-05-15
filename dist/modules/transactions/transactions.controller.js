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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const client_1 = require("@prisma/client");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const transactions_service_1 = require("./transactions.service");
const cotiser_dto_1 = require("./dto/cotiser.dto");
const webhook_kkiapay_dto_1 = require("./dto/webhook-kkiapay.dto");
const filtrer_transactions_dto_1 = require("./dto/filtrer-transactions.dto");
const partager_recu_whatsapp_dto_1 = require("./dto/partager-recu-whatsapp.dto");
const simuler_transaction_dto_1 = require("./dto/simuler-transaction.dto");
let TransactionsController = class TransactionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    cotiser(u, dto) {
        return this.service.cotiser(u.id, dto);
    }
    simuler(dto) {
        return this.service.simuler(dto);
    }
    webhook(req, body, signature) {
        const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(body));
        return this.service.traiterWebhook(body, rawBody, signature ?? '');
    }
    historique(u, filtres, clientId) {
        const estCollecteur = u.role === client_1.Role.AGENT || u.role === client_1.Role.INDEPENDANT;
        const cibleId = estCollecteur && clientId ? clientId : u.id;
        return this.service.historique(cibleId, filtres, estCollecteur ? u.id : undefined);
    }
    recu(id, u) {
        return this.service.recu(id, u.id);
    }
    async recuPdf(id, u, res) {
        const { buffer, filename } = await this.service.recuPdf(id, u.id);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(buffer);
    }
    partagerWhatsapp(id, u, dto) {
        return this.service.partagerRecuWhatsapp(id, u.id, dto.telephone);
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('cotiser'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cotiser_dto_1.CotiserDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "cotiser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('simuler'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [simuler_transaction_dto_1.SimulerTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "simuler", null);
__decorate([
    (0, common_1.Post)('webhook-kkiapay'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-kkiapay-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, webhook_kkiapay_dto_1.WebhookKkiapayDto, String]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "webhook", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('historique'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, filtrer_transactions_dto_1.FiltrerTransactionsDto, String]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "historique", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/recu'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "recu", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/recu.pdf'),
    (0, common_1.Header)('Content-Type', 'application/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "recuPdf", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/partager-whatsapp'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, partager_recu_whatsapp_dto_1.PartagerRecuWhatsappDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "partagerWhatsapp", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map