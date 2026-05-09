"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParametresModule = void 0;
const common_1 = require("@nestjs/common");
const parametres_service_1 = require("./parametres.service");
const parametres_controller_1 = require("./parametres.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
let ParametresModule = class ParametresModule {
};
exports.ParametresModule = ParametresModule;
exports.ParametresModule = ParametresModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [parametres_controller_1.ParametresController],
        providers: [parametres_service_1.ParametresService],
        exports: [parametres_service_1.ParametresService],
    })
], ParametresModule);
//# sourceMappingURL=parametres.module.js.map