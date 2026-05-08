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
                id: string;
                creeLe: Date;
                type: import("@prisma/client").$Enums.TypeNotification;
                utilisateurId: string;
                lu: boolean;
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
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            utilisateurId: string;
            smsActif: boolean;
            pushActif: boolean;
        };
    }>;
    modifierPreferences(u: {
        id: string;
    }, dto: ModifierPreferencesNotificationDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            utilisateurId: string;
            smsActif: boolean;
            pushActif: boolean;
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
            id: string;
            creeLe: Date;
            type: import("@prisma/client").$Enums.TypeNotification;
            utilisateurId: string;
            lu: boolean;
            titre: string;
            canal: import("@prisma/client").$Enums.Canal;
        };
    }>;
    enregistrerToken(u: any, dto: EnregistrerTokenDto): Promise<{
        succes: boolean;
        message: string;
    }>;
}
