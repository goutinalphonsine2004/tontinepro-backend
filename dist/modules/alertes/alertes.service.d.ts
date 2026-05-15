import { PrismaService } from '../../prisma/prisma.service';
import { FiltrerAlertesDto } from './dto/filtrer-alertes.dto';
import { ResoudreAlerteDto } from './dto/resoudre-alerte.dto';
export declare class AlertesService {
    private prisma;
    constructor(prisma: PrismaService);
    lister(dto: FiltrerAlertesDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            alertes: {
                message: string;
                id: string;
                type: string;
                titre: string;
                creeLe: Date;
                misAJourLe: Date;
                statut: string;
                severite: string;
                resourceType: string | null;
                resourceId: string | null;
                metadata: string | null;
                detecteeLe: Date;
                resolueLe: Date | null;
            }[];
            total: number;
            page: number;
            limite: number;
            pages: number;
        };
    }>;
    statistiques(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            parStatut: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.AlerteSystemeGroupByOutputType, "statut"[]> & {
                _count: number;
            })[];
            parSeverite: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.AlerteSystemeGroupByOutputType, "severite"[]> & {
                _count: number;
            })[];
            critiquesOuvertes: number;
            dernieres: {
                message: string;
                id: string;
                type: string;
                titre: string;
                creeLe: Date;
                misAJourLe: Date;
                statut: string;
                severite: string;
                resourceType: string | null;
                resourceId: string | null;
                metadata: string | null;
                detecteeLe: Date;
                resolueLe: Date | null;
            }[];
        };
    }>;
    detail(id: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            message: string;
            id: string;
            type: string;
            titre: string;
            creeLe: Date;
            misAJourLe: Date;
            statut: string;
            severite: string;
            resourceType: string | null;
            resourceId: string | null;
            metadata: string | null;
            detecteeLe: Date;
            resolueLe: Date | null;
        };
    }>;
    resoudre(id: string, adminId: string, dto: ResoudreAlerteDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            message: string;
            id: string;
            type: string;
            titre: string;
            creeLe: Date;
            misAJourLe: Date;
            statut: string;
            severite: string;
            resourceType: string | null;
            resourceId: string | null;
            metadata: string | null;
            detecteeLe: Date;
            resolueLe: Date | null;
        };
    }>;
    rouvrir(id: string, adminId: string, dto: ResoudreAlerteDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            message: string;
            id: string;
            type: string;
            titre: string;
            creeLe: Date;
            misAJourLe: Date;
            statut: string;
            severite: string;
            resourceType: string | null;
            resourceId: string | null;
            metadata: string | null;
            detecteeLe: Date;
            resolueLe: Date | null;
        };
    }>;
    private ajouterResolutionMetadata;
    private ajouterReouvertureMetadata;
    private parseMetadata;
    private finDeJournee;
}
