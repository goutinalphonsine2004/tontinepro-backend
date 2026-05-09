"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetraitsModule = void 0;
const common_1 = require("@nestjs/common");
const retraits_controller_1 = require("./retraits.controller");
const retraits_service_1 = require("./retraits.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const sms_service_1 = require("../notifications/sms.service");
let RetraitsModule = class RetraitsModule {
};
exports.RetraitsModule = RetraitsModule;
exports.RetraitsModule = RetraitsModule = __decorate([
    (0, common_1.Module)({
        controllers: [retraits_controller_1.RetraitsController],
        providers: [retraits_service_1.RetraitsService, kkiapay_service_1.KkiapayService, sms_service_1.SmsService],
    })
], RetraitsModule);
//# sourceMappingURL=retraits.module.js.map