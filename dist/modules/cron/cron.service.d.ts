import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { PdfService } from '../../common/services/pdf.service';
import { SmsService } from '../notifications/sms.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadgesService } from '../badges/badges.service';
export declare class CronService {
    private prisma;
    private kkiapay;
    private sms;
    private pdf;
    private notifications;
    private badges;
    private config;
    private readonly logger;
    constructor(prisma: PrismaService, kkiapay: KkiapayService, sms: SmsService, pdf: PdfService, notifications: NotificationsService, badges: BadgesService, config: ConfigService);
    preleverRemboursementsJournaliers(): Promise<void>;
    preleverUnCredit(credit: any): Promise<void>;
    private gererEchecRemboursement;
    scoringNocturne(): Promise<void>;
    calculerEtMettreAJourScore(clientId: string): Promise<number>;
    private genererDossierPADME;
    private notifierAdminsDossierPADME;
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
    envoyerAlertesSoldeFaible(): Promise<void>;
    declencherAlertesSoldeFaibleManuellement(): Promise<{
        succes: boolean;
        message: string;
    }>;
    envoyerRappelsCotisation(): Promise<void>;
    detecterDefaillancesGroupe(): Promise<void>;
    facturerAbonnementsCollecteurs(): Promise<void>;
    regenererQRCodesExpires(): Promise<void>;
    verifierCoherenceComptable(): Promise<void>;
    private creerOuMettreAJourAlerteCoherence;
    private resoudreAlerteCoherence;
    declencherFacturationManuellement(): Promise<{
        succes: boolean;
        message: string;
    }>;
    declencherRappelsManuellement(): Promise<{
        succes: boolean;
        message: string;
    }>;
    revoquerSessionsExpirees(): Promise<void>;
    declencherRevocationManuellement(): Promise<{
        succes: boolean;
        message: string;
    }>;
}
