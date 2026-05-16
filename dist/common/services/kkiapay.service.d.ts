import { ConfigService } from '@nestjs/config';
export interface InitierPaiementParams {
    montant: number;
    telephone: string;
    reference: string;
    description: string;
    operateur?: string;
}
export interface InitierTransfertParams {
    montant: number;
    telephone: string;
    reference: string;
    motif?: string;
}
export declare class KkiapayService {
    private config;
    private readonly logger;
    private readonly sandbox;
    private readonly secretKey;
    constructor(config: ConfigService);
    initierPaiement(params: InitierPaiementParams): {
        refKKiaPay: string;
        paymentUrl: string;
    };
    initierTransfert(params: InitierTransfertParams): {
        succes: boolean;
        refKKiaPay: string;
    };
    get estSandbox(): boolean;
    verifierSignature(rawBody: string, signatureRecue: string): boolean;
}
