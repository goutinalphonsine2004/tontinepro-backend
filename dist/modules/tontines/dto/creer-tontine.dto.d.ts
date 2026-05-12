import { FrequenceTontine, ModeTirageGroupe, PolitiqueRetrait, TypeTontine } from '@prisma/client';
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
    nbMembresMax?: number;
    montantParMembre?: number;
    cautionObligatoire?: boolean;
    montantCautionObligatoire?: number;
    penaliteRetardActive?: boolean;
    montantPenaliteRetard?: number;
    modeTirage?: ModeTirageGroupe;
}
