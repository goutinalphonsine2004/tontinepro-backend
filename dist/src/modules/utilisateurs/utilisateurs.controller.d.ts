import { UtilisateursService } from './utilisateurs.service';
import { ModifierProfilDto } from './dto/modifier-profil.dto';
import { ChangerPinDto } from './dto/changer-pin.dto';
import { FiltrerUtilisateursDto } from './dto/filtrer-utilisateurs.dto';
import { ChangerStatutDto } from './dto/changer-statut.dto';
import { ChangerRoleDto } from './dto/changer-role.dto';
export declare class UtilisateursController {
    private service;
    constructor(service: UtilisateursService);
    getProfil(u: {
        id: string;
    }): Promise<{
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
    modifierProfil(u: {
        id: string;
    }, dto: ModifierProfilDto): Promise<{
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
    changerPin(u: {
        id: string;
    }, dto: ChangerPinDto): Promise<{
        succes: boolean;
        message: string;
    }>;
    lister(dto: FiltrerUtilisateursDto): Promise<{
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
    changerStatut(u: {
        id: string;
    }, id: string, dto: ChangerStatutDto): Promise<{
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
    changerRole(u: {
        id: string;
    }, id: string, dto: ChangerRoleDto): Promise<{
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
