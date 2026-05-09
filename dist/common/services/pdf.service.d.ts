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
export declare class PdfService {
    genererRecuTransaction(recu: RecuTransactionPdf): Promise<Buffer>;
    genererEtSauverDossierPadme(dossier: DossierPadmePdf): Promise<string>;
    private ligne;
}
