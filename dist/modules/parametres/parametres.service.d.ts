import { PrismaService } from '../../prisma/prisma.service';
import { SetParametreDto, MaintenanceDto } from './dto/set-parametre.dto';
export declare class ParametresService {
    private prisma;
    constructor(prisma: PrismaService);
    lister(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            cle: string;
            valeur: string;
            description: string;
            modifiePar: string | null;
            misAJourLe: Date | null;
            estValeurParDefaut: boolean;
        }[];
    }>;
    get(cle: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            cle: string;
            valeur: string;
            description: string;
            estValeurParDefaut: boolean;
        };
    }>;
    set(cle: string, dto: SetParametreDto, adminId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            description: string | null;
            valeur: string;
            cle: string;
            modifiePar: string | null;
        };
    }>;
    maintenance(dto: MaintenanceDto, adminId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            maintenance: boolean;
            message: string | null;
        };
    }>;
    getValeur(cle: string, defaut?: string): Promise<string>;
    getValeurNumerique(cle: string, defaut?: number): Promise<number>;
}
