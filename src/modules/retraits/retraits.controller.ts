import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { RetraitsService } from './retraits.service';
import { DemanderRetraitDto } from './dto/demander-retrait.dto';
import { ConfirmerRetraitDto } from './dto/confirmer-retrait.dto';
import { RejeterRetraitDto } from './dto/rejeter-retrait.dto';

@UseGuards(JwtAuthGuard)
@Controller('retraits')
export class RetraitsController {
  constructor(private service: RetraitsService) {}

  @Post('demander')
  demander(
    @UtilisateurCourant() u: { id: string },
    @Body() dto: DemanderRetraitDto,
  ) {
    return this.service.demanderOtp(u.id, dto);
  }

  @Post('demander-otp')
  demanderOtp(
    @UtilisateurCourant() u: { id: string },
    @Body() dto: DemanderRetraitDto,
  ) {
    return this.service.demanderOtp(u.id, dto);
  }

  @Post('confirmer')
  confirmer(
    @UtilisateurCourant() u: { id: string },
    @Body() dto: ConfirmerRetraitDto,
  ) {
    return this.service.confirmer(u.id, dto);
  }

  @Get('mes-retraits')
  mesRetraits(@UtilisateurCourant() u: { id: string }) {
    return this.service.mesRetraits(u.id);
  }

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  @Get('en-attente')
  enAttente() {
    return this.service.enAttente();
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put(':id/valider')
  valider(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.valider(id, u.id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put(':id/rejeter')
  rejeter(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: RejeterRetraitDto,
  ) {
    return this.service.rejeter(id, u.id, dto);
  }
}
