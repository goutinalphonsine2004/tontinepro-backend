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
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let WhatsappService = WhatsappService_1 = class WhatsappService {
    config;
    http;
    logger = new common_1.Logger(WhatsappService_1.name);
    token;
    phoneNumberId;
    baseUrl;
    enabled;
    constructor(config, http) {
        this.config = config;
        this.http = http;
        this.token = config.get('WHATSAPP_TOKEN', '');
        this.phoneNumberId = config.get('WHATSAPP_PHONE_NUMBER_ID', '');
        this.baseUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
        this.enabled = !!(this.token && this.phoneNumberId);
        if (!this.enabled) {
            this.logger.warn('[WhatsApp] Non configuré — messages désactivés');
        }
    }
    async envoyerMessage(telephone, message) {
        if (!this.enabled) {
            this.logger.log(`[WhatsApp Sim] → ${telephone}: ${message}`);
            return { success: true, simulated: true };
        }
        try {
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: telephone.replace('+', ''),
                type: 'text',
                text: { preview_url: false, body: message },
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.http.post(this.baseUrl, payload, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
            }));
            this.logger.log(`[WhatsApp] Envoyé à ${telephone}`);
            return { success: true, data: response.data };
        }
        catch (err) {
            const msg = err.message;
            this.logger.error(`[WhatsApp] Erreur: ${msg}`);
            return { success: false, erreur: msg };
        }
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map