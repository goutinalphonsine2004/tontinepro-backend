import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { OperationsAssisteesService } from './operations-assistees.service';
import { EnrolerClientTerrainDto } from './dto/enroler-client-terrain.dto';
import { InitierOperationAssisteeDto } from './dto/initier-operation-assistee.dto';
import { ConfirmerOperationAssisteeDto } from './dto/confirmer-operation-assistee.dto';

@Controller('operations-assistees')
export class OperationsAssisteesController {
  constructor(private service: OperationsAssisteesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT, Role.INDEPENDANT)
  @Post('clients-sans-smartphone')
  enrolerClientSansSmartphone(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Body() dto: EnrolerClientTerrainDto,
  ) {
    return this.service.enrolerClientSansSmartphone(u.id, u.role, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT, Role.INDEPENDANT, Role.SUPERVISEUR)
  @Get('clients/:clientId/fiche-terrain')
  ficheTerrain(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Param('clientId') clientId: string,
  ) {
    return this.service.ficheTerrain(u.id, u.role, clientId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT, Role.INDEPENDANT)
  @Post('cotisations/initier')
  initierCotisation(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Body() dto: InitierOperationAssisteeDto,
  ) {
    return this.service.initierCotisationAssistee(u.id, u.role, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT, Role.INDEPENDANT)
  @Post('retraits/initier')
  initierRetrait(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Body() dto: InitierOperationAssisteeDto,
  ) {
    return this.service.initierRetraitAssiste(u.id, u.role, dto);
  }

  // Public par design: appelé par un flux SMS/USSD ou une page très légère.
  // La sécurité repose sur l'OTP hashé, l'expiration et le compteur de tentatives.
  @Post(':id/confirmer-client')
  confirmerClient(
    @Param('id') id: string,
    @Body() dto: ConfirmerOperationAssisteeDto,
  ) {
    return this.service.confirmerParClient(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT, Role.INDEPENDANT, Role.SUPERVISEUR)
  @Get(':id/statut')
  statut(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Param('id') id: string,
  ) {
    return this.service.statut(u.id, u.role, id);
  }
}
