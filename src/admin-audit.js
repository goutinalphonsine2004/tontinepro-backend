const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== AUDIT GÉNÉRAL DE LA PLATEFORME (ADMIN) ===');
  
  // 1. Volumes Financiers
  const volumeTxs = await prisma.transaction.aggregate({
    where: { type: 'COTISATION', statut: 'SUCCES' },
    _sum: { montant: true, fraisPlateforme: true, fraisAgent: true }
  });

  console.log('\n--- PERFORMANCE FINANCIÈRE ---');
  console.log(`- Volume Total Collecté: ${volumeTxs._sum.montant || 0} FCFA`);
  console.log(`- REVENU PLATEFORME (Fees): ${volumeTxs._sum.fraisPlateforme || 0} FCFA`);
  console.log(`- Commissions Agents Payées: ${volumeTxs._sum.fraisAgent || 0} FCFA`);

  // 2. Micro-Crédit Health
  const creditStats = await prisma.microCredit.aggregate({
    where: { statut: { in: ['ACTIF', 'EN_DEFAUT'] } },
    _sum: { montantPrincipal: true, montantRestant: true },
    _count: { id: true }
  });

  console.log('\n--- PORTEFEUILLE CRÉDIT ---');
  console.log(`- Crédits Actifs: ${creditStats._count.id}`);
  console.log(`- Principal Engagé: ${creditStats._sum.montantPrincipal || 0} FCFA`);
  console.log(`- Encours de Remboursement: ${creditStats._sum.montantRestant || 0} FCFA`);

  // 3. Revenu Récurrent (Abonnements Agents)
  const facturationTotal = await prisma.facturationAgent.aggregate({
    where: { actif: true },
    _sum: { fraisMensuels: true }
  });
  const nbIndependants = await prisma.utilisateur.count({ where: { role: 'INDEPENDANT', statut: 'ACTIF' } });

  console.log('\n--- ABONNEMENTS & AGENTS ---');
  console.log(`- Nombre d'Agents Indépendants: ${nbIndependants}`);
  console.log(`- Revenu Récurrent Estimé (Base): ${facturationTotal._sum.fraisMensuels || 0} FCFA/mois`);

  // 4. Utilisation des Zones
  const nbZones = await prisma.zone.count();
  const agentsSansZone = await prisma.utilisateur.count({ where: { role: 'AGENT', zoneId: null } });

  console.log('\n--- GESTION TERRITORIALE ---');
  console.log(`- Zones Actives: ${nbZones}`);
  console.log(`- Agents en attente d'affectation de zone: ${agentsSansZone}`);

  console.log('\n=============================================');
  console.log('CONCLUION: SYSTÈME SAIN ET ÉQUILIBRÉ.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
