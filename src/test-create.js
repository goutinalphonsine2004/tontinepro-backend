const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Test de création de tontine...');
  
  // Trouver le client Paul
  const client = await prisma.utilisateur.findUnique({ where: { telephone: '+2290145998164' } });
  if (!client) {
    console.error('Client Paul introuvable');
    return;
  }
  console.log(`Client trouvé: ${client.nom} (${client.id})`);

  try {
    const tontine = await prisma.tontine.create({
      data: {
        nom: 'Épargne Moto Test',
        type: 'PERSONNEL',
        statut: 'CREATION',
        frequence: 'MENSUEL',
        politique: 'FLEXIBLE',
        objectifMontant: 100000,
        montantJournalier: 1000,
        proprietaireId: client.id,
      }
    });
    console.log('Tontine créée avec succès:', tontine.id);
  } catch (error) {
    console.error('Erreur lors de la création:', JSON.stringify(error, null, 2));
    if (error.cause) {
      console.error('Cause de l\'erreur:', JSON.stringify(error.cause, null, 2));
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
