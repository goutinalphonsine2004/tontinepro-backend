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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreerTontineDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreerTontineDto {
    nom;
    description;
    type = client_1.TypeTontine.PERSONNEL;
    politique = client_1.PolitiqueRetrait.FLEXIBLE;
    frequence = client_1.FrequenceTontine.MENSUEL;
    jourFixe;
    objectifMontant;
    montantJournalier = 500;
    dateDeverrouillage;
    dateFin;
    clientId;
}
exports.CreerTontineDto = CreerTontineDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom est obligatoire' }),
    __metadata("design:type", String)
], CreerTontineDto.prototype, "nom", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreerTontineDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TypeTontine),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreerTontineDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.PolitiqueRetrait),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreerTontineDto.prototype, "politique", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.FrequenceTontine),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreerTontineDto.prototype, "frequence", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(28, { message: 'jourFixe doit être entre 1 et 28 (garanti dans tous les mois)' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreerTontineDto.prototype, "jourFixe", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreerTontineDto.prototype, "objectifMontant", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100, { message: 'Le montant minimum est 100 FCFA' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreerTontineDto.prototype, "montantJournalier", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreerTontineDto.prototype, "dateDeverrouillage", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreerTontineDto.prototype, "dateFin", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreerTontineDto.prototype, "clientId", void 0);
//# sourceMappingURL=creer-tontine.dto.js.map