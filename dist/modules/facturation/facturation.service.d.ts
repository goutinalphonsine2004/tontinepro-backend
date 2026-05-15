import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PayerAbonnementDto } from './dto/payer-abonnement.dto';
export declare class FacturationService {
    private prisma;
    constructor(prisma: PrismaService);
    monStatut(utilisateurId: string, role: Role): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            actif: boolean;
            agentId: string;
            plan: string;
            fraisMensuelsFcfa: number;
            fraisParClientFcfa: number;
            totalClients: number;
            dernierPaiement: Date;
            prochainPaiement: Date;
            cautionMontantFcfa: number;
        };
    }>;
    payerAbonnement(utilisateurId: string, dto: PayerAbonnementDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            actif: boolean;
            agentId: string;
            plan: string;
            fraisMensuelsFcfa: number;
            fraisParClientFcfa: number;
            totalClients: number;
            dernierPaiement: Date;
            prochainPaiement: Date;
            cautionMontantFcfa: number;
        };
    }>;
    upgrader(utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            actif: boolean;
            agentId: string;
            plan: string;
            fraisMensuelsFcfa: number;
            fraisParClientFcfa: number;
            totalClients: number;
            dernierPaiement: Date;
            prochainPaiement: Date;
            cautionMontantFcfa: number;
        };
    }>;
    tous(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            facturations: ({
                agent: {
                    telephone: string;
                    id: string;
                    nom: string;
                    role: import("@prisma/client").$Enums.Role;
                };
            } & {
                id: string;
                creeLe: Date;
                actif: boolean;
                agentId: string;
                plan: string;
                fraisMensuelsFcfa: number;
                fraisParClientFcfa: number;
                totalClients: number;
                dernierPaiement: Date;
                prochainPaiement: Date;
                cautionMontantFcfa: number;
            })[];
            totalMensuel: number;
        };
    }>;
}
