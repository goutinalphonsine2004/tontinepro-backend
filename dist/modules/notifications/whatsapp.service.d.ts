import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export declare class WhatsappService {
    private config;
    private http;
    private readonly logger;
    private readonly token;
    private readonly phoneNumberId;
    private readonly baseUrl;
    private readonly enabled;
    constructor(config: ConfigService, http: HttpService);
    envoyerMessage(telephone: string, message: string): Promise<{
        success: boolean;
        simulated: boolean;
        data?: undefined;
        erreur?: undefined;
    } | {
        success: boolean;
        data: any;
        simulated?: undefined;
        erreur?: undefined;
    } | {
        success: boolean;
        erreur: string;
        simulated?: undefined;
        data?: undefined;
    }>;
}
