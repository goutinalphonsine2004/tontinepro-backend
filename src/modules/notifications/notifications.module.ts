import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { WhatsappService } from './whatsapp.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [HttpModule],
  controllers: [NotificationsController],
  providers: [SmsService, PushService, WhatsappService, NotificationsService],
  exports: [SmsService, PushService, WhatsappService, NotificationsService],
})
export class NotificationsModule {}
