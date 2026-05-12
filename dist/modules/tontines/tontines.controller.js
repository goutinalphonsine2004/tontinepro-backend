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
exports.TontinesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const tontines_service_1 = require("./tontines.service");
const creer_tontine_dto_1 = require("./dto/creer-tontine.dto");
const modifier_tontine_dto_1 = require("./dto/modifier-tontine.dto");
const rejoindre_tontine_dto_1 = require("./dto/rejoindre-tontine.dto");
const ordre_tirage_dto_1 = require("./dto/ordre-tirage.dto");
let TontinesController = class TontinesController {
    service;
    constructor(service) {
        this.service = service;
    }
    creer(u, dto) {
        return this.service.creer(u.id, dto);
    }
    mesTontines(u) {
        return this.service.mesTontines(u.id);
    }
    getTontine(id, u) {
        return this.service.getTontine(id, u.id);
    }
    modifier(id, u, dto) {
        return this.service.modifier(id, u.id, dto);
    }
    activer(id, u) {
        return this.service.activerTontine(id, u.id);
    }
    suspendre(id, u) {
        return this.service.suspendre(id, u.id);
    }
    reactiver(id, u) {
        return this.service.reactiver(id, u.id);
    }
    terminer(id, u) {
        return this.service.terminerTontine(id, u.id);
    }
    rejoindre(id, u, dto) {
        return this.service.rejoindre(id, u.id, dto);
    }
    detailsCode(code) {
        return this.service.getDetailsParCode(code);
    }
    rejoindreCode(code, u, dto) {
        return this.service.rejoindreParCode(code, u.id, dto);
    }
    quitter(id, u) {
        return this.service.quitter(id, u.id);
    }
    membres(id) {
        return this.service.membres(id);
    }
    invitation(id, u) {
        return this.service.invitation(id, u.id);
    }
    ordreTirage(id) {
        return this.service.ordreTirage(id);
    }
    definirOrdreTirage(id, u, dto) {
        return this.service.definirOrdreTirage(id, u.id, dto.utilisateurIds);
    }
    randomiserOrdreTirage(id, u) {
        return this.service.randomiserOrdreTirage(id, u.id);
    }
    distribuer(id, u) {
        return this.service.distribuer(id, u.id);
    }
};
exports.TontinesController = TontinesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, creer_tontine_dto_1.CreerTontineDto]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "creer", null);
__decorate([
    (0, common_1.Get)('mes-tontines'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "mesTontines", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "getTontine", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, modifier_tontine_dto_1.ModifierTontineDto]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "modifier", null);
__decorate([
    (0, common_1.Post)(':id/activer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "activer", null);
__decorate([
    (0, common_1.Post)(':id/suspendre'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "suspendre", null);
__decorate([
    (0, common_1.Post)(':id/reactiver'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "reactiver", null);
__decorate([
    (0, common_1.Post)(':id/terminer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "terminer", null);
__decorate([
    (0, common_1.Post)(':id/rejoindre'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, rejoindre_tontine_dto_1.RejoindreTonitneDto]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "rejoindre", null);
__decorate([
    (0, common_1.Get)('details-code/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "detailsCode", null);
__decorate([
    (0, common_1.Post)('rejoindre-code/:code'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, rejoindre_tontine_dto_1.RejoindreTonitneDto]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "rejoindreCode", null);
__decorate([
    (0, common_1.Post)(':id/quitter'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "quitter", null);
__decorate([
    (0, common_1.Get)(':id/membres'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "membres", null);
__decorate([
    (0, common_1.Get)(':id/invitation'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "invitation", null);
__decorate([
    (0, common_1.Get)(':id/ordre-tirage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "ordreTirage", null);
__decorate([
    (0, common_1.Post)(':id/ordre-tirage/manuel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, ordre_tirage_dto_1.OrdreTirageDto]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "definirOrdreTirage", null);
__decorate([
    (0, common_1.Post)(':id/ordre-tirage/aleatoire'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "randomiserOrdreTirage", null);
__decorate([
    (0, common_1.Post)(':id/distribuer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TontinesController.prototype, "distribuer", null);
exports.TontinesController = TontinesController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('tontines'),
    __metadata("design:paramtypes", [tontines_service_1.TontinesService])
], TontinesController);
//# sourceMappingURL=tontines.controller.js.map