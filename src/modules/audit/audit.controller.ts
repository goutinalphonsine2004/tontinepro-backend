import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { FiltrerAuditDto } from './dto/filtrer-audit.dto';

@Roles(Role.ADMIN, Role.SUPERVISEUR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private service: AuditService) {}

  @Get()
  lister(@Query() dto: FiltrerAuditDto) {
    return this.service.lister(dto);
  }
}
