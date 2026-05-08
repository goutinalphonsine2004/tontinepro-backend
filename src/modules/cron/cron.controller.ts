import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CronService } from './cron.service';
import { IsOptional, IsString } from 'class-validator';

class DeclencherScoringDto {
  @IsString()
  @IsOptional()
  clientId?: string;
}

@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cron')
export class CronController {
  constructor(private service: CronService) {}

  @Post('scoring')
  scoring(@Body() dto: DeclencherScoringDto) {
    return this.service.declencherScoringManuellement(dto.clientId);
  }

  @Post('remboursements')
  remboursements() {
    return this.service.declencherRemboursementsManuellement();
  }

  @Post('facturation')
  facturation() {
    return this.service.declencherFacturationManuellement();
  }

  @Post('rappels')
  rappels() {
    return this.service.declencherRappelsManuellement();
  }
}
