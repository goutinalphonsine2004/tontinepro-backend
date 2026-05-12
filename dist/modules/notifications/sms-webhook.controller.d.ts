import { InboundSmsDto } from './dto/inbound-sms.dto';
import { SmsService } from './sms.service';
export declare class SmsWebhookController {
    private readonly smsService;
    constructor(smsService: SmsService);
    handleIncomingSms(body: InboundSmsDto): Promise<{
        status: string;
    }>;
}
