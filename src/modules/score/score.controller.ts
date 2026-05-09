import { Controller, Get, UseGuards, ParseIntPipe, DefaultValuePipe, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { ScoreService } from './score.service';

@UseGuards(JwtAuthGuard)
@Controller('score')
export class ScoreController {
  constructor(private service: ScoreService) {}

  @Get('mon-score')
  monScore(@UtilisateurCourant() u: { id: string }) {
    return this.service.monScore(u.id);
  }

  @Get('evolution')
  evolution(@UtilisateurCourant() u: { id: string }) {
    return this.service.evolution(u.id);
  }

  @Get('conseils')
  conseils(@UtilisateurCourant() u: { id: string }) {
    return this.service.conseils(u.id);
  }

  @Get('projection')
  projection(@UtilisateurCourant() u: { id: string }) {
    return this.service.projection(u.id);
  }

  @Get('calendrier-regularite')
  calendrierRegularite(@UtilisateurCourant() u: { id: string }) {
    return this.service.calendrierRegularite(u.id);
  }
}
