import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { QrcodeService } from './qrcode.service';
import { IsNotEmpty, IsString } from 'class-validator';

class RegénérerDto {
  @IsString()
  @IsNotEmpty()
  agentId!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('qrcode')
export class QrcodeController {
  constructor(private service: QrcodeService) {}

  @Get('mon-code')
  monCode(@UtilisateurCourant() u: { id: string; role: Role }) {
    return this.service.monCode(u.id, u.role);
  }

  @Post('scanner/:code')
  scanner(@Param('code') code: string) {
    return this.service.scanner(code);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post('regenerer')
  regenerer(@Body() dto: RegénérerDto) {
    return this.service.regenerer(dto.agentId);
  }
}
