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
  TAUX_COMMISSION_BASE: 0.03, // 3% standard sur cotisation
  TAUX_COMMISSION_DIAMANT: 0.02, // 2% pour les clients fidèles (Badge Diamant)
  TAUX_COMMISSION_RETRAIT: 0.02, // 2% sur retraits ET distributions GROUPE
  TAUX_COMMISSION_COTISATION: 0.03, // Alias pour compatibilité

  TAUX_INTERET_MICRO_CREDIT: 0.1, // 10% d'intérêt sur micro-crédit (100% plateforme)
  TAUX_COMMISSION_PADME: 0.03, // 3% sur crédit PADME accordé (100% plateforme)

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
    const taux = estDiamant ? 0.02 : 0.03;
    return montant * taux;
  },

  /** Calcule les frais de retrait (MoMo + Marge) */
  calculerFraisRetrait(montant: number): number {
    return montant * 0.02;
  },

  calculerInteretMicroCredit(montantPrincipalFcfa: number): number {
    return montantPrincipalFcfa * 0.1;
  },

  calculerMontantTotal(montantPrincipalFcfa: number): number {
    return montantPrincipalFcfa * 1.1;
  },

  calculerPaiementJournalier(montantTotalFcfa: number, jours: number): number {
    return Math.ceil(montantTotalFcfa / jours);
  },

  getPlafondMicroCredit(score: number): number {
    if (score >= 90) return 100000;
    if (score >= 80) return 50000;
    if (score >= 70) return 25000;
    if (score >= 60) return 10000;
    return 0;
  },

  calculerCommissionAgent(
    montantCotisation: number,
    estIndependant: boolean,
  ): number {
    if (!estIndependant) return 0;
    return montantCotisation * 0.03 * 0.5; // 1.5%
  },

  calculerCommissionPADME(montantCreditAccorde: number): number {
    return montantCreditAccorde * 0.03; // 3%
  },
};
