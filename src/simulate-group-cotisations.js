const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const tontineId = 'cf3cdc59-cd62-4752-9eed-202897af3edf';
const telephones = [
  '+2290145998164', // Paul
  '+2290146074506', // Marc
  '+2290145998165', // Marie
  '+2290145998166', // Jean
  '+2290145998167', // Koffi
  '+2290145998168', // Amina
];

async function simulateCotisations() {
  let totalCotise = 0;
  for (const tel of telephones) {
    const user = await prisma.utilisateur.findUnique({ where: { telephone: tel } });
    if (user) {
      const montant = 1000;
      const frais = 30; // 3%
      const net = montant - frais;

      await prisma.transaction.create({
        data: {
          montant,
          montantNet: net,
          fraisPlateforme: frais,
          type: 'COTISATION',
          statut: 'SUCCES',
          tontineId,
          utilisateurId: user.id,
          refKKiaPay: `sim_group_${Date.now()}_${user.id.substring(0,4)}`
        }
      });
      totalCotise += net;
      console.log(`Cotisation simulée pour ${user.nom}: ${montant} FCFA`);
    }
  }

  await prisma.tontine.update({
    where: { id: tontineId },
    data: { soldeActuel: totalCotise }
  });

  console.log(`Solde de la tontine mis à jour à ${totalCotise} FCFA.`);
  await prisma.$disconnect();
  process.exit(0);
}

simulateCotisations().catch(e => {
  console.error(e);
  process.exit(1);
});
