import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { DemanderCreditDto } from './dto/demander-credit.dto';
import { ConfirmerPinDto } from './dto/confirmer-pin.dto';
import { ConsentementSmsDto } from './dto/consentement-sms.dto';
import { RefuserCreditDto } from './dto/refuser-credit.dto';
export declare class MicroCreditsService {
    private prisma;
    private kkiapay;
    private sms;
    constructor(prisma: PrismaService, kkiapay: KkiapayService, sms: SmsService);
    monEligibilite(clientId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            score: number;
            eligible: boolean;
            plafondMaximum: number;
            tauxInteret: string;
            dureeJours: number;
            exempleCalcul: {
                montantPrincipalFcfa: number;
                interet: number;
                montantTotalFcfa: number;
                paiementJournalierFcfa: number;
            } | null;
            scoreRequis: number;
            creditActifEnCours: boolean;
        };
    }>;
    demander(clientId: string, dto: DemanderCreditDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            creditId: string;
            montantPrincipalFcfa: number;
            montantTotalFcfa: number;
            paiementJournalierFcfa: number;
            tauxInteret: string;
            methodeConsentement: string;
            dateEcheance: Date;
        };
    }>;
    consentementSms(dto: ConsentementSmsDto): Promise<{
        succes: boolean;
        message: string;
    }>;
    confirmerPin(creditId: string, clientId: string, dto: ConfirmerPinDto): Promise<{
        succes: boolean;
        message: string;
    }>;
    enAttente(): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            client: {
                telephone: string;
                id: string;
                nom: string;
                kycVerifie: boolean;
            };
        } & {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            statut: import("@prisma/client").$Enums.StatutCredit;
            clientId: string;
            montantPrincipalFcfa: number;
            tauxInteret: number;
            montantTotalFcfa: number;
            paiementJournalierFcfa: number;
            totalJours: number;
            joursPayes: number;
            montantRestantFcfa: number;
            scoreAuMoment: number;
            initiePar: string;
            methodeConsentement: string | null;
            consentementObtenu: boolean;
            consentementObtenuLe: Date | null;
            decaisseLE: Date | null;
            dateEcheance: Date;
            termineLe: Date | null;
        })[];
    }>;
    valider(creditId: string, adminId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            creditId: string;
            refKKiaPay: string;
            montantFcfaDecaisse: number;
        };
    }>;
    refuser(creditId: string, _adminId: string, dto: RefuserCreditDto): Promise<{
        succes: boolean;
        message: string;
    }>;
    mesCredits(clientId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            _count: {
                remboursements: number;
            };
        } & {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            statut: import("@prisma/client").$Enums.StatutCredit;
            clientId: string;
            montantPrincipalFcfa: number;
            tauxInteret: number;
            montantTotalFcfa: number;
            paiementJournalierFcfa: number;
            totalJours: number;
            joursPayes: number;
            montantRestantFcfa: number;
            scoreAuMoment: number;
            initiePar: string;
            methodeConsentement: string | null;
            consentementObtenu: boolean;
            consentementObtenuLe: Date | null;
            decaisseLE: Date | null;
            dateEcheance: Date;
            termineLe: Date | null;
        })[];
    }>;
    remboursements(creditId: string, clientId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            credit: {
                montantTotalFcfa: number;
                montantRestantFcfa: number;
                joursPayes: number;
                totalJours: number;
                paiementJournalierFcfa: number;
                statut: import("@prisma/client").$Enums.StatutCredit;
            };
            remboursements: {
                refKKiaPay: string | null;
                id: string;
                statut: string;
                montantFcfa: number;
                microCreditId: string;
                payeLe: Date;
            }[];
        };
    }>;
}
