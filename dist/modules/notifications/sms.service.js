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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const retraits_service_1 = require("../retraits/retraits.service");
const tontines_service_1 = require("../tontines/tontines.service");
let SmsService = SmsService_1 = class SmsService {
    config;
    prisma;
    retraitsService;
    tontinesService;
    logger = new common_1.Logger(SmsService_1.name);
    sms;
    constructor(config, prisma, retraitsService, tontinesService) {
        this.config = config;
        this.prisma = prisma;
        this.retraitsService = retraitsService;
        this.tontinesService = tontinesService;
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
                from: this.config.get('AT_SENDER', 'TontinePro'),
            });
            this.logger.log(`SMS envoyé à ${telephone}`);
        }
        catch (error) {
            this.logger.error(`Échec envoi SMS à ${telephone}: ${error.message}`);
        }
    }
    async traiterCommande(from, text) {
        this.logger.log(`Commande SMS reçue de ${from}: "${text}"`);
        const utilisateur = await this.prisma.utilisateur.findFirst({
            where: { telephone: from },
        });
        if (!utilisateur) {
            this.logger.warn(`SMS reçu d'un numéro inconnu: ${from}`);
            return;
        }
        const mots = text.trim().toUpperCase().split(/\s+/);
        const commande = mots[0];
        try {
            switch (commande) {
                case 'SOLDE':
                    return this.gererCommandeSolde(utilisateur);
                case 'RETRAIT':
                    return this.gererCommandeRetrait(utilisateur, mots[1]);
                case 'REJOINDRE':
                    return this.gererCommandeRejoindre(utilisateur, mots[1]);
                case 'AIDE':
                default:
                    return this.envoyer(from, "TontinePro: Commandes valides: SOLDE, RETRAIT [Montant], REJOINDRE [Code], AIDE.");
            }
        }
        catch (error) {
            this.logger.error(`Erreur traitement commande SMS: ${error.message}`);
            await this.envoyer(from, `TontinePro: Erreur - ${error.message}`);
        }
    }
    async gererCommandeRejoindre(utilisateur, code) {
        if (!code) {
            return this.envoyer(utilisateur.telephone, "TontinePro: Précisez le code d'invitation. Exemple: REJOINDRE X8Z2P");
        }
        const tontine = await this.prisma.tontine.findUnique({
            where: { codeInvitation: code.toUpperCase() },
        });
        if (!tontine) {
            return this.envoyer(utilisateur.telephone, "TontinePro: Code d'invitation invalide.");
        }
        try {
            await this.tontinesService.rejoindre(tontine.id, utilisateur.id, { montantCaution: 0 });
            await this.envoyer(utilisateur.telephone, `TontinePro: Félicitations ! Vous avez rejoint le groupe '${tontine.nom}'.`);
        }
        catch (err) {
            await this.envoyer(utilisateur.telephone, `TontinePro: Impossible de rejoindre : ${err.message}`);
        }
    }
    async gererCommandeSolde(utilisateur) {
        const tontines = await this.prisma.tontine.findMany({
            where: { proprietaireId: utilisateur.id, statut: 'ACTIVE' },
            select: { nom: true, soldeActuel: true },
        });
        if (tontines.length === 0) {
            return this.envoyer(utilisateur.telephone, "TontinePro: Vous n'avez aucune tontine active.");
        }
        const total = tontines.reduce((sum, t) => sum + t.soldeActuel, 0);
        const detail = tontines.map(t => `${t.nom}: ${t.soldeActuel}F`).join(', ');
        await this.envoyer(utilisateur.telephone, `TontinePro: Solde Total: ${total} FCFA. Détails: ${detail}.`);
    }
    async gererCommandeRetrait(utilisateur, montantStr) {
        if (!montantStr || isNaN(Number(montantStr))) {
            return this.envoyer(utilisateur.telephone, "TontinePro: Précisez le montant. Exemple: RETRAIT 5000");
        }
        const montant = Number(montantStr);
        const tontine = await this.prisma.tontine.findFirst({
            where: { proprietaireId: utilisateur.id, soldeActuel: { gte: montant }, statut: 'ACTIVE' },
            orderBy: { soldeActuel: 'desc' },
        });
        if (!tontine) {
            return this.envoyer(utilisateur.telephone, `TontinePro: Solde insuffisant pour retirer ${montant} FCFA sur vos tontines actives.`);
        }
        await this.envoyer(utilisateur.telephone, `TontinePro: Demande de retrait de ${montant}F sur '${tontine.nom}' reçue.`);
        await this.retraitsService.demanderOtp(utilisateur.id, {
            tontineId: tontine.id,
            montant: montant,
            telephone: utilisateur.telephone,
        });
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => retraits_service_1.RetraitsService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => tontines_service_1.TontinesService))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        retraits_service_1.RetraitsService,
        tontines_service_1.TontinesService])
], SmsService);
//# sourceMappingURL=sms.service.js.map