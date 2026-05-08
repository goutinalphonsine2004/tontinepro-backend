import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { EnregistrerTokenDto } from './dto/enregistrer-token.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Post('token-push')
  enregistrerToken(@UtilisateurCourant() u: any, @Body() dto: EnregistrerTokenDto) {
    return this.service.enregistrerTokenPush(u.id, dto.tokenPush);
  }
}
