import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { MicroCreditsService } from './micro-credits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DemanderCreditDto } from './dto/demander-credit.dto';
import { ConfirmerPinDto } from './dto/confirmer-pin.dto';
import { ConsentementSmsDto } from './dto/consentement-sms.dto';
import { RefuserCreditDto } from './dto/refuser-credit.dto';

@Controller('micro-credits')
export class MicroCreditsController {
  constructor(
    private service: MicroCreditsService,
    private prisma: PrismaService,
  ) {}

  private async verifierAccesClient(collecteurId: string, clientId: string) {
    const client = await this.prisma.utilisateur.findFirst({
      where: { id: clientId, collecteurId },
    });
    if (!client) throw new ForbiddenException('Ce client ne fait pas partie de votre portefeuille.');
    return clientId;
  }

  @UseGuards(JwtAuthGuard)
  @Get('mon-eligibilite')
  async monEligibilite(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Query('clientId') clientId?: string,
  ) {
    const estCollecteur = u.role === Role.AGENT || u.role === Role.INDEPENDANT;
    const id = estCollecteur && clientId
      ? await this.verifierAccesClient(u.id, clientId)
      : u.id;
    return this.service.monEligibilite(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('demander')
  async demander(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Body() dto: DemanderCreditDto,
    @Query('clientId') clientId?: string,
  ) {
    const estCollecteur = u.role === Role.AGENT || u.role === Role.INDEPENDANT;
    const id = estCollecteur && clientId
      ? await this.verifierAccesClient(u.id, clientId)
      : u.id;
    return this.service.demander(id, dto);
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
  async mesCredits(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Query('clientId') clientId?: string,
  ) {
    const estCollecteur = u.role === Role.AGENT || u.role === Role.INDEPENDANT;
    const id = estCollecteur && clientId
      ? await this.verifierAccesClient(u.id, clientId)
      : u.id;
    return this.service.mesCredits(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/remboursements')
  remboursements(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
  ) {
    return this.service.remboursements(id, u.id);
  }
}
