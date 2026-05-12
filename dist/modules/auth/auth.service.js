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
var AuthService_1;
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
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    config;
    sms;
    logger = new common_1.Logger(AuthService_1.name);
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
            data: {
                telephone: dto.telephone,
                nom: dto.nom,
                role,
                statut: client_1.StatutCompte.EN_ATTENTE,
            },
        });
        const { id: otpId, code } = await this.creerOTP(utilisateur.id, dto.telephone, OTP_TYPE_INSCRIPTION);
        await this.sms.envoyer(dto.telephone, `TontineBénin: Votre code de vérification est ${code}. Valable ${this.config.get('DUREE_OTP_MINUTES', 10)} min.`);
        const donnees = {
            otpId,
            telephone: dto.telephone,
        };
        if (this.config.get('NODE_ENV') === 'development') {
            donnees.otpTest = code;
            donnees.messageTest =
                '⚠️ Mode test - En production ce code ne sera pas visible';
        }
        return { succes: true, message: 'Code OTP envoyé par SMS', donnees };
    }
    async verifierOtp(dto) {
        const MAX_TENTATIVES_OTP = 3;
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
        if (!otp) {
            throw new common_1.BadRequestException({
                message: 'Code OTP invalide ou expiré',
                code: 'OTP_INVALIDE',
            });
        }
        if (otp.tentatives >= MAX_TENTATIVES_OTP) {
            await this.prisma.codeOTP.update({
                where: { id: otp.id },
                data: { utilise: true },
            });
            throw new common_1.BadRequestException({
                message: 'Code OTP invalide après 3 tentatives. Demandez un nouveau code.',
                code: 'OTP_TROP_DE_TENTATIVES',
            });
        }
        if (!(await this.verifierCodeOTP(dto.code, otp.code))) {
            const tentatives = otp.tentatives + 1;
            const restantes = MAX_TENTATIVES_OTP - tentatives;
            if (restantes <= 0) {
                await this.prisma.codeOTP.update({
                    where: { id: otp.id },
                    data: { utilise: true, tentatives },
                });
                throw new common_1.BadRequestException({
                    message: 'Code OTP invalide. Code bloqué après 3 tentatives. Demandez un nouveau code.',
                    code: 'OTP_TROP_DE_TENTATIVES',
                });
            }
            await this.prisma.codeOTP.update({
                where: { id: otp.id },
                data: { tentatives },
            });
            throw new common_1.BadRequestException({
                message: `Code OTP incorrect. ${restantes} tentative(s) restante(s).`,
                code: 'OTP_INVALIDE',
                donnees: { restantes },
            });
        }
        await this.prisma.codeOTP.update({
            where: { id: otp.id },
            data: { utilise: true },
        });
        const tokenTemporaire = this.jwt.sign({
            sub: otp.utilisateurId,
            telephone: dto.telephone,
            role: otp.utilisateur.role,
            scope: 'ONBOARDING',
        }, { expiresIn: '1h' });
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
        try {
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
                throw new common_1.BadRequestException({
                    message: 'PIN non défini',
                    code: 'PIN_NON_DEFINI',
                });
            }
            const pinValide = await bcrypt.compare(dto.pin, utilisateur.pinHash);
            if (!pinValide) {
                const tentatives = utilisateur.tentativesEchouees + 1;
                const data = {
                    tentativesEchouees: tentatives,
                };
                if (tentatives >= maxTentatives) {
                    data.bloqueLe = new Date(Date.now() + 30 * 60 * 1000);
                }
                await this.prisma.utilisateur.update({
                    where: { id: utilisateur.id },
                    data,
                });
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
                data: {
                    tentativesEchouees: 0,
                    bloqueLe: null,
                    deviceId: dto.deviceId ?? utilisateur.deviceId,
                },
            });
            this.logger.log(`[AUTH] Connexion utilisateur ${utilisateur.nom} (+${utilisateur.telephone})`);
            const session = await this.creerSession(utilisateur.id, dto.deviceId, req);
            const tokens = await this.genererTokens(utilisateur.id, utilisateur.telephone, utilisateur.role, session.id);
            return {
                succes: true,
                message: 'Connexion réussie.',
                donnees: {
                    ...tokens,
                    sessionId: session.id,
                    role: utilisateur.role,
                    nom: utilisateur.nom,
                },
            };
        }
        catch (error) {
            this.logger.error(`Erreur connexion: ${error.message}`, error.stack);
            throw error;
        }
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
        const donnees = {
            otpId,
            telephone: dto.telephone,
        };
        if (this.config.get('NODE_ENV') === 'development') {
            donnees.otpTest = code;
            donnees.messageTest =
                'Mode test - En production ce code ne sera pas visible';
        }
        return {
            succes: true,
            message: 'Code de réinitialisation envoyé par SMS.',
            donnees,
        };
    }
    async verifierOtpResetPin(dto) {
        const MAX_TENTATIVES_OTP = 3;
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
        if (!otp) {
            throw new common_1.BadRequestException({
                message: 'Code OTP invalide ou expiré',
                code: 'OTP_RESET_INVALIDE',
            });
        }
        if (otp.tentatives >= MAX_TENTATIVES_OTP) {
            await this.prisma.codeOTP.update({
                where: { id: otp.id },
                data: { utilise: true },
            });
            throw new common_1.BadRequestException({
                message: 'Code OTP invalide après 3 tentatives. Demandez un nouveau code de réinitialisation.',
                code: 'OTP_TROP_DE_TENTATIVES',
            });
        }
        if (!(await this.verifierCodeOTP(dto.code, otp.code))) {
            const tentatives = otp.tentatives + 1;
            const restantes = MAX_TENTATIVES_OTP - tentatives;
            if (restantes <= 0) {
                await this.prisma.codeOTP.update({
                    where: { id: otp.id },
                    data: { utilise: true, tentatives },
                });
                throw new common_1.BadRequestException({
                    message: 'Code OTP bloqué après 3 tentatives. Demandez un nouveau code de réinitialisation.',
                    code: 'OTP_TROP_DE_TENTATIVES',
                });
            }
            await this.prisma.codeOTP.update({
                where: { id: otp.id },
                data: { tentatives },
            });
            throw new common_1.BadRequestException({
                message: `Code OTP incorrect. ${restantes} tentative(s) restante(s).`,
                code: 'OTP_RESET_INVALIDE',
                donnees: { restantes },
            });
        }
        if (otp.utilisateur.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.ForbiddenException({
                message: 'Ce compte ne peut pas réinitialiser son PIN',
                code: 'COMPTE_INACTIF',
            });
        }
        await this.prisma.codeOTP.update({
            where: { id: otp.id },
            data: { utilise: true },
        });
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
        return {
            succes: true,
            message: 'PIN réinitialisé avec succès. Veuillez vous reconnecter.',
        };
    }
    async rafraichirToken(utilisateurId, telephone, role, sessionId, refreshTokenRecu) {
        const [utilisateur, session] = await Promise.all([
            this.prisma.utilisateur.findUnique({
                where: { id: utilisateurId },
                select: { statut: true },
            }),
            this.prisma.sessionUtilisateur.findUnique({ where: { id: sessionId } }),
        ]);
        if (!utilisateur || utilisateur.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.UnauthorizedException('Session invalide');
        }
        if (!session || !session.actif) {
            throw new common_1.UnauthorizedException('Session expirée ou révoquée');
        }
        if (session.refreshTokenHash && refreshTokenRecu) {
            const tokenValide = await bcrypt.compare(refreshTokenRecu, session.refreshTokenHash);
            if (!tokenValide) {
                await this.prisma.sessionUtilisateur.updateMany({
                    where: { utilisateurId, actif: true },
                    data: { actif: false, revoqueLe: new Date(), refreshTokenHash: null },
                });
                throw new common_1.UnauthorizedException({
                    message: 'Token de rafraîchissement invalide. Toutes vos sessions ont été révoquées.',
                    code: 'TOKEN_REJEU_DETECTE',
                });
            }
        }
        await this.prisma.sessionUtilisateur.update({
            where: { id: sessionId },
            data: { derniereUtilisation: new Date() },
        });
        const tokens = await this.genererTokens(utilisateurId, telephone, role, sessionId);
        return {
            succes: true,
            message: 'Token rafraîchi.',
            donnees: { ...tokens, sessionId },
        };
    }
    async deconnexion(utilisateurId, sessionId) {
        if (sessionId) {
            await this.prisma.sessionUtilisateur.updateMany({
                where: { id: sessionId, utilisateurId },
                data: { actif: false, revoqueLe: new Date(), refreshTokenHash: null },
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
        await this.prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: { deviceId: null },
        });
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
        const refreshTokenHash = await bcrypt.hash(refreshToken, 8);
        await this.prisma.sessionUtilisateur.update({
            where: { id: sessionId },
            data: { refreshTokenHash },
        });
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
        const expireLe = new Date(Date.now() +
            parseInt(this.config.get('DUREE_OTP_MINUTES', '10')) * 60 * 1000);
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
    async enregistrerAppareilBiometrique(utilisateurId, dto) {
        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
            select: { id: true, nom: true, statut: true },
        });
        if (!utilisateur)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (utilisateur.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.ForbiddenException({
                message: 'Compte non actif',
                code: 'COMPTE_INACTIF',
            });
        }
        const empreinteHash = await bcrypt.hash(dto.empreinteToken, 10);
        const appareil = await this.prisma.appareilBiometrique.upsert({
            where: {
                utilisateurId_deviceId: { utilisateurId, deviceId: dto.deviceId },
            },
            create: {
                utilisateurId,
                deviceId: dto.deviceId,
                empreinteHash,
                nomAppareil: dto.nomAppareil,
                modeleAppareil: dto.modeleAppareil,
                systemeExploitation: dto.systemeExploitation,
                actif: true,
            },
            update: {
                empreinteHash,
                nomAppareil: dto.nomAppareil,
                modeleAppareil: dto.modeleAppareil,
                actif: true,
            },
        });
        await this.prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: { empreinteActive: true },
        });
        return {
            succes: true,
            message: 'Appareil biométrique enregistré. Connexion par empreinte activée.',
            donnees: {
                appareilId: appareil.id,
                deviceId: appareil.deviceId,
                nomAppareil: appareil.nomAppareil,
            },
        };
    }
    async connexionBiometrique(dto, req) {
        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { telephone: dto.telephone },
            select: {
                id: true,
                telephone: true,
                nom: true,
                role: true,
                statut: true,
                empreinteActive: true,
            },
        });
        if (!utilisateur)
            throw new common_1.UnauthorizedException({
                message: 'Identifiants invalides',
                code: 'UTILISATEUR_INTROUVABLE',
            });
        if (utilisateur.statut === client_1.StatutCompte.BANNI)
            throw new common_1.ForbiddenException({
                message: 'Compte banni',
                code: 'COMPTE_BANNI',
            });
        if (!utilisateur.empreinteActive)
            throw new common_1.ForbiddenException({
                message: 'Biométrie non activée',
                code: 'BIOMETRIE_INACTIVE',
            });
        const appareil = await this.prisma.appareilBiometrique.findUnique({
            where: {
                utilisateurId_deviceId: {
                    utilisateurId: utilisateur.id,
                    deviceId: dto.deviceId,
                },
            },
        });
        if (!appareil || !appareil.actif)
            throw new common_1.UnauthorizedException({
                message: 'Appareil non reconnu',
                code: 'APPAREIL_INCONNU',
            });
        const valide = await bcrypt.compare(dto.empreinteToken, appareil.empreinteHash);
        if (!valide)
            throw new common_1.UnauthorizedException({
                message: 'Empreinte invalide',
                code: 'EMPREINTE_INVALIDE',
            });
        await this.prisma.appareilBiometrique.update({
            where: { id: appareil.id },
            data: { derniereAuthentification: new Date() },
        });
        const expireLe = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const session = await this.prisma.sessionUtilisateur.create({
            data: {
                utilisateurId: utilisateur.id,
                deviceId: dto.deviceId,
                adresseIP: req.ip,
                expireLe,
                actif: true,
            },
        });
        const payload = {
            sub: utilisateur.id,
            telephone: utilisateur.telephone,
            role: utilisateur.role,
            sessionId: session.id,
        };
        const accessToken = this.jwt.sign(payload, { expiresIn: '24h' });
        return {
            succes: true,
            message: `Connexion biométrique réussie. Bienvenue ${utilisateur.nom}.`,
            donnees: {
                accessToken,
                utilisateur: {
                    id: utilisateur.id,
                    nom: utilisateur.nom,
                    role: utilisateur.role,
                },
            },
        };
    }
    async mesAppareils(utilisateurId) {
        const appareils = await this.prisma.appareilBiometrique.findMany({
            where: { utilisateurId, actif: true },
            select: {
                id: true,
                deviceId: true,
                nomAppareil: true,
                modeleAppareil: true,
                systemeExploitation: true,
                derniereAuthentification: true,
                creeLe: true,
            },
        });
        return {
            succes: true,
            message: `${appareils.length} appareil(s).`,
            donnees: appareils,
        };
    }
    async revoquerAppareil(utilisateurId, appareilId) {
        const appareil = await this.prisma.appareilBiometrique.findUnique({
            where: { id: appareilId },
        });
        if (!appareil || appareil.utilisateurId !== utilisateurId)
            throw new common_1.NotFoundException('Appareil introuvable');
        await this.prisma.appareilBiometrique.update({
            where: { id: appareilId },
            data: { actif: false },
        });
        const restants = await this.prisma.appareilBiometrique.count({
            where: { utilisateurId, actif: true },
        });
        if (restants === 0)
            await this.prisma.utilisateur.update({
                where: { id: utilisateurId },
                data: { empreinteActive: false },
            });
        return { succes: true, message: 'Appareil révoqué.' };
    }
    async connexionsSuspectes(page = 1, limite = 50) {
        const skip = (page - 1) * limite;
        const dernierJour = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const derniereMois = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sessionsRecentes = await this.prisma.sessionUtilisateur.findMany({
            where: { creeLe: { gte: derniereMois } },
            select: {
                id: true,
                utilisateurId: true,
                adresseIP: true,
                deviceId: true,
                creeLe: true,
                actif: true,
                utilisateur: {
                    select: { id: true, nom: true, telephone: true, role: true },
                },
            },
            orderBy: { creeLe: 'desc' },
        });
        const parUtilisateur = new Map();
        for (const s of sessionsRecentes) {
            const existantes = parUtilisateur.get(s.utilisateurId) ?? [];
            existantes.push(s);
            parUtilisateur.set(s.utilisateurId, existantes);
        }
        const alertes = [];
        for (const [uid, sessions] of parUtilisateur.entries()) {
            const ips = [
                ...new Set(sessions.map((s) => s.adresseIP).filter(Boolean)),
            ];
            const sessionsRecentes24h = sessions.filter((s) => s.creeLe >= dernierJour);
            const ipsRecentes = [
                ...new Set(sessionsRecentes24h.map((s) => s.adresseIP).filter(Boolean)),
            ];
            if (ipsRecentes.length >= 3 || ips.length >= 5) {
                const derniereSession = sessions[0];
                alertes.push({
                    utilisateur: derniereSession.utilisateur,
                    nbrIPs: ips.length,
                    ips: ips.slice(0, 5),
                    derniereSession: derniereSession.creeLe,
                    derniereIP: derniereSession.adresseIP ?? 'inconnue',
                    suspicion: ipsRecentes.length >= 3
                        ? `${ipsRecentes.length} IPs différentes en 24h`
                        : `${ips.length} IPs différentes en 30 jours`,
                });
            }
        }
        const total = alertes.length;
        const paginees = alertes.slice(skip, skip + limite);
        return {
            succes: true,
            message: `${total} compte(s) avec activité suspecte.`,
            donnees: {
                alertes: paginees,
                total,
                page,
                pages: Math.ceil(total / limite),
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        sms_service_1.SmsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map