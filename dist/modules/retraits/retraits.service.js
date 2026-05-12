"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetraitsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const sms_service_1 = require("../notifications/sms.service");
const business_constants_1 = require("../../common/constants/business.constants");
const notifications_service_1 = require("../notifications/notifications.service");
const common_2 = require("@nestjs/common");
const OTP_TYPE_RETRAIT = 'RETRAIT';
const DUREE_OTP_RETRAIT_MINUTES = 10;
let RetraitsService = class RetraitsService {
    prisma;
    kkiapay;
    sms;
    notifications;
    constructor(prisma, kkiapay, sms, notifications) {
        this.prisma = prisma;
        this.kkiapay = kkiapay;
        this.sms = sms;
        this.notifications = notifications;
    }
    async demanderOtp(utilisateurId, dto) {
        const [utilisateur, tontine] = await Promise.all([
            this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } }),
            this.prisma.tontine.findUnique({ where: { id: dto.tontineId } }),
        ]);
        if (!utilisateur)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (!tontine)
            throw new common_1.NotFoundException('Tontine introuvable');
        await this.verifierRetraitPossible(utilisateurId, tontine, dto.montant);
        const telephone = dto.telephone ?? utilisateur.telephone;
        const { code, expireLe } = await this.creerOtpRetrait(utilisateurId, telephone, dto.tontineId, dto.montant);
        await this.sms.envoyer(telephone, `TontineBénin: Code retrait ${code}. Montant: ${dto.montant} FCFA. Valable ${DUREE_OTP_RETRAIT_MINUTES} min.`);
        if (utilisateur.collecteurId) {
            await this.notifications.envoyerAEquipe(utilisateur.collecteurId, 'Demande de retrait client', `Votre client ${utilisateur.nom} a initié un retrait de ${dto.montant} F sur ${tontine.nom}. Code OTP envoyé.`);
        }
        return {
            succes: true,
            message: 'Code OTP de confirmation envoyé par SMS.',
            donnees: { tontineId: tontine.id, montant: dto.montant, telephone, expireLe },
        };
    }
    async confirmer(utilisateurId, dto) {
        const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
        if (!utilisateur)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const telephone = dto.telephone ?? utilisateur.telephone;
        const otp = await this.prisma.codeOTP.findFirst({
            where: {
                utilisateurId,
                telephone,
                type: this.typeOtpRetrait(dto.tontineId, dto.montant),
                utilise: false,
                expireLe: { gt: new Date() },
            },
            orderBy: { creeLe: 'desc' },
        });
        if (!otp || !(await this.verifierCodeOtp(dto.code, otp.code))) {
            throw new common_1.BadRequestException({ message: 'Code OTP de retrait invalide ou expiré', code: 'OTP_RETRAIT_INVALIDE' });
        }
        await this.prisma.codeOTP.update({ where: { id: otp.id }, data: { utilise: true } });
        return this.demander(utilisateurId, dto);
    }
    async demander(utilisateurId, dto) {
        const [utilisateur, tontine] = await Promise.all([
            this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } }),
            this.prisma.tontine.findUnique({ where: { id: dto.tontineId } }),
        ]);
        if (!utilisateur)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (!tontine)
            throw new common_1.NotFoundException('Tontine introuvable');
        await this.verifierRetraitPossible(utilisateurId, tontine, dto.montant);
        const seuilAdmin = business_constants_1.BUSINESS.SEUIL_RETRAIT_ADMIN;
        const needsAdmin = dto.montant >= seuilAdmin;
        const retrait = await this.prisma.retrait.create({
            data: {
                utilisateurId,
                tontineId: tontine.id,
                montant: dto.montant,
                statut: needsAdmin ? client_1.StatutRetrait.EN_ATTENTE : client_1.StatutRetrait.VALIDE,
            },
        });
        if (!needsAdmin) {
            await this.executer(retrait.id, utilisateur.telephone, tontine.id, dto.montant);
        }
        return {
            succes: true,
            message: needsAdmin
                ? `Retrait de ${dto.montant} FCFA en attente de validation Admin (seuil: ${seuilAdmin} FCFA).`
                : `Retrait de ${dto.montant} FCFA validé automatiquement et en cours d'exécution.`,
            donnees: retrait,
        };
    }
    async verifierRetraitPossible(utilisateurId, tontine, montant) {
        await this.verifierAucuneAlerteBloquante(tontine.id);
        if (tontine.proprietaireId !== utilisateurId) {
            throw new common_1.ForbiddenException({ message: 'Seul le propriétaire peut demander un retrait', code: 'ACCES_REFUSE' });
        }
        if (tontine.soldeActuel < montant) {
            throw new common_1.BadRequestException({
                message: `Solde insuffisant. Disponible: ${tontine.soldeActuel} FCFA`,
                code: 'SOLDE_INSUFFISANT',
            });
        }
        if (tontine.politique === client_1.PolitiqueRetrait.BLOQUE) {
            if (!tontine.dateDeverrouillage || tontine.dateDeverrouillage > new Date()) {
                throw new common_1.BadRequestException({
                    message: `Retrait bloqué jusqu'au ${tontine.dateDeverrouillage?.toLocaleDateString('fr-FR') ?? 'date indéfinie'}`,
                    code: 'TONTINE_BLOQUEE',
                });
            }
        }
        if (tontine.politique === client_1.PolitiqueRetrait.PROGRAMME) {
            if (!tontine.dateDeverrouillage || tontine.dateDeverrouillage > new Date()) {
                throw new common_1.BadRequestException({ message: 'Date de retrait programmée non atteinte', code: 'DATE_NON_ATTEINTE' });
            }
        }
    }
    async verifierAucuneAlerteBloquante(tontineId) {
        const alerte = await this.prisma.alerteSysteme.findFirst({
            where: {
                type: 'COHERENCE_COMPTABLE',
                severite: 'CRITIQUE',
                statut: 'OUVERTE',
                resourceType: 'TONTINE',
                resourceId: tontineId,
            },
            select: { id: true, titre: true },
        });
        if (alerte) {
            throw new common_1.ForbiddenException({
                message: 'Retrait temporairement bloqué: anomalie comptable en cours de vérification.',
                code: 'CIRCUIT_BREAKER_COMPTABLE',
                alerteId: alerte.id,
            });
        }
    }
    async executer(retraitId, telephone, tontineId, montant) {
        const fraisRetrait = business_constants_1.BUSINESS.calculerFraisRetrait(montant);
        const montantNet = montant - fraisRetrait;
        const transfert = await this.kkiapay.initierTransfert({
            montant: montantNet,
            telephone,
            reference: `retrait_${retraitId}`,
            motif: 'Retrait tontine',
        });
        const retrait = await this.prisma.retrait.findUnique({
            where: { id: retraitId },
            include: { utilisateur: { select: { id: true, nom: true, collecteurId: true } }, tontine: { select: { nom: true } } },
        });
        await this.prisma.$transaction([
            this.prisma.retrait.update({
                where: { id: retraitId },
                data: {
                    statut: client_1.StatutRetrait.EXECUTE,
                    executeLe: new Date(),
                    refKKiaPay: transfert.refKKiaPay,
                },
            }),
            this.prisma.tontine.update({
                where: { id: tontineId },
                data: { soldeActuel: { decrement: montant } },
            }),
        ]);
        await this.sms.envoyer(telephone, `TontineBénin: Retrait de ${montantNet} FCFA (après ${fraisRetrait}F de frais) exécuté avec succès. Réf: ${transfert.refKKiaPay}.`);
        if (retrait?.utilisateur.collecteurId) {
            await this.notifications.envoyerAEquipe(retrait.utilisateur.collecteurId, 'Retrait effectué', `Le retrait de ${montant} F pour votre client ${retrait.utilisateur.nom} sur ${retrait.tontine.nom} a été payé.`);
        }
    }
    async mesRetraits(utilisateurId) {
        const retraits = await this.prisma.retrait.findMany({
            where: { utilisateurId },
            include: { tontine: { select: { id: true, nom: true } } },
            orderBy: { creeLe: 'desc' },
        });
        return { succes: true, message: `${retraits.length} retrait(s).`, donnees: retraits };
    }
    async enAttente() {
        const retraits = await this.prisma.retrait.findMany({
            where: { statut: client_1.StatutRetrait.EN_ATTENTE },
            include: {
                utilisateur: { select: { id: true, nom: true, telephone: true } },
                tontine: { select: { id: true, nom: true, soldeActuel: true } },
            },
            orderBy: { creeLe: 'asc' },
        });
        const total = retraits.reduce((s, r) => s + r.montant, 0);
        return { succes: true, message: `${retraits.length} retrait(s) en attente. Total: ${total} FCFA.`, donnees: retraits };
    }
    async valider(retraitId, adminId) {
        const retrait = await this.prisma.retrait.findUnique({
            where: { id: retraitId },
            include: { utilisateur: true },
        });
        if (!retrait)
            throw new common_1.NotFoundException('Retrait introuvable');
        if (retrait.statut !== client_1.StatutRetrait.EN_ATTENTE) {
            throw new common_1.BadRequestException({ message: 'Ce retrait n\'est plus en attente', code: 'STATUT_INVALIDE' });
        }
        const tontine = await this.prisma.tontine.findUnique({ where: { id: retrait.tontineId } });
        if (!tontine || tontine.soldeActuel < retrait.montant) {
            throw new common_1.BadRequestException({ message: 'Solde tontine insuffisant', code: 'SOLDE_INSUFFISANT' });
        }
        await this.prisma.retrait.update({
            where: { id: retraitId },
            data: { statut: client_1.StatutRetrait.VALIDE, validePar: adminId },
        });
        await this.executer(retraitId, retrait.utilisateur.telephone, tontine.id, retrait.montant);
        return { succes: true, message: `Retrait de ${retrait.montant} FCFA validé et exécuté.` };
    }
    async rejeter(retraitId, adminId, dto) {
        const retrait = await this.prisma.retrait.findUnique({ where: { id: retraitId } });
        if (!retrait)
            throw new common_1.NotFoundException('Retrait introuvable');
        if (retrait.statut !== client_1.StatutRetrait.EN_ATTENTE) {
            throw new common_1.BadRequestException({ message: 'Ce retrait n\'est plus en attente', code: 'STATUT_INVALIDE' });
        }
        await this.prisma.retrait.update({
            where: { id: retraitId },
            data: { statut: client_1.StatutRetrait.REJETE, validePar: adminId, motifRejet: dto.motif },
        });
        return { succes: true, message: 'Retrait rejeté.' };
    }
    async creerOtpRetrait(utilisateurId, telephone, tontineId, montant) {
        await this.prisma.codeOTP.updateMany({
            where: { utilisateurId, type: { startsWith: OTP_TYPE_RETRAIT }, utilise: false },
            data: { utilise: true },
        });
        const code = (0, crypto_1.randomInt)(100000, 1000000).toString();
        const codeHash = await bcrypt.hash(code, 10);
        const expireLe = new Date(Date.now() + DUREE_OTP_RETRAIT_MINUTES * 60 * 1000);
        await this.prisma.codeOTP.create({
            data: { utilisateurId, telephone, code: codeHash, type: this.typeOtpRetrait(tontineId, montant), expireLe },
        });
        return { code, expireLe };
    }
    typeOtpRetrait(tontineId, montant) {
        return `${OTP_TYPE_RETRAIT}:${tontineId}:${montant}`;
    }
    async verifierCodeOtp(codeRecu, codeStocke) {
        if (codeStocke.startsWith('$2')) {
            return bcrypt.compare(codeRecu, codeStocke);
        }
        return codeRecu === codeStocke;
    }
};
exports.RetraitsService = RetraitsService;
exports.RetraitsService = RetraitsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_2.Inject)((0, common_2.forwardRef)(() => sms_service_1.SmsService))),
    __param(3, (0, common_2.Inject)((0, common_2.forwardRef)(() => notifications_service_1.NotificationsService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kkiapay_service_1.KkiapayService,
        sms_service_1.SmsService,
        notifications_service_1.NotificationsService])
], RetraitsService);
//# sourceMappingURL=retraits.service.js.map