import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { CollecteurTerrainService } from './collecteur-terrain.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { CheckInDto } from './dto/check-in.dto';
import { Role } from '@prisma/client';

@Controller('collecteur')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CollecteurTerrainController {
  constructor(private readonly service: CollecteurTerrainService) {}

  @Post('check-in')
  @Roles(Role.AGENT, Role.INDEPENDANT)
  checkIn(@UtilisateurCourant() u: { id: string }, @Body() dto: CheckInDto) {
    return this.service.checkIn(u.id, dto);
  }

  @Get('clients-du-jour')
  @Roles(Role.AGENT, Role.INDEPENDANT)
  clientsDuJour(@UtilisateurCourant() u: { id: string }) {
    return this.service.clientsDuJour(u.id);
  }

  @Get('carte-clients')
  @Roles(Role.AGENT, Role.INDEPENDANT)
  carteClients(@UtilisateurCourant() u: { id: string }) {
    return this.service.carteClients(u.id);
  }

  @Get('mes-presences')
  @Roles(Role.AGENT, Role.INDEPENDANT)
  mesPresences(
    @UtilisateurCourant() u: { id: string },
    @Query('page') page?: string,
    @Query('limite') limite?: string,
  ) {
    return this.service.mesPresences(u.id, page ? parseInt(page) : 1, limite ? parseInt(limite) : 20);
  }
}
