import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { PdfService } from '../../common/services/pdf.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, KkiapayService, PdfService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
