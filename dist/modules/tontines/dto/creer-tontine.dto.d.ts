import { FrequenceTontine, ModeTirageGroupe, PolitiqueRetrait, TypeTontine } from '@prisma/client';
export declare class CreerTontineDto {
    nom: string;
    description?: string;
    type?: TypeTontine;
    politique?: PolitiqueRetrait;
    frequence?: FrequenceTontine;
    jourFixe?: number;
    objectifMontantFcfa?: number;
    montantJournalierFcfa?: number;
    dateDeverrouillage?: Date;
    dateFin?: Date;
    clientId?: string;
    nbMembresMax?: number;
    montantParMembreFcfa?: number;
    cautionObligatoire?: boolean;
    montantCautionFcfaObligatoireFcfa?: number;
    penaliteRetardActive?: boolean;
    montantPenaliteRetardFcfa?: number;
    modeTirage?: ModeTirageGroupe;
}
