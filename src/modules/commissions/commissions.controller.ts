import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { CommissionsService } from './commissions.service';
import { RetirerCommissionDto } from './dto/retirer-commission.dto';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private service: CommissionsService) {}

  @Get('mon-solde')
  monSolde(@UtilisateurCourant() u: { id: string; role: Role }) {
    return this.service.monSolde(u.id, u.role);
  }

  @Get('historique')
  historique(@UtilisateurCourant() u: { id: string; role: Role }) {
    return this.service.historique(u.id, u.role);
  }

  @Post('retirer')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  retirer(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Body() dto: RetirerCommissionDto,
  ) {
    return this.service.retirer(u.id, u.role, dto);
  }
}
