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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const score_service_1 = require("./score.service");
let ScoreController = class ScoreController {
    service;
    constructor(service) {
        this.service = service;
    }
    monScore(u) {
        return this.service.monScore(u.id);
    }
    evolution(u) {
        return this.service.evolution(u.id);
    }
    conseils(u) {
        return this.service.conseils(u.id);
    }
    projection(u) {
        return this.service.projection(u.id);
    }
};
exports.ScoreController = ScoreController;
__decorate([
    (0, common_1.Get)('mon-score'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScoreController.prototype, "monScore", null);
__decorate([
    (0, common_1.Get)('evolution'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScoreController.prototype, "evolution", null);
__decorate([
    (0, common_1.Get)('conseils'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScoreController.prototype, "conseils", null);
__decorate([
    (0, common_1.Get)('projection'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScoreController.prototype, "projection", null);
exports.ScoreController = ScoreController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('score'),
    __metadata("design:paramtypes", [score_service_1.ScoreService])
], ScoreController);
//# sourceMappingURL=score.controller.js.map