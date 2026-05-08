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
const client_1 = require("@prisma/client");
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
    async envoyerAUtilisateur(utilisateurId, titre, message, types = 'TOUS', typeNotification = client_1.TypeNotification.PAIEMENT_RECU) {
        const rows = await this.prisma.$queryRaw `
      SELECT telephone, "tokenPush", nom FROM "Utilisateur" WHERE id = ${utilisateurId} LIMIT 1`;
        const user = rows[0] ?? null;
        if (!user)
            return;
        const preferences = await this.getPreferencesBrutes(utilisateurId);
        const resultats = {};
        if ((types === 'TOUS' || types === 'SMS') && preferences.smsActif && user.telephone) {
            resultats.sms = await this.sms.envoyer(user.telephone, message);
            await this.creerNotification(utilisateurId, typeNotification, titre, message, client_1.Canal.SMS);
        }
        if ((types === 'TOUS' || types === 'PUSH') && preferences.pushActif && user.tokenPush) {
            resultats.push = await this.push.envoyerNotification(user.tokenPush, titre, message);
            await this.creerNotification(utilisateurId, typeNotification, titre, message, client_1.Canal.PUSH);
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
    async lister(utilisateurId, dto) {
        const page = dto.page ?? 1;
        const limite = dto.limite ?? 20;
        const skip = (page - 1) * limite;
        const where = { utilisateurId, ...(dto.lu !== undefined && { lu: dto.lu }) };
        const [total, notifications] = await Promise.all([
            this.prisma.notification.count({ where }),
            this.prisma.notification.findMany({
                where,
                skip,
                take: limite,
                orderBy: { creeLe: 'desc' },
            }),
        ]);
        return {
            succes: true,
            message: `${total} notification(s).`,
            donnees: { notifications, total, page, limite, pages: Math.ceil(total / limite) },
        };
    }
    async compterNonLues(utilisateurId) {
        const total = await this.prisma.notification.count({ where: { utilisateurId, lu: false } });
        return { succes: true, message: `${total} notification(s) non lue(s).`, donnees: { total } };
    }
    async marquerLu(utilisateurId, notificationId) {
        const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
        if (!notification)
            throw new common_1.NotFoundException('Notification introuvable');
        if (notification.utilisateurId !== utilisateurId) {
            throw new common_1.ForbiddenException('Accès interdit à cette notification');
        }
        const maj = await this.prisma.notification.update({
            where: { id: notificationId },
            data: { lu: true },
        });
        return { succes: true, message: 'Notification marquée comme lue.', donnees: maj };
    }
    async toutMarquerLu(utilisateurId) {
        const result = await this.prisma.notification.updateMany({
            where: { utilisateurId, lu: false },
            data: { lu: true },
        });
        return { succes: true, message: `${result.count} notification(s) marquée(s) comme lue(s).` };
    }
    async getPreferences(utilisateurId) {
        const preferences = await this.getPreferencesBrutes(utilisateurId);
        return { succes: true, message: 'Préférences notifications récupérées.', donnees: preferences };
    }
    async modifierPreferences(utilisateurId, dto) {
        const preferences = await this.prisma.preferenceNotification.upsert({
            where: { utilisateurId },
            create: {
                utilisateurId,
                smsActif: dto.smsActif ?? true,
                pushActif: dto.pushActif ?? true,
            },
            update: {
                ...(dto.smsActif !== undefined && { smsActif: dto.smsActif }),
                ...(dto.pushActif !== undefined && { pushActif: dto.pushActif }),
            },
        });
        return { succes: true, message: 'Préférences notifications mises à jour.', donnees: preferences };
    }
    async getPreferencesBrutes(utilisateurId) {
        return this.prisma.preferenceNotification.upsert({
            where: { utilisateurId },
            create: { utilisateurId },
            update: {},
        });
    }
    async creerNotification(utilisateurId, type, titre, message, canal) {
        return this.prisma.notification.create({
            data: { utilisateurId, type, titre, message, canal },
        });
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