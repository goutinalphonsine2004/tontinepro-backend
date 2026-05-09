import { PrismaService } from '../../prisma/prisma.service';
import { FiltrerRapportDto } from './dto/filtrer-rapport.dto';
export declare class RapportsService {
    private prisma;
    constructor(prisma: PrismaService);
    exportTransactionsCsv(dto: FiltrerRapportDto): Promise<{
        buffer: Buffer<ArrayBuffer>;
        filename: string;
    }>;
    exportRetraitsCsv(dto: FiltrerRapportDto): Promise<{
        buffer: Buffer<ArrayBuffer>;
        filename: string;
    }>;
    exportMicroCreditsCsv(dto: FiltrerRapportDto): Promise<{
        buffer: Buffer<ArrayBuffer>;
        filename: string;
    }>;
    rapportFinancierPdf(dto: FiltrerRapportDto): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        filename: string;
    }>;
    private periode;
    private csv;
    private csvCell;
    private pdf;
    private section;
    private ligne;
    private fcfa;
    private finDeJournee;
}
