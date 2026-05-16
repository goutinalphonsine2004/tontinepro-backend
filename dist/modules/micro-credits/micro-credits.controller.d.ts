import { Role } from '@prisma/client';
import { MicroCreditsService } from './micro-credits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DemanderCreditDto } from './dto/demander-credit.dto';
import { ConfirmerPinDto } from './dto/confirmer-pin.dto';
import { ConsentementSmsDto } from './dto/consentement-sms.dto';
import { RefuserCreditDto } from './dto/refuser-credit.dto';
export declare class MicroCreditsController {
    private service;
    private prisma;
    constructor(service: MicroCreditsService, prisma: PrismaService);
    private verifierAccesClient;
    monEligibilite(u: {
        id: string;
        role: Role;
    }, clientId?: string): Promise<{
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
    demander(u: {
        id: string;
        role: Role;
    }, dto: DemanderCreditDto, clientId?: string): Promise<{
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
    confirmerPin(id: string, u: {
        id: string;
    }, dto: ConfirmerPinDto): Promise<{
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
    valider(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            creditId: string;
            refKKiaPay: string;
            montantFcfaDecaisse: number;
        };
    }>;
    refuser(id: string, u: {
        id: string;
    }, dto: RefuserCreditDto): Promise<{
        succes: boolean;
        message: string;
    }>;
    mesCredits(u: {
        id: string;
        role: Role;
    }, clientId?: string): Promise<{
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
    remboursements(id: string, u: {
        id: string;
    }): Promise<{
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
                id: string;
                statut: string;
                montantFcfa: number;
                refKKiaPay: string | null;
                microCreditId: string;
                payeLe: Date;
            }[];
        };
    }>;
}
