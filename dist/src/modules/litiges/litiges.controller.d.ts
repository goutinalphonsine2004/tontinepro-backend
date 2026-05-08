import { LitigesService } from './litiges.service';
import { OuvrirLitigeDto } from './dto/ouvrir-litige.dto';
import { ResoudreLitigeDto } from './dto/resoudre-litige.dto';
import { RejeterLitigeDto } from './dto/rejeter-litige.dto';
export declare class LitigesController {
    private service;
    constructor(service: LitigesService);
    ouvrir(u: any, dto: OuvrirLitigeDto): Promise<{
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
    mesList(u: any): Promise<{
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
    detail(id: string, u: any): Promise<{
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
    enCours(page: number, limite: number): Promise<{
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
    examiner(id: string, u: any): Promise<{
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
    resoudre(id: string, u: any, dto: ResoudreLitigeDto): Promise<{
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
    rejeter(id: string, u: any, dto: RejeterLitigeDto): Promise<{
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
}
