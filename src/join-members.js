const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const tontineId = 'cf3cdc59-cd62-4752-9eed-202897af3edf';
const telephones = [
  '+2290145998165', // Marie
  '+2290145998166', // Jean
  '+2290145998167', // Koffi
  '+2290145998168', // Amina
];

async function joinTontine() {
  for (const tel of telephones) {
    const user = await prisma.utilisateur.findUnique({ where: { telephone: tel } });
    if (user) {
      await prisma.membreTontineGroupe.upsert({
        where: { tontineId_utilisateurId: { tontineId, utilisateurId: user.id } },
        create: { tontineId, utilisateurId: user.id, statut: 'ACTIF', cautionBloquee: true },
        update: { statut: 'ACTIF' }
      });
      console.log(`Membre ajouté: ${user.nom}`);
    }
  }
  
  // Ajouter aussi Paul (le propriétaire) comme membre si pas déjà fait
  const tontine = await prisma.tontine.findUnique({ where: { id: tontineId } });
  if (tontine) {
    await prisma.membreTontineGroupe.upsert({
      where: { tontineId_utilisateurId: { tontineId, utilisateurId: tontine.proprietaireId } },
      create: { tontineId, utilisateurId: tontine.proprietaireId, statut: 'ACTIF', cautionBloquee: true },
      update: { statut: 'ACTIF' }
    });
    console.log(`Propriétaire (Paul) ajouté comme membre.`);
  }

  console.log('Tous les membres sont ajoutés à la tontine.');
  await prisma.$disconnect();
  process.exit(0);
}

joinTontine().catch(e => {
  console.error(e);
  process.exit(1);
});
