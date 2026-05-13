import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { UtilisateursService } from './utilisateurs.service';
import { ModifierProfilDto } from './dto/modifier-profil.dto';
import { ChangerPinDto } from './dto/changer-pin.dto';
import { FiltrerUtilisateursDto } from './dto/filtrer-utilisateurs.dto';
import { ChangerStatutDto } from './dto/changer-statut.dto';
import { ChangerRoleDto } from './dto/changer-role.dto';
import { ConfigurerEmpreinteDto } from './dto/configurer-empreinte.dto';

@UseGuards(JwtAuthGuard)
@Controller('utilisateurs')
export class UtilisateursController {
  constructor(private service: UtilisateursService) {}

  @Throttle({ default: { limit: 300, ttl: 60000 } })
  @Get('mon-dashboard')
  monDashboard(@UtilisateurCourant() u: { id: string }) {
    return this.service.monDashboard(u.id);
  }

  @Get('profil')
  getProfil(@UtilisateurCourant() u: { id: string }) {
    return this.service.getProfil(u.id);
  }

  @Get('mon-qr-code')
  monQrCode(@UtilisateurCourant() u: { id: string }) {
    return this.service.monQrCode(u.id);
  }

  @Get('mes-stats')
  mesStats(@UtilisateurCourant() u: { id: string }) {
    return this.service.mesStats(u.id);
  }

  @Put('profil')
  modifierProfil(
    @UtilisateurCourant() u: { id: string },
    @Body() dto: ModifierProfilDto,
  ) {
    return this.service.modifierProfil(u.id, dto);
  }

  @Put('pin')
  changerPin(
    @UtilisateurCourant() u: { id: string },
    @Body() dto: ChangerPinDto,
  ) {
    return this.service.changerPin(u.id, dto);
  }

  @Put('empreinte')
  configurerEmpreinte(
    @UtilisateurCourant() u: { id: string },
    @Body() dto: ConfigurerEmpreinteDto,
  ) {
    return this.service.configurerEmpreinte(u.id, dto);
  }

  @Delete('mon-compte')
  supprimerMonCompte(
    @UtilisateurCourant() u: { id: string },
    @Body() body: { pin: string },
  ) {
    return this.service.supprimerMonCompte(u.id, body.pin);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  lister(@Query() dto: FiltrerUtilisateursDto) {
    return this.service.listerUtilisateurs(dto);
  }

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  @Put(':id/reassigner')
  reassignerClient(
    @Param('id') id: string,
    @Body() body: { nouveauCollecteurId: string },
    @UtilisateurCourant() u: { id: string },
  ) {
    return this.service.reassignerClient(id, body.nouveauCollecteurId, u.id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put(':id/statut')
  changerStatut(
    @UtilisateurCourant() u: { id: string },
    @Param('id') id: string,
    @Body() dto: ChangerStatutDto,
  ) {
    return this.service.changerStatut(u.id, id, dto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put(':id/role')
  changerRole(
    @UtilisateurCourant() u: { id: string },
    @Param('id') id: string,
    @Body() dto: ChangerRoleDto,
  ) {
    return this.service.changerRole(u.id, id, dto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put(':id/superviseur')
  assignerSuperviseur(
    @UtilisateurCourant() u: { id: string },
    @Param('id') id: string,
    @Body() body: { superviseurId: string | null },
  ) {
    return this.service.assignerSuperviseur(u.id, id, body.superviseurId);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Delete(':id')
  supprimer(@UtilisateurCourant() u: { id: string }, @Param('id') id: string) {
    return this.service.supprimerUtilisateur(u.id, id);
  }
}
