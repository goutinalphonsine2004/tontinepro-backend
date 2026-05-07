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
• Voir son propre profil
• Modifier son profil (nom, photo)
• Admin : lister tous les utilisateurs
• Admin : changer le statut d'un compte (ACTIF/SUSPENDU/BANNI)
• Admin : voir les détails d'un utilisateur

### 2.2 Module KYC
• Upload document KYC (CNI, passeport)
• Admin : valider un document KYC
• Admin : rejeter un document KYC (avec motif)
• Voir le statut de son KYC

### 2.3 Module Zones
• Admin : créer une zone géographique
• Admin : lister les zones
• Admin : assigner un agent à une zone

### 2.4 Module QR Code Collecteur
• Générer un QR code pour collecteur
• Valider un QR code (client scanne)
• Régénérer QR code expiré (cron)

### 2.5 Module Facturation Agent
• Créer un plan de facturation pour agent
• Voir sa facturation (agent)
• Admin : lister les facturations
• Prélèvement mensuel automatique (cron 1er du mois)

---

## PHASE 3 — CŒUR MÉTIER

### 3.1 Module Tontines
• Créer une tontine personnelle
• Créer une tontine de groupe
• Voir mes tontines
• Voir le détail d'une tontine
• Définir l'objectif et la politique de retrait
• Rejoindre une tontine de groupe
• Définir l'ordre de tirage (groupe)
• Voir les membres d'une tontine groupe

### 3.2 Module Transactions & KKiaPay
• Effectuer une cotisation (MTN/Moov Money)
• Webhook KKiaPay (vérification HMAC-SHA256)
• Idempotence des transactions
• Historique des transactions
• Retry automatique en cas d'échec

### 3.3 Module Retraits
• Demander un retrait (politique FLEXIBLE)
• Validation automatique < 50 000 FCFA
• Validation manuelle Admin ≥ 50 000 FCFA
• Refus automatique (politique BLOQUE)
• Refus si mauvaise date (politique PROGRAMME)
• Admin : valider/rejeter un retrait
• Exécution retrait via KKiaPay

### 3.4 Module Commissions
• Calcul commission agent sur cotisation
• Voir ses commissions (agent)
• Admin : voir toutes les commissions
• Retrait commission agent

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
