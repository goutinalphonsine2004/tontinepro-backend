"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUSINESS = void 0;
exports.BUSINESS = {
    TAUX_COMMISSION_COTISATION: 0.02,
    TAUX_INTERET_MICRO_CREDIT: 0.10,
    TAUX_COMMISSION_PADME: 0.03,
    ABONNEMENT_STANDARD: 2500,
    ABONNEMENT_PRO: 5000,
    PLAFONDS_MICRO_CREDIT: {
        SCORE_60_70: 10000,
        SCORE_70_80: 25000,
        SCORE_80_90: 50000,
        SCORE_90_PLUS: 100000,
    },
    SEUIL_RETRAIT_ADMIN: 50000,
    SEUIL_SCORE_PADME: 70,
    SEUIL_SCORE_MICRO_CREDIT: 60,
    MAX_TENTATIVES_PIN: 3,
    DUREE_OTP_MINUTES: 10,
    calculerFraisPlateforme(montant) {
        return montant * this.TAUX_COMMISSION_COTISATION;
    },
    calculerInteretMicroCredit(montantPrincipal) {
        return montantPrincipal * this.TAUX_INTERET_MICRO_CREDIT;
    },
    calculerMontantTotal(montantPrincipal) {
        return montantPrincipal + this.calculerInteretMicroCredit(montantPrincipal);
    },
    calculerPaiementJournalier(montantTotal, jours) {
        return Math.ceil(montantTotal / jours);
    },
    getPlafondMicroCredit(score) {
        if (score >= 90)
            return this.PLAFONDS_MICRO_CREDIT.SCORE_90_PLUS;
        if (score >= 80)
            return this.PLAFONDS_MICRO_CREDIT.SCORE_80_90;
        if (score >= 70)
            return this.PLAFONDS_MICRO_CREDIT.SCORE_70_80;
        if (score >= 60)
            return this.PLAFONDS_MICRO_CREDIT.SCORE_60_70;
        return 0;
    },
    calculerCommissionAgent(montantCotisation) {
        return this.calculerFraisPlateforme(montantCotisation) * 0.5;
    },
    calculerCommissionPADME(montantCreditAccorde) {
        return montantCreditAccorde * this.TAUX_COMMISSION_PADME;
    },
};
//# sourceMappingURL=business.constants.js.map