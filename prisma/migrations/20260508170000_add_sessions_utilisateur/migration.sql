CREATE TABLE "SessionUtilisateur" (
  "id" TEXT NOT NULL,
  "utilisateurId" TEXT NOT NULL,
  "deviceId" TEXT,
  "userAgent" TEXT,
  "adresseIP" TEXT,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "derniereUtilisation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expireLe" TIMESTAMP(3) NOT NULL,
  "revoqueLe" TIMESTAMP(3),
  "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SessionUtilisateur_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SessionUtilisateur_utilisateurId_actif_idx" ON "SessionUtilisateur"("utilisateurId", "actif");
CREATE INDEX "SessionUtilisateur_expireLe_idx" ON "SessionUtilisateur"("expireLe");

ALTER TABLE "SessionUtilisateur"
  ADD CONSTRAINT "SessionUtilisateur_utilisateurId_fkey"
  FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
