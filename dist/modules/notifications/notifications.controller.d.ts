import { NotificationsService } from './notifications.service';
import { EnregistrerTokenDto } from './dto/enregistrer-token.dto';
import { FiltrerNotificationsDto } from './dto/filtrer-notifications.dto';
import { ModifierPreferencesNotificationDto } from './dto/modifier-preferences-notification.dto';
export declare class NotificationsController {
    private service;
    constructor(service: NotificationsService);
    lister(u: {
        id: string;
    }, dto: FiltrerNotificationsDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            notifications: {
                message: string;
                lu: boolean;
                id: string;
                utilisateurId: string;
                creeLe: Date;
                type: import("@prisma/client").$Enums.TypeNotification;
                titre: string;
                canal: import("@prisma/client").$Enums.Canal;
            }[];
            total: number;
            page: number;
            limite: number;
            pages: number;
        };
    }>;
    nonLues(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            total: number;
        };
    }>;
    preferences(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            smsActif: boolean;
            pushActif: boolean;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            misAJourLe: Date;
        };
    }>;
    modifierPreferences(u: {
        id: string;
    }, dto: ModifierPreferencesNotificationDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            smsActif: boolean;
            pushActif: boolean;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            misAJourLe: Date;
        };
    }>;
    toutMarquerLu(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
    }>;
    marquerLu(u: {
        id: string;
    }, id: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            message: string;
            lu: boolean;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            type: import("@prisma/client").$Enums.TypeNotification;
            titre: string;
            canal: import("@prisma/client").$Enums.Canal;
        };
    }>;
    enregistrerToken(u: any, dto: EnregistrerTokenDto): Promise<{
        succes: boolean;
        message: string;
    }>;
}
