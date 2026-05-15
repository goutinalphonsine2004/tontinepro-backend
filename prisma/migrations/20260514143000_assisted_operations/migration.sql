-- Client terrain et opérations assistées pour clients sans smartphone.

CREATE TYPE "ModeAccesClient" AS ENUM ('SMARTPHONE', 'SANS_SMARTPHONE', 'HYBRIDE');
CREATE TYPE "TypeOperationAssistee" AS ENUM ('COTISATION', 'RETRAIT', 'MICRO_CREDIT', 'CONSULTATION');
CREATE TYPE "StatutOperationAssistee" AS ENUM ('INITIEE', 'OTP_ENVOYE', 'CONFIRMEE_CLIENT', 'EN_ATTENTE_MOBILE_MONEY', 'SUCCES', 'ECHOUEE', 'EXPIREE', 'ANNULEE');
CREATE TYPE "CanalConfirmation" AS ENUM ('OTP_SMS', 'PIN_CLIENT', 'USSD', 'MOBILE_MONEY_PIN');

ALTER TABLE "Utilisateur" ADD COLUMN "enroleParId" TEXT;

CREATE TABLE "ClientTerrainProfile" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "identifiantTerrain" TEXT NOT NULL,
  "cip" TEXT,
  "npi" TEXT,
  "quartier" TEXT,
  "adresse" TEXT,
  "telephoneSecondaire" TEXT,
  "photoUrl" TEXT,
  "signatureUrl" TEXT,
  "kycMinimalValide" BOOLEAN NOT NULL DEFAULT false,
  "modeAcces" "ModeAccesClient" NOT NULL DEFAULT 'SANS_SMARTPHONE',
  "latitudeEnrolement" DOUBLE PRECISION,
  "longitudeEnrolement" DOUBLE PRECISION,
  "enroleParId" TEXT NOT NULL,
  "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "misAJourLe" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientTerrainProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QrPapierClient" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "imprimeLe" TIMESTAMP(3),
  "expireLe" TIMESTAMP(3),
  "genereParId" TEXT NOT NULL,
  "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QrPapierClient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationAssistee" (
  "id" TEXT NOT NULL,
  "type" "TypeOperationAssistee" NOT NULL,
  "statut" "StatutOperationAssistee" NOT NULL DEFAULT 'INITIEE',
  "clientId" TEXT NOT NULL,
  "initiateurId" TEXT NOT NULL,
  "tontineId" TEXT,
  "transactionId" TEXT,
  "retraitId" TEXT,
  "montant" DOUBLE PRECISION NOT NULL,
  "operateur" TEXT,
  "telephone" TEXT NOT NULL,
  "refMobileMoney" TEXT,
  "otpHash" TEXT,
  "otpExpireLe" TIMESTAMP(3),
  "otpTentatives" INTEGER NOT NULL DEFAULT 0,
  "confirmationCanal" "CanalConfirmation",
  "confirmeParClientLe" TIMESTAMP(3),
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "distanceMetres" DOUBLE PRECISION,
  "deviceId" TEXT,
  "metadata" TEXT,
  "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "misAJourLe" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperationAssistee_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientTerrainProfile_clientId_key" ON "ClientTerrainProfile"("clientId");
CREATE UNIQUE INDEX "ClientTerrainProfile_identifiantTerrain_key" ON "ClientTerrainProfile"("identifiantTerrain");
CREATE INDEX "ClientTerrainProfile_identifiantTerrain_idx" ON "ClientTerrainProfile"("identifiantTerrain");
CREATE INDEX "ClientTerrainProfile_enroleParId_idx" ON "ClientTerrainProfile"("enroleParId");

CREATE UNIQUE INDEX "QrPapierClient_clientId_key" ON "QrPapierClient"("clientId");
CREATE UNIQUE INDEX "QrPapierClient_code_key" ON "QrPapierClient"("code");
CREATE INDEX "QrPapierClient_code_idx" ON "QrPapierClient"("code");
CREATE INDEX "QrPapierClient_genereParId_idx" ON "QrPapierClient"("genereParId");

CREATE INDEX "OperationAssistee_clientId_statut_idx" ON "OperationAssistee"("clientId", "statut");
CREATE INDEX "OperationAssistee_initiateurId_statut_idx" ON "OperationAssistee"("initiateurId", "statut");
CREATE INDEX "OperationAssistee_type_idx" ON "OperationAssistee"("type");
CREATE INDEX "Utilisateur_enroleParId_idx" ON "Utilisateur"("enroleParId");

ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_enroleParId_fkey" FOREIGN KEY ("enroleParId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientTerrainProfile" ADD CONSTRAINT "ClientTerrainProfile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QrPapierClient" ADD CONSTRAINT "QrPapierClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationAssistee" ADD CONSTRAINT "OperationAssistee_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationAssistee" ADD CONSTRAINT "OperationAssistee_initiateurId_fkey" FOREIGN KEY ("initiateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
