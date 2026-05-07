import { RetraitsService } from './retraits.service';
import { DemanderRetraitDto } from './dto/demander-retrait.dto';
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
            id: string;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            creeLe: Date;
            utilisateurId: string;
            motifRejet: string | null;
            montant: number;
            refKKiaPay: string | null;
            validePar: string | null;
            executeLe: Date | null;
        };
    }>;
    mesRetraits(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            creeLe: Date;
            utilisateurId: string;
            motifRejet: string | null;
            montant: number;
            refKKiaPay: string | null;
            validePar: string | null;
            executeLe: Date | null;
        }[];
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
        } & {
            id: string;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            creeLe: Date;
            utilisateurId: string;
            motifRejet: string | null;
            montant: number;
            refKKiaPay: string | null;
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
