const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const tontineId = 'cf3cdc59-cd62-4752-9eed-202897af3edf';

async function fixTirage() {
  // Supprimer tout tirage existant pour repartir à zéro (plus propre)
  await prisma.ordreTirage.deleteMany({ where: { tontineId } });
  
  const membres = await prisma.membreTontineGroupe.findMany({
    where: { tontineId, statut: 'ACTIF' },
    orderBy: { rejointLe: 'asc' }
  });

  console.log(`Membres trouvés: ${membres.length}`);

  for (let i = 0; i < membres.length; i++) {
    await prisma.ordreTirage.create({
      data: {
        tontineId,
        utilisateurId: membres[i].utilisateurId,
        position: i + 1
      }
    });
    console.log(`Position ${i + 1} assignée à l'utilisateur ${membres[i].utilisateurId}`);
  }

  console.log('Ordre de tirage synchronisé pour tous les membres.');
  await prisma.$disconnect();
  process.exit(0);
}

fixTirage().catch(e => {
  console.error(e);
  process.exit(1);
});
