import { RetraitsService } from './retraits.service';
import { DemanderRetraitDto } from './dto/demander-retrait.dto';
import { ConfirmerRetraitDto } from './dto/confirmer-retrait.dto';
import { RejeterRetraitDto } from './dto/rejeter-retrait.dto';
export declare class RetraitsController {
    private service;
    constructor(service: RetraitsService);
    demander(u: {
        id: string;
    }, dto: DemanderRetraitDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            tontineId: string;
            montant: number;
            telephone: string;
            expireLe: Date;
        };
    }>;
    demanderOtp(u: {
        id: string;
    }, dto: DemanderRetraitDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            tontineId: string;
            montant: number;
            telephone: string;
            expireLe: Date;
        };
    }>;
    confirmer(u: {
        id: string;
    }, dto: ConfirmerRetraitDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            tontineId: string;
            idempotencyKey: string | null;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            montantFcfa: number;
            validePar: string | null;
            motifRejet: string | null;
            refKKiaPay: string | null;
            executeLe: Date | null;
        };
    }>;
    mesRetraits(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            tontine: {
                id: string;
                nom: string;
            };
        } & {
            tontineId: string;
            idempotencyKey: string | null;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            montantFcfa: number;
            validePar: string | null;
            motifRejet: string | null;
            refKKiaPay: string | null;
            executeLe: Date | null;
        })[];
    }>;
    statut(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            historique: {
                statut: string;
                date: Date;
            }[];
            id: string;
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            montantFcfa: number;
            motifRejet: string | null;
            refKKiaPay: string | null;
            executeLe: Date | null;
        };
    }>;
    enAttente(): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                id: string;
                nom: string;
            };
            tontine: {
                id: string;
                nom: string;
                soldeActuelFcfa: number;
            };
        } & {
            tontineId: string;
            idempotencyKey: string | null;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            montantFcfa: number;
            validePar: string | null;
            motifRejet: string | null;
            refKKiaPay: string | null;
            executeLe: Date | null;
        })[];
    }>;
    valider(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
    }>;
    rejeter(id: string, u: {
        id: string;
    }, dto: RejeterRetraitDto): Promise<{
        succes: boolean;
        message: string;
    }>;
}
