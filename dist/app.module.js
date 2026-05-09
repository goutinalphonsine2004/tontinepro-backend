"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const utilisateurs_module_1 = require("./modules/utilisateurs/utilisateurs.module");
const kyc_module_1 = require("./modules/kyc/kyc.module");
const zones_module_1 = require("./modules/zones/zones.module");
const qrcode_module_1 = require("./modules/qrcode/qrcode.module");
const facturation_module_1 = require("./modules/facturation/facturation.module");
const tontines_module_1 = require("./modules/tontines/tontines.module");
const transactions_module_1 = require("./modules/transactions/transactions.module");
const retraits_module_1 = require("./modules/retraits/retraits.module");
const commissions_module_1 = require("./modules/commissions/commissions.module");
const micro_credits_module_1 = require("./modules/micro-credits/micro-credits.module");
const cron_module_1 = require("./modules/cron/cron.module");
const score_module_1 = require("./modules/score/score.module");
const padme_module_1 = require("./modules/padme/padme.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const badges_module_1 = require("./modules/badges/badges.module");
const litiges_module_1 = require("./modules/litiges/litiges.module");
const audit_module_1 = require("./modules/audit/audit.module");
const alertes_module_1 = require("./modules/alertes/alertes.module");
const rapports_module_1 = require("./modules/rapports/rapports.module");
const audit_interceptor_1 = require("./common/interceptors/audit.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            utilisateurs_module_1.UtilisateursModule,
            kyc_module_1.KycModule,
            zones_module_1.ZonesModule,
            qrcode_module_1.QrcodeModule,
            facturation_module_1.FacturationModule,
            tontines_module_1.TontinesModule,
            transactions_module_1.TransactionsModule,
            retraits_module_1.RetraitsModule,
            commissions_module_1.CommissionsModule,
            micro_credits_module_1.MicroCreditsModule,
            cron_module_1.CronModule,
            score_module_1.ScoreModule,
            padme_module_1.PadmeModule,
            analytics_module_1.AnalyticsModule,
            badges_module_1.BadgesModule,
            litiges_module_1.LitigesModule,
            audit_module_1.AuditModule,
            alertes_module_1.AlertesModule,
            rapports_module_1.RapportsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [{ provide: core_1.APP_INTERCEPTOR, useClass: audit_interceptor_1.AuditInterceptor }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map