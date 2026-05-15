import { UtilisateursService } from './utilisateurs.service';
import { ModifierProfilDto } from './dto/modifier-profil.dto';
import { ChangerPinDto } from './dto/changer-pin.dto';
import { FiltrerUtilisateursDto } from './dto/filtrer-utilisateurs.dto';
import { ChangerStatutDto } from './dto/changer-statut.dto';
import { ChangerRoleDto } from './dto/changer-role.dto';
import { ConfigurerEmpreinteDto } from './dto/configurer-empreinte.dto';
export declare class UtilisateursController {
    private service;
    constructor(service: UtilisateursService);
    monDashboard(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            profil: {
                id: string;
                nom: string;
                photo: string | null;
            };
            soldeTotal: number;
            tontines: {
                id: string;
                type: import("@prisma/client").$Enums.TypeTontine;
                nom: string;
                soldeActuelFcfa: number;
                objectifMontantFcfa: number | null;
                dateDeverrouillage: Date | null;
                montantJournalierFcfa: number;
            }[];
            graphiqueEpargne: {
                mois: string;
                montantFcfa: number;
            }[];
            badge: {
                niveau: import("@prisma/client").$Enums.NiveauBadge;
                obtenuLe: Date;
            } | null;
            score: {
                valeur: number;
                eligibleMicroCredit: boolean;
                eligiblePADME: boolean;
                dernierCalcul: Date | null;
            };
            creditActif: {
                id: string;
                paiementJournalierFcfa: number;
                totalJours: number;
                joursPayes: number;
                montantRestantFcfa: number;
            } | null;
            alertes: {
                microCreditDisponible: boolean;
                eligiblePADME: boolean;
            };
            prochaineDistribution: {
                tontine: {
                    id: string;
                    nom: string;
                    montantJournalierFcfa: number;
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
            };
            dernieresTransactions: ({
                tontine: {
                    nom: string;
                } | null;
            } & {
                refKKiaPay: string | null;
                tontineId: string | null;
                idempotencyKey: string | null;
                id: string;
                utilisateurId: string;
                type: import("@prisma/client").$Enums.TypeTransaction;
                creeLe: Date;
                statut: import("@prisma/client").$Enums.StatutTransaction;
                montantFcfa: number;
                tentatives: number;
                reference: string;
                montantNetFcfa: number;
                operateur: string | null;
                fraisPlateformeFcfa: number;
                fraisAgentFcfa: number;
                hashPrecedent: string | null;
                hashActuel: string | null;
                motifEchec: string | null;
            })[];
        };
    }>;
    getProfil(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            telephone: string;
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            nom: string;
            photo: string | null;
            role: import("@prisma/client").$Enums.Role;
            typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
            statut: import("@prisma/client").$Enums.StatutCompte;
            empreinteActive: boolean;
            kycVerifie: boolean;
            collecteurId: string | null;
            zoneId: string | null;
            soldeCommissionFcfa: number;
            montantCautionFcfa: number;
        };
    }>;
    monQrCode(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            codeQR: string;
            expireLe: Date;
            actif: boolean;
        };
    }>;
    mesStats(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            totalTontines: number;
            totalCotisations: number;
            totalRetraits: number;
            soldeTotal: number;
            tauxRegularite: number;
        };
    }>;
    modifierProfil(u: {
        id: string;
    }, dto: ModifierProfilDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            telephone: string;
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            nom: string;
            photo: string | null;
            role: import("@prisma/client").$Enums.Role;
            typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
            statut: import("@prisma/client").$Enums.StatutCompte;
            empreinteActive: boolean;
            kycVerifie: boolean;
            collecteurId: string | null;
            zoneId: string | null;
            soldeCommissionFcfa: number;
            montantCautionFcfa: number;
        };
    }>;
    changerPin(u: {
        id: string;
    }, dto: ChangerPinDto): Promise<{
        succes: boolean;
        message: string;
    }>;
    configurerEmpreinte(u: {
        id: string;
    }, dto: ConfigurerEmpreinteDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            telephone: string;
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            nom: string;
            photo: string | null;
            role: import("@prisma/client").$Enums.Role;
            typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
            statut: import("@prisma/client").$Enums.StatutCompte;
            empreinteActive: boolean;
            kycVerifie: boolean;
            collecteurId: string | null;
            zoneId: string | null;
            soldeCommissionFcfa: number;
            montantCautionFcfa: number;
        };
    }>;
    supprimerMonCompte(u: {
        id: string;
    }, body: {
        pin: string;
    }): Promise<{
        succes: boolean;
        message: string;
    }>;
    lister(dto: FiltrerUtilisateursDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            utilisateurs: {
                telephone: string;
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                nom: string;
                photo: string | null;
                role: import("@prisma/client").$Enums.Role;
                typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
                statut: import("@prisma/client").$Enums.StatutCompte;
                empreinteActive: boolean;
                kycVerifie: boolean;
                collecteurId: string | null;
                zoneId: string | null;
                soldeCommissionFcfa: number;
                montantCautionFcfa: number;
            }[];
            total: number;
            page: number;
            limite: number;
            pages: number;
        };
    }>;
    reassignerClient(id: string, body: {
        nouveauCollecteurId: string;
    }, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            clientId: string;
            ancienCollecteurId: string | null;
            nouveauCollecteurId: string;
        };
    }>;
    changerStatut(u: {
        id: string;
    }, id: string, dto: ChangerStatutDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            telephone: string;
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            nom: string;
            photo: string | null;
            role: import("@prisma/client").$Enums.Role;
            typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
            statut: import("@prisma/client").$Enums.StatutCompte;
            empreinteActive: boolean;
            kycVerifie: boolean;
            collecteurId: string | null;
            zoneId: string | null;
            soldeCommissionFcfa: number;
            montantCautionFcfa: number;
        };
    }>;
    changerRole(u: {
        id: string;
    }, id: string, dto: ChangerRoleDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            telephone: string;
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            nom: string;
            photo: string | null;
            role: import("@prisma/client").$Enums.Role;
            typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
            statut: import("@prisma/client").$Enums.StatutCompte;
            empreinteActive: boolean;
            kycVerifie: boolean;
            collecteurId: string | null;
            zoneId: string | null;
            soldeCommissionFcfa: number;
            montantCautionFcfa: number;
        };
    }>;
    assignerSuperviseur(u: {
        id: string;
    }, id: string, body: {
        superviseurId: string | null;
    }): Promise<{
        succes: boolean;
        message: string;
    }>;
    supprimer(u: {
        id: string;
    }, id: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
        };
    }>;
}
