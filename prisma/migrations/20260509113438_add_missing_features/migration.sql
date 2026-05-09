-- DropIndex
DROP INDEX "Retrait_tontineId_idx";

-- AlterTable
ALTER TABLE "SessionUtilisateur" ADD COLUMN     "refreshTokenHash" TEXT;

-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "superviseurId" TEXT;

-- CreateTable
CREATE TABLE "HistoriqueScore" (
    "id" TEXT NOT NULL,
    "scoreCreditId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "tauxRegularite" DOUBLE PRECISION NOT NULL,
    "scoreRemboursement" DOUBLE PRECISION NOT NULL,
    "calculeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriqueScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametreSysteme" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "description" TEXT,
    "modifiePar" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametreSysteme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleFAQ" (
    "id" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "reponse" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creePar" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentaireLitige" (
    "id" TEXT NOT NULL,
    "litigeId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "pieceJointeUrl" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentaireLitige_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistoriqueScore_scoreCreditId_calculeLe_idx" ON "HistoriqueScore"("scoreCreditId", "calculeLe");

-- CreateIndex
CREATE UNIQUE INDEX "ParametreSysteme_cle_key" ON "ParametreSysteme"("cle");

-- CreateIndex
CREATE INDEX "ParametreSysteme_cle_idx" ON "ParametreSysteme"("cle");

-- CreateIndex
CREATE INDEX "ArticleFAQ_categorie_actif_idx" ON "ArticleFAQ"("categorie", "actif");

-- CreateIndex
CREATE INDEX "CommentaireLitige_litigeId_creeLe_idx" ON "CommentaireLitige"("litigeId", "creeLe");

-- AddForeignKey
ALTER TABLE "HistoriqueScore" ADD CONSTRAINT "HistoriqueScore_scoreCreditId_fkey" FOREIGN KEY ("scoreCreditId") REFERENCES "ScoreCredit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentaireLitige" ADD CONSTRAINT "CommentaireLitige_litigeId_fkey" FOREIGN KEY ("litigeId") REFERENCES "Litige"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
