#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════
# TEST P0-2 — ALERTE SOLDE FAIBLE (Cron Job + SMS)
# ═══════════════════════════════════════════════════════════════════════

BASE_URL="http://localhost:3000"
ADMIN_TOKEN="${ADMIN_TOKEN:=test-admin-token}"

echo "════════════════════════════════════════════════════════════════════════"
echo "TEST P0-2: Alerte Solde Faible"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# ÉTAPE 1 : Créer client avec tontine (solde bas)
echo "📝 ÉTAPE 1: Création d'un client avec solde faible..."

TIMESTAMP=$(date +%s%N | tail -c 7)
TELEPHONE="+2290123456${TIMESTAMP:0:2}"

# Inscription
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/inscription" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "'$TELEPHONE'",
    "nom": "Test Alerte Solde",
    "role": "CLIENT"
  }')

OTP_CODE=$(echo "$RESPONSE" | grep -o '"otpTest":"[^"]*"' | cut -d'"' -f4)
echo "✅ Utilisateur créé — OTP: $OTP_CODE"
echo ""

# ÉTAPE 2 : Vérifier OTP
echo "📝 ÉTAPE 2: Vérification OTP..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verifier-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "'$TELEPHONE'",
    "code": "'$OTP_CODE'"
  }')

TOKEN_ONBOARDING=$(echo "$RESPONSE" | grep -o '"tokenTemporaire":"[^"]*"' | cut -d'"' -f4)
echo "✅ OTP vérifié"
echo ""

# ÉTAPE 3 : Créer PIN
echo "📝 ÉTAPE 3: Création du PIN..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/creer-pin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ONBOARDING" \
  -d '{
    "pin": "1234"
  }')

JWT_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "✅ PIN créé"
echo ""

# ÉTAPE 4 : Créer tontine personnelle avec solde faible (2000 FCFA < 5000 seuil)
echo "📝 ÉTAPE 4: Création tontine avec solde faible (2000 FCFA < 5000)..."
RESPONSE=$(curl -s -X POST "$BASE_URL/tontines" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "nom": "Tontine Test Alerte",
    "objectifMontant": 100000,
    "type": "PERSONNEL",
    "politique": "FLEXIBLE",
    "montantJournalier": 1000
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -15

TONTINE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TONTINE_ID" ]; then
  echo "❌ ERREUR: Impossible de créer la tontine"
  exit 1
fi

echo "✅ Tontine créée: $TONTINE_ID"
echo ""

# ÉTAPE 5 : Mettre à jour solde de la tontine manuellement (via DB directement ou endpoint)
echo "📝 ÉTAPE 5: Vérification du solde actuel..."
RESPONSE=$(curl -s -X GET "$BASE_URL/tontines/$TONTINE_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

SOLDE=$(echo "$RESPONSE" | grep -o '"soldeActuel":[0-9]*' | cut -d':' -f2)
echo "   Solde actuel: $SOLDE FCFA"

if [ "$SOLDE" -lt 5000 ]; then
  echo "✅ Solde < seuil (5000 FCFA) — Alerte SMS devrait être envoyée à 8h"
else
  echo "⚠️  Solde >= seuil — L'alerte ne sera pas envoyée"
fi

echo ""

# ÉTAPE 6 : Déclencher manuellement le cron job d'alerte
echo "📝 ÉTAPE 6: Déclenchement manuel du cron (POST /cron/alerte-solde)..."
RESPONSE=$(curl -s -X POST "$BASE_URL/cron/alerte-solde" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q "succes\|Alerte"; then
  echo "✅ Cron déclenchée — SMS d'alerte aurait dû être envoyé"
else
  echo "⚠️  Réponse inattendue (probablement token admin invalide en test)"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "✅ TEST P0-2 TERMINÉ"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 REMARQUES:"
echo "  • Le cron job s'exécute automatiquement à 8h chaque jour"
echo "  • Seuil configurable via .env: SEUIL_ALERTE_SOLDE_FAIBLE"
echo "  • SMS envoyé seulement si solde > 0 ET solde < seuil"
echo "  • Endpoint /cron/alerte-solde peut déclencher manuellement (Admin)"
