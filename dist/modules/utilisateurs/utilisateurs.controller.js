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
exports.UtilisateursController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const utilisateurs_service_1 = require("./utilisateurs.service");
const modifier_profil_dto_1 = require("./dto/modifier-profil.dto");
const changer_pin_dto_1 = require("./dto/changer-pin.dto");
const filtrer_utilisateurs_dto_1 = require("./dto/filtrer-utilisateurs.dto");
const changer_statut_dto_1 = require("./dto/changer-statut.dto");
const changer_role_dto_1 = require("./dto/changer-role.dto");
const configurer_empreinte_dto_1 = require("./dto/configurer-empreinte.dto");
let UtilisateursController = class UtilisateursController {
    service;
    constructor(service) {
        this.service = service;
    }
    monDashboard(u) {
        return this.service.monDashboard(u.id);
    }
    getProfil(u) {
        return this.service.getProfil(u.id);
    }
    modifierProfil(u, dto) {
        return this.service.modifierProfil(u.id, dto);
    }
    changerPin(u, dto) {
        return this.service.changerPin(u.id, dto);
    }
    configurerEmpreinte(u, dto) {
        return this.service.configurerEmpreinte(u.id, dto);
    }
    supprimerMonCompte(u, body) {
        return this.service.supprimerMonCompte(u.id, body.pin);
    }
    lister(dto) {
        return this.service.listerUtilisateurs(dto);
    }
    reassignerClient(id, body, u) {
        return this.service.reassignerClient(id, body.nouveauCollecteurId, u.id);
    }
    changerStatut(u, id, dto) {
        return this.service.changerStatut(u.id, id, dto);
    }
    changerRole(u, id, dto) {
        return this.service.changerRole(u.id, id, dto);
    }
    assignerSuperviseur(u, id, body) {
        return this.service.assignerSuperviseur(u.id, id, body.superviseurId);
    }
    supprimer(u, id) {
        return this.service.supprimerUtilisateur(u.id, id);
    }
};
exports.UtilisateursController = UtilisateursController;
__decorate([
    (0, common_1.Get)('mon-dashboard'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "monDashboard", null);
__decorate([
    (0, common_1.Get)('profil'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "getProfil", null);
__decorate([
    (0, common_1.Put)('profil'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, modifier_profil_dto_1.ModifierProfilDto]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "modifierProfil", null);
__decorate([
    (0, common_1.Put)('pin'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, changer_pin_dto_1.ChangerPinDto]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "changerPin", null);
__decorate([
    (0, common_1.Put)('empreinte'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, configurer_empreinte_dto_1.ConfigurerEmpreinteDto]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "configurerEmpreinte", null);
__decorate([
    (0, common_1.Delete)('mon-compte'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "supprimerMonCompte", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filtrer_utilisateurs_dto_1.FiltrerUtilisateursDto]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "lister", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERVISEUR),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Put)(':id/reassigner'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "reassignerClient", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Put)(':id/statut'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, changer_statut_dto_1.ChangerStatutDto]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "changerStatut", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Put)(':id/role'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, changer_role_dto_1.ChangerRoleDto]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "changerRole", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Put)(':id/superviseur'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "assignerSuperviseur", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "supprimer", null);
exports.UtilisateursController = UtilisateursController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('utilisateurs'),
    __metadata("design:paramtypes", [utilisateurs_service_1.UtilisateursService])
], UtilisateursController);
//# sourceMappingURL=utilisateurs.controller.js.map