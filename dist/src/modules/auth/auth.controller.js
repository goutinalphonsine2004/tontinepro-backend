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
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const inscription_dto_1 = require("./dto/inscription.dto");
const verifier_otp_dto_1 = require("./dto/verifier-otp.dto");
const creer_pin_dto_1 = require("./dto/creer-pin.dto");
const connexion_dto_1 = require("./dto/connexion.dto");
const rafraichir_token_dto_1 = require("./dto/rafraichir-token.dto");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const passport_1 = require("@nestjs/passport");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    inscription(dto) {
        return this.authService.inscription(dto);
    }
    verifierOtp(dto) {
        return this.authService.verifierOtp(dto);
    }
    creerPin(utilisateur, dto) {
        return this.authService.creerPin(utilisateur.id, dto);
    }
    connexion(dto) {
        return this.authService.connexion(dto);
    }
    rafraichirToken(utilisateur, _dto) {
        return this.authService.rafraichirToken(utilisateur.id, utilisateur.telephone, utilisateur.role);
    }
    deconnexion(utilisateur) {
        return this.authService.deconnexion(utilisateur.id);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('inscription'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inscription_dto_1.InscriptionDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "inscription", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, creer_pin_dto_1.CreerPinDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "creerPin", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('connexion'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [connexion_dto_1.ConnexionDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "connexion", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt-refresh')),
    (0, common_1.Post)('rafraichir-token'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, rafraichir_token_dto_1.RafraichirTokenDto]),
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
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map