import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { DemanderRetraitDto } from './dto/demander-retrait.dto';
import { ConfirmerRetraitDto } from './dto/confirmer-retrait.dto';
import { RejeterRetraitDto } from './dto/rejeter-retrait.dto';
export declare class RetraitsService {
    private prisma;
    private kkiapay;
    private sms;
    constructor(prisma: PrismaService, kkiapay: KkiapayService, sms: SmsService);
    demanderOtp(utilisateurId: string, dto: DemanderRetraitDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            tontineId: string;
            montant: number;
            telephone: string;
            expireLe: Date;
        };
    }>;
    confirmer(utilisateurId: string, dto: ConfirmerRetraitDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            creeLe: Date;
            utilisateurId: string;
            motifRejet: string | null;
            refKKiaPay: string | null;
            tontineId: string;
            montant: number;
            validePar: string | null;
            executeLe: Date | null;
        };
    }>;
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
            tontineId: string;
            montant: number;
            validePar: string | null;
            executeLe: Date | null;
        };
    }>;
    private verifierRetraitPossible;
    private verifierAucuneAlerteBloquante;
    private executer;
    mesRetraits(utilisateurId: string): Promise<{
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
            motifRejet: string | null;
            refKKiaPay: string | null;
            tontineId: string;
            montant: number;
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
            motifRejet: string | null;
            refKKiaPay: string | null;
            tontineId: string;
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
    private creerOtpRetrait;
    private typeOtpRetrait;
    private verifierCodeOtp;
}
