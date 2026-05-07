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
        ],
        controllers: [app_controller_1.AppController],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map