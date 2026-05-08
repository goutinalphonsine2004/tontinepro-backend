#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════
# TEST P0-3 — RÉCUPÉRATION DE COMPTE PAR SMS (Reset PIN)
# ═══════════════════════════════════════════════════════════════════════

BASE_URL="http://localhost:3000"

echo "════════════════════════════════════════════════════════════════════════"
echo "TEST P0-3: Récupération de Compte par SMS"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# ÉTAPE 1 : Créer un compte de test
echo "📝 ÉTAPE 1: Création d'un utilisateur de test..."

TIMESTAMP=$(date +%s%N | tail -c 7)
TELEPHONE="+2290123456${TIMESTAMP:0:2}"

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/inscription" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "'$TELEPHONE'",
    "nom": "Test Récupération",
    "role": "CLIENT"
  }')

OTP_INSCRIPTION=$(echo "$RESPONSE" | grep -o '"otpTest":"[^"]*"' | cut -d'"' -f4)
echo "✅ Utilisateur créé — OTP inscription: $OTP_INSCRIPTION"
echo ""

# ÉTAPE 2 : Vérifier OTP et créer PIN
echo "📝 ÉTAPE 2: Vérification OTP et création du PIN..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verifier-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "'$TELEPHONE'",
    "code": "'$OTP_INSCRIPTION'"
  }')

TOKEN_ONBOARDING=$(echo "$RESPONSE" | grep -o '"tokenTemporaire":"[^"]*"' | cut -d'"' -f4)

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/creer-pin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ONBOARDING" \
  -d '{"pin": "1234"}')

JWT_INITIAL=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "✅ Compte créé avec PIN 1234"
echo ""

# ÉTAPE 3 : Demander reset PIN (oublié son PIN)
echo "📝 ÉTAPE 3: Demande de récupération de compte (demander-reset-pin)..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/demander-reset-pin" \
  -H "Content-Type: application/json" \
  -d '{"telephone": "'$TELEPHONE'"}')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

OTP_RESET=$(echo "$RESPONSE" | grep -o '"otpTest":"[^"]*"' | cut -d'"' -f4)

if [ -z "$OTP_RESET" ]; then
  echo "❌ ERREUR: Pas d'OTP reçu"
  exit 1
fi

echo "✅ OTP de réinitialisation envoyé: $OTP_RESET"
echo ""

# ÉTAPE 4 : Vérifier OTP reset
echo "📝 ÉTAPE 4: Vérification OTP de réinitialisation..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verifier-otp-reset-pin" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "'$TELEPHONE'",
    "code": "'$OTP_RESET'"
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -10

TOKEN_RESET=$(echo "$RESPONSE" | grep -o '"tokenReset":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN_RESET" ]; then
  echo "❌ ERREUR: Token reset non reçu"
  exit 1
fi

echo "✅ OTP vérifié — Token reset: ${TOKEN_RESET:0:30}..."
echo ""

# ÉTAPE 5 : Réinitialiser le PIN avec un nouveau PIN
echo "📝 ÉTAPE 5: Réinitialisation du PIN (nouveau PIN: 9999)..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/reinitialiser-pin" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenReset": "'$TOKEN_RESET'",
    "nouveauPin": "9999"
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null

if echo "$RESPONSE" | grep -q '"succes":true'; then
  echo "✅ PIN réinitialisé avec succès"
else
  echo "❌ ERREUR: Impossible de réinitialiser le PIN"
  exit 1
fi

echo ""

# ÉTAPE 6 : Se reconnecter avec le nouveau PIN
echo "📝 ÉTAPE 6: Connexion avec le nouveau PIN (9999)..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/connexion" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "'$TELEPHONE'",
    "pin": "9999",
    "deviceId": "test-device-recovery"
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -15

if echo "$RESPONSE" | grep -q '"succes":true'; then
  echo "✅ Connexion réussie avec le nouveau PIN"
  JWT_FINAL=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "   JWT obtenu: ${JWT_FINAL:0:30}..."
else
  echo "❌ ERREUR: Impossible de se connecter avec le nouveau PIN"
  exit 1
fi

echo ""

# ÉTAPE 7 : Vérifier que l'ancien PIN ne fonctionne plus
echo "📝 ÉTAPE 7: Vérification que l'ancien PIN (1234) ne marche plus..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/connexion" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "'$TELEPHONE'",
    "pin": "1234",
    "deviceId": "test-device-old"
  }')

if echo "$RESPONSE" | grep -q '"succes":false'; then
  echo "✅ Ancien PIN correctement rejeté"
else
  echo "❌ ERREUR: L'ancien PIN n'aurait pas dû fonctionner"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "✅ TEST P0-3 TERMINÉ AVEC SUCCÈS"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 FLUX RÉCUPÉRATION DE COMPTE:"
echo "  1. POST /auth/demander-reset-pin (OTP SMS envoyé)"
echo "  2. POST /auth/verifier-otp-reset-pin (reçoit tokenReset)"
echo "  3. POST /auth/reinitialiser-pin (nouveau PIN)"
echo "  4. POST /auth/connexion (utilise le nouveau PIN)"
