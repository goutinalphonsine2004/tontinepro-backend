import { ZonesService } from './zones.service';
import { CreerZoneDto } from './dto/creer-zone.dto';
export declare class ZonesController {
    private service;
    constructor(service: ZonesService);
    creer(dto: CreerZoneDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            nom: string;
            description: string | null;
            ville: string;
        };
    }>;
    lister(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            nom: string;
            _count: {
                agents: number;
            };
            description: string | null;
            ville: string;
        }[];
    }>;
    heatmap(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            zones: {
                id: string;
                nom: string;
                ville: string;
                nbAgents: number;
                nbClients: number;
                volumeTotal: number;
                scoreMoyen: number;
                eligiblesPADME: number;
                activite: string;
            }[];
            totalVolume: number;
        };
    }>;
    modifier(id: string, dto: Partial<CreerZoneDto>): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            nom: string;
            description: string | null;
            ville: string;
        };
    }>;
    agentsDeLaZone(id: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            zone: {
                id: string;
                nom: string;
                ville: string;
            };
            agents: {
                telephone: string;
                id: string;
                nom: string;
                role: import("@prisma/client").$Enums.Role;
                statut: import("@prisma/client").$Enums.StatutCompte;
                kycVerifie: boolean;
            }[];
        };
    }>;
    statsZone(id: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            zone: {
                id: string;
                nom: string;
                ville: string;
            };
            nbAgents: number;
            nbClients: number;
            scoreMoyen: number;
            volumeCeMois: number;
            transactionsCeMois: number;
            agents: {
                id: string;
                nom: string;
                role: import("@prisma/client").$Enums.Role;
                statut: import("@prisma/client").$Enums.StatutCompte;
            }[];
        };
    }>;
    assignerSuperviseur(id: string, body: {
        superviseurId: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            zoneId: string;
            superviseurId: string;
            superviseurNom: string;
        };
    }>;
}
