# FONCTIONNALITES.md — TontinePro
> Marquer ✅ après chaque test curl réussi. Ne jamais marquer si le test échoue.

---

## PHASE 1 — FONDATION

### 1.1 Setup & Infrastructure
✅ Initialisation projet NestJS avec TypeScript
✅ Configuration Prisma ORM (Prisma 7 + adapter-pg)
✅ Connexion PostgreSQL opérationnelle
✅ Migration schema.prisma complet (24 tables, 14 enums)
✅ Module Prisma global (@Global)
✅ ConfigModule global (.env chargé)
✅ ThrottlerModule (rate limiting)
✅ ScheduleModule (cron jobs)
✅ Helmet (sécurité HTTP headers)
✅ ValidationPipe global (class-validator)
✅ Endpoint GET /health → { succes, message, donnees }

### 1.2 Module Auth
✅ Inscription par numéro de téléphone
✅ Envoi OTP par SMS (Africa's Talking sandbox)
✅ Vérification OTP (token temporaire onboarding)
✅ Création PIN (hashé bcrypt, compte activé ACTIF)
✅ Connexion avec PIN → JWT access (24h) + refresh (7j)
✅ Rafraîchissement token JWT
✅ Déconnexion (nettoyage deviceId)
✅ Blocage compte après 3 tentatives PIN échouées (30 min)
✅ Validation format téléphone béninois (+229XXXXXXXX)
• Déblocage automatique après délai
• Authentification par empreinte digitale (activation)

### 1.3 Guards & Sécurité
✅ Guard JWT (JwtAuthGuard)
✅ Guard Rôles (RolesGuard)
✅ Décorateur @Roles()
✅ Décorateur @UtilisateurCourant()
✅ Filtre d'erreurs global (format { succes, message, code })
✅ Service SMS Africa's Talking (remplace Twilio)
• Intercepteur Audit automatique (JournalAudit)

---

## PHASE 2 — UTILISATEURS

### 2.1 Module Utilisateurs
✅ GET  /utilisateurs/profil (sans pinHash)
✅ PUT  /utilisateurs/profil (nom, photo)
✅ PUT  /utilisateurs/pin (vérification ancien PIN + bcrypt)
✅ GET  /utilisateurs (Admin — filtres role/statut/recherche + pagination)
✅ PUT  /utilisateurs/:id/statut (Admin — ACTIF/SUSPENDU/BANNI)
✅ PUT  /utilisateurs/:id/role (Admin — promotion)
✅ DELETE /utilisateurs/:id (Admin — soft delete si données financières)

### 2.2 Module KYC
✅ POST /kyc/soumettre (CNI, PASSEPORT, PERMIS, ACTE_NAISSANCE)
✅ GET  /kyc/mes-documents
✅ GET  /kyc/en-attente (Admin/Superviseur)
✅ PUT  /kyc/:id/valider (Admin — kycVerifie=true sur utilisateur)
✅ PUT  /kyc/:id/rejeter (Admin — motif obligatoire)

### 2.3 Module Zones
✅ POST /zones (Admin)
✅ GET  /zones (liste avec compteur agents)
✅ PUT  /zones/:id (Admin)
✅ GET  /zones/:id/agents (Admin/Superviseur)

### 2.4 Module QR Code Collecteur
✅ GET  /qrcode/mon-code (Agent/Indépendant — auto-génère si absent/expiré)
✅ POST /qrcode/scanner/:code (vérifie authenticité + retourne infos collecteur)
✅ POST /qrcode/regenerer (Admin — force régénération pour un agent)
• Régénération automatique QR codes expirés (cron)

### 2.5 Module Facturation Agent
✅ GET  /facturation/mon-statut (init STANDARD si inexistant)
✅ POST /facturation/payer-abonnement (STANDARD=2500 FCFA / PRO=5000 FCFA)
✅ PUT  /facturation/upgrader (Standard → Pro, erreur si déjà PRO)
✅ GET  /facturation/tous (Admin — total mensuel calculé)
• Prélèvement mensuel automatique (cron 1er du mois)

---

## PHASE 3 — CŒUR MÉTIER

### 3.0 KKiaPay Service
✅ Vérification signature HMAC-SHA256 (webhook sécurisé)
✅ initierPaiement() → sandbox URL simulée
✅ initierTransfert() → transfert Mobile Money simulé
✅ Mode sandbox configurable via KKIAPAY_SANDBOX=true

### 3.1 Module Tontines
✅ POST /tontines (personnelle + groupe)
✅ GET  /tontines/mes-tontines (propriétaire + membre)
✅ GET  /tontines/:id (contrôle accès propriétaire/membre)
✅ PUT  /tontines/:id (objectif, politique, montant journalier)
✅ POST /tontines/:id/rejoindre (groupe + caution)
✅ POST /tontines/:id/quitter (soft-exclusion)
✅ GET  /tontines/:id/membres
✅ GET  /tontines/:id/ordre-tirage
✅ POST /tontines/:id/distribuer (vérif. politique + KKiaPay + chaîne atomique)

### 3.2 Module Transactions & KKiaPay
✅ POST /transactions/cotiser (initiation paiement KKiaPay sandbox)
✅ POST /transactions/webhook-kkiapay (HMAC-SHA256 vérifié)
✅ Idempotence webhook (transaction déjà traitée → 200 sans retraitement)
✅ Calcul frais: BUSINESS.calculerFraisPlateforme() = 2%
✅ Calcul commission: BUSINESS.calculerCommissionAgent() = 1% (50% des frais)
✅ Chaîne de hachage SHA256 (intégrité transactions)
✅ Notification SMS client après cotisation réussie
✅ GET  /transactions/historique (50 dernières)
✅ GET  /transactions/:id/recu (reçu structuré)

### 3.3 Module Retraits
✅ POST /retraits/demander (vérif. politique FLEXIBLE/PROGRAMME/BLOQUE)
✅ Validation automatique < 50 000 FCFA (BUSINESS.SEUIL_RETRAIT_ADMIN)
✅ Validation manuelle Admin ≥ 50 000 FCFA
✅ GET  /retraits/mes-retraits
✅ GET  /retraits/en-attente (Admin — total calculé)
✅ PUT  /retraits/:id/valider (Admin + exécution KKiaPay)
✅ PUT  /retraits/:id/rejeter (Admin + motif)

### 3.4 Module Commissions
✅ GET  /commissions/mon-solde (solde + total gagné + taux)
✅ GET  /commissions/historique (liées aux transactions)
✅ POST /commissions/retirer (KKiaPay → Mobile Money)

---

## PHASE 4 — MICRO-CRÉDIT

### 4.1 Module MicroCrédit
✅ GET  /micro-credits/mon-eligibilite (score, plafond, paiement/jour)
✅ POST /micro-credits/demander (éligibilité + plafond + calculs BUSINESS)
✅ POST /micro-credits/consentement-sms (webhook Africa's Talking)
✅ POST /micro-credits/:id/confirmer-pin (PIN bcrypt → consentement)
✅ GET  /micro-credits/en-attente (Admin — consentementObtenu=true)
✅ PUT  /micro-credits/:id/valider (Admin — vérif. consentement + KKiaPay)
✅ PUT  /micro-credits/:id/refuser (Admin + motif + SMS client)
✅ GET  /micro-credits/mes-credits
✅ GET  /micro-credits/:id/remboursements

Calculs validés avec BUSINESS.constants :
✅ montantTotal = principal × 1.10 (10 000 → 11 000 FCFA)
✅ paiementJournalier = ceil(11000/30) = 367 FCFA/jour
✅ Score 75 → plafond 25 000 FCFA (PLAFONDS_MICRO_CREDIT.SCORE_70_80)
✅ Statuts ajoutés : REFUSE + EXPIRE (migration 20260507220440)

### 4.2 Module Remboursements + Cron
✅ Cron 7h — prélèvement journalier (KKiaPay, SMS client, SMS collecteur)
✅ Crédit TERMINÉ quand montantRestant ≤ 0
✅ Crédit EN_DEFAUT après 3 prélèvements consécutifs échoués
✅ Cron 30min — expiration consentement SMS (30 min)
✅ POST /cron/remboursements (déclenchement manuel Admin)

### 4.3 Cron Scoring Nocturne (minuit)
✅ Calcul score : (tauxRégularité×40) + (ancienneté×2 max20) + (remboursement×30) + (bonus×10)
✅ Mise à jour ScoreCredit en base (upsert)
✅ Si score ≥ 70 → génération DossierPADME automatique (si pas de dossier récent)
✅ Notification SMS client PADME généré
✅ POST /cron/scoring (déclenchement manuel Admin + par clientId)

---

## PHASE 5 — ANALYTIQUE

### 5.1 Module Score Crédit
✅ GET /score/mon-score (score + composantes détaillées + plafond)
✅ GET /score/evolution (courbe 6 mois approximative)
✅ GET /score/conseils (personnalisés selon niveau score)
✅ GET /score/projection (mois estimés pour atteindre 60/70/90)

### 5.2 Module Dossier PADME
✅ GET  /padme/mes-dossiers (Client — tous statuts)
✅ GET  /padme/tous (Admin — filtre statut + pagination)
✅ GET  /padme/:id (Admin — détail complet)
✅ PUT  /padme/:id/valider (GENERE → VALIDE_ADMIN + JournalAudit)
✅ PUT  /padme/:id/soumettre (VALIDE_ADMIN → SOUMIS_PADME + SMS client)
✅ PUT  /padme/:id/resultat (ACCEPTE/REJETE + commission 3% + SMS)
    Commission PADME: BUSINESS.calculerCommissionPADME(500k) = 15 000 FCFA ✅

### 5.3 Module Analytics (Admin uniquement)
✅ GET /analytics/kpis (volume, clients, collecteurs, revenus, taux remb.)
✅ GET /analytics/scores-par-zone (score moyen + éligibles par zone)
✅ GET /analytics/performance-collecteurs (classement par cotisations)
✅ GET /analytics/taux-remboursement (global + par collecteur)
✅ GET /analytics/evolution-revenus (6 mois — commissions/padme/abonnements)
✅ GET /analytics/clients-eligibles (sans dossier en cours / sans crédit actif)

### 5.4 Module Badges Gamification
✅ Cron nocturne — attribution automatique après scoring :
   - 1 mois régulier (taux≥0.5)  → BRONZE 🥉
   - 3 mois réguliers (taux≥0.6) → ARGENT 🥈
   - 6 mois réguliers (taux≥0.7) → OR 🥇
   - 12 mois réguliers (taux≥0.8) → DIAMANT 💎
✅ SMS client à chaque nouveau badge
✅ GET /badges/mes-badges (badge actuel + historique)
✅ GET /badges/classement (top 10 épargnants avec badge + zone)

---

## PHASE 6 — SUPPORT

### 6.1 Module Litiges
✅ POST /litiges (client — ouvrir un litige sur une transaction)
✅ GET  /litiges/mes-litiges (client — voir ses litiges)
✅ GET  /litiges/:id (client/admin — détail d'un litige)
✅ GET  /litiges/en-cours/liste (Admin/Superviseur — litiges ouverts + EN_EXAMEN)
✅ PUT  /litiges/:id/examiner (Admin — prise en charge + SMS client)
✅ PUT  /litiges/:id/resoudre (Admin — résolution + SMS client)
✅ PUT  /litiges/:id/rejeter (Admin — rejet + SMS client)
✅ Protection doublon (litige déjà ouvert → 400)

### 6.2 Module Notifications
✅ PushService (Firebase FCM — envoi simple + multi-tokens)
✅ WhatsappService (WhatsApp Business API — Graph API v18)
✅ NotificationsService centralisé (SMS + PUSH + WHATSAPP)
✅ POST /notifications/token-push (enregistrement token FCM — $executeRaw)
✅ Mode gracieux sans credentials (simulation en logs)

### 6.3 Module Badges Gamification
✅ Attribuer badge BRONZE (1er mois régulier — taux≥0.5)
✅ Attribuer badge ARGENT (3 mois réguliers — taux≥0.6)
✅ Attribuer badge OR (6 mois réguliers — taux≥0.7)
✅ Attribuer badge DIAMANT (12 mois réguliers — taux≥0.8)
✅ Voir ses badges (GET /badges/mes-badges)
✅ Classement (GET /badges/classement)

### 6.4 Cron Jobs restants
✅ Rappels cotisation J-3, J-1, Jour J (cron 8h) — SMS membres tontine
✅ Détection défaillances groupe (cron 7h30) — caution + DEFAILLANT/EXCLU + SMS
✅ Facturation mensuelle collecteurs (cron 1er du mois 9h) — KKiaPay + SMS
✅ Régénération QR codes expirés (cron 6h)
✅ Vérification cohérence comptable (cron 0h30) — détection écarts
✅ Nettoyage OTP expirés (cron minuit) — Phase 1
✅ Déclenchement manuel : POST /cron/facturation, POST /cron/rappels

---

## PHASE 7 — TESTS COMPLETS

• Tous les endpoints auth testés avec curl
• Tous les endpoints utilisateurs testés
• Tous les endpoints tontines testés
• Webhook KKiaPay testé (signature valide + invalide)
• Micro-crédit testé (éligible + non éligible)
• Cron jobs vérifiés manuellement
• Sécurité : tentatives PIN, blocage compte
• Sécurité : rate limiting vérifié
