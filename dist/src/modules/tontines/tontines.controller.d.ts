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
                nom: string;
                id: string;
            };
        } & {
            nom: string;
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            objectifMontant: number | null;
            montantJournalier: number;
            dateDeverrouillage: Date | null;
            soldeActuel: number;
            proprietaireId: string;
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
                nom: string;
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                type: import("@prisma/client").$Enums.TypeTontine;
                politique: import("@prisma/client").$Enums.PolitiqueRetrait;
                objectifMontant: number | null;
                montantJournalier: number;
                dateDeverrouillage: Date | null;
                soldeActuel: number;
                proprietaireId: string;
            })[];
            membre: {
                monStatut: import("@prisma/client").$Enums.StatutMembreGroupe;
                caution: number;
                _count: {
                    membres: number;
                };
                nom: string;
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                type: import("@prisma/client").$Enums.TypeTontine;
                politique: import("@prisma/client").$Enums.PolitiqueRetrait;
                objectifMontant: number | null;
                montantJournalier: number;
                dateDeverrouillage: Date | null;
                soldeActuel: number;
                proprietaireId: string;
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
                nom: string;
                id: string;
            };
        } & {
            nom: string;
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            objectifMontant: number | null;
            montantJournalier: number;
            dateDeverrouillage: Date | null;
            soldeActuel: number;
            proprietaireId: string;
        };
    }>;
    modifier(id: string, u: {
        id: string;
    }, dto: ModifierTontineDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            nom: string;
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            objectifMontant: number | null;
            montantJournalier: number;
            dateDeverrouillage: Date | null;
            soldeActuel: number;
            proprietaireId: string;
        };
    }>;
    rejoindre(id: string, u: {
        id: string;
    }, dto: RejoindreTonitneDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            statut: import("@prisma/client").$Enums.StatutMembreGroupe;
            montantCaution: number;
            utilisateurId: string;
            tontineId: string;
            cautionBloquee: boolean;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
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
                nom: string;
                id: string;
                kycVerifie: boolean;
            };
        } & {
            id: string;
            statut: import("@prisma/client").$Enums.StatutMembreGroupe;
            montantCaution: number;
            utilisateurId: string;
            tontineId: string;
            cautionBloquee: boolean;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
        })[];
    }>;
    ordreTirage(id: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                nom: string;
                id: string;
            };
        } & {
            id: string;
            creeLe: Date;
            utilisateurId: string;
            tontineId: string;
            position: number;
            aRecu: boolean;
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
                telephone: string;
                nom: string;
                id: string;
            };
            montantNet: number;
            refKKiaPay: string;
        };
    }>;
}
