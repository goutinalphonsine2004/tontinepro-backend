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
exports.EnregistrerBiometrieDto = void 0;
const class_validator_1 = require("class-validator");
class EnregistrerBiometrieDto {
    deviceId;
    empreinteHash;
    nomAppareil;
    modeleAppareil;
    systemeExploitation;
    pin;
}
exports.EnregistrerBiometrieDto = EnregistrerBiometrieDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le deviceId est obligatoire' }),
    __metadata("design:type", String)
], EnregistrerBiometrieDto.prototype, "deviceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: "L'empreinte digitale est obligatoire" }),
    __metadata("design:type", String)
], EnregistrerBiometrieDto.prototype, "empreinteHash", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnregistrerBiometrieDto.prototype, "nomAppareil", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnregistrerBiometrieDto.prototype, "modeleAppareil", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnregistrerBiometrieDto.prototype, "systemeExploitation", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({
        message: "Le PIN est obligatoire pour l'enregistrement biométrique",
    }),
    __metadata("design:type", String)
], EnregistrerBiometrieDto.prototype, "pin", void 0);
//# sourceMappingURL=enregistrer-biometrie.dto.js.map