import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { PdfService, RecuTransactionPdf } from '../../common/services/pdf.service';
import { SmsService } from '../notifications/sms.service';
import { WhatsappService } from '../notifications/whatsapp.service';
import { CotiserDto } from './dto/cotiser.dto';
import { WebhookKkiapayDto } from './dto/webhook-kkiapay.dto';
import { FiltrerTransactionsDto } from './dto/filtrer-transactions.dto';
export declare class TransactionsService {
    private prisma;
    private kkiapay;
    private sms;
    private pdf;
    private whatsapp;
    private readonly logger;
    constructor(prisma: PrismaService, kkiapay: KkiapayService, sms: SmsService, pdf: PdfService, whatsapp: WhatsappService);
    cotiser(utilisateurId: string, dto: CotiserDto): Promise<{
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
                    nom: string;
                    id: string;
                } | null;
            } & {
                id: string;
                statut: import("@prisma/client").$Enums.StatutTransaction;
                creeLe: Date;
                type: import("@prisma/client").$Enums.TypeTransaction;
                utilisateurId: string;
                reference: string;
                montant: number;
                montantNet: number;
                refKKiaPay: string | null;
                operateur: string | null;
                fraisPlateforme: number;
                fraisAgent: number;
                hashPrecedent: string | null;
                hashActuel: string | null;
                tontineId: string | null;
                tentatives: number;
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
