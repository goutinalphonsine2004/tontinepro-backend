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
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../../prisma/prisma.service");
const METHODES_AUDITEES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ROUTES_IGNOREES = [
    '/auth/connexion',
    '/auth/rafraichir-token',
    '/auth/verifier-otp',
    '/auth/verifier-otp-reset-pin',
];
let AuditInterceptor = class AuditInterceptor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        if (context.getType() !== 'http')
            return next.handle();
        const request = context.switchToHttp().getRequest();
        const methode = request.method?.toUpperCase() ?? 'UNKNOWN';
        const chemin = request.originalUrl ?? request.url ?? 'UNKNOWN';
        const utilisateurId = request.user?.id;
        if (!utilisateurId ||
            !METHODES_AUDITEES.has(methode) ||
            this.doitIgnorer(chemin)) {
            return next.handle();
        }
        return next.handle().pipe((0, rxjs_1.tap)(() => {
            void this.prisma.journalAudit
                .create({
                data: {
                    utilisateurId,
                    action: `${methode} ${this.normaliserChemin(chemin)}`,
                    details: this.creerDetails(request),
                    adresseIP: this.extraireAdresseIP(request),
                    appareil: this.extraireUserAgent(request),
                },
            })
                .catch(() => undefined);
        }));
    }
    doitIgnorer(chemin) {
        const normalise = this.normaliserChemin(chemin);
        return ROUTES_IGNOREES.some((route) => normalise.startsWith(route));
    }
    normaliserChemin(chemin) {
        return chemin.split('?')[0] || chemin;
    }
    creerDetails(request) {
        return JSON.stringify({
            methode: request.method,
            chemin: this.normaliserChemin(request.originalUrl ?? request.url ?? ''),
            role: request.user?.role,
            sessionId: request.user?.sessionId,
        });
    }
    extraireAdresseIP(request) {
        const forwarded = request.headers['x-forwarded-for'];
        if (Array.isArray(forwarded))
            return forwarded[0];
        if (typeof forwarded === 'string')
            return forwarded.split(',')[0]?.trim();
        return request.ip;
    }
    extraireUserAgent(request) {
        const userAgent = request.headers['user-agent'];
        return Array.isArray(userAgent) ? userAgent[0] : userAgent;
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map