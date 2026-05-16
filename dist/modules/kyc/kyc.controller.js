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
exports.KycController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const utilisateur_courant_decorator_1 = require("../../common/decorators/utilisateur-courant.decorator");
const kyc_service_1 = require("./kyc.service");
const soumettre_kyc_dto_1 = require("./dto/soumettre-kyc.dto");
const rejeter_kyc_dto_1 = require("./dto/rejeter-kyc.dto");
const TAILLE_MAX = 5 * 1024 * 1024;
const MIME_AUTORISES = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
];
let KycController = class KycController {
    service;
    constructor(service) {
        this.service = service;
    }
    async uploadDocument(u, fichier, typeDocument) {
        if (!fichier) {
            throw new common_1.BadRequestException({
                message: 'Aucun fichier reçu.',
                code: 'FICHIER_MANQUANT',
            });
        }
        if (!typeDocument) {
            throw new common_1.BadRequestException({
                message: 'Le type de document est obligatoire.',
                code: 'TYPE_DOCUMENT_MANQUANT',
            });
        }
        return this.service.uploadEtSoumettre(u.id, typeDocument, fichier);
    }
    soumettre(u, dto) {
        return this.service.soumettre(u.id, dto);
    }
    mesDocuments(u) {
        return this.service.mesDocuments(u.id);
    }
    enAttente() {
        return this.service.enAttente();
    }
    valider(id, u) {
        return this.service.valider(id, u.id);
    }
    rejeter(id, u, dto) {
        return this.service.rejeter(id, u.id, dto);
    }
};
exports.KycController = KycController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('fichier', {
        storage: (0, multer_1.memoryStorage)(),
        limits: {
            fileSize: TAILLE_MAX,
            files: 1,
        },
        fileFilter: (req, file, cb) => {
            if (MIME_AUTORISES.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException({
                    message: 'Format non accepté. Utilisez JPG, PNG ou PDF.',
                    code: 'FORMAT_INVALIDE',
                }), false);
            }
        },
    })),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('typeDocument')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Post)('soumettre'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, soumettre_kyc_dto_1.SoumettreKycDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "soumettre", null);
__decorate([
    (0, common_1.Get)('mes-documents'),
    __param(0, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "mesDocuments", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERVISEUR),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Get)('en-attente'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KycController.prototype, "enAttente", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERVISEUR),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Put)(':id/valider'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "valider", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Put)(':id/rejeter'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, utilisateur_courant_decorator_1.UtilisateurCourant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, rejeter_kyc_dto_1.RejeterKycDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "rejeter", null);
exports.KycController = KycController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('kyc'),
    __metadata("design:paramtypes", [kyc_service_1.KycService])
], KycController);
//# sourceMappingURL=kyc.controller.js.map