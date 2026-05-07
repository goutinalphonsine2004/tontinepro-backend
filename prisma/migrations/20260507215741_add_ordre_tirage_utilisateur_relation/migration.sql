-- AddForeignKey
ALTER TABLE "OrdreTirage" ADD CONSTRAINT "OrdreTirage_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
