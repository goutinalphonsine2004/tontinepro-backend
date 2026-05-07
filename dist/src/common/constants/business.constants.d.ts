export declare const BUSINESS: {
    TAUX_COMMISSION_COTISATION: number;
    TAUX_INTERET_MICRO_CREDIT: number;
    TAUX_COMMISSION_PADME: number;
    ABONNEMENT_STANDARD: number;
    ABONNEMENT_PRO: number;
    PLAFONDS_MICRO_CREDIT: {
        SCORE_60_70: number;
        SCORE_70_80: number;
        SCORE_80_90: number;
        SCORE_90_PLUS: number;
    };
    SEUIL_RETRAIT_ADMIN: number;
    SEUIL_SCORE_PADME: number;
    SEUIL_SCORE_MICRO_CREDIT: number;
    MAX_TENTATIVES_PIN: number;
    DUREE_OTP_MINUTES: number;
    calculerFraisPlateforme(montant: number): number;
    calculerInteretMicroCredit(montantPrincipal: number): number;
    calculerMontantTotal(montantPrincipal: number): number;
    calculerPaiementJournalier(montantTotal: number, jours: number): number;
    getPlafondMicroCredit(score: number): number;
    calculerCommissionAgent(montantCotisation: number): number;
    calculerCommissionPADME(montantCreditAccorde: number): number;
};
