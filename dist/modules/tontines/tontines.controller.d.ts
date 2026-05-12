import { TontinesService } from './tontines.service';
import { CreerTontineDto } from './dto/creer-tontine.dto';
import { ModifierTontineDto } from './dto/modifier-tontine.dto';
import { RejoindreTonitneDto } from './dto/rejoindre-tontine.dto';
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
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
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
                soldeActuel: number;
                objectifMontant: number | null;
                dateDeverrouillage: Date | null;
                montantJournalier: number;
                proprietaireId: string;
                dateFin: Date | null;
                dateProchaineCotisation: Date | null;
                description: string | null;
                frequence: import("@prisma/client").$Enums.FrequenceTontine;
                jourFixe: number | null;
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
                soldeActuel: number;
                objectifMontant: number | null;
                dateDeverrouillage: Date | null;
                montantJournalier: number;
                proprietaireId: string;
                dateFin: Date | null;
                dateProchaineCotisation: Date | null;
                description: string | null;
                frequence: import("@prisma/client").$Enums.FrequenceTontine;
                jourFixe: number | null;
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
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
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
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
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
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
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
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
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
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
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
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
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
            montantCaution: number;
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
            montantJournalier: number;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            president: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
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
            montantCaution: number;
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
            montantCaution: number;
            cautionBloquee: boolean;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
            nombreDefaillances: number;
            derniereDefaillanceLe: Date | null;
        })[];
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
            aRecu: boolean;
            position: number;
            recuLe: Date | null;
            montantRecu: number | null;
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
                soldeCommission: number;
                montantCaution: number;
                tokenPush: string | null;
            };
            montantNet: number;
            refKKiaPay: string;
            tontineTerminee: boolean;
            prochaineDateCotisation: Date | null;
        };
    }>;
}
