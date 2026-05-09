import { Controller, Get, Header, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FiltrerRapportDto } from './dto/filtrer-rapport.dto';
import { RapportsService } from './rapports.service';

@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rapports')
export class RapportsController {
  constructor(private service: RapportsService) {}

  @Get('exports/transactions.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async transactionsCsv(@Query() dto: FiltrerRapportDto, @Res() res: Response) {
    const { buffer, filename } = await this.service.exportTransactionsCsv(dto);
    return this.envoyerFichier(res, buffer, filename);
  }

  @Get('exports/retraits.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async retraitsCsv(@Query() dto: FiltrerRapportDto, @Res() res: Response) {
    const { buffer, filename } = await this.service.exportRetraitsCsv(dto);
    return this.envoyerFichier(res, buffer, filename);
  }

  @Get('exports/micro-credits.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async microCreditsCsv(@Query() dto: FiltrerRapportDto, @Res() res: Response) {
    const { buffer, filename } = await this.service.exportMicroCreditsCsv(dto);
    return this.envoyerFichier(res, buffer, filename);
  }

  @Get('financier.pdf')
  @Header('Content-Type', 'application/pdf')
  async financierPdf(@Query() dto: FiltrerRapportDto, @Res() res: Response) {
    const { buffer, filename } = await this.service.rapportFinancierPdf(dto);
    return this.envoyerFichier(res, buffer, filename);
  }

  @Get('micro-credits.pdf')
  @Header('Content-Type', 'application/pdf')
  async microCreditsPdf(@Query() dto: FiltrerRapportDto, @Res() res: Response) {
    const { buffer, filename } = await this.service.microCreditsPdf(dto);
    return this.envoyerFichier(res, buffer, filename);
  }

  @Get('agents.pdf')
  @Header('Content-Type', 'application/pdf')
  async agentsPdf(@Query() dto: FiltrerRapportDto, @Res() res: Response) {
    const { buffer, filename } = await this.service.rapportAgentsPdf(dto);
    return this.envoyerFichier(res, buffer, filename);
  }

  @Get('bilan.pdf')
  @Header('Content-Type', 'application/pdf')
  async bilanPdf(@Query() dto: FiltrerRapportDto, @Res() res: Response) {
    const { buffer, filename } = await this.service.bilanComptablePdf(dto);
    return this.envoyerFichier(res, buffer, filename);
  }

  private envoyerFichier(res: Response, buffer: Buffer, filename: string) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }
}
