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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const inscription_dto_1 = require("./dto/inscription.dto");
const verifier_otp_dto_1 = require("./dto/verifier-otp.dto");
const creer_pin_dto_1 = require("./dto/creer-pin.dto");
const connexion_dto_1 = require("./dto/connexion.dto");
const demander_reset_pin_dto_1 = require("./dto/demander-reset-pin.dto");
const renvoyer_otp_inscription_dto_1 = require("./dto/renvoyer-otp-inscription.dto");
const verifier_otp_reset_pin_dto_1 = require("./dto/verifier-otp-reset-pin.dto");
const reinitialiser_pin_dto_1 = require("./dto/reinitialiser-pin.dto");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const passport_1 = require("@nestjs/passport");
const client_1 = require("@prisma/client");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    inscription(dto) {
        return this.authService.inscription(dto);
    }
    renvoyerOtpInscription(dto) {
        return this.authService.renvoyerOtpInscription(dto.telephone);
    }
    verifierOtp(dto) {
        return this.authService.verifierOtp(dto);
    }
    creerPin(utilisateur, dto, req) {
        return this.authService.creerPin(utilisateur.id, dto, req);
    }
    connexion(dto, req) {
        return this.authService.connexion(dto, req);
    }
    demanderResetPin(dto) {
        return this.authService.demanderResetPin(dto);
    }
    verifierOtpResetPin(dto) {
        return this.authService.verifierOtpResetPin(dto);
    }
    reinitialiserPin(dto) {
        return this.authService.reinitialiserPin(dto);
    }
    rafraichirToken(utilisateur) {
        return this.authService.rafraichirToken(utilisateur.id, utilisateur.telephone, utilisateur.role, utilisateur.sessionId, utilisateur.refreshTokenBrut);
    }
    deconnexion(utilisateur) {
        return this.authService.deconnexion(utilisateur.id, utilisateur.sessionId);
    }
    deconnexionTout(utilisateur) {
        return this.authService.deconnexionTout(utilisateur.id, utilisateur.sessionId);
    }
    mesSessions(utilisateur) {
        return this.authService.mesSessions(utilisateur.id, utilisateur.sessionId);
    }
    revoquerSession(utilisateur, sessionId) {
        return this.authService.revoquerSession(utilisateur.id, sessionId, utilisateur.sessionId);
    }
    enregistrerAppareil(u, dto) {
        return this.authService.enregistrerAppareilBiometrique(u.id, dto);
    }
    connexionBiometrique(dto, req) {
        return this.authService.connexionBiometrique(dto, req);
    }
    mesAppareils(u) {
        return this.authService.mesAppareils(u.id);
    }
    revoquerAppareil(u, appareilId) {
        return this.authService.revoquerAppareil(u.id, appareilId);
    }
    connexionsSuspectes(page, limite) {
        return this.authService.connexionsSuspectes(page, limite);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('inscription'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inscription_dto_1.InscriptionDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "inscription", null);
__decorate([
    (0, common_1.Post)('renvoyer-otp-inscription'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [renvoyer_otp_inscription_dto_1.RenvoyerOtpInscriptionDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "renvoyerOtpInscription", null);
__decorate([
    (0, common_1.Post)('verifier-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verifier_otp_dto_1.VerifierOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifierOtp", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('creer-pin'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, creer_pin_dto_1.CreerPinDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "creerPin", null);
__decorate([
    (0, common_1.Post)('connexion'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [connexion_dto_1.ConnexionDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "connexion", null);
__decorate([
    (0, common_1.Post)('demander-reset-pin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [demander_reset_pin_dto_1.DemanderResetPinDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "demanderResetPin", null);
__decorate([
    (0, common_1.Post)('verifier-otp-reset-pin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verifier_otp_reset_pin_dto_1.VerifierOtpResetPinDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifierOtpResetPin", null);
__decorate([
    (0, common_1.Post)('reinitialiser-pin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reinitialiser_pin_dto_1.ReinitialiserPinDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "reinitialiserPin", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt-refresh')),
    (0, common_1.Post)('rafraichir-token'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "rafraichirToken", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('deconnexion'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "deconnexion", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('deconnexion-tout'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "deconnexionTout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('sessions'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "mesSessions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('sessions/:id/revoquer'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "revoquerSession", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('biometrique/enregistrer'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "enregistrerAppareil", null);
__decorate([
    (0, common_1.Post)('biometrique/connexion'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "connexionBiometrique", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('biometrique/appareils'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "mesAppareils", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('biometrique/appareils/:id'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "revoquerAppareil", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Get)('connexions-suspectes'),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limite', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "connexionsSuspectes", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map