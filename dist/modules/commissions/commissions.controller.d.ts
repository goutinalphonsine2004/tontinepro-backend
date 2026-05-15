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
            type: string;
            peutRetirer: boolean;
            modePaiement: string;
            libellePrincipal: string;
            nom?: string;
            soldeDisponible: number;
            totalGagne: number;
            nombreTransactions: number;
            tauxCommission: string;
            primeEstimee?: undefined;
            paiementAdministration?: undefined;
            prochainePaieEstimee?: undefined;
            messagePaie?: undefined;
            bonusEstime?: undefined;
        } | {
            nom: string | undefined;
            type: string;
            peutRetirer: boolean;
            soldeDisponible: number;
            primeEstimee: number;
            totalGagne: number;
            nombreTransactions: number;
            paiementAdministration: boolean;
            prochainePaieEstimee: Date;
            libellePrincipal: string;
            messagePaie: string;
            bonusEstime?: undefined;
        } | {
            nom: string | undefined;
            type: string;
            peutRetirer: boolean;
            soldeDisponible: number;
            bonusEstime: number;
            totalGagne: number;
            nombreTransactions: number;
            paiementAdministration: boolean;
            prochainePaieEstimee: Date;
            libellePrincipal: string;
            messagePaie: string;
            primeEstimee?: undefined;
        };
    }>;
    historique(u: {
        id: string;
        role: Role;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            peutRetirer: boolean;
            libelle: string;
            commissions: ({
                transaction: {
                    utilisateur: {
                        nom: string;
                    };
                    creeLe: Date;
                    type: import("@prisma/client").$Enums.TypeTransaction;
                    montantFcfa: number;
                    reference: string;
                };
            } & {
                id: string;
                creeLe: Date;
                type: string;
                montantFcfa: number;
                agentId: string;
                transactionId: string;
            })[];
        };
    }>;
    retirer(u: {
        id: string;
        role: Role;
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
