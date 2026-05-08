import { Module } from '@nestjs/common';
import { MicroCreditsController } from './micro-credits.controller';
import { MicroCreditsService } from './micro-credits.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [MicroCreditsController],
  providers: [MicroCreditsService, KkiapayService],
  exports: [MicroCreditsService],
})
export class MicroCreditsModule {}
