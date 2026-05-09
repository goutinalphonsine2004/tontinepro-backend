-- Link withdrawals to the exact tontine used for balance checks/execution.
ALTER TABLE "Retrait" ADD COLUMN "tontineId" TEXT;

UPDATE "Retrait" r
SET "tontineId" = t."id"
FROM "Tontine" t
WHERE t."proprietaireId" = r."utilisateurId"
  AND r."tontineId" IS NULL;

ALTER TABLE "Retrait" ALTER COLUMN "tontineId" SET NOT NULL;

CREATE INDEX "Retrait_tontineId_idx" ON "Retrait"("tontineId");

ALTER TABLE "Retrait"
ADD CONSTRAINT "Retrait_tontineId_fkey"
FOREIGN KEY ("tontineId") REFERENCES "Tontine"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Track consecutive group contribution defaults.
ALTER TABLE "MembreTontineGroupe"
ADD COLUMN "nombreDefaillances" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "derniereDefaillanceLe" TIMESTAMP(3);
