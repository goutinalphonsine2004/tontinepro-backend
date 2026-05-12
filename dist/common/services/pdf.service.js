"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const pdfkit_1 = __importDefault(require("pdfkit"));
let PdfService = class PdfService {
    async genererRecuTransaction(recu) {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        const done = new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });
        doc
            .fontSize(20)
            .text('TontineBenin', { align: 'center' })
            .moveDown(0.4)
            .fontSize(14)
            .text('Recu de transaction', { align: 'center' })
            .moveDown(1.5);
        this.ligne(doc, 'Reference', recu.reference);
        this.ligne(doc, 'Date', recu.date.toLocaleString('fr-FR'));
        this.ligne(doc, 'Client', `${recu.client} (${recu.telephone})`);
        this.ligne(doc, 'Tontine', recu.tontine);
        this.ligne(doc, 'Type', recu.type);
        this.ligne(doc, 'Statut', recu.statut);
        this.ligne(doc, 'Operateur', recu.operateur);
        this.ligne(doc, 'Reference KKiaPay', recu.refKKiaPay);
        doc.moveDown(0.8);
        this.ligne(doc, 'Montant', `${recu.montant.toLocaleString('fr-FR')} FCFA`);
        this.ligne(doc, 'Frais plateforme', `${recu.fraisPlateforme.toLocaleString('fr-FR')} FCFA`);
        this.ligne(doc, 'Montant net', `${recu.montantNet.toLocaleString('fr-FR')} FCFA`);
        doc.moveDown(1);
        doc
            .fontSize(9)
            .fillColor('#555')
            .text('Hash integrite', { continued: false });
        doc.fontSize(8).fillColor('#111').text(recu.hashIntegrite, { width: 500 });
        doc.moveDown(2);
        doc
            .fontSize(9)
            .fillColor('#555')
            .text('Document genere automatiquement par TontineBenin.');
        doc.end();
        return done;
    }
    async genererEtSauverDossierPadme(dossier) {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        const done = new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });
        doc
            .fontSize(20)
            .text('TontineBenin', { align: 'center' })
            .moveDown(0.4)
            .fontSize(14)
            .text('Dossier PADME genere automatiquement', { align: 'center' })
            .moveDown(1.5);
        this.ligne(doc, 'Dossier', dossier.dossierId);
        this.ligne(doc, 'Client', `${dossier.clientNom} (${dossier.clientTelephone})`);
        this.ligne(doc, 'Score', `${dossier.score}/100`);
        this.ligne(doc, 'Total epargne', `${dossier.totalEpargne.toLocaleString('fr-FR')} FCFA`);
        this.ligne(doc, 'Taux regularite', `${Math.round(dossier.tauxRegularite * 100)}%`);
        this.ligne(doc, 'Credits rembourses', `${dossier.creditsRembourses}`);
        this.ligne(doc, 'Genere le', dossier.genereLe.toLocaleString('fr-FR'));
        doc.moveDown(1.5);
        doc
            .fontSize(10)
            .text('Ce document synthetise les donnees internes TontineBenin utilisees pour la prequalification PADME.');
        doc.end();
        const buffer = await done;
        const dossierDir = (0, path_1.join)(process.cwd(), 'uploads', 'padme');
        await (0, promises_1.mkdir)(dossierDir, { recursive: true });
        const filename = `padme-${dossier.dossierId}.pdf`;
        await (0, promises_1.writeFile)((0, path_1.join)(dossierDir, filename), buffer);
        return `uploads/padme/${filename}`;
    }
    ligne(doc, label, valeur) {
        doc
            .fontSize(10)
            .fillColor('#555')
            .text(label, { continued: true, width: 170 });
        doc.fillColor('#111').text(` : ${valeur}`);
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = __decorate([
    (0, common_1.Injectable)()
], PdfService);
//# sourceMappingURL=pdf.service.js.map