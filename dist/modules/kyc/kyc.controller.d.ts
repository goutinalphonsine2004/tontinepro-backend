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
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutKYC;
            motifRejet: string | null;
            typeDocument: string;
            urlDocument: string;
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
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutKYC;
            motifRejet: string | null;
            typeDocument: string;
            urlDocument: string;
            verifiePar: string | null;
        }[];
    }>;
    enAttente(): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                id: string;
                nom: string;
                role: import("@prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutKYC;
            motifRejet: string | null;
            typeDocument: string;
            urlDocument: string;
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
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutKYC;
            motifRejet: string | null;
            typeDocument: string;
            urlDocument: string;
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
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutKYC;
            motifRejet: string | null;
            typeDocument: string;
            urlDocument: string;
            verifiePar: string | null;
        };
    }>;
}
