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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtRefreshStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../../prisma/prisma.service");
function secretRefreshJwt(config) {
    const secret = config.get('JWT_REFRESH_SECRET');
    if (!secret && config.get('NODE_ENV') === 'production') {
        throw new Error('JWT_REFRESH_SECRET est obligatoire en production');
    }
    return secret ?? 'dev-refresh-secret-change-me';
}
let JwtRefreshStrategy = class JwtRefreshStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-refresh') {
    prisma;
    constructor(config, prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromBodyField('refreshToken'),
            ignoreExpiration: false,
            secretOrKey: secretRefreshJwt(config),
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        if (!payload?.sub)
            throw new common_1.UnauthorizedException('Refresh token invalide');
        if (!payload.sid)
            throw new common_1.UnauthorizedException('Session invalide');
        const session = await this.prisma.sessionUtilisateur.findFirst({
            where: {
                id: payload.sid,
                utilisateurId: payload.sub,
                actif: true,
                expireLe: { gt: new Date() },
            },
            select: { id: true },
        });
        if (!session)
            throw new common_1.UnauthorizedException('Session expirée ou révoquée');
        return { id: payload.sub, telephone: payload.telephone, role: payload.role, sessionId: payload.sid };
    }
};
exports.JwtRefreshStrategy = JwtRefreshStrategy;
exports.JwtRefreshStrategy = JwtRefreshStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtRefreshStrategy);
//# sourceMappingURL=jwt-refresh.strategy.js.map