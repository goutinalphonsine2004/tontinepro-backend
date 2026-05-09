import { PrismaService } from '../../prisma/prisma.service';
import { ModifierProfilDto } from './dto/modifier-profil.dto';
import { ChangerPinDto } from './dto/changer-pin.dto';
import { FiltrerUtilisateursDto } from './dto/filtrer-utilisateurs.dto';
import { ChangerStatutDto } from './dto/changer-statut.dto';
import { ChangerRoleDto } from './dto/changer-role.dto';
import { ConfigurerEmpreinteDto } from './dto/configurer-empreinte.dto';
export declare class UtilisateursService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfil(utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            telephone: string;
            nom: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
            photo: string | null;
            typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
            statut: import("@prisma/client").$Enums.StatutCompte;
            empreinteActive: boolean;
            kycVerifie: boolean;
            collecteurId: string | null;
            zoneId: string | null;
            soldeCommission: number;
            montantCaution: number;
            creeLe: Date;
            misAJourLe: Date;
        };
    }>;
    modifierProfil(utilisateurId: string, dto: ModifierProfilDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            telephone: string;
            nom: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
            photo: string | null;
            typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
            statut: import("@prisma/client").$Enums.StatutCompte;
            empreinteActive: boolean;
            kycVerifie: boolean;
            collecteurId: string | null;
            zoneId: string | null;
            soldeCommission: number;
            montantCaution: number;
            creeLe: Date;
            misAJourLe: Date;
        };
    }>;
    changerPin(utilisateurId: string, dto: ChangerPinDto): Promise<{
        succes: boolean;
        message: string;
    }>;
    configurerEmpreinte(utilisateurId: string, dto: ConfigurerEmpreinteDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            telephone: string;
            nom: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
            photo: string | null;
            typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
            statut: import("@prisma/client").$Enums.StatutCompte;
            empreinteActive: boolean;
            kycVerifie: boolean;
            collecteurId: string | null;
            zoneId: string | null;
            soldeCommission: number;
            montantCaution: number;
            creeLe: Date;
            misAJourLe: Date;
        };
    }>;
    listerUtilisateurs(dto: FiltrerUtilisateursDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            utilisateurs: {
                telephone: string;
                nom: string;
                role: import("@prisma/client").$Enums.Role;
                id: string;
                photo: string | null;
                typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
                statut: import("@prisma/client").$Enums.StatutCompte;
                empreinteActive: boolean;
                kycVerifie: boolean;
                collecteurId: string | null;
                zoneId: string | null;
                soldeCommission: number;
                montantCaution: number;
                creeLe: Date;
                misAJourLe: Date;
            }[];
            total: number;
            page: number;
            limite: number;
            pages: number;
        };
    }>;
    changerStatut(adminId: string, cibleId: string, dto: ChangerStatutDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            telephone: string;
            nom: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
            photo: string | null;
            typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
            statut: import("@prisma/client").$Enums.StatutCompte;
            empreinteActive: boolean;
            kycVerifie: boolean;
            collecteurId: string | null;
            zoneId: string | null;
            soldeCommission: number;
            montantCaution: number;
            creeLe: Date;
            misAJourLe: Date;
        };
    }>;
    changerRole(adminId: string, cibleId: string, dto: ChangerRoleDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            telephone: string;
            nom: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
            photo: string | null;
            typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
            statut: import("@prisma/client").$Enums.StatutCompte;
            empreinteActive: boolean;
            kycVerifie: boolean;
            collecteurId: string | null;
            zoneId: string | null;
            soldeCommission: number;
            montantCaution: number;
            creeLe: Date;
            misAJourLe: Date;
        };
    }>;
    monDashboard(clientId: string): Promise<{
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
                nom: string;
                id: string;
                type: import("@prisma/client").$Enums.TypeTontine;
                soldeActuel: number;
                objectifMontant: number | null;
                dateDeverrouillage: Date | null;
                montantJournalier: number;
            }[];
            graphiqueEpargne: {
                mois: string;
                montant: number;
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
                paiementJournalier: number;
                totalJours: number;
                joursPayes: number;
                montantRestant: number;
            } | null;
            alertes: {
                microCreditDisponible: boolean;
                eligiblePADME: boolean;
            };
            prochaineDistribution: {
                tontine: {
                    nom: string;
                    id: string;
                    montantJournalier: number;
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
            };
            dernieresTransactions: ({
                tontine: {
                    nom: string;
                } | null;
            } & {
                id: string;
                statut: import("@prisma/client").$Enums.StatutTransaction;
                creeLe: Date;
                type: import("@prisma/client").$Enums.TypeTransaction;
                utilisateurId: string;
                reference: string;
                montant: number;
                montantNet: number;
                refKKiaPay: string | null;
                operateur: string | null;
                fraisPlateforme: number;
                fraisAgent: number;
                hashPrecedent: string | null;
                hashActuel: string | null;
                tontineId: string | null;
                tentatives: number;
                motifEchec: string | null;
            })[];
        };
    }>;
    supprimerUtilisateur(adminId: string, cibleId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
        };
    }>;
    reassignerClient(clientId: string, nouveauCollecteurId: string, adminId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            clientId: string;
            ancienCollecteurId: string | null;
            nouveauCollecteurId: string;
        };
    }>;
    supprimerMonCompte(clientId: string, pin: string): Promise<{
        succes: boolean;
        message: string;
    }>;
}
