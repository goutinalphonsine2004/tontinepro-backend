import { PolitiqueRetrait, TypeTontine } from '@prisma/client';
export declare class CreerTontineDto {
    nom: string;
    type?: TypeTontine;
    politique?: PolitiqueRetrait;
    objectifMontant?: number;
    montantJournalier?: number;
    dateDeverrouillage?: Date;
}
