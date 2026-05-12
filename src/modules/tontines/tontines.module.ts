import { Module, forwardRef } from '@nestjs/common';
import { TontinesController } from './tontines.controller';
import { TontinesService } from './tontines.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [TontinesController],
  providers: [TontinesService, KkiapayService],
  exports: [TontinesService],
})
export class TontinesModule {}
