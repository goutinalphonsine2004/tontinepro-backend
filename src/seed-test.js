const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Début du seed (JS)...');

  // 1. Créer la Zone
  const zone = await prisma.zone.upsert({
    where: { id: 'test-zone-id' },
    update: {},
    create: { 
      id: 'test-zone-id',
      nom: 'Abomey-Calavi',
      ville: 'Abomey-Calavi'
    },
  });
  console.log('Zone Abomey-Calavi prête');

  // 2. Créer l'Admin
  await prisma.utilisateur.upsert({
    where: { telephone: '+2290141193597' },
    update: { statut: 'ACTIF' },
    create: {
      telephone: '+2290141193597',
      nom: 'Admin Test',
      role: 'ADMIN',
      statut: 'ACTIF',
      pinHash: await bcrypt.hash('1234', 10),
    },
  });
  console.log('Admin Test prêt');

  // 3. Assigner l'Agent à la Zone et mettre typeCollecteur: SALARIE
  const agent = await prisma.utilisateur.update({
    where: { telephone: '+2290146074506' },
    data: {
      zoneId: zone.id,
      typeCollecteur: 'SALARIE',
    },
  });
  console.log('Agent Marc Collecteur assigné à la Zone');

  // 4. Lier le Client à l'Agent
  await prisma.utilisateur.update({
    where: { telephone: '+2290145998164' },
    data: {
      collecteurId: agent.id,
    },
  });
  console.log('Client Paul lié à l\'Agent Marc');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
