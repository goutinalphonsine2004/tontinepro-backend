import { TypeNotification } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { WhatsappService } from './whatsapp.service';
import { FiltrerNotificationsDto } from './dto/filtrer-notifications.dto';
import { ModifierPreferencesNotificationDto } from './dto/modifier-preferences-notification.dto';
export type TypeNotif = 'SMS' | 'PUSH' | 'WHATSAPP' | 'TOUS';
export declare class NotificationsService {
    private prisma;
    private sms;
    private push;
    private whatsapp;
    private readonly logger;
    constructor(prisma: PrismaService, sms: SmsService, push: PushService, whatsapp: WhatsappService);
    envoyerAUtilisateur(utilisateurId: string, titre: string, message: string, types?: TypeNotif, typeNotification?: TypeNotification): Promise<Record<string, any> | undefined>;
    envoyerSmsGroupe(telephones: string[], message: string): Promise<{
        succes: number;
        total: number;
    }>;
    enregistrerTokenPush(utilisateurId: string, token: string): Promise<{
        succes: boolean;
        message: string;
    }>;
    lister(utilisateurId: string, dto: FiltrerNotificationsDto): Promise<{
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
    compterNonLues(utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            total: number;
        };
    }>;
    marquerLu(utilisateurId: string, notificationId: string): Promise<{
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
    toutMarquerLu(utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
    }>;
    getPreferences(utilisateurId: string): Promise<{
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
    modifierPreferences(utilisateurId: string, dto: ModifierPreferencesNotificationDto): Promise<{
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
    envoyerAEquipe(agentId: string, titre: string, message: string): Promise<void>;
    private getPreferencesBrutes;
    private creerNotification;
}
