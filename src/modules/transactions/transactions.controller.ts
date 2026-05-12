import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { TransactionsService } from './transactions.service';
import { CotiserDto } from './dto/cotiser.dto';
import { WebhookKkiapayDto } from './dto/webhook-kkiapay.dto';
import { FiltrerTransactionsDto } from './dto/filtrer-transactions.dto';
import { PartagerRecuWhatsappDto } from './dto/partager-recu-whatsapp.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private service: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('cotiser')
  cotiser(@UtilisateurCourant() u: { id: string }, @Body() dto: CotiserDto) {
    return this.service.cotiser(u.id, dto);
  }

  // Pas de JwtAuthGuard — appelé par le serveur KKiaPay
  @Post('webhook-kkiapay')
  webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Body() body: WebhookKkiapayDto,
    @Headers('x-kkiapay-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(body));
    return this.service.traiterWebhook(body, rawBody, signature ?? '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('historique')
  historique(
    @UtilisateurCourant() u: { id: string },
    @Query() filtres: FiltrerTransactionsDto,
  ) {
    return this.service.historique(u.id, filtres);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/recu')
  recu(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.recu(id, u.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/recu.pdf')
  @Header('Content-Type', 'application/pdf')
  async recuPdf(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.service.recuPdf(id, u.id);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/partager-whatsapp')
  partagerWhatsapp(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: PartagerRecuWhatsappDto,
  ) {
    return this.service.partagerRecuWhatsapp(id, u.id, dto.telephone);
  }
}
