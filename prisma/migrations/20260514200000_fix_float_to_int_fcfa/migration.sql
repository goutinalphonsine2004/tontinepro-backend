-- Migration: conversion des montants Float (DOUBLE PRECISION) en Int (INTEGER).
-- Idempotente: ROUND(x)::INTEGER accepte aussi un INTEGER (cast implicite via numeric).
-- Liste construite à partir des colonnes réellement Float dans la DB,
-- en excluant coordonnées GPS, taux/scores (ratios) et colonnes déjà INT.

-- Commission
ALTER TABLE "Commission"
  ALTER COLUMN "montant" TYPE INTEGER USING ROUND("montant")::INTEGER;

-- DefaillanceGroupe
ALTER TABLE "DefaillanceGroupe"
  ALTER COLUMN "montantManquant" TYPE INTEGER USING ROUND("montantManquant")::INTEGER,
  ALTER COLUMN "cautionUtilisee" DROP DEFAULT,
  ALTER COLUMN "cautionUtilisee" TYPE INTEGER USING ROUND("cautionUtilisee")::INTEGER,
  ALTER COLUMN "cautionUtilisee" SET DEFAULT 0;

-- DossierPADME
ALTER TABLE "DossierPADME"
  ALTER COLUMN "totalEpargne" TYPE INTEGER USING ROUND("totalEpargne")::INTEGER;

-- FacturationAgent
ALTER TABLE "FacturationAgent"
  ALTER COLUMN "cautionMontant" DROP DEFAULT,
  ALTER COLUMN "cautionMontant" TYPE INTEGER USING ROUND("cautionMontant")::INTEGER,
  ALTER COLUMN "cautionMontant" SET DEFAULT 0;

-- MembreTontineGroupe
ALTER TABLE "MembreTontineGroupe"
  ALTER COLUMN "montantCaution" DROP DEFAULT,
  ALTER COLUMN "montantCaution" TYPE INTEGER USING ROUND("montantCaution")::INTEGER,
  ALTER COLUMN "montantCaution" SET DEFAULT 0;

-- MicroCredit
ALTER TABLE "MicroCredit"
  ALTER COLUMN "montantPrincipal" TYPE INTEGER USING ROUND("montantPrincipal")::INTEGER,
  ALTER COLUMN "montantTotal" TYPE INTEGER USING ROUND("montantTotal")::INTEGER,
  ALTER COLUMN "paiementJournalier" TYPE INTEGER USING ROUND("paiementJournalier")::INTEGER,
  ALTER COLUMN "montantRestant" TYPE INTEGER USING ROUND("montantRestant")::INTEGER;

-- OperationAssistee
ALTER TABLE "OperationAssistee"
  ALTER COLUMN "montant" TYPE INTEGER USING ROUND("montant")::INTEGER;

-- OrdreTirage
ALTER TABLE "OrdreTirage"
  ALTER COLUMN "montantRecu" TYPE INTEGER USING ROUND("montantRecu")::INTEGER;

-- RemboursementCredit
ALTER TABLE "RemboursementCredit"
  ALTER COLUMN "montant" TYPE INTEGER USING ROUND("montant")::INTEGER;

-- Retrait
ALTER TABLE "Retrait"
  ALTER COLUMN "montant" TYPE INTEGER USING ROUND("montant")::INTEGER;

-- Tontine
ALTER TABLE "Tontine"
  ALTER COLUMN "soldeActuel" DROP DEFAULT,
  ALTER COLUMN "soldeActuel" TYPE INTEGER USING ROUND("soldeActuel")::INTEGER,
  ALTER COLUMN "soldeActuel" SET DEFAULT 0,
  ALTER COLUMN "objectifMontant" TYPE INTEGER USING ROUND("objectifMontant")::INTEGER,
  ALTER COLUMN "montantJournalier" DROP DEFAULT,
  ALTER COLUMN "montantJournalier" TYPE INTEGER USING ROUND("montantJournalier")::INTEGER,
  ALTER COLUMN "montantJournalier" SET DEFAULT 0,
  ALTER COLUMN "montantParMembre" TYPE INTEGER USING ROUND("montantParMembre")::INTEGER,
  ALTER COLUMN "montantCautionObligatoire" DROP DEFAULT,
  ALTER COLUMN "montantCautionObligatoire" TYPE INTEGER USING ROUND("montantCautionObligatoire")::INTEGER,
  ALTER COLUMN "montantCautionObligatoire" SET DEFAULT 0,
  ALTER COLUMN "montantPenaliteRetard" DROP DEFAULT,
  ALTER COLUMN "montantPenaliteRetard" TYPE INTEGER USING ROUND("montantPenaliteRetard")::INTEGER,
  ALTER COLUMN "montantPenaliteRetard" SET DEFAULT 0;

-- Transaction
ALTER TABLE "Transaction"
  ALTER COLUMN "montant" TYPE INTEGER USING ROUND("montant")::INTEGER,
  ALTER COLUMN "montantNet" TYPE INTEGER USING ROUND("montantNet")::INTEGER,
  ALTER COLUMN "fraisPlateforme" DROP DEFAULT,
  ALTER COLUMN "fraisPlateforme" TYPE INTEGER USING ROUND("fraisPlateforme")::INTEGER,
  ALTER COLUMN "fraisPlateforme" SET DEFAULT 0,
  ALTER COLUMN "fraisAgent" DROP DEFAULT,
  ALTER COLUMN "fraisAgent" TYPE INTEGER USING ROUND("fraisAgent")::INTEGER,
  ALTER COLUMN "fraisAgent" SET DEFAULT 0;
