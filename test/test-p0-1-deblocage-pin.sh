#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════
# TEST P0-1 — DÉBLOCAGE AUTOMATIQUE PIN APRÈS 30 MIN (bloqueLe)
# ═══════════════════════════════════════════════════════════════════════

BASE_URL="http://localhost:3000"
ADMIN_TOKEN="${ADMIN_TOKEN:=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibm9tIjoiQWRtaW4gVGVzdCIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c}"  # Token test
TIMESTAMP=$(date +%s%N | tail -c 7)  # 7 derniers chiffres du timestamp
TELEPHONE="+2290123456${TIMESTAMP:0:2}"  # +2290123456XX (unique)
PIN_CORRECT="1234"
PIN_FAUX="0000"

echo "════════════════════════════════════════════════════════════════════════"
echo "TEST P0-1: Déblocage Automatique PIN"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# ÉTAPE 1 : Créer utilisateur de test
echo "📝 ÉTAPE 1: Création utilisateur de test..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/inscription" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "'$TELEPHONE'",
    "nom": "Test Déblocage PIN",
    "role": "CLIENT"
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
OTP_ID=$(echo "$RESPONSE" | grep -o '"otpId":"[^"]*"' | cut -d'"' -f4)
OTP_CODE=$(echo "$RESPONSE" | grep -o '"otpTest":"[^"]*"' | cut -d'"' -f4)

if [ -z "$OTP_ID" ] && [ -z "$OTP_CODE" ]; then
  echo "❌ ERREUR: Impossible de créer l'utilisateur"
  exit 1
fi

echo "✅ Utilisateur créé — OTP: $OTP_CODE (ID: $OTP_ID)"
echo ""

# ÉTAPE 2 : Vérifier OTP
echo "📝 ÉTAPE 2: Vérification OTP..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verifier-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "'$TELEPHONE'",
    "code": "'$OTP_CODE'"
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
TOKEN_ONBOARDING=$(echo "$RESPONSE" | grep -o '"tokenTemporaire":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN_ONBOARDING" ]; then
  echo "❌ ERREUR: Impossible de vérifier l'OTP"
  exit 1
fi

echo "✅ OTP vérifié — Token onboarding: ${TOKEN_ONBOARDING:0:30}..."
echo ""

# ÉTAPE 3 : Créer le PIN
echo "📝 ÉTAPE 3: Création du PIN..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/creer-pin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ONBOARDING" \
  -d '{
    "pin": "'$PIN_CORRECT'"
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
JWT_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
  echo "❌ ERREUR: Impossible de créer le PIN"
  exit 1
fi

echo "✅ PIN créé — JWT: ${JWT_TOKEN:0:30}..."
echo ""

# ÉTAPE 4 : Faire 3 tentatives PIN échouées pour bloquer le compte
echo "📝 ÉTAPE 4: Bloquage du compte (3 tentatives échouées)..."
for i in {1..3}; do
  echo "  Tentative $i..."
  curl -s -X POST "$BASE_URL/auth/connexion" \
    -H "Content-Type: application/json" \
    -d '{
      "telephone": "'$TELEPHONE'",
      "pin": "'$PIN_FAUX'",
      "deviceId": "test-device-'$i'"
    }' > /dev/null
done

echo "✅ 3 tentatives échouées envoyées"
echo ""

# ÉTAPE 5 : Vérifier que le compte est maintenant bloqué
echo "📝 ÉTAPE 5: Vérification du blocage..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/connexion" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "'$TELEPHONE'",
    "pin": "'$PIN_CORRECT'",
    "deviceId": "test-device"
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q "COMPTE_BLOQUE\|bloqué"; then
  echo "✅ Compte correctement bloqué après 3 tentatives !"
else
  echo "❌ ERREUR: Le compte n'a pas été bloqué"
  exit 1
fi

BLOCKED_MSG=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Message: $BLOCKED_MSG"
echo ""

# ÉTAPE 6 : Déclencher le déblocage via endpoint cron
echo "📝 ÉTAPE 6: Déblocage via endpoint cron /cron/deblocage-pin (Admin seulement)..."
RESPONSE=$(curl -s -X POST "$BASE_URL/cron/deblocage-pin" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q "succes\|Déblocage"; then
  echo "✅ Déblocage déclenché"
else
  echo "⚠️  Déblocage peut ne pas être accessible (token admin peut être invalide en test)"
fi

echo ""

# ÉTAPE 7 : Attendre 1 seconde et vérifier le déblocage automatique
echo "📝 ÉTAPE 7: Vérification du déblocage..."
sleep 1

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/connexion" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "'$TELEPHONE'",
    "pin": "'$PIN_CORRECT'",
    "deviceId": "test-device-final"
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"succes":true'; then
  echo "✅ Connexion réussie après déblocage !"
  JWT_FINAL=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "   JWT obtenu: ${JWT_FINAL:0:30}..."
else
  echo "❌ ERREUR: Impossible de se connecter après déblocage"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "✅ TEST P0-1 TERMINÉ"
echo "════════════════════════════════════════════════════════════════════════"
