import { Module } from '@nestjs/common';
import { TontinesController } from './tontines.controller';
import { TontinesService } from './tontines.service';
import { KkiapayService } from '../../common/services/kkiapay.service';

@Module({
  controllers: [TontinesController],
  providers: [TontinesService, KkiapayService],
})
export class TontinesModule {}
