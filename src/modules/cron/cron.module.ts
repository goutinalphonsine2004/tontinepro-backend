import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { PdfService } from '../../common/services/pdf.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { BadgesModule } from '../badges/badges.module';
import { WhatsappService } from '../notifications/whatsapp.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [NotificationsModule, BadgesModule, HttpModule],
  controllers: [CronController],
  providers: [CronService, KkiapayService, PdfService, WhatsappService],
  exports: [CronService],
})
export class CronModule {}
