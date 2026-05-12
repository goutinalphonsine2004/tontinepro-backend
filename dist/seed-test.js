"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const bcrypt = require('bcrypt');
async function main() {
    console.log('Début du seed...');
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
    await prisma.utilisateur.upsert({
        where: { telephone: '+2290141193597' },
        update: { statut: client_1.StatutCompte.ACTIF },
        create: {
            telephone: '+2290141193597',
            nom: 'Admin Test',
            role: client_1.Role.ADMIN,
            statut: client_1.StatutCompte.ACTIF,
            pinHash: await bcrypt.hash('1234', 10),
        },
    });
    console.log('Admin Test prêt');
    await prisma.utilisateur.update({
        where: { telephone: '+2290146074506' },
        data: {
            zoneId: zone.id,
            typeCollecteur: client_1.TypeCollecteur.SALARIE,
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
//# sourceMappingURL=seed-test.js.map