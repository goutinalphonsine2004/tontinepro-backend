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
            montant: number;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            validePar: string | null;
            motifRejet: string | null;
            refKKiaPay: string | null;
            creeLe: Date;
            executeLe: Date | null;
            utilisateurId: string;
        };
    }>;
    private executer;
    mesRetraits(utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            montant: number;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            validePar: string | null;
            motifRejet: string | null;
            refKKiaPay: string | null;
            creeLe: Date;
            executeLe: Date | null;
            utilisateurId: string;
        }[];
    }>;
    enAttente(): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                id: string;
                telephone: string;
                nom: string;
            };
        } & {
            id: string;
            montant: number;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            validePar: string | null;
            motifRejet: string | null;
            refKKiaPay: string | null;
            creeLe: Date;
            executeLe: Date | null;
            utilisateurId: string;
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
