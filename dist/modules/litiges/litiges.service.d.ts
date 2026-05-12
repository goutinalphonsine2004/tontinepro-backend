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
                    montant: number;
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                };
            } & {
                motif: string;
                id: string;
                creeLe: Date;
                statut: import("@prisma/client").$Enums.StatutLitige;
                clientId: string;
                transactionId: string;
                resoluLe: Date | null;
                resolution: string | null;
                resoluPar: string | null;
            };
        };
    }>;
    mesList(clientId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litiges: ({
                transaction: {
                    montant: number;
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                };
            } & {
                motif: string;
                id: string;
                creeLe: Date;
                statut: import("@prisma/client").$Enums.StatutLitige;
                clientId: string;
                transactionId: string;
                resoluLe: Date | null;
                resolution: string | null;
                resoluPar: string | null;
            })[];
        };
    }>;
    listeEnCours(page?: number, limite?: number): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litiges: ({
                transaction: {
                    montant: number;
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                };
                client: {
                    telephone: string;
                    id: string;
                    nom: string;
                };
            } & {
                motif: string;
                id: string;
                creeLe: Date;
                statut: import("@prisma/client").$Enums.StatutLitige;
                clientId: string;
                transactionId: string;
                resoluLe: Date | null;
                resolution: string | null;
                resoluPar: string | null;
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
                motif: string;
                id: string;
                creeLe: Date;
                statut: import("@prisma/client").$Enums.StatutLitige;
                clientId: string;
                transactionId: string;
                resoluLe: Date | null;
                resolution: string | null;
                resoluPar: string | null;
            };
        };
    }>;
    resoudre(litigeId: string, adminId: string, dto: ResoudreLitigeDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litige: {
                motif: string;
                id: string;
                creeLe: Date;
                statut: import("@prisma/client").$Enums.StatutLitige;
                clientId: string;
                transactionId: string;
                resoluLe: Date | null;
                resolution: string | null;
                resoluPar: string | null;
            };
        };
    }>;
    rejeter(litigeId: string, adminId: string, dto: RejeterLitigeDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litige: {
                motif: string;
                id: string;
                creeLe: Date;
                statut: import("@prisma/client").$Enums.StatutLitige;
                clientId: string;
                transactionId: string;
                resoluLe: Date | null;
                resolution: string | null;
                resoluPar: string | null;
            };
        };
    }>;
    detail(litigeId: string, userId: string, role: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litige: {
                transaction: {
                    montant: number;
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                };
                client: {
                    telephone: string;
                    id: string;
                    nom: string;
                };
                commentaires: {
                    message: string;
                    id: string;
                    creeLe: Date;
                    auteurId: string;
                    pieceJointeUrl: string | null;
                    litigeId: string;
                }[];
            } & {
                motif: string;
                id: string;
                creeLe: Date;
                statut: import("@prisma/client").$Enums.StatutLitige;
                clientId: string;
                transactionId: string;
                resoluLe: Date | null;
                resolution: string | null;
                resoluPar: string | null;
            };
        };
    }>;
    ajouterCommentaire(litigeId: string, auteurId: string, dto: {
        message: string;
        pieceJointeUrl?: string;
    }, role: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            message: string;
            id: string;
            creeLe: Date;
            auteurId: string;
            pieceJointeUrl: string | null;
            litigeId: string;
        };
    }>;
    commentaires(litigeId: string, userId: string, role: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            message: string;
            id: string;
            creeLe: Date;
            auteurId: string;
            pieceJointeUrl: string | null;
            litigeId: string;
        }[];
    }>;
}
