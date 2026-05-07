import { ConfigService } from '@nestjs/config';
export declare class SmsService {
    private config;
    private readonly logger;
    private sms;
    constructor(config: ConfigService);
    envoyer(telephone: string, message: string): Promise<void>;
}
