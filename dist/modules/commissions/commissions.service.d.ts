import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { RetirerCommissionDto } from './dto/retirer-commission.dto';
export declare class CommissionsService {
    private prisma;
    private kkiapay;
    constructor(prisma: PrismaService, kkiapay: KkiapayService);
    monSolde(utilisateurId: string, role: Role): Promise<{
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
    historique(utilisateurId: string, role: Role): Promise<{
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
                    type: import("@prisma/client").$Enums.TypeTransaction;
                    creeLe: Date;
                    montantFcfa: number;
                    reference: string;
                };
            } & {
                id: string;
                type: string;
                creeLe: Date;
                montantFcfa: number;
                agentId: string;
                transactionId: string;
            })[];
        };
    }>;
    retirer(utilisateurId: string, role: Role, dto: RetirerCommissionDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            montant: number;
            telephone: string;
            refKKiaPay: string;
            soldeRestant: number;
        };
    }>;
    private verifierRoleFinanceTerrain;
    private prochainePaieEstimee;
    private presenterFinancesParRole;
}
