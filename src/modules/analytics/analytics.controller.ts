import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Roles(Role.ADMIN, Role.SUPERVISEUR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('kpis')
  kpis() { return this.service.kpis(); }

  @Get('scores-par-zone')
  scoreParZone() { return this.service.scoreParZone(); }

  @Get('performance-collecteurs')
  performanceCollecteurs() { return this.service.performanceCollecteurs(); }

  @Get('taux-remboursement')
  tauxRemboursement() { return this.service.tauxRemboursement(); }

  @Get('evolution-revenus')
  evolutionRevenus() { return this.service.evolutionRevenus(); }

  @Get('clients-eligibles')
  clientsEligibles() { return this.service.clientsEligibles(); }

  @Get('padme')
  padme() { return this.service.padme(); }
}
