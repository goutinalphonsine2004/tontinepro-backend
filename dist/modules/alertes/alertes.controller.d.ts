import { AlertesService } from './alertes.service';
import { FiltrerAlertesDto } from './dto/filtrer-alertes.dto';
import { ResoudreAlerteDto } from './dto/resoudre-alerte.dto';
export declare class AlertesController {
    private service;
    constructor(service: AlertesService);
    lister(dto: FiltrerAlertesDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            alertes: {
                message: string;
                id: string;
                statut: string;
                creeLe: Date;
                misAJourLe: Date;
                type: string;
                titre: string;
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
                statut: string;
                creeLe: Date;
                misAJourLe: Date;
                type: string;
                titre: string;
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
            statut: string;
            creeLe: Date;
            misAJourLe: Date;
            type: string;
            titre: string;
            severite: string;
            resourceType: string | null;
            resourceId: string | null;
            metadata: string | null;
            detecteeLe: Date;
            resolueLe: Date | null;
        };
    }>;
    resoudre(id: string, u: {
        id: string;
    }, dto: ResoudreAlerteDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            message: string;
            id: string;
            statut: string;
            creeLe: Date;
            misAJourLe: Date;
            type: string;
            titre: string;
            severite: string;
            resourceType: string | null;
            resourceId: string | null;
            metadata: string | null;
            detecteeLe: Date;
            resolueLe: Date | null;
        };
    }>;
    rouvrir(id: string, u: {
        id: string;
    }, dto: ResoudreAlerteDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            message: string;
            id: string;
            statut: string;
            creeLe: Date;
            misAJourLe: Date;
            type: string;
            titre: string;
            severite: string;
            resourceType: string | null;
            resourceId: string | null;
            metadata: string | null;
            detecteeLe: Date;
            resolueLe: Date | null;
        };
    }>;
}
