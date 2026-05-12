import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ParametresService } from './parametres.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { SetParametreDto, MaintenanceDto } from './dto/set-parametre.dto';
import { Role } from '@prisma/client';

@Controller('parametres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParametresController {
  constructor(private readonly service: ParametresService) {}

  @Get()
  @Roles(Role.ADMIN)
  lister() {
    return this.service.lister();
  }

  @Get(':cle')
  @Roles(Role.ADMIN)
  get(@Param('cle') cle: string) {
    return this.service.get(cle);
  }

  @Put(':cle')
  @Roles(Role.ADMIN)
  set(
    @Param('cle') cle: string,
    @Body() dto: SetParametreDto,
    @UtilisateurCourant() u: { id: string },
  ) {
    return this.service.set(cle, dto, u.id);
  }

  @Post('maintenance')
  @Roles(Role.ADMIN)
  maintenance(
    @Body() dto: MaintenanceDto,
    @UtilisateurCourant() u: { id: string },
  ) {
    return this.service.maintenance(dto, u.id);
  }
}
