import { Module } from '@nestjs/common';
import { RetraitsController } from './retraits.controller';
import { RetraitsService } from './retraits.service';
import { KkiapayService } from '../../common/services/kkiapay.service';

@Module({
  controllers: [RetraitsController],
  providers: [RetraitsService, KkiapayService],
})
export class RetraitsModule {}
