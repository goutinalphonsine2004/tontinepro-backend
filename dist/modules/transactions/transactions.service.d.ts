import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { PdfService, RecuTransactionPdf } from '../../common/services/pdf.service';
import { SmsService } from '../notifications/sms.service';
import { WhatsappService } from '../notifications/whatsapp.service';
import { CotiserDto } from './dto/cotiser.dto';
import { WebhookKkiapayDto } from './dto/webhook-kkiapay.dto';
import { FiltrerTransactionsDto } from './dto/filtrer-transactions.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class TransactionsService {
    private prisma;
    private kkiapay;
    private sms;
    private pdf;
    private whatsapp;
    private notifications;
    private readonly logger;
    constructor(prisma: PrismaService, kkiapay: KkiapayService, sms: SmsService, pdf: PdfService, whatsapp: WhatsappService, notifications: NotificationsService);
    cotiser(requesterId: string, dto: CotiserDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            transactionId: string;
            reference: string;
            refKKiaPay: string;
            paymentUrl: string;
            montant: number;
            fraisPlateforme: number;
            montantNet: number;
        };
    }>;
    traiterWebhook(body: WebhookKkiapayDto, rawBody: Buffer, signatureRecue: string): Promise<{
        succes: boolean;
        message: string;
    }>;
    private traiterSucces;
    private traiterWebhookRemboursement;
    private confirmerRemboursementSucces;
    private confirmerRemboursementEchec;
    historique(utilisateurId: string, filtres: FiltrerTransactionsDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            transactions: ({
                tontine: {
                    id: string;
                    nom: string;
                } | null;
            } & {
                refKKiaPay: string | null;
                tontineId: string | null;
                montant: number;
                id: string;
                utilisateurId: string;
                creeLe: Date;
                type: import("@prisma/client").$Enums.TypeTransaction;
                statut: import("@prisma/client").$Enums.StatutTransaction;
                tentatives: number;
                reference: string;
                montantNet: number;
                operateur: string | null;
                fraisPlateforme: number;
                fraisAgent: number;
                hashPrecedent: string | null;
                hashActuel: string | null;
                motifEchec: string | null;
            })[];
            total: number;
            page: number;
            limite: number;
            pages: number;
        };
    }>;
    recu(transactionId: string, utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: RecuTransactionPdf;
    }>;
    recuPdf(transactionId: string, utilisateurId: string): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        filename: string;
    }>;
    partagerRecuWhatsapp(transactionId: string, utilisateurId: string, telephone?: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            destinataire: string;
            resultat: {
                success: boolean;
                simulated: boolean;
                data?: undefined;
                erreur?: undefined;
            } | {
                success: boolean;
                data: any;
                simulated?: undefined;
                erreur?: undefined;
            } | {
                success: boolean;
                erreur: any;
                simulated?: undefined;
                data?: undefined;
            };
        };
    }>;
    private donneesRecu;
    private finDeJournee;
}
