import type { Response } from 'express';
import { FiltrerRapportDto } from './dto/filtrer-rapport.dto';
import { RapportsService } from './rapports.service';
export declare class RapportsController {
    private service;
    constructor(service: RapportsService);
    transactionsCsv(dto: FiltrerRapportDto, res: Response): Promise<Response<any, Record<string, any>>>;
    retraitsCsv(dto: FiltrerRapportDto, res: Response): Promise<Response<any, Record<string, any>>>;
    microCreditsCsv(dto: FiltrerRapportDto, res: Response): Promise<Response<any, Record<string, any>>>;
    financierPdf(dto: FiltrerRapportDto, res: Response): Promise<Response<any, Record<string, any>>>;
    private envoyerFichier;
}
