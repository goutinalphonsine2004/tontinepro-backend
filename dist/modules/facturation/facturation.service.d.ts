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
            fraisMensuels: number;
            fraisParClient: number;
            totalClients: number;
            cautionMontant: number;
            dernierPaiement: Date;
            prochainPaiement: Date;
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
            fraisMensuels: number;
            fraisParClient: number;
            totalClients: number;
            cautionMontant: number;
            dernierPaiement: Date;
            prochainPaiement: Date;
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
            fraisMensuels: number;
            fraisParClient: number;
            totalClients: number;
            cautionMontant: number;
            dernierPaiement: Date;
            prochainPaiement: Date;
        };
    }>;
    tous(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            facturations: ({
                agent: {
                    telephone: string;
                    nom: string;
                    role: import("@prisma/client").$Enums.Role;
                    id: string;
                };
            } & {
                id: string;
                creeLe: Date;
                actif: boolean;
                agentId: string;
                plan: string;
                fraisMensuels: number;
                fraisParClient: number;
                totalClients: number;
                cautionMontant: number;
                dernierPaiement: Date;
                prochainPaiement: Date;
            })[];
            totalMensuel: number;
        };
    }>;
}
