import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { CotiserDto } from './dto/cotiser.dto';
import { WebhookKkiapayDto } from './dto/webhook-kkiapay.dto';
export declare class TransactionsService {
    private prisma;
    private kkiapay;
    private sms;
    private readonly logger;
    constructor(prisma: PrismaService, kkiapay: KkiapayService, sms: SmsService);
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
    historique(utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            tontine: {
                id: string;
                nom: string;
            } | null;
        } & {
            id: string;
            reference: string;
            montant: number;
            montantNet: number;
            type: import("@prisma/client").$Enums.TypeTransaction;
            statut: import("@prisma/client").$Enums.StatutTransaction;
            refKKiaPay: string | null;
            operateur: string | null;
            fraisPlateforme: number;
            fraisAgent: number;
            hashPrecedent: string | null;
            hashActuel: string | null;
            tentatives: number;
            motifEchec: string | null;
            creeLe: Date;
            tontineId: string | null;
            utilisateurId: string;
        })[];
    }>;
    recu(transactionId: string, utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            reference: string;
            date: Date;
            type: import("@prisma/client").$Enums.TypeTransaction;
            statut: import("@prisma/client").$Enums.StatutTransaction;
            client: string;
            telephone: string;
            tontine: string;
            montant: number;
            fraisPlateforme: number;
            montantNet: number;
            operateur: string;
            refKKiaPay: string;
            hashIntegrite: string;
        };
    }>;
}
