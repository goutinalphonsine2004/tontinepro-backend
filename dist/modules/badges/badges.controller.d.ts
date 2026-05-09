import { BadgesService } from './badges.service';
export declare class BadgesController {
    private service;
    constructor(service: BadgesService);
    mesBadges(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            badges: {
                id: string;
                clientId: string;
                niveau: import("@prisma/client").$Enums.NiveauBadge;
                obtenuLe: Date;
            }[];
            niveauActuel: import("@prisma/client").$Enums.NiveauBadge | null;
        };
    }>;
    classement(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            rang: number;
            nom: string;
            score: number;
            badge: import("@prisma/client").$Enums.NiveauBadge;
            zone: string;
            ville: string;
        }[];
    }>;
}
