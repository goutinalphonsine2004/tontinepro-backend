export const BUSINESS = {
  // ═══════════════════════════════════════════════════════
  // MODÈLE ÉCONOMIQUE TONTINEBÉNIN
  // ═══════════════════════════════════════════════════════
  //
  // COTISATION (entrée de fonds) :
  //   Client standard  → 3% prélevés   → 1.5% plateforme + 1.5% agent INDÉPENDANT
  //   Client DIAMANT   → 2% prélevés   → 1%   plateforme + 1%   agent INDÉPENDANT
  //   Agent SALARIÉ    → 3% plateforme entier (pas de commission agent)
  //
  // RETRAIT / DISTRIBUTION GROUPE (sortie de fonds) :
  //   Taux fixe 2%     → 100% plateforme (couvre frais MoMo + marge)
  //
  // MICRO-CRÉDIT : 10% d'intérêt sur 30 jours → 100% plateforme
  //
  // PADME : 3% sur crédit accordé → 100% plateforme (aucun partage avec collecteurs)
  //
  // FACTURATION AGENTS : abonnement mensuel + 100 FCFA × nb clients actifs
  // ═══════════════════════════════════════════════════════

  // ─── Taux commissions ────────────────────────────────
  TAUX_COMMISSION_BASE: 0.03,      // 3% standard sur cotisation
  TAUX_COMMISSION_DIAMANT: 0.02,   // 2% pour les clients fidèles (Badge Diamant)
  TAUX_COMMISSION_RETRAIT: 0.02,   // 2% sur retraits ET distributions GROUPE
  TAUX_COMMISSION_COTISATION: 0.03, // Alias pour compatibilité

  TAUX_INTERET_MICRO_CREDIT: 0.1,  // 10% d'intérêt sur micro-crédit (100% plateforme)
  TAUX_COMMISSION_PADME: 0.03,     // 3% sur crédit PADME accordé (100% plateforme)

  // ─── Abonnements collecteurs (FCFA) ───────────────────
  ABONNEMENT_STANDARD: 2500,
  ABONNEMENT_PRO: 5000,
  FRAIS_PAR_CLIENT_MENSUEL: 100, // 100 F par client actif / mois (prélevé en cron 1er/mois)

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
    const taux = estDiamant
      ? this.TAUX_COMMISSION_DIAMANT
      : this.TAUX_COMMISSION_BASE;
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
   * Commission de l'agent sur une cotisation.
   * INDÉPENDANT : reçoit 50% des frais plateforme (1.5% sur 3%, ou 1% sur 2% DIAMANT).
   * SALARIÉ (AGENT) : 0% — la plateforme garde tout (sert à financer le salaire fixe).
   */
  calculerCommissionAgent(
    montantCotisation: number,
    estIndependant: boolean,
  ): number {
    if (!estIndependant) return 0;
    return montantCotisation * this.TAUX_COMMISSION_BASE * 0.5; // 1.5%
  },

  /**
   * Commission PADME sur un crédit accordé.
   * 100% plateforme — aucun partage avec les collecteurs (indépendants ou salariés).
   */
  calculerCommissionPADME(montantCreditAccorde: number): number {
    return montantCreditAccorde * this.TAUX_COMMISSION_PADME; // 3%
  },
};
