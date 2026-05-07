import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { TontinesService } from './tontines.service';
import { CreerTontineDto } from './dto/creer-tontine.dto';
import { ModifierTontineDto } from './dto/modifier-tontine.dto';
import { RejoindreTonitneDto } from './dto/rejoindre-tontine.dto';

@UseGuards(JwtAuthGuard)
@Controller('tontines')
export class TontinesController {
  constructor(private service: TontinesService) {}

  @Post()
  creer(@UtilisateurCourant() u: { id: string }, @Body() dto: CreerTontineDto) {
    return this.service.creer(u.id, dto);
  }

  @Get('mes-tontines')
  mesTontines(@UtilisateurCourant() u: { id: string }) {
    return this.service.mesTontines(u.id);
  }

  @Get(':id')
  getTontine(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.getTontine(id, u.id);
  }

  @Put(':id')
  modifier(@Param('id') id: string, @UtilisateurCourant() u: { id: string }, @Body() dto: ModifierTontineDto) {
    return this.service.modifier(id, u.id, dto);
  }

  @Post(':id/rejoindre')
  rejoindre(@Param('id') id: string, @UtilisateurCourant() u: { id: string }, @Body() dto: RejoindreTonitneDto) {
    return this.service.rejoindre(id, u.id, dto);
  }

  @Post(':id/quitter')
  quitter(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.quitter(id, u.id);
  }

  @Get(':id/membres')
  membres(@Param('id') id: string) {
    return this.service.membres(id);
  }

  @Get(':id/ordre-tirage')
  ordreTirage(@Param('id') id: string) {
    return this.service.ordreTirage(id);
  }

  @Post(':id/distribuer')
  distribuer(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.distribuer(id, u.id);
  }
}
