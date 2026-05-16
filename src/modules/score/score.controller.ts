import {
  Controller,
  Get,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { ScoreService } from './score.service';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('score')
export class ScoreController {
  constructor(
    private service: ScoreService,
    private prisma: PrismaService,
  ) {}

  private async resoudreClientId(
    u: { id: string; role: Role },
    clientId?: string,
  ): Promise<string> {
    const estCollecteur = u.role === Role.AGENT || u.role === Role.INDEPENDANT;
    if (!estCollecteur || !clientId) return u.id;
    const client = await this.prisma.utilisateur.findFirst({
      where: { id: clientId, collecteurId: u.id },
    });
    if (!client)
      throw new ForbiddenException(
        'Ce client ne fait pas partie de votre portefeuille.',
      );
    return clientId;
  }

  @Get('mon-score')
  async monScore(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Query('clientId') clientId?: string,
  ) {
    const id = await this.resoudreClientId(u, clientId);
    return this.service.monScore(id);
  }

  @Get('evolution')
  async evolution(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Query('clientId') clientId?: string,
  ) {
    const id = await this.resoudreClientId(u, clientId);
    return this.service.evolution(id);
  }

  @Get('conseils')
  async conseils(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Query('clientId') clientId?: string,
  ) {
    const id = await this.resoudreClientId(u, clientId);
    return this.service.conseils(id);
  }

  @Get('projection')
  async projection(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Query('clientId') clientId?: string,
  ) {
    const id = await this.resoudreClientId(u, clientId);
    return this.service.projection(id);
  }

  @Get('calendrier-regularite')
  async calendrierRegularite(
    @UtilisateurCourant() u: { id: string; role: Role },
    @Query('clientId') clientId?: string,
  ) {
    const id = await this.resoudreClientId(u, clientId);
    return this.service.calendrierRegularite(id);
  }
}
