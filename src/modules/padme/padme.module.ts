import { Module } from '@nestjs/common';
import { PadmeController } from './padme.controller';
import { PadmeService } from './padme.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PadmeController],
  providers: [PadmeService],
})
export class PadmeModule {}
