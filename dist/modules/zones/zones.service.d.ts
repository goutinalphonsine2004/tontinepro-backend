import { PrismaService } from '../../prisma/prisma.service';
import { CreerZoneDto } from './dto/creer-zone.dto';
export declare class ZonesService {
    private prisma;
    constructor(prisma: PrismaService);
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
    modifier(zoneId: string, dto: Partial<CreerZoneDto>): Promise<{
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
    agentsDeLaZone(zoneId: string): Promise<{
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
    assignerSuperviseur(zoneId: string, superviseurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            zoneId: string;
            superviseurId: string;
            superviseurNom: string;
        };
    }>;
    statsZone(zoneId: string): Promise<{
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
}
