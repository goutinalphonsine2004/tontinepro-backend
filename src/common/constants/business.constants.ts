export const BUSINESS = {
  // ═══════════════════════════════════════════════════════
  // MODÈLE ÉCONOMIQUE TONTINEBÉNIN
  // ═══════════════════════════════════════════════════════
  //
  // COTISATION (entrée de fonds) :
  //   0% frais → 100% crédité dans la tontine.
  //
  // RETRAIT / DISTRIBUTION GROUPE — BARÈME PROGRESSIF :
  //
  //   Montant retiré       Standard   Diamant   Agent indép. (40% des frais)
  //   ─────────────────────────────────────────────────────────────────────
  //   ≤ 5 000 FCFA         1.5%       1%        0.6% / 0.4%
  //   5 001 – 25 000       2.5%       1.5%      1.0% / 0.6%
  //   25 001 – 75 000      4.0%       2.5%      1.6% / 1.0%
  //   > 75 000             5.0%       3.0%      2.0% / 1.2%
  //   Minimum absolu       100 FCFA   100 FCFA
  //
  //   Distribution groupe : même barème, pas de commission agent.
  //
  // MICRO-CRÉDIT : 10% intérêt sur 30j → 100% plateforme
  //   Pénalité retard : 2%/semaine du capital restant → 100% plateforme
  //
  // PADME : 3% sur crédit accordé → 100% plateforme
  //
  // FACTURATION AGENTS : abonnement mensuel + 100 FCFA × nb clients actifs
  // ═══════════════════════════════════════════════════════

  // ─── Barème progressif retrait ────────────────────────
  TRANCHES_RETRAIT: [
    { max: 5_000,      tauxStd: 0.015, tauxDiamant: 0.010 },
    { max: 25_000,     tauxStd: 0.025, tauxDiamant: 0.015 },
    { max: 75_000,     tauxStd: 0.040, tauxDiamant: 0.025 },
    { max: Infinity,   tauxStd: 0.050, tauxDiamant: 0.030 },
  ] as const,

  FRAIS_RETRAIT_MINIMUM: 100,    // FCFA — couvre frais opérateur MoMo
  PART_AGENT_RETRAIT: 0.40,      // 40% des frais retrait pour l'agent indépendant

  // ─── Autres taux ──────────────────────────────────────
  TAUX_COMMISSION_COTISATION: 0.0,    // aucun frais sur cotisation
  TAUX_INTERET_MICRO_CREDIT: 0.1,     // 10% sur 30j
  TAUX_PENALITE_RETARD_CREDIT: 0.02,  // 2%/semaine du capital restant
  TAUX_COMMISSION_PADME: 0.03,        // 3% dossier PADME → 100% plateforme

  // ─── Aliases lecture rapports (ne pas utiliser dans les calculs) ──
  TAUX_COMMISSION_BASE: 0.05,
  TAUX_COMMISSION_DIAMANT: 0.03,
  TAUX_COMMISSION_RETRAIT: 0.05,

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

  /**
   * Calcule les frais d'un retrait selon le barème progressif.
   *
   * @param montant          Montant brut retiré (FCFA)
   * @param estDiamant       Badge Diamant → taux réduit
   * @param estAgentIndep    Agent indépendant lié au client → 40% des frais lui revient
   * @returns { fraisTotal, fraisPlateforme, fraisAgent, taux, montantNet }
   *
   * Exemples :
   *   calculerFraisRetrait(3_000)              → frais=100 (min), net=2_900
   *   calculerFraisRetrait(15_000)             → frais=375,       net=14_625
   *   calculerFraisRetrait(15_000, true)       → frais=225,       net=14_775
   *   calculerFraisRetrait(50_000, false, true)→ frais=2_000, agent=800, plat=1_200
   */
  calculerFraisRetrait(
    montant: number,
    estDiamant = false,
    estAgentIndep = false,
  ): {
    fraisTotal: number;
    fraisPlateforme: number;
    fraisAgent: number;
    taux: number;
    montantNet: number;
  } {
    const tranche = BUSINESS.TRANCHES_RETRAIT.find((t) => montant <= t.max)!;
    const taux = estDiamant ? tranche.tauxDiamant : tranche.tauxStd;

    const fraisTotal = Math.max(
      BUSINESS.FRAIS_RETRAIT_MINIMUM,
      Math.ceil(montant * taux),
    );
    const fraisAgent = estAgentIndep
      ? Math.ceil(fraisTotal * BUSINESS.PART_AGENT_RETRAIT)
      : 0;
    const fraisPlateforme = fraisTotal - fraisAgent;

    return {
      fraisTotal,
      fraisPlateforme,
      fraisAgent,
      taux,
      montantNet: montant - fraisTotal,
    };
  },

  /** Cotisation → toujours 0 (frais prélevés uniquement au retrait). */
  calculerFraisPlateforme(_montant: number, _estDiamant = false): number {
    return 0;
  },

  /** @deprecated Cotisation → 0 commission agent. Conservé pour compatibilité. */
  calculerCommissionAgent(_montant: number, _estIndependant: boolean): number {
    return 0;
  },

  calculerInteretMicroCredit(montantPrincipalFcfa: number): number {
    return Math.ceil(montantPrincipalFcfa * 0.1);
  },

  calculerMontantTotal(montantPrincipalFcfa: number): number {
    return Math.ceil(montantPrincipalFcfa * 1.1);
  },

  calculerPaiementJournalier(montantTotalFcfa: number, jours: number): number {
    return Math.ceil(montantTotalFcfa / jours);
  },

  getPlafondMicroCredit(score: number): number {
    if (score >= 90) return 100_000;
    if (score >= 80) return 50_000;
    if (score >= 70) return 25_000;
    if (score >= 60) return 10_000;
    return 0;
  },

  calculerCommissionPADME(montantCreditAccorde: number): number {
    return Math.ceil(montantCreditAccorde * 0.03);
  },

  /** Pénalité retard micro-crédit : 2%/semaine du capital restant. */
  calculerPenaliteRetard(capitalRestant: number, nbSemainesRetard: number): number {
    return Math.ceil(capitalRestant * 0.02 * nbSemainesRetard);
  },
};
