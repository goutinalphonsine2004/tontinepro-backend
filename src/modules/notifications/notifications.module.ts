import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../prisma/prisma.module';
import { RetraitsModule } from '../retraits/retraits.module';
import { TontinesModule } from '../tontines/tontines.module';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { WhatsappService } from './whatsapp.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SmsWebhookController } from './sms-webhook.controller';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    forwardRef(() => RetraitsModule),
    forwardRef(() => TontinesModule),
  ],
  controllers: [NotificationsController, SmsWebhookController],
  providers: [SmsService, PushService, WhatsappService, NotificationsService],
  exports: [SmsService, PushService, WhatsappService, NotificationsService],
})
export class NotificationsModule {}
