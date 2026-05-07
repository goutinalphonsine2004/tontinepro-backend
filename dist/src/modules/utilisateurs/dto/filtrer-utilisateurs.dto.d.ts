import { Role, StatutCompte } from '@prisma/client';
export declare class FiltrerUtilisateursDto {
    role?: Role;
    statut?: StatutCompte;
    recherche?: string;
    page?: number;
    limite?: number;
}
