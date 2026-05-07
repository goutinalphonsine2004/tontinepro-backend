"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const sms_service_1 = require("../notifications/sms.service");
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    sms;
    constructor(prisma, jwt, config, sms) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.sms = sms;
    }
    async inscription(dto) {
        const existant = await this.prisma.utilisateur.findUnique({
            where: { telephone: dto.telephone },
        });
        if (existant) {
            throw new common_1.ConflictException({
                message: 'Ce numéro de téléphone est déjà inscrit',
                code: 'TELEPHONE_EXISTANT',
            });
        }
        const roleAutorise = [client_1.Role.CLIENT, client_1.Role.INDEPENDANT, client_1.Role.AGENT];
        const role = dto.role && roleAutorise.includes(dto.role) ? dto.role : client_1.Role.CLIENT;
        const utilisateur = await this.prisma.utilisateur.create({
            data: { telephone: dto.telephone, nom: dto.nom, role, statut: client_1.StatutCompte.EN_ATTENTE },
        });
        const { id: otpId, code } = await this.creerOTP(utilisateur.id, dto.telephone, 'INSCRIPTION');
        await this.sms.envoyer(dto.telephone, `TontinePro: Votre code de vérification est ${code}. Valable ${this.config.get('DUREE_OTP_MINUTES', 10)} min.`);
        const donnees = { otpId, telephone: dto.telephone };
        if (this.config.get('NODE_ENV') === 'development')
            donnees.otp = code;
        return { succes: true, message: 'Inscription initiée. Code OTP envoyé par SMS.', donnees };
    }
    async verifierOtp(dto) {
        const otp = await this.prisma.codeOTP.findFirst({
            where: {
                telephone: dto.telephone,
                code: dto.code,
                type: 'INSCRIPTION',
                utilise: false,
                expireLe: { gt: new Date() },
            },
            include: { utilisateur: true },
        });
        if (!otp) {
            throw new common_1.BadRequestException({
                message: 'Code OTP invalide ou expiré',
                code: 'OTP_INVALIDE',
            });
        }
        await this.prisma.codeOTP.update({ where: { id: otp.id }, data: { utilise: true } });
        const tokenTemporaire = this.jwt.sign({ sub: otp.utilisateurId, telephone: dto.telephone, role: otp.utilisateur.role, scope: 'ONBOARDING' }, { expiresIn: '1h' });
        return {
            succes: true,
            message: 'Numéro de téléphone vérifié avec succès.',
            donnees: { tokenTemporaire },
        };
    }
    async creerPin(utilisateurId, dto) {
        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
        });
        if (!utilisateur)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (utilisateur.statut === client_1.StatutCompte.ACTIF && utilisateur.pinHash) {
            throw new common_1.BadRequestException({
                message: 'Un PIN est déjà défini. Utilisez la réinitialisation de PIN.',
                code: 'PIN_DEJA_DEFINI',
            });
        }
        const pinHash = await bcrypt.hash(dto.pin, 10);
        await this.prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: { pinHash, statut: client_1.StatutCompte.ACTIF },
        });
        const tokens = await this.genererTokens(utilisateurId, utilisateur.telephone, utilisateur.role);
        return {
            succes: true,
            message: 'PIN créé avec succès. Compte activé.',
            donnees: tokens,
        };
    }
    async connexion(dto) {
        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { telephone: dto.telephone },
        });
        if (!utilisateur) {
            throw new common_1.UnauthorizedException({
                message: 'Numéro de téléphone ou PIN incorrect',
                code: 'IDENTIFIANTS_INVALIDES',
            });
        }
        if (utilisateur.statut === client_1.StatutCompte.SUSPENDU) {
            throw new common_1.ForbiddenException({
                message: 'Votre compte est suspendu. Contactez le support.',
                code: 'COMPTE_SUSPENDU',
            });
        }
        if (utilisateur.statut === client_1.StatutCompte.BANNI) {
            throw new common_1.ForbiddenException({
                message: 'Votre compte a été banni.',
                code: 'COMPTE_BANNI',
            });
        }
        if (utilisateur.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.ForbiddenException({
                message: 'Compte non activé. Veuillez vérifier votre OTP et créer votre PIN.',
                code: 'COMPTE_INACTIF',
            });
        }
        const maxTentatives = parseInt(this.config.get('MAX_TENTATIVES_PIN', '3'));
        if (utilisateur.bloqueLe && utilisateur.bloqueLe > new Date()) {
            const minutesRestantes = Math.ceil((utilisateur.bloqueLe.getTime() - Date.now()) / 60000);
            throw new common_1.ForbiddenException({
                message: `Compte temporairement bloqué. Réessayez dans ${minutesRestantes} minute(s).`,
                code: 'COMPTE_BLOQUE',
            });
        }
        if (!utilisateur.pinHash) {
            throw new common_1.BadRequestException({ message: 'PIN non défini', code: 'PIN_NON_DEFINI' });
        }
        const pinValide = await bcrypt.compare(dto.pin, utilisateur.pinHash);
        if (!pinValide) {
            const tentatives = utilisateur.tentativesEchouees + 1;
            const data = { tentativesEchouees: tentatives };
            if (tentatives >= maxTentatives) {
                data.bloqueLe = new Date(Date.now() + 30 * 60 * 1000);
            }
            await this.prisma.utilisateur.update({ where: { id: utilisateur.id }, data });
            const restantes = maxTentatives - tentatives;
            throw new common_1.UnauthorizedException({
                message: restantes > 0
                    ? `PIN incorrect. ${restantes} tentative(s) restante(s).`
                    : 'Compte bloqué après trop de tentatives.',
                code: 'PIN_INCORRECT',
            });
        }
        await this.prisma.utilisateur.update({
            where: { id: utilisateur.id },
            data: { tentativesEchouees: 0, bloqueLe: null, deviceId: dto.deviceId ?? utilisateur.deviceId },
        });
        const tokens = await this.genererTokens(utilisateur.id, utilisateur.telephone, utilisateur.role);
        return {
            succes: true,
            message: 'Connexion réussie.',
            donnees: { ...tokens, role: utilisateur.role, nom: utilisateur.nom },
        };
    }
    async rafraichirToken(utilisateurId, telephone, role) {
        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
            select: { statut: true },
        });
        if (!utilisateur || utilisateur.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.UnauthorizedException('Session invalide');
        }
        const tokens = await this.genererTokens(utilisateurId, telephone, role);
        return { succes: true, message: 'Token rafraîchi.', donnees: tokens };
    }
    async deconnexion(utilisateurId) {
        await this.prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: { deviceId: null },
        });
        return { succes: true, message: 'Déconnexion réussie.' };
    }
    async genererTokens(id, telephone, role) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync({ sub: id, telephone, role }, { expiresIn: this.config.get('JWT_EXPIRES_IN', '24h') }),
            this.jwt.signAsync({ sub: id, telephone, role }, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
                expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async creerOTP(utilisateurId, telephone, type) {
        await this.prisma.codeOTP.updateMany({
            where: { utilisateurId, type, utilise: false },
            data: { utilise: true },
        });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expireLe = new Date(Date.now() + parseInt(this.config.get('DUREE_OTP_MINUTES', '10')) * 60 * 1000);
        const otp = await this.prisma.codeOTP.create({
            data: { utilisateurId, telephone, code, type, expireLe },
        });
        return otp;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        sms_service_1.SmsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map