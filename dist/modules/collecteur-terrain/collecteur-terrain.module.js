"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollecteurTerrainModule = void 0;
const common_1 = require("@nestjs/common");
const collecteur_terrain_service_1 = require("./collecteur-terrain.service");
const collecteur_terrain_controller_1 = require("./collecteur-terrain.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
const notifications_module_1 = require("../notifications/notifications.module");
let CollecteurTerrainModule = class CollecteurTerrainModule {
};
exports.CollecteurTerrainModule = CollecteurTerrainModule;
exports.CollecteurTerrainModule = CollecteurTerrainModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, notifications_module_1.NotificationsModule],
        controllers: [collecteur_terrain_controller_1.CollecteurTerrainController],
        providers: [collecteur_terrain_service_1.CollecteurTerrainService],
        exports: [collecteur_terrain_service_1.CollecteurTerrainService],
    })
], CollecteurTerrainModule);
//# sourceMappingURL=collecteur-terrain.module.js.map