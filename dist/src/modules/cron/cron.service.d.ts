import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
export declare class CronService {
    private prisma;
    private kkiapay;
    private sms;
    private readonly logger;
    constructor(prisma: PrismaService, kkiapay: KkiapayService, sms: SmsService);
    preleverRemboursementsJournaliers(): Promise<void>;
    preleverUnCredit(credit: any): Promise<void>;
    private gererEchecRemboursement;
    scoringNocturne(): Promise<void>;
    calculerEtMettreAJourScore(clientId: string): Promise<number>;
    private genererDossierPADME;
    nettoyerOTPExpires(): Promise<void>;
    expirerCreditsConsentementExpires(): Promise<void>;
    declencherScoringManuellement(clientId?: string): Promise<{
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
    declencherRemboursementsManuellement(): Promise<{
        succes: boolean;
        message: string;
    }>;
}
