import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DonnerAvisDto {
  @IsInt() @Min(1) @Max(5) @Type(() => Number)
  note!: number;

  @IsOptional() @IsString() @MaxLength(300)
  commentaire?: string;
}
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
    return this.service.mesPresences(
      u.id,
      page ? parseInt(page) : 1,
      limite ? parseInt(limite) : 20,
    );
  }

  @Get('dashboard-independant')
  @Roles(Role.INDEPENDANT)
  dashboardIndependant(@UtilisateurCourant() u: { id: string }) {
    return this.service.dashboardIndependant(u.id);
  }

  @Get('contact-whatsapp/:clientId')
  @Roles(Role.AGENT, Role.INDEPENDANT)
  contactWhatsApp(
    @UtilisateurCourant() u: { id: string },
    @Param('clientId') clientId: string,
  ) {
    return this.service.contactWhatsApp(u.id, clientId);
  }

  @Get('mon-collecteur')
  monCollecteur(@UtilisateurCourant() u: { id: string }) {
    return this.service.monCollecteur(u.id);
  }

  // ─── POST /collecteur/:id/avis ─────────────────────
  // Le CLIENT donne une note (1-5) à son collecteur
  @Post(':id/avis')
  @Roles(Role.CLIENT)
  donnerAvis(
    @UtilisateurCourant() u: { id: string },
    @Param('id') collecteurId: string,
    @Body() dto: DonnerAvisDto,
  ) {
    return this.service.donnerAvis(u.id, collecteurId, dto.note, dto.commentaire);
  }

  // ─── GET /collecteur/:id/avis ──────────────────────
  // Résumé public des avis d'un collecteur
  @Get(':id/avis')
  avisCollecteur(@Param('id') collecteurId: string) {
    return this.service.avisCollecteur(collecteurId);
  }
}
