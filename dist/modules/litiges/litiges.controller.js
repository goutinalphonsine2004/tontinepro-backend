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
exports.LitigesController = void 0;
const common_1 = require("@nestjs/common");
const litiges_service_1 = require("./litiges.service");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const client_1 = require("@prisma/client");
const ouvrir_litige_dto_1 = require("./dto/ouvrir-litige.dto");
const resoudre_litige_dto_1 = require("./dto/resoudre-litige.dto");
const rejeter_litige_dto_1 = require("./dto/rejeter-litige.dto");
let LitigesController = class LitigesController {
    service;
    constructor(service) {
        this.service = service;
    }
    ouvrir(u, dto) {
        return this.service.ouvrirLitige(u.id, dto);
    }
    mesList(u) {
        return this.service.mesList(u.id);
    }
    enCours(page, limite) {
        return this.service.listeEnCours(page, limite);
    }
    examiner(id, u) {
        return this.service.examiner(id, u.id);
    }
    resoudre(id, u, dto) {
        return this.service.resoudre(id, u.id, dto);
    }
    rejeter(id, u, dto) {
        return this.service.rejeter(id, u.id, dto);
    }
    ajouterCommentaire(id, u, dto) {
        return this.service.ajouterCommentaire(id, u.id, dto, u.role);
    }
    commentaires(id, u) {
        return this.service.commentaires(id, u.id, u.role);
    }
    detail(id, u) {
        return this.service.detail(id, u.id, u.role);
    }
};
exports.LitigesController = LitigesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ouvrir_litige_dto_1.OuvrirLitigeDto]),
    __metadata("design:returntype", void 0)
], LitigesController.prototype, "ouvrir", null);
__decorate([
    (0, common_1.Get)('mes-litiges'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LitigesController.prototype, "mesList", null);
__decorate([
    (0, common_1.Get)('en-cours/liste'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERVISEUR),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limite', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], LitigesController.prototype, "enCours", null);
__decorate([
    (0, common_1.Put)(':id/examiner'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERVISEUR),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LitigesController.prototype, "examiner", null);
__decorate([
    (0, common_1.Put)(':id/resoudre'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, resoudre_litige_dto_1.ResoudreLitigeDto]),
    __metadata("design:returntype", void 0)
], LitigesController.prototype, "resoudre", null);
__decorate([
    (0, common_1.Put)(':id/rejeter'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, rejeter_litige_dto_1.RejeterLitigeDto]),
    __metadata("design:returntype", void 0)
], LitigesController.prototype, "rejeter", null);
__decorate([
    (0, common_1.Post)(':id/commentaire'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LitigesController.prototype, "ajouterCommentaire", null);
__decorate([
    (0, common_1.Get)(':id/commentaires'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LitigesController.prototype, "commentaires", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LitigesController.prototype, "detail", null);
exports.LitigesController = LitigesController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('litiges'),
    __metadata("design:paramtypes", [litiges_service_1.LitigesService])
], LitigesController);
//# sourceMappingURL=litiges.controller.js.map