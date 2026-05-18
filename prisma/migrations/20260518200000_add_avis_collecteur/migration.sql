CREATE TABLE "AvisCollecteur" (
    "id"           TEXT NOT NULL,
    "auteurId"     TEXT NOT NULL,
    "collecteurId" TEXT NOT NULL,
    "note"         INTEGER NOT NULL,
    "commentaire"  TEXT,
    "creeLe"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvisCollecteur_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AvisCollecteur_auteurId_collecteurId_key"
    ON "AvisCollecteur"("auteurId", "collecteurId");

CREATE INDEX "AvisCollecteur_collecteurId_idx" ON "AvisCollecteur"("collecteurId");
CREATE INDEX "AvisCollecteur_auteurId_idx"     ON "AvisCollecteur"("auteurId");

ALTER TABLE "AvisCollecteur"
    ADD CONSTRAINT "AvisCollecteur_auteurId_fkey"
    FOREIGN KEY ("auteurId") REFERENCES "Utilisateur"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AvisCollecteur"
    ADD CONSTRAINT "AvisCollecteur_collecteurId_fkey"
    FOREIGN KEY ("collecteurId") REFERENCES "Utilisateur"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
