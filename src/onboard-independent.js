const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- ONBOARDING MOUSSA (INDÉPENDANT) & FATOU (CLIENT) ---');
  
  const pinHash = await bcrypt.hash('1234', 10);

  // 1. Créer Moussa (Indépendant)
  const moussa = await prisma.utilisateur.upsert({
    where: { telephone: '+2290146074507' },
    update: {},
    create: {
      nom: 'Moussa Indépendant',
      telephone: '+2290146074507',
      role: 'INDEPENDANT',
      statut: 'ACTIF',
      pinHash,
      kycVerifie: true
    }
  });
  console.log('Moussa créé:', moussa.id);

  // 2. Configurer sa facturation (Profil PRO)
  await prisma.facturationAgent.upsert({
    where: { agentId: moussa.id },
    update: {},
    create: {
      agentId: moussa.id,
      plan: 'PRO',
      fraisMensuels: 5000,
      cautionMontant: 500000,
      prochainPaiement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  console.log('Facturation Moussa configurée (PRO)');

  // 3. Créer Fatou (Client Moussa)
  const fatou = await prisma.utilisateur.upsert({
    where: { telephone: '+2290145998168' },
    update: { collecteurId: moussa.id },
    create: {
      nom: 'Fatou Client',
      telephone: '+2290145998168',
      role: 'CLIENT',
      statut: 'ACTIF',
      pinHash,
      collecteurId: moussa.id,
      kycVerifie: true
    }
  });
  console.log('Fatou créée et assignée à Moussa:', fatou.id);

  // 4. Créer une tontine pour Fatou
  const tontine = await prisma.tontine.create({
    data: {
      nom: 'Épargne Commerce Fatou',
      type: 'PERSONNEL',
      montantJournalier: 2000,
      proprietaireId: fatou.id,
      statut: 'ACTIVE',
      frequence: 'JOURNALIER'
    }
  });
  console.log('Tontine Fatou créée:', tontine.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
