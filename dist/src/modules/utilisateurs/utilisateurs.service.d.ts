import { PrismaService } from '../../prisma/prisma.service';
import { ModifierProfilDto } from './dto/modifier-profil.dto';
import { ChangerPinDto } from './dto/changer-pin.dto';
import { FiltrerUtilisateursDto } from './dto/filtrer-utilisateurs.dto';
import { ChangerStatutDto } from './dto/changer-statut.dto';
import { ChangerRoleDto } from './dto/changer-role.dto';
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
    supprimerUtilisateur(adminId: string, cibleId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
        };
    }>;
}
