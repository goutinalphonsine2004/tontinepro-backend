import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { BadgesService } from '../badges/badges.service';
export declare class CronService {
    private prisma;
    private kkiapay;
    private sms;
    private badges;
    private readonly logger;
    constructor(prisma: PrismaService, kkiapay: KkiapayService, sms: SmsService, badges: BadgesService);
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
    debloquerPINAutomatiquement(): Promise<void>;
    declencherDeblocagePINManuellement(): Promise<{
        succes: boolean;
        message: string;
    }>;
    envoyerRappelsCotisation(): Promise<void>;
    detecterDefaillancesGroupe(): Promise<void>;
    facturerAbonnementsCollecteurs(): Promise<void>;
    regenererQRCodesExpires(): Promise<void>;
    verifierCoherenceComptable(): Promise<void>;
    declencherFacturationManuellement(): Promise<{
        succes: boolean;
        message: string;
    }>;
    declencherRappelsManuellement(): Promise<{
        succes: boolean;
        message: string;
    }>;
}
