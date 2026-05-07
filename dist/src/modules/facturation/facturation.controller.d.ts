import { Role } from '@prisma/client';
import { FacturationService } from './facturation.service';
import { PayerAbonnementDto } from './dto/payer-abonnement.dto';
export declare class FacturationController {
    private service;
    constructor(service: FacturationService);
    monStatut(u: {
        id: string;
        role: Role;
    }): Promise<{
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
            dernierPaiement: Date;
            prochainPaiement: Date;
        };
    }>;
    payerAbonnement(u: {
        id: string;
    }, dto: PayerAbonnementDto): Promise<{
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
            dernierPaiement: Date;
            prochainPaiement: Date;
        };
    }>;
    upgrader(u: {
        id: string;
    }): Promise<{
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
                dernierPaiement: Date;
                prochainPaiement: Date;
            })[];
            totalMensuel: number;
        };
    }>;
}
