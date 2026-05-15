import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { OperationsAssisteesController } from './operations-assistees.controller';
import { OperationsAssisteesService } from './operations-assistees.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [OperationsAssisteesController],
  providers: [OperationsAssisteesService, KkiapayService],
  exports: [OperationsAssisteesService],
})
export class OperationsAssisteesModule {}
