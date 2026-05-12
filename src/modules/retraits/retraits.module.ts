import { Module, forwardRef } from '@nestjs/common';
import { RetraitsController } from './retraits.controller';
import { RetraitsService } from './retraits.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [RetraitsController],
  providers: [RetraitsService, KkiapayService],
  exports: [RetraitsService],
})
export class RetraitsModule {}
