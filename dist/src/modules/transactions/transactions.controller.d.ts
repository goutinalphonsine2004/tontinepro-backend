import type { Request } from 'express';
import { TransactionsService } from './transactions.service';
import { CotiserDto } from './dto/cotiser.dto';
import { WebhookKkiapayDto } from './dto/webhook-kkiapay.dto';
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
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
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
            refKKiaPay: string | null;
            tontineId: string | null;
            reference: string;
            montant: number;
            montantNet: number;
            operateur: string | null;
            fraisPlateforme: number;
            fraisAgent: number;
            hashPrecedent: string | null;
            hashActuel: string | null;
            tentatives: number;
            motifEchec: string | null;
        })[];
    }>;
    recu(id: string, u: {
        id: string;
    }): Promise<{
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
