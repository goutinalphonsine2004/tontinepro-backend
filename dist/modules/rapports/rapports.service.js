"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RapportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pdfkit_1 = __importDefault(require("pdfkit"));
const prisma_service_1 = require("../../prisma/prisma.service");
let RapportsService = class RapportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportTransactionsCsv(dto) {
        const periode = this.periode(dto);
        const transactions = await this.prisma.transaction.findMany({
            where: { creeLe: { gte: periode.debut, lte: periode.fin } },
            include: {
                utilisateur: { select: { nom: true, telephone: true, role: true } },
                tontine: { select: { nom: true } },
            },
            orderBy: { creeLe: 'desc' },
        });
        const csv = this.csv([
            'reference',
            'date',
            'client',
            'telephone',
            'role',
            'tontine',
            'type',
            'statut',
            'montant',
            'montantNet',
            'fraisPlateforme',
            'fraisAgent',
            'operateur',
            'refKKiaPay',
        ], transactions.map((tx) => [
            tx.reference,
            tx.creeLe.toISOString(),
            tx.utilisateur.nom,
            tx.utilisateur.telephone,
            tx.utilisateur.role,
            tx.tontine?.nom ?? '',
            tx.type,
            tx.statut,
            tx.montant,
            tx.montantNet,
            tx.fraisPlateforme,
            tx.fraisAgent,
            tx.operateur ?? '',
            tx.refKKiaPay ?? '',
        ]));
        return {
            buffer: Buffer.from(csv, 'utf8'),
            filename: `transactions-${periode.label}.csv`,
        };
    }
    async exportRetraitsCsv(dto) {
        const periode = this.periode(dto);
        const retraits = await this.prisma.retrait.findMany({
            where: { creeLe: { gte: periode.debut, lte: periode.fin } },
            include: {
                utilisateur: { select: { nom: true, telephone: true, role: true } },
                tontine: { select: { nom: true } },
            },
            orderBy: { creeLe: 'desc' },
        });
        const csv = this.csv([
            'id',
            'date',
            'client',
            'telephone',
            'role',
            'tontine',
            'montant',
            'statut',
            'validePar',
            'motifRejet',
            'refKKiaPay',
            'executeLe',
        ], retraits.map((r) => [
            r.id,
            r.creeLe.toISOString(),
            r.utilisateur.nom,
            r.utilisateur.telephone,
            r.utilisateur.role,
            r.tontine.nom,
            r.montant,
            r.statut,
            r.validePar ?? '',
            r.motifRejet ?? '',
            r.refKKiaPay ?? '',
            r.executeLe?.toISOString() ?? '',
        ]));
        return {
            buffer: Buffer.from(csv, 'utf8'),
            filename: `retraits-${periode.label}.csv`,
        };
    }
    async exportMicroCreditsCsv(dto) {
        const periode = this.periode(dto);
        const credits = await this.prisma.microCredit.findMany({
            where: { creeLe: { gte: periode.debut, lte: periode.fin } },
            include: {
                client: { select: { nom: true, telephone: true, collecteurId: true } },
            },
            orderBy: { creeLe: 'desc' },
        });
        const csv = this.csv([
            'id',
            'date',
            'client',
            'telephone',
            'collecteurId',
            'principal',
            'interet',
            'total',
            'journalier',
            'joursPayes',
            'restant',
            'statut',
            'score',
            'echeance',
        ], credits.map((c) => [
            c.id,
            c.creeLe.toISOString(),
            c.client.nom,
            c.client.telephone,
            c.client.collecteurId ?? '',
            c.montantPrincipal,
            c.montantTotal - c.montantPrincipal,
            c.montantTotal,
            c.paiementJournalier,
            c.joursPayes,
            c.montantRestant,
            c.statut,
            c.scoreAuMoment,
            c.dateEcheance.toISOString(),
        ]));
        return {
            buffer: Buffer.from(csv, 'utf8'),
            filename: `micro-credits-${periode.label}.csv`,
        };
    }
    async rapportFinancierPdf(dto) {
        const periode = this.periode(dto);
        const [cotisations, retraitsExecutes, distributions, commissions, microCredits, remboursements, abonnements, transactionsParStatut,] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: {
                    type: client_1.TypeTransaction.COTISATION,
                    statut: client_1.StatutTransaction.SUCCES,
                    creeLe: { gte: periode.debut, lte: periode.fin },
                },
                _sum: {
                    montant: true,
                    montantNet: true,
                    fraisPlateforme: true,
                    fraisAgent: true,
                },
                _count: true,
            }),
            this.prisma.retrait.aggregate({
                where: {
                    statut: client_1.StatutRetrait.EXECUTE,
                    creeLe: { gte: periode.debut, lte: periode.fin },
                },
                _sum: { montant: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: {
                    type: client_1.TypeTransaction.DISTRIBUTION_GROUPE,
                    creeLe: { gte: periode.debut, lte: periode.fin },
                },
                _sum: { montant: true, montantNet: true },
                _count: true,
            }),
            this.prisma.commission.aggregate({
                where: { creeLe: { gte: periode.debut, lte: periode.fin } },
                _sum: { montant: true },
                _count: true,
            }),
            this.prisma.microCredit.findMany({
                where: {
                    creeLe: { gte: periode.debut, lte: periode.fin },
                    statut: {
                        in: [
                            client_1.StatutCredit.ACTIF,
                            client_1.StatutCredit.TERMINE,
                            client_1.StatutCredit.EN_DEFAUT,
                        ],
                    },
                },
                select: { montantPrincipal: true, montantTotal: true, statut: true },
            }),
            this.prisma.remboursementCredit.aggregate({
                where: {
                    statut: 'SUCCES',
                    payeLe: { gte: periode.debut, lte: periode.fin },
                },
                _sum: { montant: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: {
                    type: client_1.TypeTransaction.ABONNEMENT,
                    statut: client_1.StatutTransaction.SUCCES,
                    creeLe: { gte: periode.debut, lte: periode.fin },
                },
                _sum: { montant: true },
                _count: true,
            }),
            this.prisma.transaction.groupBy({
                by: ['statut'],
                where: { creeLe: { gte: periode.debut, lte: periode.fin } },
                _count: true,
            }),
        ]);
        const principalCredits = microCredits.reduce((s, c) => s + c.montantPrincipal, 0);
        const interetsCredits = microCredits.reduce((s, c) => s + (c.montantTotal - c.montantPrincipal), 0);
        const creditsEnDefaut = microCredits.filter((c) => c.statut === client_1.StatutCredit.EN_DEFAUT).length;
        const buffer = await this.pdf((doc) => {
            doc.fontSize(20).text('TontineBenin', { align: 'center' });
            doc
                .moveDown(0.4)
                .fontSize(14)
                .text('Rapport financier mensuel', { align: 'center' });
            doc
                .moveDown(0.5)
                .fontSize(10)
                .text(`Periode: ${periode.label}`, { align: 'center' });
            doc.moveDown(1.5);
            this.section(doc, 'Flux epargne');
            this.ligne(doc, 'Cotisations brutes', this.fcfa(cotisations._sum.montant ?? 0));
            this.ligne(doc, 'Cotisations nettes creditees', this.fcfa(cotisations._sum.montantNet ?? 0));
            this.ligne(doc, 'Nombre cotisations', `${cotisations._count}`);
            this.ligne(doc, 'Retraits executes', this.fcfa(retraitsExecutes._sum.montant ?? 0));
            this.ligne(doc, 'Nombre retraits executes', `${retraitsExecutes._count}`);
            this.ligne(doc, 'Distributions groupe', this.fcfa(distributions._sum.montant ?? 0));
            this.section(doc, 'Revenus');
            this.ligne(doc, 'Frais plateforme cotisations', this.fcfa(cotisations._sum.fraisPlateforme ?? 0));
            this.ligne(doc, 'Commissions agents', this.fcfa(cotisations._sum.fraisAgent ?? 0));
            this.ligne(doc, 'Commissions comptabilisees', this.fcfa(commissions._sum.montant ?? 0));
            this.ligne(doc, 'Abonnements', this.fcfa(abonnements._sum.montant ?? 0));
            this.ligne(doc, 'Interets micro-credits generes', this.fcfa(interetsCredits));
            this.section(doc, 'Micro-credits');
            this.ligne(doc, 'Principal decaisse', this.fcfa(principalCredits));
            this.ligne(doc, 'Remboursements recus', this.fcfa(remboursements._sum.montant ?? 0));
            this.ligne(doc, 'Credits actifs/termines/defaut crees', `${microCredits.length}`);
            this.ligne(doc, 'Credits en defaut', `${creditsEnDefaut}`);
            this.section(doc, 'Transactions par statut');
            for (const item of transactionsParStatut) {
                this.ligne(doc, item.statut, `${item._count}`);
            }
            doc
                .moveDown(1.5)
                .fontSize(9)
                .fillColor('#555')
                .text(`Document genere le ${new Date().toLocaleString('fr-FR')}.`);
        });
        return { buffer, filename: `rapport-financier-${periode.label}.pdf` };
    }
    periode(dto) {
        if (dto.dateDebut || dto.dateFin) {
            const debut = dto.dateDebut
                ? new Date(dto.dateDebut)
                : new Date('2020-01-01T00:00:00.000Z');
            const fin = dto.dateFin ? this.finDeJournee(dto.dateFin) : new Date();
            return {
                debut,
                fin,
                label: `${debut.toISOString().slice(0, 10)}_${fin.toISOString().slice(0, 10)}`,
            };
        }
        const now = new Date();
        const annee = dto.annee ?? now.getFullYear();
        const mois = dto.mois ?? now.getMonth() + 1;
        const debut = new Date(annee, mois - 1, 1, 0, 0, 0, 0);
        const fin = new Date(annee, mois, 0, 23, 59, 59, 999);
        return { debut, fin, label: `${annee}-${String(mois).padStart(2, '0')}` };
    }
    csv(headers, rows) {
        return [headers, ...rows]
            .map((row) => row.map((value) => this.csvCell(value)).join(','))
            .join('\n');
    }
    csvCell(value) {
        const text = String(value ?? '');
        const escaped = text.replace(/"/g, '""');
        return `"${escaped}"`;
    }
    async pdf(render) {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
        render(doc);
        doc.end();
        return done;
    }
    async microCreditsPdf(dto) {
        const periode = this.periode(dto);
        const credits = await this.prisma.microCredit.findMany({
            where: { creeLe: { gte: periode.debut, lte: periode.fin } },
            include: { client: { select: { nom: true, telephone: true } } },
            orderBy: [{ statut: 'asc' }, { creeLe: 'desc' }],
        });
        const actifs = credits.filter((c) => c.statut === 'ACTIF');
        const termines = credits.filter((c) => c.statut === 'TERMINE');
        const defaut = credits.filter((c) => c.statut === 'EN_DEFAUT');
        const totalDecaisse = credits.reduce((s, c) => s + c.montantPrincipal, 0);
        const totalInterets = credits.reduce((s, c) => s + (c.montantTotal - c.montantPrincipal), 0);
        const totalRestant = credits
            .filter((c) => c.statut === 'ACTIF')
            .reduce((s, c) => s + c.montantRestant, 0);
        const buffer = await new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50, size: 'A4' });
            const chunks = [];
            doc.on('data', (c) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc
                .fontSize(18)
                .fillColor('#1a1a2e')
                .text('Rapport Micro-Crédits', { align: 'center' });
            doc
                .moveDown(0.5)
                .fontSize(11)
                .fillColor('#666')
                .text(`Période: ${periode.label}`, { align: 'center' });
            doc.moveDown(2);
            this.section(doc, 'SYNTHÈSE');
            this.ligne(doc, 'Total crédits émis', `${credits.length}`);
            this.ligne(doc, 'En cours (ACTIF)', `${actifs.length}`);
            this.ligne(doc, 'Terminés', `${termines.length}`);
            this.ligne(doc, 'En défaut', `${defaut.length}`);
            this.ligne(doc, 'Taux de remboursement', `${credits.length > 0 ? Math.round((termines.length / credits.length) * 100) : 0}%`);
            this.ligne(doc, 'Taux de défaut', `${credits.length > 0 ? Math.round((defaut.length / credits.length) * 100) : 0}%`);
            doc.moveDown(1);
            this.section(doc, 'FINANCES');
            this.ligne(doc, 'Total décaissé', this.fcfa(totalDecaisse));
            this.ligne(doc, 'Intérêts générés', this.fcfa(totalInterets));
            this.ligne(doc, 'Capital restant dû', this.fcfa(totalRestant));
            doc.moveDown(1);
            if (defaut.length > 0) {
                this.section(doc, `CLIENTS EN DÉFAUT (${defaut.length})`);
                defaut.forEach((c) => {
                    doc
                        .fontSize(10)
                        .fillColor('#dc2626')
                        .text(`• ${c.client.nom} (${c.client.telephone}) — Restant: ${this.fcfa(c.montantRestant)}`);
                });
                doc.moveDown(1);
            }
            this.section(doc, `CRÉDITS ACTIFS (${actifs.length})`);
            actifs.slice(0, 30).forEach((c) => {
                doc
                    .fontSize(9)
                    .fillColor('#555')
                    .text(`${c.client.nom} | ${this.fcfa(c.montantPrincipal)} | Score: ${c.scoreAuMoment} | Restant: ${this.fcfa(c.montantRestant)} | ${c.joursPayes}/${c.totalJours} j`);
            });
            if (actifs.length > 30)
                doc.text(`... et ${actifs.length - 30} autres crédits actifs`);
            doc.end();
        });
        return {
            buffer,
            filename: `micro-credits-${periode.label.replace(/\s/g, '_')}.pdf`,
        };
    }
    async rapportAgentsPdf(dto) {
        const periode = this.periode(dto);
        const agents = await this.prisma.utilisateur.findMany({
            where: { role: { in: ['AGENT', 'INDEPENDANT'] } },
            include: {
                clients: {
                    include: {
                        transactions: {
                            where: {
                                type: 'COTISATION',
                                statut: 'SUCCES',
                                creeLe: { gte: periode.debut, lte: periode.fin },
                            },
                            select: { montant: true },
                        },
                        scoreCredit: { select: { tauxRegularite: true } },
                    },
                },
                commissions: {
                    where: { creeLe: { gte: periode.debut, lte: periode.fin } },
                    select: { montant: true },
                },
            },
            orderBy: { nom: 'asc' },
        });
        const perf = agents
            .map((a) => ({
            nom: a.nom,
            telephone: a.telephone,
            role: a.role,
            nbClients: a.clients.length,
            volumeCollecte: a.clients
                .flatMap((c) => c.transactions)
                .reduce((s, tx) => s + tx.montant, 0),
            commissions: a.commissions.reduce((s, c) => s + c.montant, 0),
            tauxMoyenRegularite: a.clients.length > 0
                ? a.clients
                    .filter((c) => c.scoreCredit)
                    .reduce((s, c) => s + (c.scoreCredit?.tauxRegularite ?? 0), 0) /
                    a.clients.length
                : 0,
        }))
            .sort((a, b) => b.volumeCollecte - a.volumeCollecte);
        const buffer = await new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50, size: 'A4' });
            const chunks = [];
            doc.on('data', (c) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc
                .fontSize(18)
                .fillColor('#1a1a2e')
                .text('Rapport Performance Agents', { align: 'center' });
            doc
                .moveDown(0.5)
                .fontSize(11)
                .fillColor('#666')
                .text(`Période: ${periode.label}`, { align: 'center' });
            doc.moveDown(1.5);
            perf.forEach((agent, idx) => {
                doc
                    .fontSize(12)
                    .fillColor('#1a1a2e')
                    .text(`${idx + 1}. ${agent.nom} (${agent.role})`);
                doc
                    .fontSize(10)
                    .fillColor('#555')
                    .text(`   Tél: ${agent.telephone}`)
                    .text(`   Clients: ${agent.nbClients} | Volume: ${this.fcfa(agent.volumeCollecte)} | Commissions: ${this.fcfa(agent.commissions)}`)
                    .text(`   Taux régularité moyen clients: ${Math.round(agent.tauxMoyenRegularite * 100)}%`);
                doc.moveDown(0.5);
            });
            doc.end();
        });
        return {
            buffer,
            filename: `agents-${periode.label.replace(/\s/g, '_')}.pdf`,
        };
    }
    async bilanComptablePdf(dto) {
        const periode = this.periode(dto);
        const where = { creeLe: { gte: periode.debut, lte: periode.fin } };
        const [cotisations, retraits, credits, commissions, decaissements] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: {
                    ...where,
                    type: 'COTISATION',
                    statut: 'SUCCES',
                },
                _sum: { montant: true, fraisPlateforme: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: { ...where, type: 'RETRAIT', statut: 'SUCCES' },
                _sum: { montant: true },
                _count: true,
            }),
            this.prisma.microCredit.findMany({
                where: { ...where, statut: { in: ['ACTIF', 'TERMINE'] } },
                select: { montantPrincipal: true, montantTotal: true },
            }),
            this.prisma.commission.aggregate({
                where,
                _sum: { montant: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: {
                    ...where,
                    type: 'DEBLOCAGE_CREDIT',
                    statut: 'SUCCES',
                },
                _sum: { montant: true },
            }),
        ]);
        const revenus = (cotisations._sum.fraisPlateforme ?? 0) +
            credits.reduce((s, c) => s + (c.montantTotal - c.montantPrincipal), 0);
        const charges = commissions._sum.montant ?? 0;
        const resultatNet = revenus - charges;
        const buffer = await new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50, size: 'A4' });
            const chunks = [];
            doc.on('data', (c) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc
                .fontSize(18)
                .fillColor('#1a1a2e')
                .text('Bilan Comptable Mensuel', { align: 'center' });
            doc
                .moveDown(0.5)
                .fontSize(11)
                .fillColor('#666')
                .text(`Période: ${periode.label}`, { align: 'center' });
            doc.moveDown(2);
            this.section(doc, 'FLUX FINANCIERS');
            this.ligne(doc, 'Cotisations collectées', this.fcfa(cotisations._sum.montant ?? 0));
            this.ligne(doc, 'Retraits exécutés', this.fcfa(retraits._sum.montant ?? 0));
            this.ligne(doc, 'Décaissements crédits', this.fcfa(decaissements._sum.montant ?? 0));
            doc.moveDown(1);
            this.section(doc, "COMPTE D'EXPLOITATION");
            this.ligne(doc, 'Frais plateforme collectés', this.fcfa(cotisations._sum.fraisPlateforme ?? 0));
            this.ligne(doc, 'Intérêts micro-crédits', this.fcfa(credits.reduce((s, c) => s + (c.montantTotal - c.montantPrincipal), 0)));
            this.ligne(doc, '= REVENUS BRUTS', this.fcfa(revenus));
            this.ligne(doc, '- Commissions agents', this.fcfa(charges));
            doc.moveDown(0.5);
            doc
                .fontSize(13)
                .fillColor(resultatNet >= 0 ? '#16a34a' : '#dc2626')
                .text(`RÉSULTAT NET: ${this.fcfa(resultatNet)}`);
            doc.end();
        });
        return {
            buffer,
            filename: `bilan-${periode.label.replace(/\s/g, '_')}.pdf`,
        };
    }
    section(doc, titre) {
        doc.moveDown(1).fontSize(13).fillColor('#111').text(titre);
        doc.moveDown(0.3);
    }
    ligne(doc, label, valeur) {
        doc
            .fontSize(10)
            .fillColor('#555')
            .text(label, { continued: true, width: 230 });
        doc.fillColor('#111').text(` : ${valeur}`);
    }
    fcfa(montant) {
        return `${Math.round(montant).toLocaleString('fr-FR')} FCFA`;
    }
    finDeJournee(date) {
        const fin = new Date(date);
        fin.setHours(23, 59, 59, 999);
        return fin;
    }
};
exports.RapportsService = RapportsService;
exports.RapportsService = RapportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RapportsService);
//# sourceMappingURL=rapports.service.js.map