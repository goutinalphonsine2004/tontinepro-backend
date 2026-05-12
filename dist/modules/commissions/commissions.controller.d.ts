import { CommissionsService } from './commissions.service';
import { RetirerCommissionDto } from './dto/retirer-commission.dto';
import { Role } from '@prisma/client';
export declare class CommissionsController {
    private service;
    constructor(service: CommissionsService);
    monSolde(u: {
        id: string;
        role: Role;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            nom: string | undefined;
            soldeDisponible: number;
            totalGagne: number;
            nombreTransactions: number;
            tauxCommission: string;
        };
    }>;
    historique(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            transaction: {
                utilisateur: {
                    nom: string;
                };
                montant: number;
                creeLe: Date;
                type: import("@prisma/client").$Enums.TypeTransaction;
                reference: string;
            };
        } & {
            montant: number;
            id: string;
            creeLe: Date;
            type: string;
            agentId: string;
            transactionId: string;
        })[];
    }>;
    retirer(u: {
        id: string;
    }, dto: RetirerCommissionDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            montant: number;
            telephone: string;
            refKKiaPay: string;
            soldeRestant: number;
        };
    }>;
}
