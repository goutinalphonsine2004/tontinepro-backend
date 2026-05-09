-- Persist operational alerts used by accounting checks and circuit breakers.
CREATE TABLE "AlerteSysteme" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severite" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'OUVERTE',
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" TEXT,
    "detecteeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolueLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlerteSysteme_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AlerteSysteme_statut_severite_idx" ON "AlerteSysteme"("statut", "severite");
CREATE INDEX "AlerteSysteme_resourceType_resourceId_idx" ON "AlerteSysteme"("resourceType", "resourceId");
CREATE INDEX "AlerteSysteme_type_idx" ON "AlerteSysteme"("type");
