#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Baseline + déploiement des migrations Prisma pour TontinePro.
#
# Contexte :
#   La base contient déjà toutes les tables (créées par un ancien `db push`
#   ou un reset historique), mais la table _prisma_migrations est vide.
#   On marque donc les 16 migrations existantes comme `applied` (baseline),
#   puis on déploie les 2 nouvelles migrations:
#     - 20260514200000_fix_float_to_int_fcfa
#     - 20260514200100_add_idempotency_key
#
# ⚠️  PRÉREQUIS : avoir lancé un `pg_dump` complet avant.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ Étape 1/3 — Baseline des 16 migrations existantes"
for mig in \
  20260507171149_init \
  20260507215741_add_ordre_tirage_utilisateur_relation \
  20260507220440_add_statut_credit_refuse_expire \
  20260508165900_add_token_push_utilisateur \
  20260508170000_add_sessions_utilisateur \
  20260508173000_add_preferences_notifications \
  20260508174653_ajouter_biometrie \
  20260508195000_retraits_tontine_et_defaillances \
  20260509090000_alertes_systeme_circuit_breaker \
  20260509113438_add_missing_features \
  20260509130729_add_caution_montant \
  20260509183624_add_tentatives_otp \
  20260510220709_ajout_statut_frequence_tontine_mvp \
  20260511085242_sync_schema_changes \
  20260512140000_group_tontine_config \
  20260514143000_assisted_operations
do
  echo "   • resolve --applied $mig"
  npx prisma migrate resolve --applied "$mig"
done

echo ""
echo "▶ Étape 2/3 — Application des 2 nouvelles migrations"
npx prisma migrate deploy

echo ""
echo "▶ Étape 3/3 — Régénération du client Prisma"
npx prisma generate

echo ""
echo "✅ Migrations terminées avec succès."
echo "   Vérifie avec :  npx prisma migrate status"
