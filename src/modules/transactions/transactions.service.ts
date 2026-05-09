import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { StatutCredit, StatutTransaction, TypeTransaction } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { PdfService, RecuTransactionPdf } from '../../common/services/pdf.service';
import { SmsService } from '../notifications/sms.service';
import { WhatsappService } from '../notifications/whatsapp.service';
import { BUSINESS } from '../../common/constants/business.constants';
import { CotiserDto } from './dto/cotiser.dto';
import { WebhookKkiapayDto } from './dto/webhook-kkiapay.dto';
import { FiltrerTransactionsDto } from './dto/filtrer-transactions.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
    private sms: SmsService,
    private pdf: PdfService,
    private whatsapp: WhatsappService,
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

    // ─── VÉRIFICATION PLAFOND CAUTION (INDEPENDANT uniquement) ───
    // Si le client a un collecteur INDEPENDANT, vérifier que sa caution couvre les collectes du mois
    if (utilisateur.collecteurId) {
      const collecteur = await this.prisma.utilisateur.findUnique({
        where: { id: utilisateur.collecteurId },
        select: { id: true, role: true },
      });

      if (collecteur?.role === 'INDEPENDANT') {
        const facturation = await this.prisma.facturationAgent.findFirst({
          where: { agentId: collecteur.id },
        });

        const caution = (facturation as any)?.cautionMontant ?? 0;

        // Calculer le total des collectes de l'agent ce mois-ci
        if (caution > 0) {
          const debutMois = new Date();
          debutMois.setDate(1);
          debutMois.setHours(0, 0, 0, 0);

          const totalMois = await this.prisma.transaction.aggregate({
            where: {
              utilisateur: { collecteurId: collecteur.id },
              type: TypeTransaction.COTISATION,
              statut: StatutTransaction.SUCCES,
              creeLe: { gte: debutMois },
            },
            _sum: { montant: true },
          });

          const collecteMois = (totalMois._sum.montant ?? 0) + dto.montant;
          const pourcentage = (collecteMois / caution) * 100;

          // Blocage à 100% de la caution
          if (collecteMois >= caution) {
            throw new ForbiddenException({
              message: `Plafond de caution atteint pour ce collecteur (${caution.toLocaleString()} FCFA/mois). Le client doit payer directement via Mobile Money.`,
              code: 'PLAFOND_CAUTION_ATTEINT',
              donnees: { caution, collecteMois: collecteMois - dto.montant, pourcentage: Math.round(pourcentage) },
            });
          }

          // Alerte automatique à 80%
          if (pourcentage >= 80) {
            this.logger.warn(
              `[CAUTION] Collecteur ${collecteur.id} à ${Math.round(pourcentage)}% de sa caution (${collecteMois.toLocaleString()}/${caution.toLocaleString()} FCFA)`,
            );
            // Créer une alerte si pas déjà existante
            const alerteExistante = await this.prisma.alerteSysteme.findFirst({
              where: {
                type: 'SEUIL_CAUTION',
                resourceType: 'UTILISATEUR',
                resourceId: collecteur.id,
                statut: 'OUVERTE',
              },
            });
            if (!alerteExistante) {
              await this.prisma.alerteSysteme.create({
                data: {
                  type: 'SEUIL_CAUTION',
                  severite: 'AVERTISSEMENT',
                  statut: 'OUVERTE',
                  titre: `Collecteur indépendant à ${Math.round(pourcentage)}% de sa caution`,
                  message: `Le collecteur ${collecteur.id} a atteint ${Math.round(pourcentage)}% de sa caution mensuelle (${collecteMois.toLocaleString()} / ${caution.toLocaleString()} FCFA). Blocage automatique à 100%.`,
                  resourceType: 'UTILISATEUR',
                  resourceId: collecteur.id,
                  metadata: JSON.stringify({ caution, collecteMois, pourcentage: Math.round(pourcentage) }),
                },
              });
            }
          }
        }
      }
    }
    // ─────────────────────────────────────────────────

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
      const remboursementTraite = await this.traiterWebhookRemboursement(body);
      if (remboursementTraite) {
        return { succes: true, message: 'Webhook remboursement traité' };
      }

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

      // ─── CIRCUIT BREAKER ───────────────────────────
      // Si 10+ transactions échouées en <60s sur ce compte → suspension + alerte
      const FENETRE_MS = 60_000;
      const SEUIL_ECHECS = 10;
      const depuis = new Date(Date.now() - FENETRE_MS);

      const nbEchouees = await this.prisma.transaction.count({
        where: {
          utilisateurId: transaction.utilisateur.id,
          statut: StatutTransaction.ECHOUE,
          creeLe: { gte: depuis },
        },
      });

      if (nbEchouees >= SEUIL_ECHECS) {
        this.logger.error(
          `[CIRCUIT BREAKER] Compte ${transaction.utilisateur.id} — ${nbEchouees} échecs en <60s → SUSPENSION`,
        );

        // Suspendre le compte
        await this.prisma.utilisateur.update({
          where: { id: transaction.utilisateur.id },
          data: { statut: 'SUSPENDU' as any },
        });

        // Créer alerte CRITIQUE
        await this.prisma.alerteSysteme.create({
          data: {
            type: 'CIRCUIT_BREAKER',
            severite: 'CRITIQUE',
            statut: 'OUVERTE',
            titre: `Circuit breaker déclenché — ${transaction.utilisateur.nom}`,
            message: `${nbEchouees} transactions échouées en moins d'une minute sur le compte ${transaction.utilisateur.telephone}. Compte suspendu automatiquement.`,
            resourceType: 'UTILISATEUR',
            resourceId: transaction.utilisateur.id,
            metadata: JSON.stringify({
              nbEchouees,
              fenetreMs: FENETRE_MS,
              telephone: transaction.utilisateur.telephone,
              declencheLe: new Date().toISOString(),
            }),
          },
        });
      }
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
      `TontineBénin: Cotisation de ${transaction.montant} FCFA reçue ✅. Frais: ${fraisPlateforme} FCFA. Net crédité: ${montantNet} FCFA.`,
    );

    this.logger.log(`Cotisation traitée: ${transaction.montant} FCFA pour ${transaction.utilisateur.nom}`);
  }

  private async traiterWebhookRemboursement(body: WebhookKkiapayDto) {
    const remboursement = await this.prisma.remboursementCredit.findFirst({
      where: { refKKiaPay: body.transactionId },
      include: {
        microCredit: {
          include: {
            client: { select: { id: true, nom: true, telephone: true, collecteurId: true } },
          },
        },
      },
    });

    if (!remboursement) return false;

    if (remboursement.statut !== 'EN_ATTENTE') {
      this.logger.log(`Remboursement déjà traité: ${body.transactionId} (${remboursement.statut})`);
      return true;
    }

    if (body.status === 'SUCCESS') {
      await this.confirmerRemboursementSucces(remboursement as any);
      return true;
    }

    await this.confirmerRemboursementEchec(remboursement as any, body.reason ?? 'Paiement refusé');
    return true;
  }

  private async confirmerRemboursementSucces(remboursement: any) {
    const credit = remboursement.microCredit;
    const montantRestant = Math.max(0, credit.montantRestant - remboursement.montant);
    const joursPayes = credit.joursPayes + 1;
    const termine = montantRestant <= 0;

    await this.prisma.$transaction([
      this.prisma.remboursementCredit.update({
        where: { id: remboursement.id },
        data: { statut: 'SUCCES' },
      }),
      this.prisma.microCredit.update({
        where: { id: credit.id },
        data: {
          joursPayes,
          montantRestant,
          statut: termine ? StatutCredit.TERMINE : StatutCredit.ACTIF,
          ...(termine && { termineLe: new Date() }),
        },
      }),
    ]);

    if (termine) {
      await this.sms.envoyer(
        credit.client.telephone,
        `TontineBénin: Bravo ${credit.client.nom} ! Votre micro-crédit de ${credit.montantPrincipal} FCFA est entièrement remboursé. Votre score de crédit va augmenter.`,
      );
      this.logger.log(`[Webhook remboursement] Crédit terminé: ${credit.id} — ${credit.client.nom}`);
      return;
    }

    await this.sms.envoyer(
      credit.client.telephone,
      `TontineBénin: Prélèvement ${remboursement.montant} FCFA confirmé. Restant: ${montantRestant} FCFA (${joursPayes}/${credit.totalJours} jours).`,
    );
  }

  private async confirmerRemboursementEchec(remboursement: any, motif: string) {
    const credit = remboursement.microCredit;

    await this.prisma.remboursementCredit.update({
      where: { id: remboursement.id },
      data: { statut: 'ECHEC' },
    });

    const echecsRecents = await this.prisma.remboursementCredit.findMany({
      where: { microCreditId: credit.id, statut: 'ECHEC' },
      orderBy: { payeLe: 'desc' },
      take: 3,
    });

    if (echecsRecents.length === 3) {
      await this.prisma.microCredit.update({
        where: { id: credit.id },
        data: { statut: StatutCredit.EN_DEFAUT },
      });
      this.logger.warn(`[Webhook remboursement] Crédit en défaut: ${credit.id} — ${credit.client.nom}`);
    }

    await this.sms.envoyer(
      credit.client.telephone,
      `TontineBénin: Prélèvement micro-crédit échoué (${motif}). Assurez-vous d'avoir ${remboursement.montant} FCFA sur votre compte Mobile Money.`,
    );

    if (!credit.client.collecteurId) return;

    const collecteur = await this.prisma.utilisateur.findUnique({
      where: { id: credit.client.collecteurId },
      select: { telephone: true },
    });
    if (collecteur) {
      await this.sms.envoyer(
        collecteur.telephone,
        `TontineBénin: Alerte remboursement échoué pour ${credit.client.nom}. Crédit: ${credit.montantPrincipal} FCFA.`,
      );
    }
  }

  // ─── GET /transactions/historique ─────────────────
  async historique(utilisateurId: string, filtres: FiltrerTransactionsDto) {
    const page = filtres.page ?? 1;
    const limite = Math.min(filtres.limite ?? 20, 100);
    const skip = (page - 1) * limite;

    const where: Record<string, unknown> = { utilisateurId };
    if (filtres.type) where.type = filtres.type;
    if (filtres.statut) where.statut = filtres.statut;
    if (filtres.tontineId) where.tontineId = filtres.tontineId;
    if (filtres.dateDebut || filtres.dateFin) {
      where.creeLe = {
        ...(filtres.dateDebut && { gte: new Date(filtres.dateDebut) }),
        ...(filtres.dateFin && { lte: this.finDeJournee(filtres.dateFin) }),
      };
    }

    const [total, transactions] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        include: { tontine: { select: { id: true, nom: true } } },
        orderBy: { creeLe: 'desc' },
        skip,
        take: limite,
      }),
    ]);

    return {
      succes: true,
      message: `${total} transaction(s).`,
      donnees: { transactions, total, page, limite, pages: Math.ceil(total / limite) },
    };
  }

  // ─── GET /transactions/:id/recu ───────────────────
  async recu(transactionId: string, utilisateurId: string) {
    const recu = await this.donneesRecu(transactionId, utilisateurId);
    return {
      succes: true,
      message: 'Reçu de transaction.',
      donnees: recu,
    };
  }

  async recuPdf(transactionId: string, utilisateurId: string) {
    const recu = await this.donneesRecu(transactionId, utilisateurId);
    const buffer = await this.pdf.genererRecuTransaction(recu);
    return { buffer, filename: `recu-${recu.reference}.pdf` };
  }

  async partagerRecuWhatsapp(transactionId: string, utilisateurId: string, telephone?: string) {
    const recu = await this.donneesRecu(transactionId, utilisateurId);
    const destinataire = telephone ?? recu.telephone;
    const message = [
      'TontineBenin - Recu de transaction',
      `Reference: ${recu.reference}`,
      `Date: ${recu.date.toLocaleString('fr-FR')}`,
      `Client: ${recu.client}`,
      `Tontine: ${recu.tontine}`,
      `Type: ${recu.type}`,
      `Statut: ${recu.statut}`,
      `Montant: ${recu.montant.toLocaleString('fr-FR')} FCFA`,
      `Frais: ${recu.fraisPlateforme.toLocaleString('fr-FR')} FCFA`,
      `Net: ${recu.montantNet.toLocaleString('fr-FR')} FCFA`,
      `Ref KKiaPay: ${recu.refKKiaPay}`,
    ].join('\n');

    const resultat = await this.whatsapp.envoyerMessage(destinataire, message);
    return {
      succes: resultat.success,
      message: resultat.success ? 'Reçu partagé via WhatsApp.' : 'Échec du partage WhatsApp.',
      donnees: { destinataire, resultat },
    };
  }

  private async donneesRecu(transactionId: string, utilisateurId: string): Promise<RecuTransactionPdf> {
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
    };
  }

  private finDeJournee(date: string) {
    const fin = new Date(date);
    fin.setHours(23, 59, 59, 999);
    return fin;
  }
}
