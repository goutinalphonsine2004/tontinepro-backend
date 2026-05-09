import { KycService } from './kyc.service';
import { SoumettreKycDto } from './dto/soumettre-kyc.dto';
import { RejeterKycDto } from './dto/rejeter-kyc.dto';
export declare class KycController {
    private service;
    constructor(service: KycService);
    soumettre(u: {
        id: string;
    }, dto: SoumettreKycDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            statut: import("@prisma/client").$Enums.StatutKYC;
            creeLe: Date;
            utilisateurId: string;
            typeDocument: string;
            urlDocument: string;
            motifRejet: string | null;
            verifiePar: string | null;
        };
    }>;
    mesDocuments(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            statut: import("@prisma/client").$Enums.StatutKYC;
            creeLe: Date;
            utilisateurId: string;
            typeDocument: string;
            urlDocument: string;
            motifRejet: string | null;
            verifiePar: string | null;
        }[];
    }>;
    enAttente(): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                nom: string;
                role: import("@prisma/client").$Enums.Role;
                id: string;
            };
        } & {
            id: string;
            statut: import("@prisma/client").$Enums.StatutKYC;
            creeLe: Date;
            utilisateurId: string;
            typeDocument: string;
            urlDocument: string;
            motifRejet: string | null;
            verifiePar: string | null;
        })[];
    }>;
    valider(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            statut: import("@prisma/client").$Enums.StatutKYC;
            creeLe: Date;
            utilisateurId: string;
            typeDocument: string;
            urlDocument: string;
            motifRejet: string | null;
            verifiePar: string | null;
        };
    }>;
    rejeter(id: string, u: {
        id: string;
    }, dto: RejeterKycDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            statut: import("@prisma/client").$Enums.StatutKYC;
            creeLe: Date;
            utilisateurId: string;
            typeDocument: string;
            urlDocument: string;
            motifRejet: string | null;
            verifiePar: string | null;
        };
    }>;
}
