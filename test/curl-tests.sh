#!/bin/bash
# ═══════════════════════════════════════════════════
# TESTS CURL — TontinePro Backend
# Usage : bash test/curl-tests.sh
# ═══════════════════════════════════════════════════

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

check() {
  local label=$1
  local result=$2
  local expected=$3
  if echo "$result" | grep -q "$expected"; then
    echo "  ✅ $label"
    PASS=$((PASS+1))
  else
    echo "  ❌ $label"
    echo "     Réponse: $result"
    FAIL=$((FAIL+1))
  fi
}

# ─────────────────────────────────────────────────────
# PHASE 1 — FONDATION
# ─────────────────────────────────────────────────────

echo ""
echo "══════════════════════════════════════════════"
echo " PHASE 1 — FONDATION"
echo "══════════════════════════════════════════════"

echo ""
echo "=== TEST: Endpoint de santé ==="
RESULT=$(curl -s -X GET "$BASE_URL/health")
check "GET /health → succes: true" "$RESULT" '"succes":true'
check "GET /health → statut: ok" "$RESULT" '"statut":"ok"'
check "GET /health → version: 1.0.0" "$RESULT" '"version":"1.0.0"'

# ─────────────────────────────────────────────────────
# PHASE 1.4 — MODULE AUTH
# ─────────────────────────────────────────────────────

echo ""
echo "══════════════════════════════════════════════"
echo " PHASE 1.4 — MODULE AUTH"
echo "══════════════════════════════════════════════"

# Numéro unique pour éviter conflits (format Bénin: +229 + 8 chiffres)
SUFFIX=$(printf '%08d' $((RANDOM * RANDOM % 100000000)))
TEL="+229${SUFFIX}"

echo ""
echo "=== TEST: POST /auth/inscription ==="
R_INSCR=$(curl -s -X POST "$BASE_URL/auth/inscription" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"nom\":\"Test Curl\",\"role\":\"CLIENT\"}")
check "Inscription → succes: true" "$R_INSCR" '"succes":true'
check "Inscription → OTP présent (dev)" "$R_INSCR" '"otpTest":'
OTP=$(echo $R_INSCR | python3 -c "import sys,json; print(json.load(sys.stdin)['donnees']['otpTest'])" 2>/dev/null)

echo ""
echo "=== TEST: POST /auth/inscription (doublon) ==="
R_DUP=$(curl -s -X POST "$BASE_URL/auth/inscription" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"nom\":\"Doublon\"}")
check "Doublon → succes: false" "$R_DUP" '"succes":false'
check "Doublon → code TELEPHONE_EXISTANT" "$R_DUP" 'TELEPHONE_EXISTANT'

echo ""
echo "=== TEST: POST /auth/inscription (téléphone invalide) ==="
R_INV=$(curl -s -X POST "$BASE_URL/auth/inscription" \
  -H "Content-Type: application/json" \
  -d '{"telephone":"0097000001","nom":"Invalide"}')
check "Téléphone invalide → succes: false" "$R_INV" '"succes":false'

echo ""
echo "=== TEST: POST /auth/verifier-otp ==="
R_OTP=$(curl -s -X POST "$BASE_URL/auth/verifier-otp" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"code\":\"$OTP\"}")
check "Vérifier OTP → succes: true" "$R_OTP" '"succes":true'
check "Vérifier OTP → tokenTemporaire présent" "$R_OTP" 'tokenTemporaire'
TOKEN_TEMP=$(echo $R_OTP | python3 -c "import sys,json; print(json.load(sys.stdin)['donnees']['tokenTemporaire'])" 2>/dev/null)

echo ""
echo "=== TEST: POST /auth/verifier-otp (OTP déjà utilisé) ==="
R_OTP2=$(curl -s -X POST "$BASE_URL/auth/verifier-otp" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"code\":\"$OTP\"}")
check "OTP déjà utilisé → code OTP_INVALIDE" "$R_OTP2" 'OTP_INVALIDE'

echo ""
echo "=== TEST: POST /auth/creer-pin ==="
R_PIN=$(curl -s -X POST "$BASE_URL/auth/creer-pin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_TEMP" \
  -d '{"pin":"1234"}')
check "Créer PIN → succes: true" "$R_PIN" '"succes":true'
check "Créer PIN → accessToken présent" "$R_PIN" 'accessToken'
check "Créer PIN → refreshToken présent" "$R_PIN" 'refreshToken'

echo ""
echo "=== TEST: POST /auth/connexion ==="
R_CONN=$(curl -s -X POST "$BASE_URL/auth/connexion" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"pin\":\"1234\"}")
check "Connexion → succes: true" "$R_CONN" '"succes":true'
check "Connexion → role présent" "$R_CONN" '"role"'
check "Connexion → nom présent" "$R_CONN" '"nom"'
ACCESS=$(echo $R_CONN | python3 -c "import sys,json; print(json.load(sys.stdin)['donnees']['accessToken'])" 2>/dev/null)
REFRESH=$(echo $R_CONN | python3 -c "import sys,json; print(json.load(sys.stdin)['donnees']['refreshToken'])" 2>/dev/null)

echo ""
echo "=== TEST: POST /auth/connexion (PIN incorrect) ==="
R_BADPIN=$(curl -s -X POST "$BASE_URL/auth/connexion" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"pin\":\"9999\"}")
check "PIN incorrect → code PIN_INCORRECT" "$R_BADPIN" 'PIN_INCORRECT'
check "PIN incorrect → succes: false" "$R_BADPIN" '"succes":false'

echo ""
echo "=== TEST: POST /auth/rafraichir-token ==="
R_REFRESH=$(curl -s -X POST "$BASE_URL/auth/rafraichir-token" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}")
check "Rafraîchir token → succes: true" "$R_REFRESH" '"succes":true'
check "Rafraîchir token → nouvel accessToken" "$R_REFRESH" 'accessToken'

echo ""
echo "=== TEST: POST /auth/deconnexion ==="
R_DECO=$(curl -s -X POST "$BASE_URL/auth/deconnexion" \
  -H "Authorization: Bearer $ACCESS")
check "Déconnexion → succes: true" "$R_DECO" '"succes":true'

echo ""
echo "=== TEST: Route protégée sans token ==="
R_NAUTH=$(curl -s -X POST "$BASE_URL/auth/deconnexion")
check "Sans token → succes: false" "$R_NAUTH" '"succes":false'

echo ""
echo "══════════════════════════════════════════════"
echo " RÉSUMÉ : $PASS tests réussis, $FAIL échecs"
echo "══════════════════════════════════════════════"
echo ""
