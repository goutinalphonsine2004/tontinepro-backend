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
var KkiapayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KkiapayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let KkiapayService = KkiapayService_1 = class KkiapayService {
    config;
    logger = new common_1.Logger(KkiapayService_1.name);
    sandbox;
    secretKey;
    constructor(config) {
        this.config = config;
        this.sandbox = config.get('KKIAPAY_SANDBOX', 'true') === 'true';
        this.secretKey = config.get('KKIAPAY_SECRET_KEY', '');
    }
    async initierPaiement(params) {
        const refKKiaPay = `kkp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        if (this.sandbox) {
            this.logger.log(`[SANDBOX] Paiement initié: ${params.montant} FCFA → ${params.telephone} | ref: ${params.reference}`);
            return {
                refKKiaPay,
                paymentUrl: `https://sandbox.kkiapay.me/pay/${refKKiaPay}?amount=${params.montant}&phone=${params.telephone}`,
            };
        }
        this.logger.log(`[PROD] Initier paiement KKiaPay: ${params.montant} FCFA`);
        return {
            refKKiaPay,
            paymentUrl: `https://api.kkiapay.me/pay/${refKKiaPay}`,
        };
    }
    async initierTransfert(params) {
        const refKKiaPay = `transfer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        if (this.sandbox) {
            this.logger.log(`[SANDBOX] Transfert: ${params.montant} FCFA → ${params.telephone} | motif: ${params.motif ?? 'N/A'}`);
            return { succes: true, refKKiaPay };
        }
        this.logger.log(`[PROD] Transfert KKiaPay: ${params.montant} FCFA → ${params.telephone}`);
        return { succes: true, refKKiaPay };
    }
    verifierSignature(rawBody, signatureRecue) {
        if (!this.secretKey) {
            const production = this.config.get('NODE_ENV') === 'production';
            this.logger.warn('KKIAPAY_SECRET_KEY non configuré — signature non vérifiée');
            return !production;
        }
        const signatureCalculee = (0, crypto_1.createHmac)('sha256', this.secretKey)
            .update(rawBody)
            .digest('hex');
        const recue = Buffer.from(signatureRecue ?? '', 'hex');
        const calculee = Buffer.from(signatureCalculee, 'hex');
        const valide = recue.length === calculee.length && (0, crypto_1.timingSafeEqual)(recue, calculee);
        if (!valide) {
            this.logger.warn(`Signature invalide. Reçue: ${signatureRecue} | Calculée: ${signatureCalculee}`);
        }
        return valide;
    }
};
exports.KkiapayService = KkiapayService;
exports.KkiapayService = KkiapayService = KkiapayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KkiapayService);
//# sourceMappingURL=kkiapay.service.js.map