const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const clients = [
  { telephone: '+2290145998165', nom: 'Marie Smartphone', role: 'CLIENT' },
  { telephone: '+2290145998166', nom: 'Jean Smartphone', role: 'CLIENT' },
  { telephone: '+2290145998167', nom: 'Koffi Nokia', role: 'CLIENT' },
  { telephone: '+2290145998168', nom: 'Amina Nokia', role: 'CLIENT' },
];

async function onboardClients() {
  const pinHash = await bcrypt.hash('1234', 10);
  const zoneId = 'test-zone-id';
  const agentId = '6e3c0509-7827-48fe-9679-d67a7e598b76'; // Marc Collecteur

  for (const c of clients) {
    const user = await prisma.utilisateur.upsert({
      where: { telephone: c.telephone },
      create: {
        telephone: c.telephone,
        nom: c.nom,
        role: 'CLIENT',
        pinHash,
        statut: 'ACTIF',
        zoneId,
        collecteurId: agentId
      },
      update: {
        statut: 'ACTIF',
        collecteurId: agentId
      }
    });
    console.log(`Client onboardé: ${c.nom} (${c.telephone})`);
  }

  console.log('Tous les clients sont prêts et liés à Marc Collecteur.');
  await prisma.$disconnect();
  process.exit(0);
}

onboardClients().catch(e => {
  console.error(e);
  process.exit(1);
});
