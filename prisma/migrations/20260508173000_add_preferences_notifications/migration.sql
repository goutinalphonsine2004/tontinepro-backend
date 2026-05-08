CREATE TABLE "PreferenceNotification" (
  "id" TEXT NOT NULL,
  "utilisateurId" TEXT NOT NULL,
  "smsActif" BOOLEAN NOT NULL DEFAULT true,
  "pushActif" BOOLEAN NOT NULL DEFAULT true,
  "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "misAJourLe" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PreferenceNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PreferenceNotification_utilisateurId_key" ON "PreferenceNotification"("utilisateurId");

ALTER TABLE "PreferenceNotification"
  ADD CONSTRAINT "PreferenceNotification_utilisateurId_fkey"
  FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
