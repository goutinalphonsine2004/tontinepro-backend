import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { TransactionsService } from './transactions.service';
import { CotiserDto } from './dto/cotiser.dto';
import { WebhookKkiapayDto } from './dto/webhook-kkiapay.dto';
import { FiltrerTransactionsDto } from './dto/filtrer-transactions.dto';
import { PartagerRecuWhatsappDto } from './dto/partager-recu-whatsapp.dto';
import { SimulerTransactionDto } from './dto/simuler-transaction.dto';
export declare class TransactionsController {
    private service;
    constructor(service: TransactionsService);
    cotiser(u: {
        id: string;
    }, dto: CotiserDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            refKKiaPay: string | null;
            tontineId: string | null;
            idempotencyKey: string | null;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            type: import("@prisma/client").$Enums.TypeTransaction;
            statut: import("@prisma/client").$Enums.StatutTransaction;
            montantFcfa: number;
            tentatives: number;
            reference: string;
            montantNetFcfa: number;
            operateur: string | null;
            fraisPlateformeFcfa: number;
            fraisAgentFcfa: number;
            hashPrecedent: string | null;
            hashActuel: string | null;
            motifEchec: string | null;
        };
    } | {
        succes: boolean;
        message: string;
        donnees: {
            transactionId: string;
            reference: string;
            refKKiaPay: string;
            paymentUrl: string;
            montant: number;
            fraisPlateformeFcfa: number;
            montantNetFcfa: number;
            confirme: boolean;
        };
    }>;
    simuler(dto: SimulerTransactionDto): {
        succes: boolean;
        message: string;
        donnees: {
            montantBrut: number;
            fraisOperateur: number;
            fraisPlateforme: number;
            montantNet: number;
            canal: string;
        };
    };
    webhook(req: Request & {
        rawBody?: Buffer;
    }, body: WebhookKkiapayDto, signature: string): Promise<{
        succes: boolean;
        message: string;
    }>;
    historique(u: {
        id: string;
        role: Role;
    }, filtres: FiltrerTransactionsDto, clientId?: string): Promise<{
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
                idempotencyKey: string | null;
                id: string;
                utilisateurId: string;
                creeLe: Date;
                type: import("@prisma/client").$Enums.TypeTransaction;
                statut: import("@prisma/client").$Enums.StatutTransaction;
                montantFcfa: number;
                tentatives: number;
                reference: string;
                montantNetFcfa: number;
                operateur: string | null;
                fraisPlateformeFcfa: number;
                fraisAgentFcfa: number;
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
