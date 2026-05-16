import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { LitigesService } from './litiges.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { Role } from '@prisma/client';
import { OuvrirLitigeDto } from './dto/ouvrir-litige.dto';
import { ResoudreLitigeDto } from './dto/resoudre-litige.dto';
import { RejeterLitigeDto } from './dto/rejeter-litige.dto';

@UseGuards(JwtAuthGuard)
@Controller('litiges')
export class LitigesController {
  constructor(private service: LitigesService) {}

  @Post()
  ouvrir(
    @UtilisateurCourant() u: { id: string; role?: string },
    @Body() dto: OuvrirLitigeDto,
  ) {
    return this.service.ouvrirLitige(u.id, dto);
  }

  @Get('mes-litiges')
  mesList(@UtilisateurCourant() u: { id: string; role?: string }) {
    return this.service.mesList(u.id);
  }

  @Get('en-cours/liste')
  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  enCours(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limite', new DefaultValuePipe(20), ParseIntPipe) limite: number,
  ) {
    return this.service.listeEnCours(page, limite);
  }

  @Put(':id/examiner')
  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  examiner(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string; role?: string },
  ) {
    return this.service.examiner(id, u.id);
  }

  @Put(':id/resoudre')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  resoudre(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string; role?: string },
    @Body() dto: ResoudreLitigeDto,
  ) {
    return this.service.resoudre(id, u.id, dto);
  }

  @Put(':id/rejeter')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  rejeter(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string; role?: string },
    @Body() dto: RejeterLitigeDto,
  ) {
    return this.service.rejeter(id, u.id, dto);
  }

  @Post(':id/commentaire')
  ajouterCommentaire(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string; role: string },
    @Body() dto: { message: string; pieceJointeUrl?: string },
  ) {
    return this.service.ajouterCommentaire(id, u.id, dto, u.role);
  }

  @Get(':id/commentaires')
  commentaires(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string; role: string },
  ) {
    return this.service.commentaires(id, u.id, u.role);
  }

  @Get(':id')
  detail(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string; role: string },
  ) {
    return this.service.detail(id, u.id, u.role);
  }
}
