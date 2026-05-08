import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { MicroCreditsService } from './micro-credits.service';
import { DemanderCreditDto } from './dto/demander-credit.dto';
import { ConfirmerPinDto } from './dto/confirmer-pin.dto';
import { ConsentementSmsDto } from './dto/consentement-sms.dto';
import { RefuserCreditDto } from './dto/refuser-credit.dto';

@Controller('micro-credits')
export class MicroCreditsController {
  constructor(private service: MicroCreditsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('mon-eligibilite')
  monEligibilite(@UtilisateurCourant() u: { id: string }) {
    return this.service.monEligibilite(u.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('demander')
  demander(@UtilisateurCourant() u: { id: string }, @Body() dto: DemanderCreditDto) {
    return this.service.demander(u.id, dto);
  }

  // Webhook Africa's Talking — pas de JWT (appelé par AT)
  @Post('consentement-sms')
  consentementSms(@Body() dto: ConsentementSmsDto) {
    return this.service.consentementSms(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/confirmer-pin')
  confirmerPin(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: ConfirmerPinDto,
  ) {
    return this.service.confirmerPin(id, u.id, dto);
  }

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('en-attente')
  enAttente() {
    return this.service.enAttente();
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id/valider')
  valider(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.valider(id, u.id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id/refuser')
  refuser(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: RefuserCreditDto,
  ) {
    return this.service.refuser(id, u.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mes-credits')
  mesCredits(@UtilisateurCourant() u: { id: string }) {
    return this.service.mesCredits(u.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/remboursements')
  remboursements(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.remboursements(id, u.id);
  }
}
