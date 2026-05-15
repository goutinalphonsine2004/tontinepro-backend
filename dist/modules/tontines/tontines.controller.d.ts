import { TontinesService } from './tontines.service';
import { CreerTontineDto } from './dto/creer-tontine.dto';
import { ModifierTontineDto } from './dto/modifier-tontine.dto';
import { RejoindreTonitneDto } from './dto/rejoindre-tontine.dto';
import { OrdreTirageDto } from './dto/ordre-tirage.dto';
export declare class TontinesController {
    private service;
    constructor(service: TontinesService);
    creer(u: {
        id: string;
    }, dto: CreerTontineDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            proprietaire: {
                telephone: string;
                id: string;
                nom: string;
            };
        } & {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuelFcfa: number;
            objectifMontantFcfa: number | null;
            dateDeverrouillage: Date | null;
            montantJournalierFcfa: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembreFcfa: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoireFcfa: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetardFcfa: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    mesTontines(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            proprietaire: ({
                _count: {
                    transactions: number;
                    membres: number;
                };
            } & {
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                type: import("@prisma/client").$Enums.TypeTontine;
                nom: string;
                statut: import("@prisma/client").$Enums.StatutTontine;
                codeInvitation: string | null;
                politique: import("@prisma/client").$Enums.PolitiqueRetrait;
                soldeActuelFcfa: number;
                objectifMontantFcfa: number | null;
                dateDeverrouillage: Date | null;
                montantJournalierFcfa: number;
                proprietaireId: string;
                dateFin: Date | null;
                dateProchaineCotisation: Date | null;
                description: string | null;
                frequence: import("@prisma/client").$Enums.FrequenceTontine;
                jourFixe: number | null;
                qrInvitation: string | null;
                nbMembresMax: number | null;
                montantParMembreFcfa: number | null;
                cautionObligatoire: boolean;
                montantCautionObligatoireFcfa: number;
                penaliteRetardActive: boolean;
                montantPenaliteRetardFcfa: number;
                modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
                tourActuel: number;
            })[];
            membre: {
                monStatut: import("@prisma/client").$Enums.StatutMembreGroupe;
                caution: number;
                _count: {
                    membres: number;
                };
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                type: import("@prisma/client").$Enums.TypeTontine;
                nom: string;
                statut: import("@prisma/client").$Enums.StatutTontine;
                codeInvitation: string | null;
                politique: import("@prisma/client").$Enums.PolitiqueRetrait;
                soldeActuelFcfa: number;
                objectifMontantFcfa: number | null;
                dateDeverrouillage: Date | null;
                montantJournalierFcfa: number;
                proprietaireId: string;
                dateFin: Date | null;
                dateProchaineCotisation: Date | null;
                description: string | null;
                frequence: import("@prisma/client").$Enums.FrequenceTontine;
                jourFixe: number | null;
                qrInvitation: string | null;
                nbMembresMax: number | null;
                montantParMembreFcfa: number | null;
                cautionObligatoire: boolean;
                montantCautionObligatoireFcfa: number;
                penaliteRetardActive: boolean;
                montantPenaliteRetardFcfa: number;
                modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
                tourActuel: number;
            }[];
        };
    }>;
    getTontine(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            _count: {
                transactions: number;
                membres: number;
            };
            proprietaire: {
                telephone: string;
                id: string;
                nom: string;
            };
        } & {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuelFcfa: number;
            objectifMontantFcfa: number | null;
            dateDeverrouillage: Date | null;
            montantJournalierFcfa: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembreFcfa: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoireFcfa: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetardFcfa: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    modifier(id: string, u: {
        id: string;
    }, dto: ModifierTontineDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuelFcfa: number;
            objectifMontantFcfa: number | null;
            dateDeverrouillage: Date | null;
            montantJournalierFcfa: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembreFcfa: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoireFcfa: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetardFcfa: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    activer(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuelFcfa: number;
            objectifMontantFcfa: number | null;
            dateDeverrouillage: Date | null;
            montantJournalierFcfa: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembreFcfa: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoireFcfa: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetardFcfa: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    suspendre(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuelFcfa: number;
            objectifMontantFcfa: number | null;
            dateDeverrouillage: Date | null;
            montantJournalierFcfa: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembreFcfa: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoireFcfa: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetardFcfa: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    reactiver(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuelFcfa: number;
            objectifMontantFcfa: number | null;
            dateDeverrouillage: Date | null;
            montantJournalierFcfa: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembreFcfa: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoireFcfa: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetardFcfa: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    terminer(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuelFcfa: number;
            objectifMontantFcfa: number | null;
            dateDeverrouillage: Date | null;
            montantJournalierFcfa: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembreFcfa: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoireFcfa: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetardFcfa: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    rejoindre(id: string, u: {
        id: string;
    }, dto: RejoindreTonitneDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            utilisateur: {
                id: string;
                nom: string;
                collecteurId: string | null;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            statut: import("@prisma/client").$Enums.StatutMembreGroupe;
            montantCautionFcfa: number;
            cautionBloquee: boolean;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
            nombreDefaillances: number;
            derniereDefaillanceLe: Date | null;
        };
    }>;
    detailsCode(code: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            nom: string;
            type: import("@prisma/client").$Enums.TypeTontine;
            montantJournalierFcfa: number;
            montantParMembreFcfa: number | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            president: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            cautionObligatoire: boolean;
            montantCautionObligatoireFcfa: number;
            nbMembresMax: number | null;
        };
    }>;
    rejoindreCode(code: string, u: {
        id: string;
    }, dto: RejoindreTonitneDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            utilisateur: {
                id: string;
                nom: string;
                collecteurId: string | null;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            statut: import("@prisma/client").$Enums.StatutMembreGroupe;
            montantCautionFcfa: number;
            cautionBloquee: boolean;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
            nombreDefaillances: number;
            derniereDefaillanceLe: Date | null;
        };
    }>;
    quitter(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
    }>;
    membres(id: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                id: string;
                nom: string;
                kycVerifie: boolean;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            statut: import("@prisma/client").$Enums.StatutMembreGroupe;
            montantCautionFcfa: number;
            cautionBloquee: boolean;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
            nombreDefaillances: number;
            derniereDefaillanceLe: Date | null;
        })[];
    }>;
    invitation(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            codeInvitation: string | null;
            qrInvitation: string | null;
            membresInvites: number;
            minimumActivation: number;
            nbMembresMax: number | null;
        };
    }>;
    ordreTirage(id: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                id: string;
                nom: string;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            position: number;
            aRecu: boolean;
            recuLe: Date | null;
            montantRecuFcfa: number | null;
        })[];
    }>;
    definirOrdreTirage(id: string, u: {
        id: string;
    }, dto: OrdreTirageDto): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                id: string;
                nom: string;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            position: number;
            aRecu: boolean;
            recuLe: Date | null;
            montantRecuFcfa: number | null;
        })[];
    }>;
    randomiserOrdreTirage(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                id: string;
                nom: string;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            position: number;
            aRecu: boolean;
            recuLe: Date | null;
            montantRecuFcfa: number | null;
        })[];
    }>;
    distribuer(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            beneficiaire: {
                badges: {
                    id: string;
                    clientId: string;
                    niveau: import("@prisma/client").$Enums.NiveauBadge;
                    obtenuLe: Date;
                }[];
            } & {
                telephone: string;
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                nom: string;
                photo: string | null;
                role: import("@prisma/client").$Enums.Role;
                typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
                statut: import("@prisma/client").$Enums.StatutCompte;
                pinHash: string | null;
                deviceId: string | null;
                empreinteActive: boolean;
                kycVerifie: boolean;
                tentativesEchouees: number;
                bloqueLe: Date | null;
                collecteurId: string | null;
                superviseurId: string | null;
                zoneId: string | null;
                enroleParId: string | null;
                soldeCommissionFcfa: number;
                montantCautionFcfa: number;
                tokenPush: string | null;
            };
            montantNetFcfa: number;
            refKKiaPay: string;
            tontineTerminee: boolean;
            prochaineDateCotisation: Date | null;
        };
    }>;
}
