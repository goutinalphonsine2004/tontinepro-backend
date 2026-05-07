import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { DemanderRetraitDto } from './dto/demander-retrait.dto';
import { RejeterRetraitDto } from './dto/rejeter-retrait.dto';
export declare class RetraitsService {
    private prisma;
    private kkiapay;
    constructor(prisma: PrismaService, kkiapay: KkiapayService);
    demander(utilisateurId: string, dto: DemanderRetraitDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            creeLe: Date;
            utilisateurId: string;
            motifRejet: string | null;
            refKKiaPay: string | null;
            montant: number;
            validePar: string | null;
            executeLe: Date | null;
        };
    }>;
    private executer;
    mesRetraits(utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            creeLe: Date;
            utilisateurId: string;
            motifRejet: string | null;
            refKKiaPay: string | null;
            montant: number;
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
            refKKiaPay: string | null;
            montant: number;
            validePar: string | null;
            executeLe: Date | null;
        })[];
    }>;
    valider(retraitId: string, adminId: string): Promise<{
        succes: boolean;
        message: string;
    }>;
    rejeter(retraitId: string, adminId: string, dto: RejeterRetraitDto): Promise<{
        succes: boolean;
        message: string;
    }>;
}
