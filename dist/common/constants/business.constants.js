"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUSINESS = void 0;
exports.BUSINESS = {
    TAUX_COMMISSION_BASE: 0.03,
    TAUX_COMMISSION_DIAMANT: 0.02,
    TAUX_COMMISSION_RETRAIT: 0.02,
    TAUX_COMMISSION_COTISATION: 0.03,
    TAUX_INTERET_MICRO_CREDIT: 0.1,
    TAUX_COMMISSION_PADME: 0.03,
    ABONNEMENT_STANDARD: 2500,
    ABONNEMENT_PRO: 5000,
    FRAIS_PAR_CLIENT_MENSUEL: 100,
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
    calculerFraisPlateforme(montant, estDiamant = false) {
        const taux = estDiamant ? 0.02 : 0.03;
        return montant * taux;
    },
    calculerFraisRetrait(montant) {
        return montant * 0.02;
    },
    calculerInteretMicroCredit(montantPrincipalFcfa) {
        return montantPrincipalFcfa * 0.1;
    },
    calculerMontantTotal(montantPrincipalFcfa) {
        return montantPrincipalFcfa * 1.1;
    },
    calculerPaiementJournalier(montantTotalFcfa, jours) {
        return Math.ceil(montantTotalFcfa / jours);
    },
    getPlafondMicroCredit(score) {
        if (score >= 90)
            return 100000;
        if (score >= 80)
            return 50000;
        if (score >= 70)
            return 25000;
        if (score >= 60)
            return 10000;
        return 0;
    },
    calculerCommissionAgent(montantCotisation, estIndependant) {
        if (!estIndependant)
            return 0;
        return montantCotisation * 0.03 * 0.5;
    },
    calculerCommissionPADME(montantCreditAccorde) {
        return montantCreditAccorde * 0.03;
    },
};
//# sourceMappingURL=business.constants.js.map