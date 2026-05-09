-- CreateTable
CREATE TABLE "AppareilBiometrique" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "empreinteHash" TEXT NOT NULL,
    "nomAppareil" TEXT,
    "modeleAppareil" TEXT,
    "systemeExploitation" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "derniereAuthentification" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppareilBiometrique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppareilBiometrique_utilisateurId_idx" ON "AppareilBiometrique"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "AppareilBiometrique_utilisateurId_deviceId_key" ON "AppareilBiometrique"("utilisateurId", "deviceId");

-- AddForeignKey
ALTER TABLE "AppareilBiometrique" ADD CONSTRAINT "AppareilBiometrique_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
