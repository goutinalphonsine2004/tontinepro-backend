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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SmsService = SmsService_1 = class SmsService {
    config;
    logger = new common_1.Logger(SmsService_1.name);
    sms;
    constructor(config) {
        this.config = config;
        const AfricasTalking = require('africastalking');
        const at = AfricasTalking({
            username: config.get('AT_USERNAME', 'sandbox'),
            apiKey: config.get('AT_API_KEY', ''),
        });
        this.sms = at.SMS;
    }
    async envoyer(telephone, message) {
        try {
            await this.sms.send({
                to: [telephone],
                message,
                from: this.config.get('AT_SENDER', 'TontineBénin'),
            });
            this.logger.log(`SMS envoyé à ${telephone}`);
        }
        catch (error) {
            this.logger.error(`Échec envoi SMS à ${telephone}: ${error.message}`);
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsService);
//# sourceMappingURL=sms.service.js.map