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
var MicroCreditsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroCreditsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const sms_service_1 = require("../notifications/sms.service");
const business_constants_1 = require("../../common/constants/business.constants");
const DUREE_CONSENTEMENT_MIN = 30;
const DUREE_CREDIT_JOURS = 30;
let MicroCreditsService = MicroCreditsService_1 = class MicroCreditsService {
    prisma;
    kkiapay;
    sms;
    logger = new common_1.Logger(MicroCreditsService_1.name);
    constructor(prisma, kkiapay, sms) {
        this.prisma = prisma;
        this.kkiapay = kkiapay;
        this.sms = sms;
    }
    async monEligibilite(clientId) {
        const scoreCredit = await this.prisma.scoreCredit.findUnique({
            where: { utilisateurId: clientId },
        });
        const score = scoreCredit?.score ?? 0;
        const eligible = score >= business_constants_1.BUSINESS.SEUIL_SCORE_MICRO_CREDIT;
        const plafond = business_constants_1.BUSINESS.getPlafondMicroCredit(score);
        const montantTotalFcfa = eligible
            ? business_constants_1.BUSINESS.calculerMontantTotal(plafond)
            : 0;
        const paiementJournalierFcfa = eligible
            ? business_constants_1.BUSINESS.calculerPaiementJournalier(montantTotalFcfa, DUREE_CREDIT_JOURS)
            : 0;
        const creditActif = await this.prisma.microCredit.findFirst({
            where: { clientId, statut: client_1.StatutCredit.ACTIF },
        });
        return {
            succes: true,
            message: eligible
                ? 'Vous êtes éligible au micro-crédit.'
                : 'Score insuffisant pour un micro-crédit.',
            donnees: {
                score,
                eligible,
                plafondMaximum: plafond,
                tauxInteret: `${business_constants_1.BUSINESS.TAUX_INTERET_MICRO_CREDIT * 100}%`,
                dureeJours: DUREE_CREDIT_JOURS,
                exempleCalcul: eligible
                    ? {
                        montantPrincipalFcfa: plafond,
                        interet: business_constants_1.BUSINESS.calculerInteretMicroCredit(plafond),
                        montantTotalFcfa,
                        paiementJournalierFcfa,
                    }
                    : null,
                scoreRequis: business_constants_1.BUSINESS.SEUIL_SCORE_MICRO_CREDIT,
                creditActifEnCours: !!creditActif,
            },
        };
    }
    async demander(clientId, dto) {
        const [client, scoreCredit] = await Promise.all([
            this.prisma.utilisateur.findUnique({ where: { id: clientId } }),
            this.prisma.scoreCredit.findUnique({
                where: { utilisateurId: clientId },
            }),
        ]);
        if (!client)
            throw new common_1.NotFoundException('Client introuvable');
        const score = scoreCredit?.score ?? 0;
        if (score < business_constants_1.BUSINESS.SEUIL_SCORE_MICRO_CREDIT) {
            throw new common_1.BadRequestException({
                message: `Score insuffisant pour un micro-crédit. Score actuel: ${score}, requis: ${business_constants_1.BUSINESS.SEUIL_SCORE_MICRO_CREDIT}`,
                code: 'SCORE_INSUFFISANT',
                scoreActuel: score,
                scoreRequis: business_constants_1.BUSINESS.SEUIL_SCORE_MICRO_CREDIT,
            });
        }
        const creditActif = await this.prisma.microCredit.findFirst({
            where: { clientId, statut: client_1.StatutCredit.ACTIF },
        });
        if (creditActif) {
            throw new common_1.BadRequestException({
                message: 'Vous avez déjà un micro-crédit actif en cours.',
                code: 'CREDIT_EN_COURS',
            });
        }
        const plafond = business_constants_1.BUSINESS.getPlafondMicroCredit(score);
        if (dto.montantPrincipalFcfa > plafond) {
            throw new common_1.BadRequestException({
                message: `Montant demandé (${dto.montantPrincipalFcfa} FCFA) dépasse votre plafond (${plafond} FCFA).`,
                code: 'MONTANT_DEPASSE_PLAFOND',
                plafond,
            });
        }
        const montantTotalFcfa = business_constants_1.BUSINESS.calculerMontantTotal(dto.montantPrincipalFcfa);
        const paiementJournalierFcfa = business_constants_1.BUSINESS.calculerPaiementJournalier(montantTotalFcfa, DUREE_CREDIT_JOURS);
        const dateEcheance = new Date(Date.now() + DUREE_CREDIT_JOURS * 24 * 60 * 60 * 1000);
        const methode = dto.methodeConsentement ?? 'SMARTPHONE';
        const credit = await this.prisma.microCredit.create({
            data: {
                clientId,
                montantPrincipalFcfa: dto.montantPrincipalFcfa,
                tauxInteret: business_constants_1.BUSINESS.TAUX_INTERET_MICRO_CREDIT,
                montantTotalFcfa,
                paiementJournalierFcfa,
                totalJours: DUREE_CREDIT_JOURS,
                montantRestantFcfa: montantTotalFcfa,
                scoreAuMoment: score,
                initiePar: clientId,
                methodeConsentement: methode,
                consentementObtenu: false,
                dateEcheance,
            },
        });
        if (methode === 'SMS') {
            const telephone = dto.telephone ?? client.telephone;
            await this.sms.envoyer(telephone, `TontineBénin: Votre collecteur vous propose un micro-crédit de ${dto.montantPrincipalFcfa} FCFA (remb. ${paiementJournalierFcfa} FCFA/jour pendant 30j). Répondez 1 pour ACCEPTER ou 2 pour REFUSER. Offre valable ${DUREE_CONSENTEMENT_MIN} minutes.`);
        }
        return {
            succes: true,
            message: methode === 'SMS'
                ? 'Demande créée. SMS de consentement envoyé au client.'
                : 'Demande créée. Confirmez avec votre PIN.',
            donnees: {
                creditId: credit.id,
                montantPrincipalFcfa: dto.montantPrincipalFcfa,
                montantTotalFcfa,
                paiementJournalierFcfa,
                tauxInteret: `${business_constants_1.BUSINESS.TAUX_INTERET_MICRO_CREDIT * 100}%`,
                methodeConsentement: methode,
                dateEcheance,
            },
        };
    }
    async consentementSms(dto) {
        const telephone = dto.from.startsWith('+') ? dto.from : `+${dto.from}`;
        const client = await this.prisma.utilisateur.findUnique({
            where: { telephone },
        });
        if (!client) {
            return { succes: true, message: 'Numéro inconnu — ignoré' };
        }
        const credit = await this.prisma.microCredit.findFirst({
            where: {
                clientId: client.id,
                statut: client_1.StatutCredit.EN_ATTENTE,
                methodeConsentement: 'SMS',
                consentementObtenu: false,
            },
            orderBy: { creeLe: 'desc' },
        });
        if (!credit) {
            return {
                succes: true,
                message: 'Aucune demande en attente de consentement',
            };
        }
        const delaiExpire = Date.now() - credit.creeLe.getTime() > DUREE_CONSENTEMENT_MIN * 60 * 1000;
        if (delaiExpire) {
            await this.prisma.microCredit.update({
                where: { id: credit.id },
                data: { statut: client_1.StatutCredit.EXPIRE },
            });
            return {
                succes: true,
                message: 'Délai de consentement expiré — demande annulée',
            };
        }
        const reponse = dto.text.trim();
        if (reponse === '1') {
            await this.prisma.microCredit.update({
                where: { id: credit.id },
                data: { consentementObtenu: true, consentementObtenuLe: new Date() },
            });
            await this.sms.envoyer(telephone, "TontineBénin: Consentement reçu ✅. Votre dossier est transmis à l'administration pour validation.");
            return { succes: true, message: 'Consentement enregistré.' };
        }
        if (reponse === '2') {
            await this.prisma.microCredit.update({
                where: { id: credit.id },
                data: { statut: client_1.StatutCredit.REFUSE },
            });
            await this.sms.envoyer(telephone, 'TontineBénin: Vous avez refusé le micro-crédit. Aucun prélèvement ne sera effectué.');
            return { succes: true, message: 'Crédit refusé par le client.' };
        }
        return { succes: true, message: 'Réponse non reconnue — ignorée' };
    }
    async confirmerPin(creditId, clientId, dto) {
        const [credit, client] = await Promise.all([
            this.prisma.microCredit.findUnique({ where: { id: creditId } }),
            this.prisma.utilisateur.findUnique({ where: { id: clientId } }),
        ]);
        if (!credit)
            throw new common_1.NotFoundException('Micro-crédit introuvable');
        if (credit.clientId !== clientId)
            throw new common_1.ForbiddenException('Accès refusé');
        if (credit.statut !== client_1.StatutCredit.EN_ATTENTE) {
            throw new common_1.BadRequestException({
                message: 'Ce crédit ne peut plus être confirmé',
                code: 'STATUT_INVALIDE',
            });
        }
        if (credit.consentementObtenu) {
            throw new common_1.BadRequestException({
                message: 'Consentement déjà donné',
                code: 'DEJA_CONSENTI',
            });
        }
        if (!client?.pinHash)
            throw new common_1.BadRequestException('PIN non configuré');
        const pinValide = await bcrypt.compare(dto.pin, client.pinHash);
        if (!pinValide) {
            throw new common_1.BadRequestException({
                message: 'PIN incorrect',
                code: 'PIN_INCORRECT',
            });
        }
        await this.prisma.microCredit.update({
            where: { id: creditId },
            data: { consentementObtenu: true, consentementObtenuLe: new Date() },
        });
        return {
            succes: true,
            message: "Consentement confirmé avec PIN. Dossier transmis à l'administration.",
        };
    }
    async enAttente() {
        const credits = await this.prisma.microCredit.findMany({
            where: { statut: client_1.StatutCredit.EN_ATTENTE, consentementObtenu: true },
            include: {
                client: {
                    select: { id: true, nom: true, telephone: true, kycVerifie: true },
                },
            },
            orderBy: { creeLe: 'asc' },
        });
        return {
            succes: true,
            message: `${credits.length} crédit(s) en attente de validation.`,
            donnees: credits,
        };
    }
    async valider(creditId, adminId) {
        this.logger.log(`[valider] crédit ${creditId} validé par admin ${adminId}`);
        const credit = await this.prisma.microCredit.findUnique({
            where: { id: creditId },
            include: { client: { select: { id: true, nom: true, telephone: true } } },
        });
        if (!credit)
            throw new common_1.NotFoundException('Micro-crédit introuvable');
        if (!credit.consentementObtenu) {
            throw new common_1.BadRequestException({
                message: 'Impossible de valider : consentement du client non obtenu',
                code: 'CONSENTEMENT_MANQUANT',
            });
        }
        if (credit.statut !== client_1.StatutCredit.EN_ATTENTE) {
            throw new common_1.BadRequestException({
                message: "Ce crédit n'est plus en attente",
                code: 'STATUT_INVALIDE',
            });
        }
        const transfert = this.kkiapay.initierTransfert({
            montant: credit.montantPrincipalFcfa,
            telephone: credit.client.telephone,
            reference: `credit_${creditId}`,
            motif: `Micro-crédit TontineBénin — ${credit.montantPrincipalFcfa} FCFA`,
        });
        if (!transfert.succes) {
            throw new common_1.BadRequestException({
                message: 'Échec du décaissement KKiaPay',
                code: 'DECAISSEMENT_ECHOUE',
            });
        }
        await this.prisma.microCredit.update({
            where: { id: creditId },
            data: { statut: client_1.StatutCredit.ACTIF, decaisseLE: new Date() },
        });
        await this.sms.envoyer(credit.client.telephone, `TontineBénin: Votre micro-crédit de ${credit.montantPrincipalFcfa} FCFA a été débloqué sur votre Mobile Money ✅. Remboursement: ${credit.paiementJournalierFcfa} FCFA/jour pendant 30 jours.`);
        return {
            succes: true,
            message: `Micro-crédit de ${credit.montantPrincipalFcfa} FCFA décaissé vers ${credit.client.nom}.`,
            donnees: {
                creditId,
                refKKiaPay: transfert.refKKiaPay,
                montantFcfaDecaisse: credit.montantPrincipalFcfa,
            },
        };
    }
    async refuser(creditId, _adminId, dto) {
        const credit = await this.prisma.microCredit.findUnique({
            where: { id: creditId },
            include: { client: { select: { telephone: true } } },
        });
        if (!credit)
            throw new common_1.NotFoundException('Micro-crédit introuvable');
        if (credit.statut !== client_1.StatutCredit.EN_ATTENTE) {
            throw new common_1.BadRequestException({
                message: 'Ce crédit ne peut plus être refusé',
                code: 'STATUT_INVALIDE',
            });
        }
        await this.prisma.microCredit.update({
            where: { id: creditId },
            data: { statut: client_1.StatutCredit.REFUSE },
        });
        await this.sms.envoyer(credit.client.telephone, `TontineBénin: Votre demande de micro-crédit a été refusée. Motif: ${dto.motif}. Continuez à épargner pour améliorer votre score.`);
        return { succes: true, message: 'Micro-crédit refusé. Client notifié.' };
    }
    async mesCredits(clientId) {
        const credits = await this.prisma.microCredit.findMany({
            where: { clientId },
            include: { _count: { select: { remboursements: true } } },
            orderBy: { creeLe: 'desc' },
        });
        return {
            succes: true,
            message: `${credits.length} crédit(s).`,
            donnees: credits,
        };
    }
    async remboursements(creditId, clientId) {
        const credit = await this.prisma.microCredit.findUnique({
            where: { id: creditId },
        });
        if (!credit)
            throw new common_1.NotFoundException('Micro-crédit introuvable');
        if (credit.clientId !== clientId)
            throw new common_1.ForbiddenException('Accès refusé');
        const rembList = await this.prisma.remboursementCredit.findMany({
            where: { microCreditId: creditId },
            orderBy: { payeLe: 'desc' },
        });
        const totalPaye = rembList
            .filter((r) => r.statut === 'SUCCES')
            .reduce((s, r) => s + r.montantFcfa, 0);
        return {
            succes: true,
            message: `${rembList.length} remboursement(s). Total payé: ${totalPaye} FCFA.`,
            donnees: {
                credit: {
                    montantTotalFcfa: credit.montantTotalFcfa,
                    montantRestantFcfa: credit.montantRestantFcfa,
                    joursPayes: credit.joursPayes,
                    totalJours: credit.totalJours,
                    paiementJournalierFcfa: credit.paiementJournalierFcfa,
                    statut: credit.statut,
                },
                remboursements: rembList,
            },
        };
    }
};
exports.MicroCreditsService = MicroCreditsService;
exports.MicroCreditsService = MicroCreditsService = MicroCreditsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kkiapay_service_1.KkiapayService,
        sms_service_1.SmsService])
], MicroCreditsService);
//# sourceMappingURL=micro-credits.service.js.map