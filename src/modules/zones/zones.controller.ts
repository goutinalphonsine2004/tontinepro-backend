import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZonesService } from './zones.service';
import { CreerZoneDto } from './dto/creer-zone.dto';

@UseGuards(JwtAuthGuard)
@Controller('zones')
export class ZonesController {
  constructor(private service: ZonesService) {}

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post()
  creer(@Body() dto: CreerZoneDto) {
    return this.service.creer(dto);
  }

  @Get()
  lister() {
    return this.service.lister();
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('heatmap')
  heatmap() {
    return this.service.heatmap();
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put(':id')
  modifier(@Param('id') id: string, @Body() dto: Partial<CreerZoneDto>) {
    return this.service.modifier(id, dto);
  }

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  @Get(':id/agents')
  agentsDeLaZone(@Param('id') id: string) {
    return this.service.agentsDeLaZone(id);
  }

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  @Get(':id/stats')
  statsZone(@Param('id') id: string) {
    return this.service.statsZone(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put(':id/superviseur')
  assignerSuperviseur(@Param('id') id: string, @Body() body: { superviseurId: string }) {
    return this.service.assignerSuperviseur(id, body.superviseurId);
  }
}
