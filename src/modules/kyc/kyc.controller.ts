import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { KycService } from './kyc.service';
import { SoumettreKycDto } from './dto/soumettre-kyc.dto';
import { RejeterKycDto } from './dto/rejeter-kyc.dto';

@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private service: KycService) {}

  @Post('soumettre')
  soumettre(@UtilisateurCourant() u: { id: string }, @Body() dto: SoumettreKycDto) {
    return this.service.soumettre(u.id, dto);
  }

  @Get('mes-documents')
  mesDocuments(@UtilisateurCourant() u: { id: string }) {
    return this.service.mesDocuments(u.id);
  }

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  @Get('en-attente')
  enAttente() {
    return this.service.enAttente();
  }

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  @Put(':id/valider')
  valider(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.valider(id, u.id);
  }

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  @Put(':id/rejeter')
  rejeter(@Param('id') id: string, @UtilisateurCourant() u: { id: string }, @Body() dto: RejeterKycDto) {
    return this.service.rejeter(id, u.id, dto);
  }
}
