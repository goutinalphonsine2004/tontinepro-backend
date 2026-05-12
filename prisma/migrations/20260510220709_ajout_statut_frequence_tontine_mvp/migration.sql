-- CreateEnum
CREATE TYPE "StatutTontine" AS ENUM ('CREATION', 'ACTIVE', 'SUSPENDUE', 'TERMINEE');

-- CreateEnum
CREATE TYPE "FrequenceTontine" AS ENUM ('JOURNALIER', 'HEBDOMADAIRE', 'MENSUEL', 'DATE_FIXE');

-- AlterEnum
ALTER TYPE "TypeTontine" ADD VALUE 'PROJET';

-- AlterTable
ALTER TABLE "Tontine" ADD COLUMN     "dateFin" TIMESTAMP(3),
ADD COLUMN     "dateProchaineCotisation" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "frequence" "FrequenceTontine" NOT NULL DEFAULT 'MENSUEL',
ADD COLUMN     "jourFixe" INTEGER,
ADD COLUMN     "statut" "StatutTontine" NOT NULL DEFAULT 'CREATION';

-- CreateIndex
CREATE INDEX "Tontine_statut_idx" ON "Tontine"("statut");

-- AddForeignKey
ALTER TABLE "DefaillanceGroupe" ADD CONSTRAINT "DefaillanceGroupe_tontineId_fkey" FOREIGN KEY ("tontineId") REFERENCES "Tontine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefaillanceGroupe" ADD CONSTRAINT "DefaillanceGroupe_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "MembreTontineGroupe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresenceCollecteur" ADD CONSTRAINT "PresenceCollecteur_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
