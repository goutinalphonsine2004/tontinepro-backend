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
exports.MicroCreditsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const micro_credits_service_1 = require("./micro-credits.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const demander_credit_dto_1 = require("./dto/demander-credit.dto");
const confirmer_pin_dto_1 = require("./dto/confirmer-pin.dto");
const consentement_sms_dto_1 = require("./dto/consentement-sms.dto");
const refuser_credit_dto_1 = require("./dto/refuser-credit.dto");
let MicroCreditsController = class MicroCreditsController {
    service;
    prisma;
    constructor(service, prisma) {
        this.service = service;
        this.prisma = prisma;
    }
    async verifierAccesClient(collecteurId, clientId) {
        const client = await this.prisma.utilisateur.findFirst({
            where: { id: clientId, collecteurId },
        });
        if (!client)
            throw new common_1.ForbiddenException('Ce client ne fait pas partie de votre portefeuille.');
        return clientId;
    }
    async monEligibilite(u, clientId) {
        const estCollecteur = u.role === client_1.Role.AGENT || u.role === client_1.Role.INDEPENDANT;
        const id = estCollecteur && clientId
            ? await this.verifierAccesClient(u.id, clientId)
            : u.id;
        return this.service.monEligibilite(id);
    }
    async demander(u, dto, clientId) {
        const estCollecteur = u.role === client_1.Role.AGENT || u.role === client_1.Role.INDEPENDANT;
        const id = estCollecteur && clientId
            ? await this.verifierAccesClient(u.id, clientId)
            : u.id;
        return this.service.demander(id, dto);
    }
    consentementSms(dto) {
        return this.service.consentementSms(dto);
    }
    confirmerPin(id, u, dto) {
        return this.service.confirmerPin(id, u.id, dto);
    }
    enAttente() {
        return this.service.enAttente();
    }
    valider(id, u) {
        return this.service.valider(id, u.id);
    }
    refuser(id, u, dto) {
        return this.service.refuser(id, u.id, dto);
    }
    async mesCredits(u, clientId) {
        const estCollecteur = u.role === client_1.Role.AGENT || u.role === client_1.Role.INDEPENDANT;
        const id = estCollecteur && clientId
            ? await this.verifierAccesClient(u.id, clientId)
            : u.id;
        return this.service.mesCredits(id);
    }
    remboursements(id, u) {
        return this.service.remboursements(id, u.id);
    }
};
exports.MicroCreditsController = MicroCreditsController;
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('mon-eligibilite'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MicroCreditsController.prototype, "monEligibilite", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('demander'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, demander_credit_dto_1.DemanderCreditDto, String]),
    __metadata("design:returntype", Promise)
], MicroCreditsController.prototype, "demander", null);
__decorate([
    (0, common_1.Post)('consentement-sms'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [consentement_sms_dto_1.ConsentementSmsDto]),
    __metadata("design:returntype", void 0)
], MicroCreditsController.prototype, "consentementSms", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/confirmer-pin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, confirmer_pin_dto_1.ConfirmerPinDto]),
    __metadata("design:returntype", void 0)
], MicroCreditsController.prototype, "confirmerPin", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERVISEUR),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)('en-attente'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MicroCreditsController.prototype, "enAttente", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Put)(':id/valider'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MicroCreditsController.prototype, "valider", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Put)(':id/refuser'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, refuser_credit_dto_1.RefuserCreditDto]),
    __metadata("design:returntype", void 0)
], MicroCreditsController.prototype, "refuser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('mes-credits'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MicroCreditsController.prototype, "mesCredits", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/remboursements'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MicroCreditsController.prototype, "remboursements", null);
exports.MicroCreditsController = MicroCreditsController = __decorate([
    (0, common_1.Controller)('micro-credits'),
    __metadata("design:paramtypes", [micro_credits_service_1.MicroCreditsService,
        prisma_service_1.PrismaService])
], MicroCreditsController);
//# sourceMappingURL=micro-credits.controller.js.map