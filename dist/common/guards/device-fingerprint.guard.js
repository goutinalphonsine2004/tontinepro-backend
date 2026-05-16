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
var DeviceFingerprintGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceFingerprintGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const sms_service_1 = require("../../modules/notifications/sms.service");
let DeviceFingerprintGuard = DeviceFingerprintGuard_1 = class DeviceFingerprintGuard {
    prisma;
    sms;
    logger = new common_1.Logger(DeviceFingerprintGuard_1.name);
    constructor(prisma, sms) {
        this.prisma = prisma;
        this.sms = sms;
    }
    async canActivate(context) {
        const req = context
            .switchToHttp()
            .getRequest();
        const utilisateur = req.user;
        if (!utilisateur?.id || !utilisateur?.sessionId)
            return true;
        const session = await this.prisma.sessionUtilisateur.findUnique({
            where: { id: utilisateur.sessionId },
            select: {
                id: true,
                adresseIP: true,
                userAgent: true,
                actif: true,
                utilisateur: { select: { telephone: true, nom: true } },
            },
        });
        if (!session || !session.actif) {
            throw new common_1.UnauthorizedException({
                message: 'Session révoquée',
                code: 'SESSION_REVOQUEE',
            });
        }
        const ipActuelle = this.extraireIP(req);
        const uaActuel = req.headers['user-agent'] ?? '';
        const ipSuspecte = session.adresseIP &&
            ipActuelle &&
            !this.memeSubnet(session.adresseIP, ipActuelle);
        const uaSuspect = session.userAgent && uaActuel && session.userAgent !== uaActuel;
        if (ipSuspecte && uaSuspect) {
            this.logger.warn(`[DeviceFingerprint] Changement IP+UA suspect — session: ${session.id} | ` +
                `IP connue: ${session.adresseIP} → actuelle: ${ipActuelle} | ` +
                `UA connu: ${session.userAgent?.slice(0, 50)} → actuel: ${uaActuel.slice(0, 50)}`);
            await this.prisma.sessionUtilisateur.update({
                where: { id: session.id },
                data: { actif: false, revoqueLe: new Date(), refreshTokenHash: null },
            });
            if (session.utilisateur?.telephone) {
                await this.sms
                    .envoyer(session.utilisateur.telephone, `TontineBénin: 🚨 Alerte sécurité — connexion suspecte détectée depuis un nouvel appareil/réseau. ` +
                    `Si ce n'est pas vous, changez votre PIN immédiatement.`)
                    .catch(() => { });
            }
            throw new common_1.UnauthorizedException({
                message: 'Session révoquée pour raison de sécurité. Veuillez vous reconnecter.',
                code: 'SESSION_SUSPECTE',
            });
        }
        return true;
    }
    extraireIP(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (Array.isArray(forwarded))
            return forwarded[0] ?? null;
        if (typeof forwarded === 'string')
            return forwarded.split(',')[0]?.trim() ?? null;
        return req.ip ?? null;
    }
    memeSubnet(ip1, ip2) {
        if (ip1 === ip2)
            return true;
        try {
            const s1 = ip1.split('.').slice(0, 3).join('.');
            const s2 = ip2.split('.').slice(0, 3).join('.');
            return s1 === s2;
        }
        catch {
            return false;
        }
    }
};
exports.DeviceFingerprintGuard = DeviceFingerprintGuard;
exports.DeviceFingerprintGuard = DeviceFingerprintGuard = DeviceFingerprintGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sms_service_1.SmsService])
], DeviceFingerprintGuard);
//# sourceMappingURL=device-fingerprint.guard.js.map