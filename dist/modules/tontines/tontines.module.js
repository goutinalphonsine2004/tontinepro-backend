"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TontinesModule = void 0;
const common_1 = require("@nestjs/common");
const tontines_controller_1 = require("./tontines.controller");
const tontines_service_1 = require("./tontines.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
let TontinesModule = class TontinesModule {
};
exports.TontinesModule = TontinesModule;
exports.TontinesModule = TontinesModule = __decorate([
    (0, common_1.Module)({
        controllers: [tontines_controller_1.TontinesController],
        providers: [tontines_service_1.TontinesService, kkiapay_service_1.KkiapayService],
    })
], TontinesModule);
//# sourceMappingURL=tontines.module.js.map