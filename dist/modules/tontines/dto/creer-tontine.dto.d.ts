import { FrequenceTontine, PolitiqueRetrait, TypeTontine } from '@prisma/client';
export declare class CreerTontineDto {
    nom: string;
    description?: string;
    type?: TypeTontine;
    politique?: PolitiqueRetrait;
    frequence?: FrequenceTontine;
    jourFixe?: number;
    objectifMontant?: number;
    montantJournalier?: number;
    dateDeverrouillage?: Date;
    dateFin?: Date;
    clientId?: string;
}
