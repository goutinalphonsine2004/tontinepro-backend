import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AlertesService } from './alertes.service';
import { FiltrerAlertesDto } from './dto/filtrer-alertes.dto';
import { ResoudreAlerteDto } from './dto/resoudre-alerte.dto';

@Roles(Role.ADMIN, Role.SUPERVISEUR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alertes')
export class AlertesController {
  constructor(private service: AlertesService) {}

  @Get()
  lister(@Query() dto: FiltrerAlertesDto) {
    return this.service.lister(dto);
  }

  @Get('statistiques')
  statistiques() {
    return this.service.statistiques();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Roles(Role.ADMIN)
  @Put(':id/resoudre')
  resoudre(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: ResoudreAlerteDto,
  ) {
    return this.service.resoudre(id, u.id, dto);
  }

  @Roles(Role.ADMIN)
  @Put(':id/rouvrir')
  rouvrir(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: ResoudreAlerteDto,
  ) {
    return this.service.rouvrir(id, u.id, dto);
  }
}
