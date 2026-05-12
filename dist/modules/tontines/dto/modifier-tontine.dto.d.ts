import { FrequenceTontine, PolitiqueRetrait } from '@prisma/client';
export declare class ModifierTontineDto {
    nom?: string;
    description?: string;
    politique?: PolitiqueRetrait;
    frequence?: FrequenceTontine;
    jourFixe?: number;
    objectifMontant?: number;
    montantJournalier?: number;
    dateDeverrouillage?: Date;
    dateFin?: Date;
}
