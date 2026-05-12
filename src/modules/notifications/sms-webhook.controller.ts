import { Body, Controller, Post } from '@nestjs/common';
import { InboundSmsDto } from './dto/inbound-sms.dto';
import { SmsService } from './sms.service';

@Controller('webhooks/sms')
export class SmsWebhookController {
  constructor(private readonly smsService: SmsService) {}

  @Post('incoming')
  async handleIncomingSms(@Body() body: InboundSmsDto) {
    // Africa's Talking envoie les données en x-www-form-urlencoded ou JSON selon la config
    // On délègue au service pour le traitement asynchrone
    await this.smsService.traiterCommande(body.from, body.text);
    return { status: 'Received' };
  }
}
