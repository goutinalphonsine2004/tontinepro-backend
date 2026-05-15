-- Migration: ajout de la colonne idempotencyKey + index unique
-- sur Transaction, Retrait et OperationAssistee.
-- Permet de garantir qu'une même requête métier ne crée pas
-- deux entrées en cas de retry réseau côté client.

ALTER TABLE "Transaction"       ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Retrait"           ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "OperationAssistee" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "Transaction_idempotencyKey_key"
  ON "Transaction"("idempotencyKey");

CREATE UNIQUE INDEX "Retrait_idempotencyKey_key"
  ON "Retrait"("idempotencyKey");

CREATE UNIQUE INDEX "OperationAssistee_idempotencyKey_key"
  ON "OperationAssistee"("idempotencyKey");
