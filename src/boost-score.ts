import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function boostScore() {
  const clientId = '9fb1ab19-c84d-4192-b144-054d52f09a51';

  await prisma.scoreCredit.upsert({
    where: { utilisateurId: clientId },
    create: {
      utilisateurId: clientId,
      score: 65,
      eligibleMicroCredit: true,
      tauxRegularite: 0.8,
      totalDepots: 20,
      totalMois: 1,
      scoreRemboursement: 1,
      dernierCalcul: new Date(),
    },
    update: {
      score: 65,
      eligibleMicroCredit: true,
      tauxRegularite: 0.8,
      totalDepots: 20,
      dernierCalcul: new Date(),
    },
  });

  console.log('Score de Paul boosté à 65 pour le test.');
  await prisma.$disconnect();
  process.exit(0);
}

boostScore().catch((e) => {
  console.error(e);
  process.exit(1);
});
