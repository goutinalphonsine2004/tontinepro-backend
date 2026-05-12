"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const prisma_module_1 = require("../../prisma/prisma.module");
const retraits_module_1 = require("../retraits/retraits.module");
const tontines_module_1 = require("../tontines/tontines.module");
const sms_service_1 = require("./sms.service");
const push_service_1 = require("./push.service");
const whatsapp_service_1 = require("./whatsapp.service");
const notifications_service_1 = require("./notifications.service");
const notifications_controller_1 = require("./notifications.controller");
const sms_webhook_controller_1 = require("./sms-webhook.controller");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            prisma_module_1.PrismaModule,
            (0, common_1.forwardRef)(() => retraits_module_1.RetraitsModule),
            (0, common_1.forwardRef)(() => tontines_module_1.TontinesModule),
        ],
        controllers: [notifications_controller_1.NotificationsController, sms_webhook_controller_1.SmsWebhookController],
        providers: [sms_service_1.SmsService, push_service_1.PushService, whatsapp_service_1.WhatsappService, notifications_service_1.NotificationsService],
        exports: [sms_service_1.SmsService, push_service_1.PushService, whatsapp_service_1.WhatsappService, notifications_service_1.NotificationsService],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map