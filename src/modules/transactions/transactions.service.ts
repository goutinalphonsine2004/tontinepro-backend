import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { StatutTransaction, TypeTransaction } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { BUSINESS } from '../../common/constants/business.constants';
import { CotiserDto } from './dto/cotiser.dto';
import { WebhookKkiapayDto } from './dto/webhook-kkiapay.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
    private sms: SmsService,
  ) {}

  // ─── POST /transactions/cotiser ───────────────────
  async cotiser(utilisateurId: string, dto: CotiserDto) {
    const [utilisateur, tontine] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } }),
      this.prisma.tontine.findUnique({ where: { id: dto.tontineId } }),
    ]);
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');
    if (!tontine) throw new NotFoundException('Tontine introuvable');

    const telephone = dto.telephone ?? utilisateur.telephone;
    const fraisPlateforme = BUSINESS.calculerFraisPlateforme(dto.montant);
    const montantNet = dto.montant - fraisPlateforme;
    const fraisAgent = utilisateur.collecteurId
      ? BUSINESS.calculerCommissionAgent(dto.montant)
      : 0;

    // Créer transaction EN_ATTENTE
    const transaction = await this.prisma.transaction.create({
      data: {
        montant: dto.montant,
        montantNet,
        type: TypeTransaction.COTISATION,
        fraisPlateforme,
        fraisAgent,
        operateur: dto.operateur,
        tontineId: dto.tontineId,
        utilisateurId,
      },
    });

    // Initier paiement KKiaPay
    const paiement = await this.kkiapay.initierPaiement({
      montant: dto.montant,
      telephone,
      reference: transaction.reference,
      description: `Cotisation tontine ${tontine.nom}`,
      operateur: dto.operateur,
    });

    // Stocker la ref KKiaPay
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { refKKiaPay: paiement.refKKiaPay },
    });

    return {
      succes: true,
      message: 'Paiement initié. Complétez sur votre téléphone.',
      donnees: {
        transactionId: transaction.id,
        reference: transaction.reference,
        refKKiaPay: paiement.refKKiaPay,
        paymentUrl: paiement.paymentUrl,
        montant: dto.montant,
        fraisPlateforme,
        montantNet,
      },
    };
  }

  // ─── POST /transactions/webhook-kkiapay ───────────
  async traiterWebhook(body: WebhookKkiapayDto, rawBody: Buffer, signatureRecue: string) {
    // 1. Vérifier signature HMAC-SHA256
    const signatureValide = this.kkiapay.verifierSignature(rawBody.toString(), signatureRecue ?? '');
    if (!signatureValide) {
      this.logger.warn(`Webhook rejeté — signature invalide: ${signatureRecue}`);
      throw new UnauthorizedException({ message: 'Signature webhook invalide', code: 'SIGNATURE_INVALIDE' });
    }

    this.logger.log(`Webhook KKiaPay: ${body.transactionId} — ${body.status}`);

    // 2. Idempotence — trouver notre transaction
    const transaction = await this.prisma.transaction.findFirst({
      where: { refKKiaPay: body.transactionId },
      include: {
        tontine: true,
        utilisateur: { select: { id: true, telephone: true, nom: true, collecteurId: true } },
      },
    });

    // Webhook pour transaction inconnue → 200 OK (éviter les retentatives KKiaPay)
    if (!transaction) {
      this.logger.warn(`Transaction inconnue pour refKKiaPay: ${body.transactionId}`);
      return { succes: true, message: 'Webhook reçu' };
    }

    // Déjà traitée → idempotence
    if (transaction.statut !== StatutTransaction.EN_ATTENTE) {
      this.logger.log(`Transaction déjà traitée: ${body.transactionId} (${transaction.statut})`);
      return { succes: true, message: 'Transaction déjà traitée' };
    }

    if (body.status === 'SUCCESS') {
      await this.traiterSucces(transaction as any);
    } else {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { statut: StatutTransaction.ECHOUE, motifEchec: body.reason ?? 'Paiement refusé' },
      });
      this.logger.log(`Transaction échouée: ${body.transactionId}`);
    }

    return { succes: true, message: 'Webhook traité avec succès' };
  }

  private async traiterSucces(transaction: any) {
    const fraisPlateforme = BUSINESS.calculerFraisPlateforme(transaction.montant);
    const montantNet = transaction.montant - fraisPlateforme;
    const collecteurId = transaction.utilisateur.collecteurId;
    const fraisAgent = collecteurId ? BUSINESS.calculerCommissionAgent(transaction.montant) : 0;

    // Chaîne de hachage
    const derniereTx = await this.prisma.transaction.findFirst({
      where: { utilisateurId: transaction.utilisateur.id, statut: StatutTransaction.SUCCES },
      orderBy: { creeLe: 'desc' },
      select: { hashActuel: true },
    });
    const hashPrecedent = derniereTx?.hashActuel ?? null;
    const hashActuel = createHash('sha256')
      .update(`${transaction.id}|${transaction.montant}|${transaction.type}|${Date.now()}|${hashPrecedent}`)
      .digest('hex');

    await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { statut: StatutTransaction.SUCCES, montantNet, fraisPlateforme, fraisAgent, hashPrecedent, hashActuel },
      }),
      ...(transaction.tontineId
        ? [this.prisma.tontine.update({
            where: { id: transaction.tontineId },
            data: { soldeActuel: { increment: montantNet } },
          })]
        : []),
      ...(collecteurId && fraisAgent > 0
        ? [
            this.prisma.commission.create({
              data: { agentId: collecteurId, transactionId: transaction.id, montant: fraisAgent, type: 'COTISATION' },
            }),
            this.prisma.utilisateur.update({
              where: { id: collecteurId },
              data: { soldeCommission: { increment: fraisAgent } },
            }),
          ]
        : []),
    ]);

    await this.sms.envoyer(
      transaction.utilisateur.telephone,
      `TontinePro: Cotisation de ${transaction.montant} FCFA reçue ✅. Frais: ${fraisPlateforme} FCFA. Net crédité: ${montantNet} FCFA.`,
    );

    this.logger.log(`Cotisation traitée: ${transaction.montant} FCFA pour ${transaction.utilisateur.nom}`);
  }

  // ─── GET /transactions/historique ─────────────────
  async historique(utilisateurId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { utilisateurId },
      include: { tontine: { select: { id: true, nom: true } } },
      orderBy: { creeLe: 'desc' },
      take: 50,
    });
    return { succes: true, message: `${transactions.length} transaction(s).`, donnees: transactions };
  }

  // ─── GET /transactions/:id/recu ───────────────────
  async recu(transactionId: string, utilisateurId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        utilisateur: { select: { nom: true, telephone: true } },
        tontine: { select: { nom: true } },
      },
    });
    if (!tx) throw new NotFoundException('Transaction introuvable');
    if (tx.utilisateurId !== utilisateurId) throw new UnauthorizedException('Accès refusé');

    return {
      succes: true,
      message: 'Reçu de transaction.',
      donnees: {
        reference: tx.reference,
        date: tx.creeLe,
        type: tx.type,
        statut: tx.statut,
        client: tx.utilisateur.nom,
        telephone: tx.utilisateur.telephone,
        tontine: tx.tontine?.nom ?? 'N/A',
        montant: tx.montant,
        fraisPlateforme: tx.fraisPlateforme,
        montantNet: tx.montantNet,
        operateur: tx.operateur ?? 'N/A',
        refKKiaPay: tx.refKKiaPay ?? 'N/A',
        hashIntegrite: tx.hashActuel ?? 'En attente',
      },
    };
  }
}
