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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("./notifications.service");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const enregistrer_token_dto_1 = require("./dto/enregistrer-token.dto");
const filtrer_notifications_dto_1 = require("./dto/filtrer-notifications.dto");
const modifier_preferences_notification_dto_1 = require("./dto/modifier-preferences-notification.dto");
let NotificationsController = class NotificationsController {
    service;
    constructor(service) {
        this.service = service;
    }
    lister(u, dto) {
        return this.service.lister(u.id, dto);
    }
    nonLues(u) {
        return this.service.compterNonLues(u.id);
    }
    preferences(u) {
        return this.service.getPreferences(u.id);
    }
    modifierPreferences(u, dto) {
        return this.service.modifierPreferences(u.id, dto);
    }
    toutMarquerLu(u) {
        return this.service.toutMarquerLu(u.id);
    }
    marquerLu(u, id) {
        return this.service.marquerLu(u.id, id);
    }
    enregistrerToken(u, dto) {
        return this.service.enregistrerTokenPush(u.id, dto.tokenPush);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, filtrer_notifications_dto_1.FiltrerNotificationsDto]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "lister", null);
__decorate([
    (0, common_1.Get)('non-lues'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "nonLues", null);
__decorate([
    (0, common_1.Get)('preferences'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "preferences", null);
__decorate([
    (0, common_1.Put)('preferences'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, modifier_preferences_notification_dto_1.ModifierPreferencesNotificationDto]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "modifierPreferences", null);
__decorate([
    (0, common_1.Put)('tout-lu'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "toutMarquerLu", null);
__decorate([
    (0, common_1.Put)(':id/lu'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "marquerLu", null);
__decorate([
    (0, common_1.Post)('token-push'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, enregistrer_token_dto_1.EnregistrerTokenDto]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "enregistrerToken", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map