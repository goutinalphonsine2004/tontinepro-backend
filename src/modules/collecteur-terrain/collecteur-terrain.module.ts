import { Module } from '@nestjs/common';
import { CollecteurTerrainService } from './collecteur-terrain.service';
import { CollecteurTerrainController } from './collecteur-terrain.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CollecteurTerrainController],
  providers: [CollecteurTerrainService],
  exports: [CollecteurTerrainService],
})
export class CollecteurTerrainModule {}
