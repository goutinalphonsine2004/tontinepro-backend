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
exports.VerifierOtpDto = void 0;
const class_validator_1 = require("class-validator");
class VerifierOtpDto {
    telephone;
    code;
}
exports.VerifierOtpDto = VerifierOtpDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le numéro de téléphone est obligatoire' }),
    (0, class_validator_1.Matches)(/^\+229\d{8,10}$/, { message: 'Format téléphone invalide' }),
    __metadata("design:type", String)
], VerifierOtpDto.prototype, "telephone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le code OTP est obligatoire' }),
    (0, class_validator_1.Length)(6, 6, { message: 'Le code OTP doit contenir 6 chiffres' }),
    __metadata("design:type", String)
], VerifierOtpDto.prototype, "code", void 0);
//# sourceMappingURL=verifier-otp.dto.js.map