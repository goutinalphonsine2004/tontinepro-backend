import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UtilisateursModule } from './modules/utilisateurs/utilisateurs.module';
import { KycModule } from './modules/kyc/kyc.module';
import { ZonesModule } from './modules/zones/zones.module';
import { QrcodeModule } from './modules/qrcode/qrcode.module';
import { FacturationModule } from './modules/facturation/facturation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    PrismaModule,
    AuthModule,
    UtilisateursModule,
    KycModule,
    ZonesModule,
    QrcodeModule,
    FacturationModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
