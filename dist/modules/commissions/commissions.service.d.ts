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
            nom: string | undefined;
            soldeDisponible: number;
            totalGagne: number;
            nombreTransactions: number;
            tauxCommission: string;
        };
    }>;
    historique(utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            transaction: {
                utilisateur: {
                    nom: string;
                };
                creeLe: Date;
                type: import("@prisma/client").$Enums.TypeTransaction;
                reference: string;
                montant: number;
            };
        } & {
            id: string;
            creeLe: Date;
            type: string;
            agentId: string;
            montant: number;
            transactionId: string;
        })[];
    }>;
    retirer(utilisateurId: string, dto: RetirerCommissionDto): Promise<{
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
