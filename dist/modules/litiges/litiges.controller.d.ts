import { LitigesService } from './litiges.service';
import { OuvrirLitigeDto } from './dto/ouvrir-litige.dto';
import { ResoudreLitigeDto } from './dto/resoudre-litige.dto';
import { RejeterLitigeDto } from './dto/rejeter-litige.dto';
export declare class LitigesController {
    private service;
    constructor(service: LitigesService);
    ouvrir(u: {
        id: string;
        role?: string;
    }, dto: OuvrirLitigeDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litige: {
                transaction: {
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                    montantFcfa: number;
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
    mesList(u: {
        id: string;
        role?: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litiges: ({
                transaction: {
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                    montantFcfa: number;
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
    enCours(page: number, limite: number): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litiges: ({
                transaction: {
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                    montantFcfa: number;
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
    examiner(id: string, u: {
        id: string;
        role?: string;
    }): Promise<{
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
    resoudre(id: string, u: {
        id: string;
        role?: string;
    }, dto: ResoudreLitigeDto): Promise<{
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
    rejeter(id: string, u: {
        id: string;
        role?: string;
    }, dto: RejeterLitigeDto): Promise<{
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
    ajouterCommentaire(id: string, u: {
        id: string;
        role: string;
    }, dto: {
        message: string;
        pieceJointeUrl?: string;
    }): Promise<{
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
    commentaires(id: string, u: {
        id: string;
        role: string;
    }): Promise<{
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
    detail(id: string, u: {
        id: string;
        role: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            litige: {
                transaction: {
                    id: string;
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                    montantFcfa: number;
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
}
