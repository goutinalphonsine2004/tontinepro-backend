import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { EnregistrerTokenDto } from './dto/enregistrer-token.dto';
import { FiltrerNotificationsDto } from './dto/filtrer-notifications.dto';
import { ModifierPreferencesNotificationDto } from './dto/modifier-preferences-notification.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  lister(
    @UtilisateurCourant() u: { id: string },
    @Query() dto: FiltrerNotificationsDto,
  ) {
    return this.service.lister(u.id, dto);
  }

  @Get('non-lues')
  nonLues(@UtilisateurCourant() u: { id: string }) {
    return this.service.compterNonLues(u.id);
  }

  @Get('preferences')
  preferences(@UtilisateurCourant() u: { id: string }) {
    return this.service.getPreferences(u.id);
  }

  @Put('preferences')
  modifierPreferences(
    @UtilisateurCourant() u: { id: string },
    @Body() dto: ModifierPreferencesNotificationDto,
  ) {
    return this.service.modifierPreferences(u.id, dto);
  }

  @Put('tout-lu')
  toutMarquerLu(@UtilisateurCourant() u: { id: string }) {
    return this.service.toutMarquerLu(u.id);
  }

  @Put(':id/lu')
  marquerLu(@UtilisateurCourant() u: { id: string }, @Param('id') id: string) {
    return this.service.marquerLu(u.id, id);
  }

  @Post('token-push')
  enregistrerToken(
    @UtilisateurCourant() u: { id: string },
    @Body() dto: EnregistrerTokenDto,
  ) {
    return this.service.enregistrerTokenPush(u.id, dto.tokenPush);
  }
}
