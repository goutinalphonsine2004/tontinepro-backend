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
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const sms_service_1 = require("../notifications/sms.service");
const OTP_TYPE_INSCRIPTION = 'INSCRIPTION';
const OTP_TYPE_RESET_PIN = 'RESET_PIN';
const JWT_SCOPE_RESET_PIN = 'RESET_PIN';
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
        const { id: otpId, code } = await this.creerOTP(utilisateur.id, dto.telephone, OTP_TYPE_INSCRIPTION);
        await this.sms.envoyer(dto.telephone, `TontineBénin: Votre code de vérification est ${code}. Valable ${this.config.get('DUREE_OTP_MINUTES', 10)} min.`);
        const donnees = { otpId, telephone: dto.telephone };
        if (this.config.get('NODE_ENV') === 'development') {
            donnees.otpTest = code;
            donnees.messageTest = '⚠️ Mode test - En production ce code ne sera pas visible';
        }
        return { succes: true, message: 'Code OTP envoyé par SMS', donnees };
    }
    async verifierOtp(dto) {
        const otp = await this.prisma.codeOTP.findFirst({
            where: {
                telephone: dto.telephone,
                type: OTP_TYPE_INSCRIPTION,
                utilise: false,
                expireLe: { gt: new Date() },
            },
            include: { utilisateur: true },
            orderBy: { creeLe: 'desc' },
        });
        if (!otp || !(await this.verifierCodeOTP(dto.code, otp.code))) {
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
    async creerPin(utilisateurId, dto, req) {
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
        const session = await this.creerSession(utilisateurId, undefined, req);
        const tokens = await this.genererTokens(utilisateurId, utilisateur.telephone, utilisateur.role, session.id);
        return {
            succes: true,
            message: 'PIN créé avec succès. Compte activé.',
            donnees: { ...tokens, sessionId: session.id },
        };
    }
    async connexion(dto, req) {
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
        const session = await this.creerSession(utilisateur.id, dto.deviceId, req);
        const tokens = await this.genererTokens(utilisateur.id, utilisateur.telephone, utilisateur.role, session.id);
        return {
            succes: true,
            message: 'Connexion réussie.',
            donnees: { ...tokens, sessionId: session.id, role: utilisateur.role, nom: utilisateur.nom },
        };
    }
    async demanderResetPin(dto) {
        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { telephone: dto.telephone },
        });
        if (!utilisateur || utilisateur.statut === client_1.StatutCompte.BANNI) {
            throw new common_1.NotFoundException({
                message: 'Aucun compte actif ne correspond à ce numéro',
                code: 'COMPTE_INTROUVABLE',
            });
        }
        if (utilisateur.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.ForbiddenException({
                message: 'Ce compte ne peut pas encore réinitialiser son PIN',
                code: 'COMPTE_INACTIF',
            });
        }
        const { id: otpId, code } = await this.creerOTP(utilisateur.id, dto.telephone, OTP_TYPE_RESET_PIN);
        await this.sms.envoyer(dto.telephone, `TontineBénin: Code de réinitialisation PIN ${code}. Valable ${this.config.get('DUREE_OTP_MINUTES', 10)} min.`);
        const donnees = { otpId, telephone: dto.telephone };
        if (this.config.get('NODE_ENV') === 'development') {
            donnees.otpTest = code;
            donnees.messageTest = 'Mode test - En production ce code ne sera pas visible';
        }
        return { succes: true, message: 'Code de réinitialisation envoyé par SMS.', donnees };
    }
    async verifierOtpResetPin(dto) {
        const otp = await this.prisma.codeOTP.findFirst({
            where: {
                telephone: dto.telephone,
                type: OTP_TYPE_RESET_PIN,
                utilise: false,
                expireLe: { gt: new Date() },
            },
            include: { utilisateur: true },
            orderBy: { creeLe: 'desc' },
        });
        if (!otp || !(await this.verifierCodeOTP(dto.code, otp.code))) {
            throw new common_1.BadRequestException({
                message: 'Code OTP invalide ou expiré',
                code: 'OTP_RESET_INVALIDE',
            });
        }
        if (otp.utilisateur.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.ForbiddenException({
                message: 'Ce compte ne peut pas réinitialiser son PIN',
                code: 'COMPTE_INACTIF',
            });
        }
        await this.prisma.codeOTP.update({ where: { id: otp.id }, data: { utilise: true } });
        const tokenReset = this.jwt.sign({
            sub: otp.utilisateurId,
            telephone: dto.telephone,
            role: otp.utilisateur.role,
            scope: JWT_SCOPE_RESET_PIN,
        }, { expiresIn: '15m' });
        return {
            succes: true,
            message: 'Code vérifié. Vous pouvez définir un nouveau PIN.',
            donnees: { tokenReset },
        };
    }
    async reinitialiserPin(dto) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(dto.tokenReset);
        }
        catch {
            throw new common_1.UnauthorizedException({
                message: 'Token de réinitialisation invalide ou expiré',
                code: 'TOKEN_RESET_INVALIDE',
            });
        }
        if (!payload.sub || payload.scope !== JWT_SCOPE_RESET_PIN) {
            throw new common_1.UnauthorizedException({
                message: 'Token de réinitialisation invalide',
                code: 'TOKEN_RESET_INVALIDE',
            });
        }
        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { id: payload.sub },
        });
        if (!utilisateur)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (utilisateur.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.ForbiddenException({
                message: 'Ce compte ne peut pas réinitialiser son PIN',
                code: 'COMPTE_INACTIF',
            });
        }
        const pinHash = await bcrypt.hash(dto.nouveauPin, 10);
        await this.prisma.$transaction([
            this.prisma.utilisateur.update({
                where: { id: utilisateur.id },
                data: {
                    pinHash,
                    tentativesEchouees: 0,
                    bloqueLe: null,
                    deviceId: null,
                },
            }),
            this.prisma.sessionUtilisateur.updateMany({
                where: { utilisateurId: utilisateur.id, actif: true },
                data: { actif: false, revoqueLe: new Date() },
            }),
        ]);
        return { succes: true, message: 'PIN réinitialisé avec succès. Veuillez vous reconnecter.' };
    }
    async rafraichirToken(utilisateurId, telephone, role, sessionId) {
        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
            select: { statut: true },
        });
        if (!utilisateur || utilisateur.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.UnauthorizedException('Session invalide');
        }
        await this.prisma.sessionUtilisateur.update({
            where: { id: sessionId },
            data: { derniereUtilisation: new Date() },
        });
        const tokens = await this.genererTokens(utilisateurId, telephone, role, sessionId);
        return { succes: true, message: 'Token rafraîchi.', donnees: { ...tokens, sessionId } };
    }
    async deconnexion(utilisateurId, sessionId) {
        if (sessionId) {
            await this.prisma.sessionUtilisateur.updateMany({
                where: { id: sessionId, utilisateurId },
                data: { actif: false, revoqueLe: new Date() },
            });
        }
        await this.prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: { deviceId: null },
        });
        return { succes: true, message: 'Déconnexion réussie.' };
    }
    async deconnexionTout(utilisateurId, sessionCouranteId) {
        const result = await this.prisma.sessionUtilisateur.updateMany({
            where: { utilisateurId, actif: true },
            data: { actif: false, revoqueLe: new Date() },
        });
        await this.prisma.utilisateur.update({ where: { id: utilisateurId }, data: { deviceId: null } });
        return {
            succes: true,
            message: `${result.count} session(s) révoquée(s).`,
            donnees: { sessionCouranteRevoquee: !!sessionCouranteId },
        };
    }
    async mesSessions(utilisateurId, sessionCouranteId) {
        const sessions = await this.prisma.sessionUtilisateur.findMany({
            where: { utilisateurId },
            orderBy: { derniereUtilisation: 'desc' },
            select: {
                id: true,
                deviceId: true,
                userAgent: true,
                adresseIP: true,
                actif: true,
                derniereUtilisation: true,
                expireLe: true,
                revoqueLe: true,
                creeLe: true,
            },
        });
        return {
            succes: true,
            message: `${sessions.length} session(s).`,
            donnees: sessions.map((session) => ({
                ...session,
                sessionCourante: session.id === sessionCouranteId,
            })),
        };
    }
    async revoquerSession(utilisateurId, sessionId, sessionCouranteId) {
        const result = await this.prisma.sessionUtilisateur.updateMany({
            where: { id: sessionId, utilisateurId, actif: true },
            data: { actif: false, revoqueLe: new Date() },
        });
        if (result.count === 0) {
            throw new common_1.NotFoundException({
                message: 'Session introuvable ou déjà révoquée',
                code: 'SESSION_INTROUVABLE',
            });
        }
        return {
            succes: true,
            message: 'Session révoquée.',
            donnees: { sessionCouranteRevoquee: sessionId === sessionCouranteId },
        };
    }
    async genererTokens(id, telephone, role, sessionId) {
        const refreshSecret = this.secretRefreshJwt();
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync({ sub: id, telephone, role, sid: sessionId }, { expiresIn: this.config.get('JWT_EXPIRES_IN', '24h') }),
            this.jwt.signAsync({ sub: id, telephone, role, sid: sessionId }, {
                secret: refreshSecret,
                expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    secretRefreshJwt() {
        const secret = this.config.get('JWT_REFRESH_SECRET');
        if (!secret && this.config.get('NODE_ENV') === 'production') {
            throw new Error('JWT_REFRESH_SECRET est obligatoire en production');
        }
        return secret ?? 'dev-refresh-secret-change-me';
    }
    async creerSession(utilisateurId, deviceId, req) {
        const expireLe = new Date(Date.now() + this.dureeRefreshMs());
        return this.prisma.sessionUtilisateur.create({
            data: {
                utilisateurId,
                deviceId,
                userAgent: req?.headers['user-agent'],
                adresseIP: this.extraireAdresseIP(req),
                expireLe,
            },
        });
    }
    dureeRefreshMs() {
        const valeur = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
        const match = valeur.match(/^(\d+)([dhm])$/);
        if (!match)
            return 7 * 24 * 60 * 60 * 1000;
        const nombre = Number(match[1]);
        const unite = match[2];
        if (unite === 'd')
            return nombre * 24 * 60 * 60 * 1000;
        if (unite === 'h')
            return nombre * 60 * 60 * 1000;
        return nombre * 60 * 1000;
    }
    extraireAdresseIP(req) {
        const forwarded = req?.headers['x-forwarded-for'];
        if (Array.isArray(forwarded))
            return forwarded[0];
        if (typeof forwarded === 'string')
            return forwarded.split(',')[0]?.trim();
        return req?.ip;
    }
    async creerOTP(utilisateurId, telephone, type) {
        await this.prisma.codeOTP.updateMany({
            where: { utilisateurId, type, utilise: false },
            data: { utilise: true },
        });
        const code = (0, crypto_1.randomInt)(100000, 1000000).toString();
        const codeHash = await bcrypt.hash(code, 10);
        const expireLe = new Date(Date.now() + parseInt(this.config.get('DUREE_OTP_MINUTES', '10')) * 60 * 1000);
        const otp = await this.prisma.codeOTP.create({
            data: { utilisateurId, telephone, code: codeHash, type, expireLe },
        });
        return { ...otp, code };
    }
    async verifierCodeOTP(codeRecu, codeStocke) {
        if (codeStocke.startsWith('$2')) {
            return bcrypt.compare(codeRecu, codeStocke);
        }
        return codeRecu === codeStocke;
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