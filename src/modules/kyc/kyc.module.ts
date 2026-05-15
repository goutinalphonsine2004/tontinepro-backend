import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';

@Module({
  imports: [ConfigModule],
  controllers: [KycController],
  providers: [KycService],
})
export class KycModule {}
