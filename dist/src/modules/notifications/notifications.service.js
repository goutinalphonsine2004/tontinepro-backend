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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const sms_service_1 = require("./sms.service");
const push_service_1 = require("./push.service");
const whatsapp_service_1 = require("./whatsapp.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    sms;
    push;
    whatsapp;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma, sms, push, whatsapp) {
        this.prisma = prisma;
        this.sms = sms;
        this.push = push;
        this.whatsapp = whatsapp;
    }
    async envoyerAUtilisateur(utilisateurId, titre, message, types = 'TOUS') {
        const rows = await this.prisma.$queryRaw `
      SELECT telephone, "tokenPush", nom FROM "Utilisateur" WHERE id = ${utilisateurId} LIMIT 1`;
        const user = rows[0] ?? null;
        if (!user)
            return;
        const resultats = {};
        if ((types === 'TOUS' || types === 'SMS') && user.telephone) {
            resultats.sms = await this.sms.envoyer(user.telephone, message);
        }
        if ((types === 'TOUS' || types === 'PUSH') && user.tokenPush) {
            resultats.push = await this.push.envoyerNotification(user.tokenPush, titre, message);
        }
        if (types === 'WHATSAPP' && user.telephone) {
            resultats.whatsapp = await this.whatsapp.envoyerMessage(user.telephone, message);
        }
        return resultats;
    }
    async envoyerSmsGroupe(telephones, message) {
        const resultats = await Promise.allSettled(telephones.map((tel) => this.sms.envoyer(tel, message)));
        const succes = resultats.filter((r) => r.status === 'fulfilled').length;
        this.logger.log(`[Notif groupe] ${succes}/${telephones.length} SMS envoyés`);
        return { succes, total: telephones.length };
    }
    async enregistrerTokenPush(utilisateurId, token) {
        await this.prisma.$executeRaw `UPDATE "Utilisateur" SET "tokenPush" = ${token} WHERE id = ${utilisateurId}`;
        return { succes: true, message: 'Token push enregistré' };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sms_service_1.SmsService,
        push_service_1.PushService,
        whatsapp_service_1.WhatsappService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map