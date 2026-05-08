import { CronService } from './cron.service';
declare class DeclencherScoringDto {
    clientId?: string;
}
export declare class CronController {
    private service;
    constructor(service: CronService);
    scoring(dto: DeclencherScoringDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            score: number;
        };
    } | {
        succes: boolean;
        message: string;
        donnees?: undefined;
    }>;
    remboursements(): Promise<{
        succes: boolean;
        message: string;
    }>;
    facturation(): Promise<{
        succes: boolean;
        message: string;
    }>;
    rappels(): Promise<{
        succes: boolean;
        message: string;
    }>;
}
export {};
