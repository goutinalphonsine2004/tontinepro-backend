import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
} as any);

async function main() {
  console.log('🗑️  Début du reset BDD (admin conservé)...');

  // Supprimer dans l'ordre des dépendances (du plus dépendant au moins dépendant)
  await prisma.commentaireLitige.deleteMany();
  await prisma.avisCollecteur.deleteMany();
  await prisma.historiqueScore.deleteMany();
  await prisma.badgeClient.deleteMany();
  await prisma.preferenceNotification.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dossierPADME.deleteMany();
  await prisma.scoreCredit.deleteMany();
  await prisma.journalAudit.deleteMany();
  await prisma.alerteSysteme.deleteMany();
  await prisma.presenceCollecteur.deleteMany();
  await prisma.remboursementCredit.deleteMany();
  await prisma.microCredit.deleteMany();
  await prisma.operationAssistee.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.retrait.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.defaillanceGroupe.deleteMany();
  await prisma.ordreTirage.deleteMany();
  await prisma.membreTontineGroupe.deleteMany();
  await prisma.tontine.deleteMany();
  await prisma.sessionUtilisateur.deleteMany();
  await prisma.appareilBiometrique.deleteMany();
  await prisma.codeOTP.deleteMany();
  await prisma.qRCodeCollecteur.deleteMany();
  await prisma.facturationAgent.deleteMany();
  await prisma.documentKYC.deleteMany();
  await prisma.qrPapierClient.deleteMany();
  await prisma.litige.deleteMany();
  await prisma.clientTerrainProfile.deleteMany();

  // Supprimer tous les utilisateurs SAUF l'admin
  const ADMIN_TEL = '+2290141193597';
  const deleted = await prisma.utilisateur.deleteMany({
    where: { telephone: { not: ADMIN_TEL } },
  });

  console.log(`✅ Reset terminé : ${deleted.count} utilisateur(s) supprimé(s)`);
  console.log(`✅ Admin conservé : ${ADMIN_TEL}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
