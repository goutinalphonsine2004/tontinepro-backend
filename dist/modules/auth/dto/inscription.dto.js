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
exports.InscriptionDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class InscriptionDto {
    telephone;
    nom;
    role;
}
exports.InscriptionDto = InscriptionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le numéro de téléphone est obligatoire' }),
    (0, class_validator_1.Matches)(/^\+229\d{8,10}$/, {
        message: 'Numéro béninois invalide. Ex: +2290141193597',
    }),
    __metadata("design:type", String)
], InscriptionDto.prototype, "telephone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom est obligatoire' }),
    __metadata("design:type", String)
], InscriptionDto.prototype, "nom", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Role, { message: 'Rôle invalide' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InscriptionDto.prototype, "role", void 0);
//# sourceMappingURL=inscription.dto.js.map