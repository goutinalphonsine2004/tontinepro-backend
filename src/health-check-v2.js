const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== RAPPORT DE SANTÉ DU SYSTÈME TONTINEPRO ===');
  
  // 1. Utilisateurs Clés
  const users = await prisma.utilisateur.findMany({
    where: { telephone: { in: ['+2290146074506', '+2290145998164'] } },
    include: { _count: { select: { documentsKYC: true, microCredits: true, tontines: true } } }
  });
  
  console.log('\n--- UTILISATEURS ---');
  users.forEach(u => {
    console.log(`- ${u.nom} (${u.telephone}): Role=${u.role}, KYC=${u.kycVerifie}, Empreinte=${u.empreinteActive}, Credits=${u._count.microCredits}, Tontines=${u._count.tontines}`);
  });

  // 2. Micro-Crédits
  const credits = await prisma.microCredit.findMany({
    include: { client: { select: { nom: true } } }
  });
  console.log('\n--- MICRO-CRÉDITS ---');
  credits.forEach(c => {
    console.log(`- ID: ${c.id.substring(0,8)} | Client: ${c.client.nom} | Montant: ${c.montantPrincipal} | Statut: ${c.statut}`);
  });

  // 3. Tontines de Groupe
  const tontines = await prisma.tontine.findMany({
    where: { type: 'GROUPE' },
    include: { _count: { select: { membres: true } }, proprietaire: { select: { nom: true } } }
  });
  console.log('\n--- TONTINES DE GROUPE ---');
  for (const t of tontines) {
    const tirages = await prisma.ordreTirage.count({ where: { tontineId: t.id, aRecu: true } });
    console.log(`- ${t.nom}: Statut=${t.statut}, Membres=${t._count.membres}, Proprio=${t.proprietaire.nom}, Payés=${tirages}/${t._count.membres}`);
  }

  // 4. Commissions Agent
  const agent = users.find(u => u.role === 'AGENT');
  if (agent) {
    const totalCom = await prisma.commission.aggregate({
      where: { agentId: agent.id },
      _sum: { montant: true }
    });
    console.log('\n--- COMMISSIONS ---');
    console.log(`- ${agent.nom}: Solde DB=${agent.soldeCommission} FCFA | Cumul Calculé=${totalCom._sum.montant || 0} FCFA`);
  }

  console.log('\n=============================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
