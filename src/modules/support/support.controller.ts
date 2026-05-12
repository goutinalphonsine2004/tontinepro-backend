import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { Role } from '@prisma/client';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Get('faq')
  listerFAQ(@Query('categorie') categorie?: string) {
    return this.service.listerFAQ(categorie);
  }

  @Post('faq')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  creerFAQ(
    @Body()
    dto: {
      categorie: string;
      question: string;
      reponse: string;
      ordre?: number;
    },
    @UtilisateurCourant() u: { id: string },
  ) {
    return this.service.creerFAQ(dto, u.id);
  }

  @Put('faq/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  modifierFAQ(@Param('id') id: string, @Body() dto: any) {
    return this.service.modifierFAQ(id, dto);
  }

  @Delete('faq/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  supprimerFAQ(@Param('id') id: string) {
    return this.service.supprimerFAQ(id);
  }
}
