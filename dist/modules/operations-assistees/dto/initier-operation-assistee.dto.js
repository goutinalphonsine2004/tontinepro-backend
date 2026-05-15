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
exports.InitierOperationAssisteeDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class InitierOperationAssisteeDto {
    clientId;
    tontineId;
    montant;
    operateur = 'MTN';
    telephone;
    idempotencyKey;
    latitude;
    longitude;
    deviceId;
}
exports.InitierOperationAssisteeDto = InitierOperationAssisteeDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InitierOperationAssisteeDto.prototype, "clientId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InitierOperationAssisteeDto.prototype, "tontineId", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(100),
    (0, class_validator_1.Max)(10000000),
    __metadata("design:type", Number)
], InitierOperationAssisteeDto.prototype, "montant", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['MTN', 'MOOV', 'CELTIIS']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InitierOperationAssisteeDto.prototype, "operateur", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^(\+229|229)\d{8,10}$/, {
        message: 'Téléphone invalide. Format attendu: +229XXXXXXXX ou 229XXXXXXXX',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InitierOperationAssisteeDto.prototype, "telephone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InitierOperationAssisteeDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], InitierOperationAssisteeDto.prototype, "latitude", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], InitierOperationAssisteeDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InitierOperationAssisteeDto.prototype, "deviceId", void 0);
//# sourceMappingURL=initier-operation-assistee.dto.js.map