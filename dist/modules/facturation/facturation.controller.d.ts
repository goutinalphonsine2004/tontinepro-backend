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
            fraisMensuelsFcfa: number;
            fraisParClientFcfa: number;
            totalClients: number;
            dernierPaiement: Date;
            prochainPaiement: Date;
            cautionMontantFcfa: number;
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
            fraisMensuelsFcfa: number;
            fraisParClientFcfa: number;
            totalClients: number;
            dernierPaiement: Date;
            prochainPaiement: Date;
            cautionMontantFcfa: number;
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
