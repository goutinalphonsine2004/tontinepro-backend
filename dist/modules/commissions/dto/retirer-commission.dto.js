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
exports.RetirerCommissionDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class RetirerCommissionDto {
    montant;
    telephone;
}
exports.RetirerCommissionDto = RetirerCommissionDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(500, { message: 'Le montant minimum de retrait est 500 FCFA' }),
    (0, class_validator_1.Max)(10000000, { message: 'Le montant maximum est 10 000 000 FCFA' }),
    __metadata("design:type", Number)
], RetirerCommissionDto.prototype, "montant", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^(\+229|229)\d{8}$/, {
        message: 'Téléphone invalide. Format attendu: +229XXXXXXXX ou 229XXXXXXXX',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RetirerCommissionDto.prototype, "telephone", void 0);
//# sourceMappingURL=retirer-commission.dto.js.map