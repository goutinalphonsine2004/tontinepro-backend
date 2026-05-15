"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroCreditsModule = void 0;
const common_1 = require("@nestjs/common");
const micro_credits_controller_1 = require("./micro-credits.controller");
const micro_credits_service_1 = require("./micro-credits.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const notifications_module_1 = require("../notifications/notifications.module");
const prisma_module_1 = require("../../prisma/prisma.module");
let MicroCreditsModule = class MicroCreditsModule {
};
exports.MicroCreditsModule = MicroCreditsModule;
exports.MicroCreditsModule = MicroCreditsModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule, prisma_module_1.PrismaModule],
        controllers: [micro_credits_controller_1.MicroCreditsController],
        providers: [micro_credits_service_1.MicroCreditsService, kkiapay_service_1.KkiapayService],
        exports: [micro_credits_service_1.MicroCreditsService],
    })
], MicroCreditsModule);
//# sourceMappingURL=micro-credits.module.js.map