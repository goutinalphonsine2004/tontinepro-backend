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
exports.ParametresService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const DEFAULTS = {
    TAUX_COMMISSION_COTISATION: { valeur: '0.05', description: 'Taux de commission sur les cotisations (ex: 0.05 = 5%)' },
    TAUX_INTERET_MICRO_CREDIT: { valeur: '0.10', description: 'Taux d\'intérêt sur les micro-crédits (ex: 0.10 = 10%)' },
    SEUIL_SCORE_MICRO_CREDIT: { valeur: '60', description: 'Score minimum pour accéder au micro-crédit' },
    SEUIL_SCORE_PADME: { valeur: '70', description: 'Score minimum pour le dossier PADME' },
    PLAFOND_MICRO_CREDIT_60: { valeur: '25000', description: 'Plafond micro-crédit pour score 60-69' },
    PLAFOND_MICRO_CREDIT_70: { valeur: '50000', description: 'Plafond micro-crédit pour score 70-79' },
    PLAFOND_MICRO_CREDIT_80: { valeur: '75000', description: 'Plafond micro-crédit pour score 80-89' },
    PLAFOND_MICRO_CREDIT_90: { valeur: '100000', description: 'Plafond micro-crédit pour score >= 90' },
    SEUIL_RETRAIT_ADMIN: { valeur: '500000', description: 'Montant de retrait nécessitant validation admin' },
    ABONNEMENT_STANDARD: { valeur: '2000', description: 'Frais abonnement mensuel collecteur STANDARD (FCFA)' },
    ABONNEMENT_PRO: { valeur: '5000', description: 'Frais abonnement mensuel collecteur PRO (FCFA)' },
    SEUIL_ALERTE_SOLDE_FAIBLE: { valeur: '5000', description: 'Seuil de solde faible pour alertes (FCFA)' },
    DUREE_OTP_MINUTES: { valeur: '10', description: 'Durée de validité des codes OTP (minutes)' },
    MODE_MAINTENANCE: { valeur: 'false', description: 'Activer/désactiver le mode maintenance' },
    MESSAGE_MAINTENANCE: { valeur: 'Application en maintenance. Revenez dans quelques instants.', description: 'Message affiché en mode maintenance' },
};
let ParametresService = class ParametresService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async lister() {
        const parametres = await this.prisma.parametreSysteme.findMany({
            orderBy: { cle: 'asc' },
        });
        const resultats = Object.entries(DEFAULTS).map(([cle, def]) => {
            const enBase = parametres.find((p) => p.cle === cle);
            return {
                cle,
                valeur: enBase?.valeur ?? def.valeur,
                description: enBase?.description ?? def.description,
                modifiePar: enBase?.modifiePar ?? null,
                misAJourLe: enBase?.misAJourLe ?? null,
                estValeurParDefaut: !enBase,
            };
        });
        return { succes: true, message: `${resultats.length} paramètre(s).`, donnees: resultats };
    }
    async get(cle) {
        if (!DEFAULTS[cle]) {
            throw new common_1.NotFoundException({ message: `Paramètre "${cle}" inconnu`, code: 'PARAMETRE_INCONNU' });
        }
        const enBase = await this.prisma.parametreSysteme.findUnique({ where: { cle } });
        const valeur = enBase?.valeur ?? DEFAULTS[cle].valeur;
        return {
            succes: true,
            message: `Paramètre récupéré.`,
            donnees: { cle, valeur, description: DEFAULTS[cle].description, estValeurParDefaut: !enBase },
        };
    }
    async set(cle, dto, adminId) {
        if (!DEFAULTS[cle]) {
            throw new common_1.NotFoundException({ message: `Paramètre "${cle}" inconnu`, code: 'PARAMETRE_INCONNU' });
        }
        if (cle === 'MODE_MAINTENANCE' && !['true', 'false'].includes(dto.valeur)) {
            throw new common_1.BadRequestException('La valeur du mode maintenance doit être "true" ou "false"');
        }
        const param = await this.prisma.parametreSysteme.upsert({
            where: { cle },
            create: {
                cle,
                valeur: dto.valeur,
                description: dto.description ?? DEFAULTS[cle].description,
                modifiePar: adminId,
            },
            update: {
                valeur: dto.valeur,
                description: dto.description ?? DEFAULTS[cle].description,
                modifiePar: adminId,
            },
        });
        return {
            succes: true,
            message: `Paramètre "${cle}" mis à jour → ${dto.valeur}`,
            donnees: param,
        };
    }
    async maintenance(dto, adminId) {
        await this.prisma.parametreSysteme.upsert({
            where: { cle: 'MODE_MAINTENANCE' },
            create: { cle: 'MODE_MAINTENANCE', valeur: dto.actif ? 'true' : 'false', description: DEFAULTS.MODE_MAINTENANCE.description, modifiePar: adminId },
            update: { valeur: dto.actif ? 'true' : 'false', modifiePar: adminId },
        });
        if (dto.message) {
            await this.prisma.parametreSysteme.upsert({
                where: { cle: 'MESSAGE_MAINTENANCE' },
                create: { cle: 'MESSAGE_MAINTENANCE', valeur: dto.message, description: DEFAULTS.MESSAGE_MAINTENANCE.description, modifiePar: adminId },
                update: { valeur: dto.message, modifiePar: adminId },
            });
        }
        return {
            succes: true,
            message: dto.actif ? '🔴 Mode maintenance activé.' : '🟢 Mode maintenance désactivé.',
            donnees: { maintenance: dto.actif, message: dto.message ?? null },
        };
    }
    async getValeur(cle, defaut) {
        const enBase = await this.prisma.parametreSysteme.findUnique({ where: { cle } });
        return enBase?.valeur ?? defaut ?? DEFAULTS[cle]?.valeur ?? '';
    }
    async getValeurNumerique(cle, defaut) {
        const valeur = await this.getValeur(cle, defaut?.toString());
        return parseFloat(valeur) || defaut || 0;
    }
};
exports.ParametresService = ParametresService;
exports.ParametresService = ParametresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ParametresService);
//# sourceMappingURL=parametres.service.js.map