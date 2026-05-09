import { PrismaService } from '../../prisma/prisma.service';
import { SoumettreKycDto } from './dto/soumettre-kyc.dto';
import { RejeterKycDto } from './dto/rejeter-kyc.dto';
export declare class KycService {
    private prisma;
    constructor(prisma: PrismaService);
    soumettre(utilisateurId: string, dto: SoumettreKycDto): Promise<{
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
    mesDocuments(utilisateurId: string): Promise<{
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
    valider(docId: string, adminId: string): Promise<{
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
    rejeter(docId: string, adminId: string, dto: RejeterKycDto): Promise<{
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
