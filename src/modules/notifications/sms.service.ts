import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RetraitsService } from '../retraits/retraits.service';
import { TontinesService } from '../tontines/tontines.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private sms: any | null = null;
  private smsEnabled = false;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => RetraitsService))
    private retraitsService: RetraitsService,
    @Inject(forwardRef(() => TontinesService))
    private tontinesService: TontinesService,
  ) {
    const apiKey = config.get<string>('AT_API_KEY', '').trim();

    // Render (and other envs) may leave AT_API_KEY unset when SMS is not used.
    // AfricasTalking validates apiKey at init time and would crash the whole Nest app.
    if (!apiKey) {
      this.logger.warn('[SMS] AfricasTalking non configuré — SMS désactivés');
      this.smsEnabled = false;
      this.sms = null;
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AfricasTalking = require('africastalking');
    const at = AfricasTalking({
      username: config.get<string>('AT_USERNAME', 'sandbox'),
      apiKey,
    });

    this.smsEnabled = true;
    this.sms = at.SMS;
  }

  async envoyer(telephone: string, message: string): Promise<void> {
    if (!this.smsEnabled || !this.sms) {
      // Don’t throw: keep app booting / running even if SMS credentials are missing.
      this.logger.warn(`[SMS] Non configuré — message non envoyé à ${telephone}`);
      return;
    }

    try {
      await this.sms.send({
        to: [telephone],
        message,
        from: this.config.get<string>('AT_SENDER', 'TontineBénin'),
      });
      this.logger.log(`SMS envoyé à ${telephone}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Échec envoi SMS à ${telephone}: ${message}`);
    }
  }

  async traiterCommande(from: string, text: string): Promise<void> {
    this.logger.log(`Commande SMS reçue de ${from}: "${text}"`);

    // 1. Trouver l'utilisateur
    const utilisateur = await this.prisma.utilisateur.findFirst({
      where: { telephone: from },
    });

    if (!utilisateur) {
      // On ne répond pas aux numéros inconnus pour éviter le spam/frais
      this.logger.warn(`SMS reçu d'un numéro inconnu: ${from}`);
      return;
    }

    const mots = text.trim().toUpperCase().split(/\s+/);
    const commande = mots[0];

    try {
      switch (commande) {
        case 'SOLDE':
          return this.gererCommandeSolde(utilisateur);
        case 'RETRAIT':
          return this.gererCommandeRetrait(utilisateur, mots[1]);
        case 'REJOINDRE':
          return this.gererCommandeRejoindre(utilisateur, mots[1]);
        case 'AIDE':
        default:
          return this.envoyer(
            from,
            'TontineBénin: Commandes valides: SOLDE, RETRAIT [Montant], REJOINDRE [Code], AIDE.',
          );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erreur traitement commande SMS: ${message}`);
      await this.envoyer(from, `TontineBénin: Erreur - ${message}`);
    }
  }

  private async gererCommandeRejoindre(utilisateur: any, code?: string) {
    if (!code) {
      return this.envoyer(
        utilisateur.telephone,
        "TontineBénin: Précisez le code d'invitation. Exemple: REJOINDRE X8Z2P",
      );
    }

    const tontine = await this.prisma.tontine.findUnique({
      where: { codeInvitation: code.toUpperCase() },
    });

    if (!tontine) {
      return this.envoyer(
        utilisateur.telephone,
        "TontineBénin: Code d'invitation invalide.",
      );
    }

    try {
      await this.tontinesService.rejoindre(tontine.id, utilisateur.id, {
        montantCautionFcfa: 0,
      });
      await this.envoyer(
        utilisateur.telephone,
        `TontineBénin: Félicitations ! Vous avez rejoint le groupe '${tontine.nom}'.`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'erreur inconnue';
      await this.envoyer(
        utilisateur.telephone,
        `TontineBénin: Impossible de rejoindre : ${message}`,
      );
    }
  }

  private async gererCommandeSolde(utilisateur: any) {
    const tontines = await this.prisma.tontine.findMany({
      where: { proprietaireId: utilisateur.id, statut: 'ACTIVE' },
      select: { nom: true, soldeActuelFcfa: true },
    });

    if (tontines.length === 0) {
      return this.envoyer(
        utilisateur.telephone,
        "TontineBénin: Vous n'avez aucune tontine active.",
      );
    }

    const total = tontines.reduce((sum, t) => sum + t.soldeActuelFcfa, 0);
    const detail = tontines
      .map((t) => `${t.nom}: ${t.soldeActuelFcfa}F`)
      .join(', ');

    await this.envoyer(
      utilisateur.telephone,
      `TontineBénin: Solde Total: ${total} FCFA. Détails: ${detail}.`,
    );
  }

  private async gererCommandeRetrait(utilisateur: any, montantFcfaStr?: string) {
    if (!montantFcfaStr || isNaN(Number(montantFcfaStr))) {
      return this.envoyer(
        utilisateur.telephone,
        'TontineBénin: Précisez le montantFcfa. Exemple: RETRAIT 5000',
      );
    }

    const montantFcfa = Number(montantFcfaStr);

    // Trouver la tontine avec le solde suffisant (la plus remplie)
    const tontine = await this.prisma.tontine.findFirst({
      where: {
        proprietaireId: utilisateur.id,
        soldeActuelFcfa: { gte: montantFcfa },
        statut: 'ACTIVE',
      },
      orderBy: { soldeActuelFcfa: 'desc' },
    });

    if (!tontine) {
      return this.envoyer(
        utilisateur.telephone,
        `TontineBénin: Solde insuffisant pour retirer ${montantFcfa} FCFA sur vos tontines actives.`,
      );
    }

    await this.envoyer(
      utilisateur.telephone,
      `TontineBénin: Demande de retrait de ${montantFcfa}F sur '${tontine.nom}' reçue.`,
    );

    // Déclencher la logique de retrait réelle (Génération OTP + envoi SMS OTP)
    await this.retraitsService.demanderOtp(utilisateur.id, {
      tontineId: tontine.id,
      montant: montantFcfa,
      telephone: utilisateur.telephone,
    });
  }
}
