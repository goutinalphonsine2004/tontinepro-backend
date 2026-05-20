import { Module, forwardRef } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { PdfService } from '../../common/services/pdf.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CronModule } from '../cron/cron.module';

@Module({
  imports: [NotificationsModule, forwardRef(() => CronModule)],
  controllers: [TransactionsController],
  providers: [TransactionsService, KkiapayService, PdfService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
