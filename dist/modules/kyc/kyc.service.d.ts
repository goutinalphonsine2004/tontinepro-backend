import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SoumettreKycDto } from './dto/soumettre-kyc.dto';
import { RejeterKycDto } from './dto/rejeter-kyc.dto';
export declare class KycService {
    private prisma;
    private config;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService);
    uploadEtSoumettre(utilisateurId: string, typeDocument: string, fichier: Express.Multer.File): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            typeDocument: string;
            statut: import("@prisma/client").$Enums.StatutKYC;
            creeLe: Date;
        };
    }>;
    private uploaderFichier;
    private uploadCloudinary;
    private creerDataUrl;
    soumettre(utilisateurId: string, dto: SoumettreKycDto): Promise<{
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
    mesDocuments(utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutKYC;
            motifRejet: string | null;
            typeDocument: string;
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
    valider(docId: string, adminId: string): Promise<{
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
    rejeter(docId: string, adminId: string, dto: RejeterKycDto): Promise<{
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
