-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'INDEPENDANT', 'AGENT', 'SUPERVISEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('EN_ATTENTE', 'ACTIF', 'SUSPENDU', 'BANNI');

-- CreateEnum
CREATE TYPE "TypeCollecteur" AS ENUM ('INDEPENDANT', 'SALARIE');

-- CreateEnum
CREATE TYPE "PolitiqueRetrait" AS ENUM ('FLEXIBLE', 'PROGRAMME', 'BLOQUE');

-- CreateEnum
CREATE TYPE "TypeTontine" AS ENUM ('PERSONNEL', 'GROUPE');

-- CreateEnum
CREATE TYPE "StatutTransaction" AS ENUM ('EN_ATTENTE', 'SUCCES', 'ECHOUE', 'REMBOURSE');

-- CreateEnum
CREATE TYPE "TypeTransaction" AS ENUM ('COTISATION', 'RETRAIT', 'COMMISSION', 'REMBOURSEMENT_CREDIT', 'DEBLOCAGE_CREDIT', 'DISTRIBUTION_GROUPE', 'ABONNEMENT');

-- CreateEnum
CREATE TYPE "StatutRetrait" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE', 'EXECUTE');

-- CreateEnum
CREATE TYPE "StatutLitige" AS ENUM ('OUVERT', 'EN_EXAMEN', 'RESOLU', 'REJETE');

-- CreateEnum
CREATE TYPE "StatutCredit" AS ENUM ('EN_ATTENTE', 'ACTIF', 'TERMINE', 'EN_DEFAUT');

-- CreateEnum
CREATE TYPE "StatutDossierPADME" AS ENUM ('GENERE', 'VALIDE_ADMIN', 'SOUMIS_PADME', 'ACCEPTE', 'REJETE');

-- CreateEnum
CREATE TYPE "StatutMembreGroupe" AS ENUM ('ACTIF', 'DEFAILLANT', 'EXCLU', 'A_RECU');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('PAIEMENT_RECU', 'RAPPEL_COTISATION', 'TOUR_TONTINE', 'SCORE_MISE_A_JOUR', 'LITIGE_REPONSE', 'BADGE_OBTENU', 'MICRO_CREDIT_DISPO', 'DOSSIER_PADME_SOUMIS', 'REMBOURSEMENT_RAPPEL', 'DEFAILLANT_GROUPE', 'BIENVENUE');

-- CreateEnum
CREATE TYPE "Canal" AS ENUM ('PUSH', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "StatutKYC" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE');

-- CreateEnum
CREATE TYPE "NiveauBadge" AS ENUM ('BRONZE', 'ARGENT', 'OR', 'DIAMANT');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "photo" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "typeCollecteur" "TypeCollecteur",
    "statut" "StatutCompte" NOT NULL DEFAULT 'EN_ATTENTE',
    "pinHash" TEXT,
    "deviceId" TEXT,
    "empreinteActive" BOOLEAN NOT NULL DEFAULT false,
    "kycVerifie" BOOLEAN NOT NULL DEFAULT false,
    "tentativesEchouees" INTEGER NOT NULL DEFAULT 0,
    "bloqueLe" TIMESTAMP(3),
    "collecteurId" TEXT,
    "superviseurId" TEXT,
    "zoneId" TEXT,
    "soldeCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantCaution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "description" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentKYC" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "typeDocument" TEXT NOT NULL,
    "urlDocument" TEXT NOT NULL,
    "statut" "StatutKYC" NOT NULL DEFAULT 'EN_ATTENTE',
    "verifiePar" TEXT,
    "motifRejet" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentKYC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturationAgent" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'STANDARD',
    "fraisMensuels" DOUBLE PRECISION NOT NULL,
    "fraisParClient" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "totalClients" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dernierPaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prochainPaiement" TIMESTAMP(3) NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacturationAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCodeCollecteur" (
    "id" TEXT NOT NULL,
    "collecteurId" TEXT NOT NULL,
    "codeQR" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRCodeCollecteur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeOTP" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "utilise" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeOTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tontine" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeTontine" NOT NULL DEFAULT 'PERSONNEL',
    "politique" "PolitiqueRetrait" NOT NULL DEFAULT 'FLEXIBLE',
    "soldeActuel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "objectifMontant" DOUBLE PRECISION,
    "dateDeverrouillage" TIMESTAMP(3),
    "montantJournalier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proprietaireId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tontine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembreTontineGroupe" (
    "id" TEXT NOT NULL,
    "tontineId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "statut" "StatutMembreGroupe" NOT NULL DEFAULT 'ACTIF',
    "montantCaution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cautionBloquee" BOOLEAN NOT NULL DEFAULT true,
    "rejointLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excluLe" TIMESTAMP(3),
    "motifExclusion" TEXT,

    CONSTRAINT "MembreTontineGroupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdreTirage" (
    "id" TEXT NOT NULL,
    "tontineId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "aRecu" BOOLEAN NOT NULL DEFAULT false,
    "recuLe" TIMESTAMP(3),
    "montantRecu" DOUBLE PRECISION,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrdreTirage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefaillanceGroupe" (
    "id" TEXT NOT NULL,
    "tontineId" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "montantManquant" DOUBLE PRECISION NOT NULL,
    "cautionUtilisee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "detecteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resoluLe" TIMESTAMP(3),

    CONSTRAINT "DefaillanceGroupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "montantNet" DOUBLE PRECISION NOT NULL,
    "type" "TypeTransaction" NOT NULL,
    "statut" "StatutTransaction" NOT NULL DEFAULT 'EN_ATTENTE',
    "refKKiaPay" TEXT,
    "operateur" TEXT,
    "fraisPlateforme" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fraisAgent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hashPrecedent" TEXT,
    "hashActuel" TEXT,
    "tontineId" TEXT,
    "utilisateurId" TEXT NOT NULL,
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "motifEchec" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retrait" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" "StatutRetrait" NOT NULL DEFAULT 'EN_ATTENTE',
    "validePar" TEXT,
    "motifRejet" TEXT,
    "refKKiaPay" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executeLe" TIMESTAMP(3),

    CONSTRAINT "Retrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroCredit" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "montantPrincipal" DOUBLE PRECISION NOT NULL,
    "tauxInteret" DOUBLE PRECISION NOT NULL,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "paiementJournalier" DOUBLE PRECISION NOT NULL,
    "totalJours" INTEGER NOT NULL,
    "joursPayes" INTEGER NOT NULL DEFAULT 0,
    "montantRestant" DOUBLE PRECISION NOT NULL,
    "statut" "StatutCredit" NOT NULL DEFAULT 'EN_ATTENTE',
    "scoreAuMoment" INTEGER NOT NULL,
    "initiePar" TEXT NOT NULL,
    "methodeConsentement" TEXT,
    "consentementObtenu" BOOLEAN NOT NULL DEFAULT false,
    "consentementObtenuLe" TIMESTAMP(3),
    "decaisseLE" TIMESTAMP(3),
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "termineLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MicroCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemboursementCredit" (
    "id" TEXT NOT NULL,
    "microCreditId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "refKKiaPay" TEXT,
    "payeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemboursementCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Litige" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "statut" "StatutLitige" NOT NULL DEFAULT 'OUVERT',
    "resoluPar" TEXT,
    "resolution" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resoluLe" TIMESTAMP(3),

    CONSTRAINT "Litige_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresenceCollecteur" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "estValide" BOOLEAN NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresenceCollecteur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalAudit" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "adresseIP" TEXT,
    "appareil" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreCredit" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalDepots" INTEGER NOT NULL DEFAULT 0,
    "tauxRegularite" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMois" INTEGER NOT NULL DEFAULT 0,
    "scoreRemboursement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eligiblePADME" BOOLEAN NOT NULL DEFAULT false,
    "eligibleMicroCredit" BOOLEAN NOT NULL DEFAULT false,
    "dernierCalcul" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierPADME" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scoreCreditId" TEXT NOT NULL,
    "scoreAuMoment" INTEGER NOT NULL,
    "totalEpargne" DOUBLE PRECISION NOT NULL,
    "tauxRegularite" DOUBLE PRECISION NOT NULL,
    "creditsRembourses" INTEGER NOT NULL DEFAULT 0,
    "urlPDF" TEXT,
    "statut" "StatutDossierPADME" NOT NULL DEFAULT 'GENERE',
    "genereePar" TEXT NOT NULL DEFAULT 'SYSTEME',
    "soumisLe" TIMESTAMP(3),
    "examineLE" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DossierPADME_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "canal" "Canal" NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeClient" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "niveau" "NiveauBadge" NOT NULL,
    "obtenuLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BadgeClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_telephone_key" ON "Utilisateur"("telephone");

-- CreateIndex
CREATE INDEX "Utilisateur_telephone_idx" ON "Utilisateur"("telephone");

-- CreateIndex
CREATE INDEX "Utilisateur_role_idx" ON "Utilisateur"("role");

-- CreateIndex
CREATE INDEX "Utilisateur_collecteurId_idx" ON "Utilisateur"("collecteurId");

-- CreateIndex
CREATE INDEX "Utilisateur_zoneId_idx" ON "Utilisateur"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "FacturationAgent_agentId_key" ON "FacturationAgent"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCodeCollecteur_collecteurId_key" ON "QRCodeCollecteur"("collecteurId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCodeCollecteur_codeQR_key" ON "QRCodeCollecteur"("codeQR");

-- CreateIndex
CREATE INDEX "Tontine_proprietaireId_idx" ON "Tontine"("proprietaireId");

-- CreateIndex
CREATE UNIQUE INDEX "MembreTontineGroupe_tontineId_utilisateurId_key" ON "MembreTontineGroupe"("tontineId", "utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");

-- CreateIndex
CREATE INDEX "Transaction_utilisateurId_idx" ON "Transaction"("utilisateurId");

-- CreateIndex
CREATE INDEX "Transaction_statut_idx" ON "Transaction"("statut");

-- CreateIndex
CREATE INDEX "Transaction_creeLe_idx" ON "Transaction"("creeLe");

-- CreateIndex
CREATE INDEX "MicroCredit_clientId_idx" ON "MicroCredit"("clientId");

-- CreateIndex
CREATE INDEX "MicroCredit_statut_idx" ON "MicroCredit"("statut");

-- CreateIndex
CREATE INDEX "JournalAudit_utilisateurId_idx" ON "JournalAudit"("utilisateurId");

-- CreateIndex
CREATE INDEX "JournalAudit_creeLe_idx" ON "JournalAudit"("creeLe");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreCredit_utilisateurId_key" ON "ScoreCredit"("utilisateurId");

-- CreateIndex
CREATE INDEX "DossierPADME_clientId_idx" ON "DossierPADME"("clientId");

-- CreateIndex
CREATE INDEX "DossierPADME_statut_idx" ON "DossierPADME"("statut");

-- CreateIndex
CREATE INDEX "Notification_utilisateurId_lu_idx" ON "Notification"("utilisateurId", "lu");

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_collecteurId_fkey" FOREIGN KEY ("collecteurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentKYC" ADD CONSTRAINT "DocumentKYC_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturationAgent" ADD CONSTRAINT "FacturationAgent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCodeCollecteur" ADD CONSTRAINT "QRCodeCollecteur_collecteurId_fkey" FOREIGN KEY ("collecteurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeOTP" ADD CONSTRAINT "CodeOTP_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tontine" ADD CONSTRAINT "Tontine_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreTontineGroupe" ADD CONSTRAINT "MembreTontineGroupe_tontineId_fkey" FOREIGN KEY ("tontineId") REFERENCES "Tontine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreTontineGroupe" ADD CONSTRAINT "MembreTontineGroupe_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreTirage" ADD CONSTRAINT "OrdreTirage_tontineId_fkey" FOREIGN KEY ("tontineId") REFERENCES "Tontine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tontineId_fkey" FOREIGN KEY ("tontineId") REFERENCES "Tontine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retrait" ADD CONSTRAINT "Retrait_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroCredit" ADD CONSTRAINT "MicroCredit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemboursementCredit" ADD CONSTRAINT "RemboursementCredit_microCreditId_fkey" FOREIGN KEY ("microCreditId") REFERENCES "MicroCredit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Litige" ADD CONSTRAINT "Litige_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Litige" ADD CONSTRAINT "Litige_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresenceCollecteur" ADD CONSTRAINT "PresenceCollecteur_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalAudit" ADD CONSTRAINT "JournalAudit_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreCredit" ADD CONSTRAINT "ScoreCredit_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierPADME" ADD CONSTRAINT "DossierPADME_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierPADME" ADD CONSTRAINT "DossierPADME_scoreCreditId_fkey" FOREIGN KEY ("scoreCreditId") REFERENCES "ScoreCredit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeClient" ADD CONSTRAINT "BadgeClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
