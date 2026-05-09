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
exports.ChangerPinDto = void 0;
const class_validator_1 = require("class-validator");
class ChangerPinDto {
    ancienPin;
    nouveauPin;
}
exports.ChangerPinDto = ChangerPinDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: "L'ancien PIN est obligatoire" }),
    __metadata("design:type", String)
], ChangerPinDto.prototype, "ancienPin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nouveau PIN est obligatoire' }),
    (0, class_validator_1.Length)(4, 6, { message: 'Le PIN doit contenir entre 4 et 6 chiffres' }),
    (0, class_validator_1.Matches)(/^\d+$/, { message: 'Le PIN doit contenir uniquement des chiffres' }),
    __metadata("design:type", String)
], ChangerPinDto.prototype, "nouveauPin", void 0);
//# sourceMappingURL=changer-pin.dto.js.map