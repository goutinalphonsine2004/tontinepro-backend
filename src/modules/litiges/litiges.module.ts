import { Module } from '@nestjs/common';
import { LitigesController } from './litiges.controller';
import { LitigesService } from './litiges.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [LitigesController],
  providers: [LitigesService],
})
export class LitigesModule {}
