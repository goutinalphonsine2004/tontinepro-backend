#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TESTS CURL COMPLETS — TontinePro Backend — Phases 1 à 7
# Usage : bash test/curl-tests-complets.sh
# ═══════════════════════════════════════════════════════════════

BASE_URL="http://localhost:3000"
PASS=0; FAIL=0; SKIP=0

# ─── Helpers ────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

check() {
  local label=$1 result=$2 expected=$3
  if echo "$result" | grep -q "$expected"; then
    echo -e "  ${GREEN}✅ $label${NC}"; PASS=$((PASS+1))
  else
    echo -e "  ${RED}❌ $label${NC}"
    echo "     Réponse: $(echo $result | head -c 200)"
    FAIL=$((FAIL+1))
  fi
}
skip() { echo -e "  ${YELLOW}⏭  $1 (skippé)${NC}"; SKIP=$((SKIP+1)); }
section() { echo -e "\n${YELLOW}══════════════════════════════════════════════${NC}"; echo -e "${YELLOW} $1${NC}"; echo -e "${YELLOW}══════════════════════════════════════════════${NC}"; }

jq_py() { echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); v=d; [v:=v[k] for k in $2]; print(v)" 2>/dev/null; }

# ═══════════════════════════════════════════════════════════════
section "PHASE 1 — SANTÉ & AUTH"
# ═══════════════════════════════════════════════════════════════

echo -e "\n=== Endpoint de santé ==="
R=$(curl -s "$BASE_URL/health")
check "GET /health → succes:true"   "$R" '"succes":true'
check "GET /health → statut:ok"     "$R" '"statut":"ok"'
check "GET /health → version:1.0.0" "$R" '"version":"1.0.0"'

# Numéros Bénin — format 2024 : +229 01 XXXXXXXX (10 chiffres après +229)
# Uniques à chaque run grâce au timestamp UNIX
TS=$(date +%s)
TEL="+22901$(echo $TS | tail -c 9 | head -c 8)"
TEL_COLLECTEUR="+22901$(echo $((TS+7)) | tail -c 9 | head -c 8)"
TEL_BRUTE_PRESET="+22901$(echo $((TS+13)) | tail -c 9 | head -c 8)"
echo -e "  📱 Numéro test      : $TEL"
echo -e "  📱 Numéro collecteur: $TEL_COLLECTEUR"

echo -e "\n=== POST /auth/inscription (CLIENT) ==="
R_INSCR=$(curl -s -X POST "$BASE_URL/auth/inscription" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"nom\":\"Test Curl Client\",\"role\":\"CLIENT\"}")
check "Inscription CLIENT → succes:true"   "$R_INSCR" '"succes":true'
check "Inscription CLIENT → otpTest présent" "$R_INSCR" '"otpTest":'
OTP=$(echo "$R_INSCR" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['donnees']['otpTest'])" 2>/dev/null)

echo -e "\n=== POST /auth/inscription (doublon) ==="
R_DUP=$(curl -s -X POST "$BASE_URL/auth/inscription" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"nom\":\"Doublon\"}")
check "Doublon → succes:false"            "$R_DUP" '"succes":false'
check "Doublon → TELEPHONE_EXISTANT"      "$R_DUP" 'TELEPHONE_EXISTANT'

echo -e "\n=== POST /auth/inscription (téléphone invalide) ==="
R_INV=$(curl -s -X POST "$BASE_URL/auth/inscription" \
  -H "Content-Type: application/json" \
  -d '{"telephone":"0097000001","nom":"Invalide"}')
check "Téléphone invalide → succes:false" "$R_INV" '"succes":false'

echo -e "\n=== POST /auth/verifier-otp ==="
R_OTP=$(curl -s -X POST "$BASE_URL/auth/verifier-otp" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"code\":\"$OTP\"}")
check "Vérifier OTP → succes:true"           "$R_OTP" '"succes":true'
check "Vérifier OTP → tokenTemporaire"       "$R_OTP" 'tokenTemporaire'
TOKEN_TEMP=$(echo "$R_OTP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['donnees']['tokenTemporaire'])" 2>/dev/null)

echo -e "\n=== POST /auth/verifier-otp (OTP déjà utilisé) ==="
R_OTP2=$(curl -s -X POST "$BASE_URL/auth/verifier-otp" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"code\":\"$OTP\"}")
check "OTP déjà utilisé → OTP_INVALIDE" "$R_OTP2" 'OTP_INVALIDE'

echo -e "\n=== POST /auth/creer-pin ==="
R_PIN=$(curl -s -X POST "$BASE_URL/auth/creer-pin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_TEMP" \
  -d '{"pin":"1234"}')
check "Créer PIN → succes:true"        "$R_PIN" '"succes":true'
check "Créer PIN → accessToken"        "$R_PIN" 'accessToken'
check "Créer PIN → refreshToken"       "$R_PIN" 'refreshToken'

echo -e "\n=== POST /auth/connexion ==="
R_CONN=$(curl -s -X POST "$BASE_URL/auth/connexion" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"pin\":\"1234\"}")
check "Connexion → succes:true"  "$R_CONN" '"succes":true'
check "Connexion → role"         "$R_CONN" '"role"'
check "Connexion → nom"          "$R_CONN" '"nom"'
ACCESS=$(echo "$R_CONN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['donnees']['accessToken'])" 2>/dev/null)
REFRESH=$(echo "$R_CONN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['donnees']['refreshToken'])" 2>/dev/null)

echo -e "\n=== POST /auth/connexion (PIN incorrect) ==="
R_BADPIN=$(curl -s -X POST "$BASE_URL/auth/connexion" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL\",\"pin\":\"9999\"}")
check "PIN incorrect → PIN_INCORRECT"  "$R_BADPIN" 'PIN_INCORRECT'
check "PIN incorrect → succes:false"   "$R_BADPIN" '"succes":false'

echo -e "\n=== POST /auth/rafraichir-token ==="
R_REFRESH=$(curl -s -X POST "$BASE_URL/auth/rafraichir-token" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}")
check "Rafraîchir token → succes:true"   "$R_REFRESH" '"succes":true'
check "Rafraîchir token → accessToken"   "$R_REFRESH" 'accessToken'
NEW_ACCESS=$(echo "$R_REFRESH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['donnees']['accessToken'])" 2>/dev/null)
[ -n "$NEW_ACCESS" ] && ACCESS="$NEW_ACCESS"

echo -e "\n=== Route protégée sans token ==="
R_NAUTH=$(curl -s -X POST "$BASE_URL/auth/deconnexion")
check "Sans token → succes:false" "$R_NAUTH" '"succes":false'

# ═══════════════════════════════════════════════════════════════
section "PHASE 2 — UTILISATEURS & PROFIL"
# ═══════════════════════════════════════════════════════════════

echo -e "\n=== GET /utilisateurs/profil ==="
R=$(curl -s "$BASE_URL/utilisateurs/profil" -H "Authorization: Bearer $ACCESS")
check "GET /profil → succes:true"    "$R" '"succes":true'
check "GET /profil → telephone"      "$R" '"telephone"'
check "GET /profil → role:CLIENT"    "$R" '"role":"CLIENT"'
USER_ID=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['donnees']['id'])" 2>/dev/null)

echo -e "\n=== GET /utilisateurs/mes-stats ==="
R=$(curl -s "$BASE_URL/utilisateurs/mes-stats" -H "Authorization: Bearer $ACCESS")
check "GET /mes-stats → succes:true" "$R" '"succes":true'

echo -e "\n=== PUT /utilisateurs/profil ==="
R=$(curl -s -X PUT "$BASE_URL/utilisateurs/profil" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS" \
  -d '{"nom":"Curl Test Modifié"}')
check "PUT /profil → succes:true" "$R" '"succes":true'

# ═══════════════════════════════════════════════════════════════
section "PHASE 3 — TONTINES"
# ═══════════════════════════════════════════════════════════════

echo -e "\n=== POST /tontines (créer individuelle FLEXIBLE) ==="
R_CREA=$(curl -s -X POST "$BASE_URL/tontines" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS" \
  -d '{
    "nom":"Gando Test Curl",
    "type":"PERSONNEL",
    "montantJournalierFcfa":1000,
    "frequence":"JOURNALIER",
    "politique":"FLEXIBLE",
    "objectifMontantFcfa":90000
  }')
check "Créer tontine → succes:true"  "$R_CREA" '"succes":true'
check "Créer tontine → id présent"   "$R_CREA" '"id"'
check "Créer tontine → statut"       "$R_CREA" '"statut"'
TONTINE_ID=$(echo "$R_CREA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['donnees']['id'])" 2>/dev/null)

echo -e "\n=== POST /tontines (créer PROGRAMME avec dateDeverrouillage) ==="
FUTURE_DATE="2027-01-01T00:00:00.000Z"
R=$(curl -s -X POST "$BASE_URL/tontines" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS" \
  -d "{
    \"nom\":\"Épargne Programme\",
    \"type\":\"PERSONNEL\",
    \"montantJournalierFcfa\":1000,
    \"frequence\":\"HEBDOMADAIRE\",
    \"politique\":\"PROGRAMME\",
    \"dateDeverrouillage\":\"$FUTURE_DATE\"
  }")
check "Tontine PROGRAMME → succes:true" "$R" '"succes":true'

echo -e "\n=== POST /tontines (BLOQUE sans dateDeverrouillage — doit échouer) ==="
R=$(curl -s -X POST "$BASE_URL/tontines" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS" \
  -d '{
    "nom":"Erreur BLOQUE",
    "type":"PERSONNEL",
    "montantJournalierFcfa":500,
    "frequence":"JOURNALIER",
    "politique":"BLOQUE"
  }')
check "BLOQUÉ sans date → succes:false" "$R" '"succes":false'

echo -e "\n=== GET /tontines/mes-tontines ==="
R=$(curl -s "$BASE_URL/tontines/mes-tontines" -H "Authorization: Bearer $ACCESS")
check "GET mes-tontines → succes:true" "$R" '"succes":true'

if [ -n "$TONTINE_ID" ]; then
  echo -e "\n=== GET /tontines/:id ==="
  R=$(curl -s "$BASE_URL/tontines/$TONTINE_ID" -H "Authorization: Bearer $ACCESS")
  check "GET tontine/:id → succes:true" "$R" '"succes":true'
  check "GET tontine/:id → id correct"  "$R" "$TONTINE_ID"
else
  skip "GET /tontines/:id (pas d'id)"
fi

# ═══════════════════════════════════════════════════════════════
section "PHASE 3 — TRANSACTIONS (COTISATION)"
# ═══════════════════════════════════════════════════════════════

if [ -n "$TONTINE_ID" ]; then
  echo -e "\n=== POST /transactions/cotiser ==="
  R_COT=$(curl -s -X POST "$BASE_URL/transactions/cotiser" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS" \
    -d "{
      \"tontineId\":\"$TONTINE_ID\",
      \"montant\":1000,
      \"operateur\":\"MTN\",
      \"telephone\":\"$TEL\"
    }")
  check "Cotiser → succes:true"            "$R_COT" '"succes":true'
  check "Cotiser → transactionId"          "$R_COT" 'transactionId'
  check "Cotiser → paymentUrl KKiaPay"     "$R_COT" 'paymentUrl\|confirme'
  TXN_ID=$(echo "$R_COT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['donnees']['transactionId'])" 2>/dev/null 2>/dev/null)

  echo -e "\n=== GET /transactions/historique ==="
  R=$(curl -s "$BASE_URL/transactions/historique" -H "Authorization: Bearer $ACCESS")
  check "GET historique → succes:true" "$R" '"succes":true'
else
  skip "Cotisation (tontineId absent)"
fi

# ═══════════════════════════════════════════════════════════════
section "PHASE 3 — RETRAITS"
# ═══════════════════════════════════════════════════════════════

if [ -n "$TONTINE_ID" ]; then
  echo -e "\n=== POST /retraits/demander (FLEXIBLE — OTP vers client) ==="
  R_RET=$(curl -s -X POST "$BASE_URL/retraits/demander" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS" \
    -d "{
      \"tontineId\":\"$TONTINE_ID\",
      \"montant\":500,
      \"telephone\":\"$TEL\"
    }")
  check "Retrait → succes:true"           "$R_RET" '"succes":true'
  check "Retrait → OTP envoyé (expireLe)" "$R_RET" 'expireLe\|otpId\|tontineId'
  RETRAIT_ID=$(echo "$R_RET" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['donnees']['id'])" 2>/dev/null 2>/dev/null)

  echo -e "\n=== GET /retraits/mes-retraits ==="
  R=$(curl -s "$BASE_URL/retraits/mes-retraits" -H "Authorization: Bearer $ACCESS")
  check "GET mes-retraits → succes:true" "$R" '"succes":true'
else
  skip "Retraits (tontineId absent)"
fi

# ═══════════════════════════════════════════════════════════════
section "PHASE 4 — MICRO-CRÉDITS"
# ═══════════════════════════════════════════════════════════════

echo -e "\n=== POST /micro-credits/demander ==="
R_MC=$(curl -s -X POST "$BASE_URL/micro-credits/demander" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS" \
  -d '{
    "montant":10000,
    "dureeJours":30,
    "motif":"Test curl micro-crédit"
  }')
check "Micro-crédit demander → réponse valide" "$R_MC" '"succes"'

echo -e "\n=== GET /micro-credits/mes-credits ==="
R=$(curl -s "$BASE_URL/micro-credits/mes-credits" -H "Authorization: Bearer $ACCESS")
check "GET mes-credits → succes:true" "$R" '"succes":true'

# ═══════════════════════════════════════════════════════════════
section "PHASE 5 — SCORE CRÉDIT"
# ═══════════════════════════════════════════════════════════════

echo -e "\n=== GET /score/mon-score ==="
R=$(curl -s "$BASE_URL/score/mon-score" -H "Authorization: Bearer $ACCESS")
check "GET mon-score → succes:true"   "$R" '"succes":true'
check "GET mon-score → scoreTotal"    "$R" '"scoreTotal"\|"score"'

echo -e "\n=== GET /score/evolution ==="
R=$(curl -s "$BASE_URL/score/evolution" -H "Authorization: Bearer $ACCESS")
check "GET score/evolution → succes:true" "$R" '"succes":true'

echo -e "\n=== GET /score/conseils ==="
R=$(curl -s "$BASE_URL/score/conseils" -H "Authorization: Bearer $ACCESS")
check "GET score/conseils → succes:true" "$R" '"succes":true'

# ═══════════════════════════════════════════════════════════════
section "PHASE 5 — BADGES"
# ═══════════════════════════════════════════════════════════════

echo -e "\n=== GET /badges/mes-badges ==="
R=$(curl -s "$BASE_URL/badges/mes-badges" -H "Authorization: Bearer $ACCESS")
check "GET mes-badges → succes:true" "$R" '"succes":true'

# ═══════════════════════════════════════════════════════════════
section "PHASE 6 — NOTIFICATIONS"
# ═══════════════════════════════════════════════════════════════

echo -e "\n=== GET /notifications ==="
R=$(curl -s "$BASE_URL/notifications" -H "Authorization: Bearer $ACCESS")
check "GET /notifications → succes:true" "$R" '"succes":true'

echo -e "\n=== GET /notifications/non-lues ==="
R=$(curl -s "$BASE_URL/notifications/non-lues" -H "Authorization: Bearer $ACCESS")
check "GET non-lues → succes:true" "$R" '"succes":true'

echo -e "\n=== PUT /notifications/tout-lu ==="
R=$(curl -s -X PUT "$BASE_URL/notifications/tout-lu" \
  -H "Authorization: Bearer $ACCESS")
check "Tout lu → succes:true" "$R" '"succes":true'

# ═══════════════════════════════════════════════════════════════
section "PHASE 6 — LITIGES"
# ═══════════════════════════════════════════════════════════════

echo -e "\n=== POST /litiges (signaler — nécessite transactionId) ==="
if [ -n "$TXN_ID" ]; then
  R_LIT=$(curl -s -X POST "$BASE_URL/litiges" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS" \
    -d "{
      \"transactionId\":\"$TXN_ID\",
      \"motif\":\"Test litige curl — montant cotisation erroné\"
    }")
  check "Signaler litige → succes:true" "$R_LIT" '"succes":true'
  check "Signaler litige → id"          "$R_LIT" '"id"'
else
  skip "Signaler litige (transactionId absent — cotisation non réussie)"
fi

echo -e "\n=== GET /litiges/mes-litiges ==="
R=$(curl -s "$BASE_URL/litiges/mes-litiges" -H "Authorization: Bearer $ACCESS")
check "GET mes-litiges → succes:true" "$R" '"succes":true'

# ═══════════════════════════════════════════════════════════════
section "PHASE 6 — ALERTES"
# ═══════════════════════════════════════════════════════════════

echo -e "\n=== GET /alertes (ADMIN/SUPERVISEUR uniquement — doit retourner 403 pour CLIENT) ==="
R=$(curl -s "$BASE_URL/alertes" -H "Authorization: Bearer $ACCESS")
check "GET alertes CLIENT → 403 Forbidden" "$R" 'Forbidden\|succes":false'

# ═══════════════════════════════════════════════════════════════
section "PHASE 7 — SÉCURITÉ"
# ═══════════════════════════════════════════════════════════════

echo -e "\n=== POST /auth/connexion (3 PIN incorrects — compte dédié brute force) ==="
TEL_BRUTE="$TEL_BRUTE_PRESET"
# Créer un compte temporaire pour le test brute force
R_BF_INSCR=$(curl -s -X POST "$BASE_URL/auth/inscription" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL_BRUTE\",\"nom\":\"BruteForce Test\",\"role\":\"CLIENT\"}")
BF_OTP=$(echo $R_BF_INSCR | python3 -c "import sys,json; print(json.load(sys.stdin)['donnees']['otpTest'])" 2>/dev/null)
if [ -n "$BF_OTP" ]; then
  BF_TEMP=$(curl -s -X POST "$BASE_URL/auth/verifier-otp" \
    -H "Content-Type: application/json" \
    -d "{\"telephone\":\"$TEL_BRUTE\",\"code\":\"$BF_OTP\"}" | \
    python3 -c "import sys,json; print(json.load(sys.stdin)['donnees']['tokenTemporaire'])" 2>/dev/null)
  curl -s -X POST "$BASE_URL/auth/creer-pin" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $BF_TEMP" \
    -d '{"pin":"5678"}' > /dev/null
fi
for i in 1 2 3; do
  curl -s -X POST "$BASE_URL/auth/connexion" \
    -H "Content-Type: application/json" \
    -d "{\"telephone\":\"$TEL_BRUTE\",\"pin\":\"0000\"}" > /dev/null
done
R=$(curl -s -X POST "$BASE_URL/auth/connexion" \
  -H "Content-Type: application/json" \
  -d "{\"telephone\":\"$TEL_BRUTE\",\"pin\":\"0000\"}")
check "Brute force PIN → compte bloqué ou PIN_INCORRECT" "$R" 'COMPTE_SUSPENDU\|PIN_INCORRECT\|"succes":false'

echo -e "\n=== Token invalide → 401 ==="
R=$(curl -s "$BASE_URL/utilisateurs/moi" -H "Authorization: Bearer FAKETOKEN123")
check "Token invalide → succes:false" "$R" '"succes":false'

echo -e "\n=== Token expiré (format valide mais corrompu) ==="
FAKE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.INVALIDE"
R=$(curl -s "$BASE_URL/utilisateurs/moi" -H "Authorization: Bearer $FAKE")
check "JWT corrompu → succes:false" "$R" '"succes":false'

# ═══════════════════════════════════════════════════════════════
section "DÉCONNEXION"
# ═══════════════════════════════════════════════════════════════

echo -e "\n=== POST /auth/deconnexion ==="
R=$(curl -s -X POST "$BASE_URL/auth/deconnexion" -H "Authorization: Bearer $ACCESS")
check "Déconnexion → succes:true" "$R" '"succes":true'

echo -e "\n=== Token après déconnexion → invalide ==="
R=$(curl -s "$BASE_URL/utilisateurs/moi" -H "Authorization: Bearer $ACCESS")
check "Token révoqué → succes:false" "$R" '"succes":false'

# ═══════════════════════════════════════════════════════════════
echo -e "\n${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN} RÉSUMÉ FINAL${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}✅ Réussis  : $PASS${NC}"
echo -e "  ${RED}❌ Échoués  : $FAIL${NC}"
echo -e "  ${YELLOW}⏭  Skippés  : $SKIP${NC}"
TOTAL=$((PASS+FAIL))
PCT=$((PASS*100/TOTAL))
echo -e "  📊 Score    : ${PCT}% ($PASS/$TOTAL)"
echo ""
[ $FAIL -eq 0 ] && echo -e "${GREEN}🎉 TOUS LES TESTS PASSENT — Flutter peut démarrer !${NC}" \
                || echo -e "${RED}⚠️  Des tests échouent — corriger avant Flutter.${NC}"
echo ""
