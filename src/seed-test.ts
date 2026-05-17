import {
  PrismaClient,
  Role,
  StatutCompte,
  TypeCollecteur,
} from '@prisma/client';
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
} as any);
const bcrypt = require('bcrypt');

async function main() {
  console.log('Début du seed...');

  // 1. Créer la Zone
  const zone = await prisma.zone.upsert({
    where: { id: 'test-zone-id' },
    update: {},
    create: {
      id: 'test-zone-id',
      nom: 'Abomey-Calavi',
      ville: 'Abomey-Calavi',
    },
  });
  console.log('Zone Abomey-Calavi prête');

  // 2. Créer l'Admin
  await prisma.utilisateur.upsert({
    where: { telephone: '+2290141193597' },
    update: { statut: StatutCompte.ACTIF },
    create: {
      telephone: '+2290141193597',
      nom: 'Admin Test',
      role: Role.ADMIN,
      statut: StatutCompte.ACTIF,
      pinHash: await bcrypt.hash('1234', 10),
    },
  });
  console.log('Admin Test prêt');

  // 3. Assigner l'Agent à la Zone et mettre typeCollecteur: SALARIE
  await prisma.utilisateur.update({
    where: { telephone: '+2290146074506' },
    data: {
      zoneId: zone.id,
      typeCollecteur: TypeCollecteur.SALARIE,
    },
  });
  console.log('Agent Marc Collecteur assigné à la Zone');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
