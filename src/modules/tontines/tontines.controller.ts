import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { TontinesService } from './tontines.service';
import { CreerTontineDto } from './dto/creer-tontine.dto';
import { ModifierTontineDto } from './dto/modifier-tontine.dto';
import { RejoindreTonitneDto } from './dto/rejoindre-tontine.dto';
import { OrdreTirageDto } from './dto/ordre-tirage.dto';

@UseGuards(JwtAuthGuard)
@Controller('tontines')
export class TontinesController {
  constructor(private service: TontinesService) {}

  // ─── CRUD de base ─────────────────────────────────
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
  modifier(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: ModifierTontineDto,
  ) {
    return this.service.modifier(id, u.id, dto);
  }

  // ─── Machine à états ──────────────────────────────
  /** CREATION → ACTIVE : ouvre les cotisations (min 2 membres pour GROUPE) */
  @Post(':id/activer')
  activer(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.activerTontine(id, u.id);
  }

  /** ACTIVE → SUSPENDUE : pause temporaire */
  @Post(':id/suspendre')
  suspendre(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.suspendre(id, u.id);
  }

  /** SUSPENDUE → ACTIVE : reprise */
  @Post(':id/reactiver')
  reactiver(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.reactiver(id, u.id);
  }

  /** ACTIVE/SUSPENDUE → TERMINEE : clôture manuelle */
  @Post(':id/terminer')
  terminer(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.terminerTontine(id, u.id);
  }

  // ─── Membres & tirage ─────────────────────────────
  @Post(':id/rejoindre')
  rejoindre(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: RejoindreTonitneDto,
  ) {
    return this.service.rejoindre(id, u.id, dto);
  }

  // ─── Joindre via Code (SCAN QR) ───────────────────
  @Get('details-code/:code')
  detailsCode(@Param('code') code: string) {
    return this.service.getDetailsParCode(code);
  }

  @Post('rejoindre-code/:code')
  rejoindreCode(
    @Param('code') code: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: RejoindreTonitneDto,
  ) {
    return this.service.rejoindreParCode(code, u.id, dto);
  }

  @Post(':id/quitter')
  quitter(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.quitter(id, u.id);
  }

  @Get(':id/membres')
  membres(@Param('id') id: string) {
    return this.service.membres(id);
  }

  @Get(':id/invitation')
  invitation(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.invitation(id, u.id);
  }

  @Get(':id/ordre-tirage')
  ordreTirage(@Param('id') id: string) {
    return this.service.ordreTirage(id);
  }

  @Post(':id/ordre-tirage/manuel')
  definirOrdreTirage(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: OrdreTirageDto,
  ) {
    return this.service.definirOrdreTirage(id, u.id, dto.utilisateurIds);
  }

  @Post(':id/ordre-tirage/aleatoire')
  randomiserOrdreTirage(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
  ) {
    return this.service.randomiserOrdreTirage(id, u.id);
  }

  @Post(':id/distribuer')
  distribuer(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.distribuer(id, u.id);
  }
}
