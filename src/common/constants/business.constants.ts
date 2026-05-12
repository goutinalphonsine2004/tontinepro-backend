export const BUSINESS = {
  // ─── Commissions ──────────────────────────────────────
  TAUX_COMMISSION_BASE: 0.03,         // 3% standard sur cotisation
  TAUX_COMMISSION_DIAMANT: 0.02,      // 2% pour les clients fidèles (Badge Diamant)
  TAUX_COMMISSION_RETRAIT: 0.02,      // 2% sur les retraits (couvre frais MoMo + marge)
  TAUX_COMMISSION_COTISATION: 0.03,   // Alias pour compatibilité
  
  TAUX_INTERET_MICRO_CREDIT: 0.10,    // 10% d'intérêt sur micro-crédit
  TAUX_COMMISSION_PADME: 0.03,        // 3% commission sur crédit PADME accordé

  // ─── Abonnements collecteurs (FCFA) ───────────────────
  ABONNEMENT_STANDARD: 2500,
  ABONNEMENT_PRO: 5000,
  FRAIS_PAR_CLIENT_MENSUEL: 100,      // 100 F par client actif / mois pour les indépendants

  // ─── Plafonds micro-crédit par score (FCFA) ───────────
  PLAFONDS_MICRO_CREDIT: {
    SCORE_60_70: 10000,
    SCORE_70_80: 25000,
    SCORE_80_90: 50000,
    SCORE_90_PLUS: 100000,
  },

  // ─── Seuils généraux ──────────────────────────────────
  SEUIL_RETRAIT_ADMIN: 50000,
  SEUIL_SCORE_PADME: 70,
  SEUIL_SCORE_MICRO_CREDIT: 60,
  MAX_TENTATIVES_PIN: 3,
  DUREE_OTP_MINUTES: 10,

  // ─── Calculs financiers ───────────────────────────────

  /** Calcule les frais plateforme selon le niveau du client */
  calculerFraisPlateforme(montant: number, estDiamant = false): number {
    const taux = estDiamant ? this.TAUX_COMMISSION_DIAMANT : this.TAUX_COMMISSION_BASE;
    return montant * taux;
  },

  /** Calcule les frais de retrait (MoMo + Marge) */
  calculerFraisRetrait(montant: number): number {
    return montant * this.TAUX_COMMISSION_RETRAIT;
  },

  calculerInteretMicroCredit(montantPrincipal: number): number {
    return montantPrincipal * this.TAUX_INTERET_MICRO_CREDIT;
  },

  calculerMontantTotal(montantPrincipal: number): number {
    return montantPrincipal + this.calculerInteretMicroCredit(montantPrincipal);
  },

  calculerPaiementJournalier(montantTotal: number, jours: number): number {
    return Math.ceil(montantTotal / jours);
  },

  getPlafondMicroCredit(score: number): number {
    if (score >= 90) return this.PLAFONDS_MICRO_CREDIT.SCORE_90_PLUS;
    if (score >= 80) return this.PLAFONDS_MICRO_CREDIT.SCORE_80_90;
    if (score >= 70) return this.PLAFONDS_MICRO_CREDIT.SCORE_70_80;
    if (score >= 60) return this.PLAFONDS_MICRO_CREDIT.SCORE_60_70;
    return 0;
  },

  /** 
   * Calcule la commission de l'agent.
   * L'agent reçoit 50% de la commission SI il est indépendant.
   * Si c'est un membre de l'équipe (AGENT salairé), la plateforme garde tout (3%).
   */
  calculerCommissionAgent(montantCotisation: number, estIndependant: boolean): number {
    if (!estIndependant) return 0;
    return (montantCotisation * this.TAUX_COMMISSION_BASE) * 0.5;
  },

  calculerCommissionPADME(montantCreditAccorde: number): number {
    return montantCreditAccorde * this.TAUX_COMMISSION_PADME;
  },
};
