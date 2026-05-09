import { StatutTransaction, TypeTransaction } from '@prisma/client';
export declare class FiltrerTransactionsDto {
    type?: TypeTransaction;
    statut?: StatutTransaction;
    tontineId?: string;
    dateDebut?: string;
    dateFin?: string;
    page?: number;
    limite?: number;
}
