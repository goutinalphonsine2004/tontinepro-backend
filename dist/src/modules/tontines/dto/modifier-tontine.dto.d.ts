import { PolitiqueRetrait } from '@prisma/client';
export declare class ModifierTontineDto {
    politique?: PolitiqueRetrait;
    objectifMontant?: number;
    montantJournalier?: number;
    dateDeverrouillage?: Date;
}
