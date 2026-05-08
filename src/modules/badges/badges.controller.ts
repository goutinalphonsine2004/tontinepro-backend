import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { BadgesService } from './badges.service';

@UseGuards(JwtAuthGuard)
@Controller('badges')
export class BadgesController {
  constructor(private service: BadgesService) {}

  @Get('mes-badges')
  mesBadges(@UtilisateurCourant() u: { id: string }) {
    return this.service.mesBadges(u.id);
  }

  @Get('classement')
  classement() {
    return this.service.classement();
  }
}
