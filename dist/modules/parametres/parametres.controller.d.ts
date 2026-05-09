import { ParametresService } from './parametres.service';
import { SetParametreDto, MaintenanceDto } from './dto/set-parametre.dto';
export declare class ParametresController {
    private readonly service;
    constructor(service: ParametresService);
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
    set(cle: string, dto: SetParametreDto, u: {
        id: string;
    }): Promise<{
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
    maintenance(dto: MaintenanceDto, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            maintenance: boolean;
            message: string | null;
        };
    }>;
}
