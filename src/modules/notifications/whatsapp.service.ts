import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly token: string;
  private readonly phoneNumberId: string;
  private readonly baseUrl: string;
  private readonly enabled: boolean;

  constructor(
    private config: ConfigService,
    private http: HttpService,
  ) {
    this.token = config.get<string>('WHATSAPP_TOKEN', '');
    this.phoneNumberId = config.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.baseUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
    this.enabled = !!(this.token && this.phoneNumberId);

    if (!this.enabled) {
      this.logger.warn('[WhatsApp] Non configuré — messages désactivés');
    }
  }

  async envoyerMessage(telephone: string, message: string) {
    if (!this.enabled) {
      this.logger.log(`[WhatsApp Sim] → ${telephone}: ${message}`);
      return { success: true, simulated: true };
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: telephone.replace('+', ''),
        type: 'text',
        text: { preview_url: false, body: message },
      };

      const response = await firstValueFrom(
        this.http.post(this.baseUrl, payload, {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`[WhatsApp] Envoyé à ${telephone}`);
      return { success: true, data: response.data };
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.error(`[WhatsApp] Erreur: ${msg}`);
      return { success: false, erreur: msg };
    }
  }
}
