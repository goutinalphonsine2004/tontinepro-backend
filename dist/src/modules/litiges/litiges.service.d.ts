import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { OuvrirLitigeDto } from './dto/ouvrir-litige.dto';
import { ResoudreLitigeDto } from './dto/resoudre-litige.dto';
import { RejeterLitigeDto } from './dto/rejeter-litige.dto';
export declare class LitigesService {
    private prisma;
    private sms;
    constructor(prisma: PrismaService, sms: SmsService);
    ouvrirLitige(clientId: string, dto: OuvrirLitigeDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litige: {
                transaction: {
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                    montant: number;
                };
            } & {
                id: string;
                statut: import("@prisma/client").$Enums.StatutLitige;
                creeLe: Date;
                motif: string;
                transactionId: string;
                clientId: string;
                resolution: string | null;
                resoluPar: string | null;
                resoluLe: Date | null;
            };
        };
    }>;
    mesList(clientId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litiges: ({
                transaction: {
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                    montant: number;
                };
            } & {
                id: string;
                statut: import("@prisma/client").$Enums.StatutLitige;
                creeLe: Date;
                motif: string;
                transactionId: string;
                clientId: string;
                resolution: string | null;
                resoluPar: string | null;
                resoluLe: Date | null;
            })[];
        };
    }>;
    listeEnCours(page?: number, limite?: number): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litiges: ({
                transaction: {
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                    montant: number;
                };
                client: {
                    telephone: string;
                    nom: string;
                    id: string;
                };
            } & {
                id: string;
                statut: import("@prisma/client").$Enums.StatutLitige;
                creeLe: Date;
                motif: string;
                transactionId: string;
                clientId: string;
                resolution: string | null;
                resoluPar: string | null;
                resoluLe: Date | null;
            })[];
            total: number;
            page: number;
            totalPages: number;
        };
    }>;
    examiner(litigeId: string, adminId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litige: {
                id: string;
                statut: import("@prisma/client").$Enums.StatutLitige;
                creeLe: Date;
                motif: string;
                transactionId: string;
                clientId: string;
                resolution: string | null;
                resoluPar: string | null;
                resoluLe: Date | null;
            };
        };
    }>;
    resoudre(litigeId: string, adminId: string, dto: ResoudreLitigeDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litige: {
                id: string;
                statut: import("@prisma/client").$Enums.StatutLitige;
                creeLe: Date;
                motif: string;
                transactionId: string;
                clientId: string;
                resolution: string | null;
                resoluPar: string | null;
                resoluLe: Date | null;
            };
        };
    }>;
    rejeter(litigeId: string, adminId: string, dto: RejeterLitigeDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litige: {
                id: string;
                statut: import("@prisma/client").$Enums.StatutLitige;
                creeLe: Date;
                motif: string;
                transactionId: string;
                clientId: string;
                resolution: string | null;
                resoluPar: string | null;
                resoluLe: Date | null;
            };
        };
    }>;
    detail(litigeId: string, userId: string, role: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litige: {
                transaction: {
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                    montant: number;
                };
                client: {
                    telephone: string;
                    nom: string;
                    id: string;
                };
            } & {
                id: string;
                statut: import("@prisma/client").$Enums.StatutLitige;
                creeLe: Date;
                motif: string;
                transactionId: string;
                clientId: string;
                resolution: string | null;
                resoluPar: string | null;
                resoluLe: Date | null;
            };
        };
    }>;
}
