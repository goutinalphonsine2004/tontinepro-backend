import { FrequenceTontine, ModeTirageGroupe, PolitiqueRetrait } from '@prisma/client';
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
    nbMembresMax?: number;
    montantParMembre?: number;
    cautionObligatoire?: boolean;
    montantCautionObligatoire?: number;
    penaliteRetardActive?: boolean;
    montantPenaliteRetard?: number;
    modeTirage?: ModeTirageGroupe;
}
