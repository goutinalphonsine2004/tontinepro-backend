import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
export declare class BadgesService {
    private prisma;
    private sms;
    constructor(prisma: PrismaService, sms: SmsService);
    attribuerBadgesSiEligible(clientId: string): Promise<void>;
    attribuerBadgesATous(): Promise<void>;
    mesBadges(clientId: string): Promise<{
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
