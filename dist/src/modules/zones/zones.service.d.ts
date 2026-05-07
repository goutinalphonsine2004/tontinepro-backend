import { PrismaService } from '../../prisma/prisma.service';
import { CreerZoneDto } from './dto/creer-zone.dto';
export declare class ZonesService {
    private prisma;
    constructor(prisma: PrismaService);
    creer(dto: CreerZoneDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            nom: string;
            id: string;
            creeLe: Date;
            ville: string;
            description: string | null;
        };
    }>;
    lister(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            nom: string;
            id: string;
            creeLe: Date;
            _count: {
                agents: number;
            };
            ville: string;
            description: string | null;
        }[];
    }>;
    modifier(zoneId: string, dto: Partial<CreerZoneDto>): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            nom: string;
            id: string;
            creeLe: Date;
            ville: string;
            description: string | null;
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
                nom: string;
                role: import("@prisma/client").$Enums.Role;
                id: string;
                statut: import("@prisma/client").$Enums.StatutCompte;
                kycVerifie: boolean;
            }[];
        };
    }>;
}
