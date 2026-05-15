import { FrequenceTontine, ModeTirageGroupe, PolitiqueRetrait } from '@prisma/client';
export declare class ModifierTontineDto {
    nom?: string;
    description?: string;
    politique?: PolitiqueRetrait;
    frequence?: FrequenceTontine;
    jourFixe?: number;
    objectifMontantFcfa?: number;
    montantJournalierFcfa?: number;
    dateDeverrouillage?: Date;
    dateFin?: Date;
    nbMembresMax?: number;
    montantParMembreFcfa?: number;
    cautionObligatoire?: boolean;
    montantCautionFcfaObligatoireFcfa?: number;
    penaliteRetardActive?: boolean;
    montantPenaliteRetardFcfa?: number;
    modeTirage?: ModeTirageGroupe;
}
