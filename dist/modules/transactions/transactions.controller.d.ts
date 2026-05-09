import type { Request, Response } from 'express';
import { TransactionsService } from './transactions.service';
import { CotiserDto } from './dto/cotiser.dto';
import { WebhookKkiapayDto } from './dto/webhook-kkiapay.dto';
import { FiltrerTransactionsDto } from './dto/filtrer-transactions.dto';
import { PartagerRecuWhatsappDto } from './dto/partager-recu-whatsapp.dto';
export declare class TransactionsController {
    private service;
    constructor(service: TransactionsService);
    cotiser(u: {
        id: string;
    }, dto: CotiserDto): Promise<{
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
    webhook(req: Request & {
        rawBody?: Buffer;
    }, body: WebhookKkiapayDto, signature: string): Promise<{
        succes: boolean;
        message: string;
    }>;
    historique(u: {
        id: string;
    }, filtres: FiltrerTransactionsDto): Promise<{
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
    recu(id: string, u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: import("../../common/services/pdf.service").RecuTransactionPdf;
    }>;
    recuPdf(id: string, u: {
        id: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    partagerWhatsapp(id: string, u: {
        id: string;
    }, dto: PartagerRecuWhatsappDto): Promise<{
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
}
