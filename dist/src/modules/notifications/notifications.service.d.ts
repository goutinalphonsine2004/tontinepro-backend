import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { WhatsappService } from './whatsapp.service';
export type TypeNotif = 'SMS' | 'PUSH' | 'WHATSAPP' | 'TOUS';
export declare class NotificationsService {
    private prisma;
    private sms;
    private push;
    private whatsapp;
    private readonly logger;
    constructor(prisma: PrismaService, sms: SmsService, push: PushService, whatsapp: WhatsappService);
    envoyerAUtilisateur(utilisateurId: string, titre: string, message: string, types?: TypeNotif): Promise<Record<string, any> | undefined>;
    envoyerSmsGroupe(telephones: string[], message: string): Promise<{
        succes: number;
        total: number;
    }>;
    enregistrerTokenPush(utilisateurId: string, token: string): Promise<{
        succes: boolean;
        message: string;
    }>;
}
