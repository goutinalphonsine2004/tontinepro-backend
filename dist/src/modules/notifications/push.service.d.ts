import { ConfigService } from '@nestjs/config';
export declare class PushService {
    private config;
    private readonly logger;
    private initialized;
    constructor(config: ConfigService);
    envoyerNotification(token: string, titre: string, corps: string, donnees?: Record<string, string>): Promise<{
        success: boolean;
        simulated: boolean;
        messageId?: undefined;
        erreur?: undefined;
    } | {
        success: boolean;
        messageId: string;
        simulated?: undefined;
        erreur?: undefined;
    } | {
        success: boolean;
        erreur: any;
        simulated?: undefined;
        messageId?: undefined;
    }>;
    envoyerAMultiple(tokens: string[], titre: string, corps: string, donnees?: Record<string, string>): Promise<import("node_modules/firebase-admin/lib/messaging/messaging-api").BatchResponse | undefined>;
}
