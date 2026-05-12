import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { FacturationService } from './facturation.service';
import { PayerAbonnementDto } from './dto/payer-abonnement.dto';

@UseGuards(JwtAuthGuard)
@Controller('facturation')
export class FacturationController {
  constructor(private service: FacturationService) {}

  @Get('mon-statut')
  monStatut(@UtilisateurCourant() u: { id: string; role: Role }) {
    return this.service.monStatut(u.id, u.role);
  }

  @Post('payer-abonnement')
  payerAbonnement(
    @UtilisateurCourant() u: { id: string },
    @Body() dto: PayerAbonnementDto,
  ) {
    return this.service.payerAbonnement(u.id, dto);
  }

  @Put('upgrader')
  upgrader(@UtilisateurCourant() u: { id: string }) {
    return this.service.upgrader(u.id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('tous')
  tous() {
    return this.service.tous();
  }
}
