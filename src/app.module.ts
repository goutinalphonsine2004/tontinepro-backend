import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { TontinesModule } from './modules/tontines/tontines.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { RetraitsModule } from './modules/retraits/retraits.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { MicroCreditsModule } from './modules/micro-credits/micro-credits.module';
import { CronModule } from './modules/cron/cron.module';
import { ScoreModule } from './modules/score/score.module';
import { PadmeModule } from './modules/padme/padme.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BadgesModule } from './modules/badges/badges.module';
import { LitigesModule } from './modules/litiges/litiges.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

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
    TontinesModule,
    TransactionsModule,
    RetraitsModule,
    CommissionsModule,
    MicroCreditsModule,
    CronModule,
    ScoreModule,
    PadmeModule,
    AnalyticsModule,
    BadgesModule,
    LitigesModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AppModule {}
