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
            id: string;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            creeLe: Date;
            utilisateurId: string;
            montant: number;
            refKKiaPay: string | null;
            tontineId: string;
            motifRejet: string | null;
            validePar: string | null;
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
                nom: string;
                id: string;
            };
        } & {
            id: string;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            creeLe: Date;
            utilisateurId: string;
            montant: number;
            refKKiaPay: string | null;
            tontineId: string;
            motifRejet: string | null;
            validePar: string | null;
            executeLe: Date | null;
        })[];
    }>;
    enAttente(): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                nom: string;
                id: string;
            };
            tontine: {
                nom: string;
                id: string;
                soldeActuel: number;
            };
        } & {
            id: string;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            creeLe: Date;
            utilisateurId: string;
            montant: number;
            refKKiaPay: string | null;
            tontineId: string;
            motifRejet: string | null;
            validePar: string | null;
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
