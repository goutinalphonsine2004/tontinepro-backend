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
exports.EnrolerClientTerrainDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class EnrolerClientTerrainDto {
    nom;
    telephone;
    telephoneSecondaire;
    cip;
    npi;
    quartier;
    adresse;
    photoUrl;
    signatureUrl;
    latitude;
    longitude;
    typeTontine = 'PERSONNEL';
    nomTontine;
    montantJournalierFcfa = 0;
    consentementTexte;
}
exports.EnrolerClientTerrainDto = EnrolerClientTerrainDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "nom", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "telephone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "telephoneSecondaire", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "cip", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "npi", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "quartier", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "adresse", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "photoUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "signatureUrl", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EnrolerClientTerrainDto.prototype, "latitude", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EnrolerClientTerrainDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['PERSONNEL', 'GROUPE', 'PROJET']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "typeTontine", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "nomTontine", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EnrolerClientTerrainDto.prototype, "montantJournalierFcfa", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnrolerClientTerrainDto.prototype, "consentementTexte", void 0);
//# sourceMappingURL=enroler-client-terrain.dto.js.map