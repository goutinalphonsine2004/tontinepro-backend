import { Module } from '@nestjs/common';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { KkiapayService } from '../../common/services/kkiapay.service';

@Module({
  controllers: [CommissionsController],
  providers: [CommissionsService, KkiapayService],
})
export class CommissionsModule {}
