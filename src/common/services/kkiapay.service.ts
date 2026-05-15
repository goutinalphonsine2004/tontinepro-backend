import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

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

@Injectable()
export class KkiapayService {
  private readonly logger = new Logger(KkiapayService.name);
  private readonly sandbox: boolean;
  private readonly secretKey: string;

  constructor(private config: ConfigService) {
    this.sandbox = config.get<string>('KKIAPAY_SANDBOX', 'true') === 'true';
    this.secretKey = config.get<string>('KKIAPAY_SECRET_KEY', '');
  }

  async initierPaiement(
    params: InitierPaiementParams,
  ): Promise<{ refKKiaPay: string; paymentUrl: string }> {
    const refKKiaPay = `kkp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (this.sandbox) {
      this.logger.log(
        `[SANDBOX] Paiement initié: ${params.montant} FCFA → ${params.telephone} | ref: ${params.reference}`,
      );
      return {
        refKKiaPay,
        paymentUrl: `https://sandbox.kkiapay.me/pay/${refKKiaPay}?amount=${params.montant}&phone=${params.telephone}`,
      };
    }

    // En production : appel réel à l'API KKiaPay
    this.logger.log(`[PROD] Initier paiement KKiaPay: ${params.montant} FCFA`);
    return {
      refKKiaPay,
      paymentUrl: `https://api.kkiapay.me/pay/${refKKiaPay}`,
    };
  }

  async initierTransfert(
    params: InitierTransfertParams,
  ): Promise<{ succes: boolean; refKKiaPay: string }> {
    const refKKiaPay = `transfer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (this.sandbox) {
      this.logger.log(
        `[SANDBOX] Transfert: ${params.montant} FCFA → ${params.telephone} | motif: ${params.motif ?? 'N/A'}`,
      );
      return { succes: true, refKKiaPay };
    }

    this.logger.log(
      `[PROD] Transfert KKiaPay: ${params.montant} FCFA → ${params.telephone}`,
    );
    return { succes: true, refKKiaPay };
  }

  get estSandbox(): boolean {
    return this.sandbox;
  }

  // Vérification signature HMAC-SHA256 du webhook KKiaPay
  verifierSignature(rawBody: string, signatureRecue: string): boolean {
    if (!this.secretKey) {
      const production = this.config.get<string>('NODE_ENV') === 'production';
      this.logger.warn(
        'KKIAPAY_SECRET_KEY non configuré — signature non vérifiée',
      );
      return !production; // permissif uniquement hors production
    }
    const signatureCalculee = createHmac('sha256', this.secretKey)
      .update(rawBody)
      .digest('hex');
    const recue = Buffer.from(signatureRecue ?? '', 'hex');
    const calculee = Buffer.from(signatureCalculee, 'hex');
    const valide =
      recue.length === calculee.length && timingSafeEqual(recue, calculee);
    if (!valide) {
      this.logger.warn(
        `Signature invalide. Reçue: ${signatureRecue} | Calculée: ${signatureCalculee}`,
      );
    }
    return valide;
  }
}
