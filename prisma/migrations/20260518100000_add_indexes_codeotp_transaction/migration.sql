-- Index sur CodeOTP.utilisateurId (lookups lors de vérification OTP)
CREATE INDEX IF NOT EXISTS "CodeOTP_utilisateurId_idx" ON "CodeOTP"("utilisateurId");

-- Index sur CodeOTP.expireLe (cron nettoyage OTP expirés, requêtes de validité)
CREATE INDEX IF NOT EXISTS "CodeOTP_expireLe_idx" ON "CodeOTP"("expireLe");

-- Index sur Transaction.refKKiaPay (idempotence webhook KKiaPay)
CREATE INDEX IF NOT EXISTS "Transaction_refKKiaPay_idx" ON "Transaction"("refKKiaPay");
