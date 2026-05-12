"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require('bcrypt');
const prisma = new client_1.PrismaClient();
const ADMIN_TEL = '+2290141193597';
const ADMIN_PIN = '1234';
const ZONE_ID = 'test-zone-id';
async function main() {
    console.log('\n🔄  Début du reset de la base de données...\n');
    console.log('  ⬛  Suppression des sessions, OTPs, tontines, transactions...');
    const nonAdmins = await prisma.utilisateur.findMany({
        where: { role: { not: client_1.Role.ADMIN } },
        select: { id: true },
    });
    const ids = nonAdmins.map(u => u.id);
    if (ids.length > 0) {
        await prisma.sessionUtilisateur.deleteMany({ where: { utilisateurId: { in: ids } } });
        await prisma.codeOTP.deleteMany({ where: { utilisateurId: { in: ids } } });
        await prisma.appareilBiometrique.deleteMany({ where: { utilisateurId: { in: ids } } });
        await prisma.transaction.deleteMany({ where: { utilisateurId: { in: ids } } }).catch(() => { });
        await prisma.retrait.deleteMany({ where: { utilisateurId: { in: ids } } }).catch(() => { });
        await prisma.microCredit.deleteMany({ where: { emprunteurId: { in: ids } } }).catch(() => { });
        await prisma.membreTontine.deleteMany({ where: { utilisateurId: { in: ids } } }).catch(() => { });
        await prisma.tontine.deleteMany({ where: { proprietaireId: { in: ids } } }).catch(() => { });
        await prisma.scorePADME.deleteMany({ where: { utilisateurId: { in: ids } } }).catch(() => { });
        await prisma.badgeUtilisateur.deleteMany({ where: { utilisateurId: { in: ids } } }).catch(() => { });
        await prisma.utilisateur.deleteMany({ where: { id: { in: ids } } });
        console.log(`  ✅  ${ids.length} utilisateur(s) non-admin supprimé(s)\n`);
    }
    else {
        console.log('  ✅  Aucun utilisateur non-admin à supprimer\n');
    }
    const admin = await prisma.utilisateur.findUnique({ where: { telephone: ADMIN_TEL } });
    if (admin) {
        await prisma.sessionUtilisateur.deleteMany({ where: { utilisateurId: admin.id } });
        await prisma.codeOTP.deleteMany({ where: { utilisateurId: admin.id } });
        await prisma.appareilBiometrique.deleteMany({ where: { utilisateurId: admin.id } });
        console.log('  ✅  Sessions et OTPs admin purgés\n');
    }
    await prisma.zone.upsert({
        where: { id: ZONE_ID },
        update: {},
        create: { id: ZONE_ID, nom: 'Abomey-Calavi', ville: 'Abomey-Calavi' },
    });
    console.log('  ✅  Zone Abomey-Calavi prête\n');
    const pinHash = await bcrypt.hash(ADMIN_PIN, 10);
    await prisma.utilisateur.upsert({
        where: { telephone: ADMIN_TEL },
        update: { statut: client_1.StatutCompte.ACTIF, pinHash, tentativesEchouees: 0, bloqueLe: null },
        create: {
            telephone: ADMIN_TEL,
            nom: 'Admin TontinePro',
            role: client_1.Role.ADMIN,
            statut: client_1.StatutCompte.ACTIF,
            pinHash,
        },
    });
    console.log('  ✅  Admin reset → PIN 1234\n');
    const total = await prisma.utilisateur.count();
    console.log('─────────────────────────────────────────────');
    console.log(`✅  BASE PRÊTE — ${total} utilisateur(s) en base`);
    console.log(`\n  📱  Admin   : ${ADMIN_TEL} (PIN: ${ADMIN_PIN})`);
    console.log(`  🌍  Zone    : Abomey-Calavi\n`);
    console.log('🚀  Inscrivez votre numéro dans l\'app Flutter !');
    console.log('─────────────────────────────────────────────\n');
}
main()
    .catch(e => { console.error('❌ Erreur:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=reset-for-test.js.map