const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Vérification finale...');
  
  const tontineId = '8279803b-8637-4cb5-8152-4ee66d02640d';
  const tontine = await prisma.tontine.findUnique({ where: { id: tontineId } });
  const transactions = await prisma.transaction.findMany({ where: { tontineId } });
  const agent = await prisma.utilisateur.findUnique({ where: { telephone: '+2290146074506' } });

  console.log('--- ETAT TONTINE ---');
  console.log('ID:', tontine.id);
  console.log('Nom:', tontine.nom);
  console.log('Statut:', tontine.statut);
  console.log('Solde Actuel:', tontine.soldeActuel, 'FCFA');

  console.log('\n--- TRANSACTIONS ---');
  transactions.forEach(tx => {
    console.log(`- Ref: ${tx.reference} | Montant: ${tx.montant} | Statut: ${tx.statut} | RefKKiaPay: ${tx.refKKiaPay}`);
  });

  console.log('\n--- COMMISSIONS AGENT ---');
  const commissions = await prisma.commission.findMany({ where: { agentId: agent.id } });
  console.log(`Solde Commission Marc: ${agent.soldeCommission} FCFA`);
  commissions.forEach(c => {
    console.log(`- Montant: ${c.montant} | Date: ${c.creeLe}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
