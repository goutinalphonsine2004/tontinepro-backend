import { Body, Controller, Get, Header, Param, Put, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { PadmeService } from './padme.service';
import { FiltrerDossiersDto } from './dto/filtrer-dossiers.dto';
import { ResultatPadmeDto } from './dto/resultat-padme.dto';

@UseGuards(JwtAuthGuard)
@Controller('padme')
export class PadmeController {
  constructor(private service: PadmeService) {}

  @Get('mes-dossiers')
  mesDossiers(@UtilisateurCourant() u: { id: string }) {
    return this.service.mesDossiers(u.id);
  }

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  @Get('tous')
  tous(@Query() dto: FiltrerDossiersDto) {
    return this.service.tous(dto);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async pdf(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string; role: Role },
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.service.pdf(id, u.id, u.role);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put(':id/valider')
  valider(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.valider(id, u.id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put(':id/soumettre')
  soumettre(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.soumettre(id, u.id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put(':id/resultat')
  resultat(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: ResultatPadmeDto,
  ) {
    return this.service.resultat(id, u.id, dto);
  }
}
