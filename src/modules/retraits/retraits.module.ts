import { Module } from '@nestjs/common';
import { RetraitsController } from './retraits.controller';
import { RetraitsService } from './retraits.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';

@Module({
  controllers: [RetraitsController],
  providers: [RetraitsService, KkiapayService, SmsService],
})
export class RetraitsModule {}
