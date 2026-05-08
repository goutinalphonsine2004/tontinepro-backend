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
• Vérifier éligibilité (score ≥ 60)
• Demander un micro-crédit (avec plafond selon score)
• Consentement client avec smartphone (PIN)
• Consentement client sans smartphone (SMS → 1 OUI / 2 NON)
• Annulation automatique si pas de réponse après 30min
• Admin/Agent : valider et décaisser le crédit
• Voir ses micro-crédits actifs
• Admin : voir tous les crédits

### 4.2 Module Remboursements
• Prélèvement journalier automatique (cron 7h)
• Voir l'historique de remboursements
• Crédit marqué TERMINE quand soldé
• Crédit marqué EN_DEFAUT si retards répétés

---

## PHASE 5 — ANALYTIQUE

### 5.1 Module Score Crédit
• Calcul score (régularité 40% + ancienneté 20% + remboursement 30% + bonus 10%)
• Recalcul nocturne automatique (cron minuit)
• Voir son score et éligibilités
• Historique évolution score

### 5.2 Module Dossier PADME
• Génération automatique dossier PDF (score ≥ 70, cron minuit)
• Admin : consulter les dossiers GENERES
• Admin : valider un dossier (VALIDE_ADMIN)
• Admin : soumettre à PADME (SOUMIS_PADME)
• Client : voir le statut de son dossier

### 5.3 Module Analytics
• KPIs Admin : total clients, total épargne, taux de défaillance
• KPIs Agent : performance, commissions du mois
• Évolution mensuelle des dépôts
• Rapport exportable

---

## PHASE 6 — SUPPORT

### 6.1 Module Litiges
• Ouvrir un litige sur une transaction
• Admin : examiner un litige
• Admin : résoudre/rejeter un litige
• Voir ses litiges (client)

### 6.2 Module Notifications
• Notification push Firebase (PUSH)
• Notification SMS Twilio (SMS)
• Notification WhatsApp Business (WHATSAPP)
• Marquer notification comme lue
• Voir ses notifications non lues

### 6.3 Module Badges Gamification
• Attribuer badge BRONZE (1er mois régulier)
• Attribuer badge ARGENT (3 mois réguliers)
• Attribuer badge OR (6 mois réguliers)
• Attribuer badge DIAMANT (12 mois + crédit remboursé)
• Voir ses badges

### 6.4 Cron Jobs restants
• Rappels cotisation J-3, J-1, Jour J (cron 8h)
• Détection défaillances groupe (cron 7h)
• Vérification cohérence comptable (cron minuit)
• Nettoyage OTP expirés (cron minuit)

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
