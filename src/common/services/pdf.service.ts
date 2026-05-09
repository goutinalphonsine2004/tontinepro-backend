import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import PDFDocument from 'pdfkit';

export type RecuTransactionPdf = {
  reference: string;
  date: Date;
  type: string;
  statut: string;
  client: string;
  telephone: string;
  tontine: string;
  montant: number;
  fraisPlateforme: number;
  montantNet: number;
  operateur: string;
  refKKiaPay: string;
  hashIntegrite: string;
};

export type DossierPadmePdf = {
  dossierId: string;
  clientNom: string;
  clientTelephone: string;
  score: number;
  totalEpargne: number;
  tauxRegularite: number;
  creditsRembourses: number;
  genereLe: Date;
};

@Injectable()
export class PdfService {
  async genererRecuTransaction(recu: RecuTransactionPdf): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

    const done = new Promise<Buffer>((resolve) => {
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
    doc.fontSize(9).fillColor('#555').text('Hash integrite', { continued: false });
    doc.fontSize(8).fillColor('#111').text(recu.hashIntegrite, { width: 500 });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#555').text('Document genere automatiquement par TontineBenin.');
    doc.end();

    return done;
  }

  async genererEtSauverDossierPadme(dossier: DossierPadmePdf): Promise<string> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

    const done = new Promise<Buffer>((resolve) => {
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
    const dossierDir = join(process.cwd(), 'uploads', 'padme');
    await mkdir(dossierDir, { recursive: true });

    const filename = `padme-${dossier.dossierId}.pdf`;
    await writeFile(join(dossierDir, filename), buffer);

    return `uploads/padme/${filename}`;
  }

  private ligne(doc: PDFKit.PDFDocument, label: string, valeur: string) {
    doc.fontSize(10).fillColor('#555').text(label, { continued: true, width: 170 });
    doc.fillColor('#111').text(` : ${valeur}`);
  }
}
