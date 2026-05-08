import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [NotificationsModule, BadgesModule],
  controllers: [CronController],
  providers: [CronService, KkiapayService],
  exports: [CronService],
})
export class CronModule {}
