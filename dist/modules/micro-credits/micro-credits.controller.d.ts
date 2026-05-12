import { MicroCreditsService } from './micro-credits.service';
import { DemanderCreditDto } from './dto/demander-credit.dto';
import { ConfirmerPinDto } from './dto/confirmer-pin.dto';
import { ConsentementSmsDto } from './dto/consentement-sms.dto';
import { RefuserCreditDto } from './dto/refuser-credit.dto';
export declare class MicroCreditsController {
    private service;
    constructor(service: MicroCreditsService);
    monEligibilite(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            score: number;
            eligible: boolean;
            plafondMaximum: number;
            tauxInteret: string;
            dureeJours: number;
            exempleCalcul: {
                montantPrincipal: number;
                interet: number;
                montantTotal: number;
                paiementJournalier: number;
            } | null;
            scoreRequis: number;
            creditActifEnCours: boolean;
        };
    }>;
    demander(u: {
        id: string;
    }, dto: DemanderCreditDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            creditId: string;
            montantPrincipal: number;
            montantTotal: number;
            paiementJournalier: number;
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
            montantPrincipal: number;
            tauxInteret: number;
            montantTotal: number;
            paiementJournalier: number;
            totalJours: number;
            joursPayes: number;
            montantRestant: number;
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
            montantDecaisse: number;
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
    }): Promise<{
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
            montantPrincipal: number;
            tauxInteret: number;
            montantTotal: number;
            paiementJournalier: number;
            totalJours: number;
            joursPayes: number;
            montantRestant: number;
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
                montantTotal: number;
                montantRestant: number;
                joursPayes: number;
                totalJours: number;
                paiementJournalier: number;
                statut: import("@prisma/client").$Enums.StatutCredit;
            };
            remboursements: {
                refKKiaPay: string | null;
                montant: number;
                id: string;
                statut: string;
                microCreditId: string;
                payeLe: Date;
            }[];
        };
    }>;
}
