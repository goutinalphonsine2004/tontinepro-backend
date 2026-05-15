"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationsAssisteesModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const notifications_module_1 = require("../notifications/notifications.module");
const operations_assistees_controller_1 = require("./operations-assistees.controller");
const operations_assistees_service_1 = require("./operations-assistees.service");
let OperationsAssisteesModule = class OperationsAssisteesModule {
};
exports.OperationsAssisteesModule = OperationsAssisteesModule;
exports.OperationsAssisteesModule = OperationsAssisteesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, notifications_module_1.NotificationsModule],
        controllers: [operations_assistees_controller_1.OperationsAssisteesController],
        providers: [operations_assistees_service_1.OperationsAssisteesService, kkiapay_service_1.KkiapayService],
        exports: [operations_assistees_service_1.OperationsAssisteesService],
    })
], OperationsAssisteesModule);
//# sourceMappingURL=operations-assistees.module.js.map