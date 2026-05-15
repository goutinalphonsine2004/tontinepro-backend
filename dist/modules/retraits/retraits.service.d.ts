import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { DemanderRetraitDto } from './dto/demander-retrait.dto';
import { ConfirmerRetraitDto } from './dto/confirmer-retrait.dto';
import { RejeterRetraitDto } from './dto/rejeter-retrait.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class RetraitsService {
    private prisma;
    private kkiapay;
    private sms;
    private notifications;
    constructor(prisma: PrismaService, kkiapay: KkiapayService, sms: SmsService, notifications: NotificationsService);
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
            refKKiaPay: string | null;
            tontineId: string;
            idempotencyKey: string | null;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            montantFcfa: number;
            validePar: string | null;
            motifRejet: string | null;
            executeLe: Date | null;
        };
    }>;
    demander(utilisateurId: string, dto: DemanderRetraitDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            refKKiaPay: string | null;
            tontineId: string;
            idempotencyKey: string | null;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            montantFcfa: number;
            validePar: string | null;
            motifRejet: string | null;
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
                id: string;
                nom: string;
            };
        } & {
            refKKiaPay: string | null;
            tontineId: string;
            idempotencyKey: string | null;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            montantFcfa: number;
            validePar: string | null;
            motifRejet: string | null;
            executeLe: Date | null;
        })[];
    }>;
    statut(retraitId: string, utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            historique: {
                statut: string;
                date: Date;
            }[];
            refKKiaPay: string | null;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            montantFcfa: number;
            motifRejet: string | null;
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
            refKKiaPay: string | null;
            tontineId: string;
            idempotencyKey: string | null;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutRetrait;
            montantFcfa: number;
            validePar: string | null;
            motifRejet: string | null;
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
