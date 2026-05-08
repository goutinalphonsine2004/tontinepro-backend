import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sms: any;

  constructor(private config: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AfricasTalking = require('africastalking');
    const at = AfricasTalking({
      username: config.get<string>('AT_USERNAME', 'sandbox'),
      apiKey: config.get<string>('AT_API_KEY', ''),
    });
    this.sms = at.SMS;
  }

  async envoyer(telephone: string, message: string): Promise<void> {
    try {
      await this.sms.send({
        to: [telephone],
        message,
        from: this.config.get<string>('AT_SENDER', 'TontineBénin'),
      });
      this.logger.log(`SMS envoyé à ${telephone}`);
    } catch (error) {
      this.logger.error(`Échec envoi SMS à ${telephone}: ${error.message}`);
    }
  }
}
