import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RetraitsService } from '../retraits/retraits.service';
import { TontinesService } from '../tontines/tontines.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sms: any;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => RetraitsService))
    private retraitsService: RetraitsService,
    @Inject(forwardRef(() => TontinesService))
    private tontinesService: TontinesService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AfricasTalking = require('africastalking');
    const at = AfricasTalking({
      username: config.get<string>('AT_USERNAME', 'sandbox'),
      apiKey: config.get<string>('AT_API_KEY', ''),
    });
    this.sms = at.SMS;
  }

  async envoyer(telephone: string, message: string): Promise<void> {
    try {
      await this.sms.send({
        to: [telephone],
        message,
        from: this.config.get<string>('AT_SENDER', 'TontinePro'),
      });
      this.logger.log(`SMS envoyé à ${telephone}`);
    } catch (error) {
      this.logger.error(`Échec envoi SMS à ${telephone}: ${error.message}`);
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
            "TontinePro: Commandes valides: SOLDE, RETRAIT [Montant], REJOINDRE [Code], AIDE.",
          );
      }
    } catch (error) {
      this.logger.error(`Erreur traitement commande SMS: ${error.message}`);
      await this.envoyer(from, `TontinePro: Erreur - ${error.message}`);
    }
  }

  private async gererCommandeRejoindre(utilisateur: any, code?: string) {
    if (!code) {
      return this.envoyer(utilisateur.telephone, "TontinePro: Précisez le code d'invitation. Exemple: REJOINDRE X8Z2P");
    }

    const tontine = await this.prisma.tontine.findUnique({
      where: { codeInvitation: code.toUpperCase() },
    });

    if (!tontine) {
      return this.envoyer(utilisateur.telephone, "TontinePro: Code d'invitation invalide.");
    }

    try {
      await this.tontinesService.rejoindre(tontine.id, utilisateur.id, { montantCaution: 0 });
      await this.envoyer(
        utilisateur.telephone,
        `TontinePro: Félicitations ! Vous avez rejoint le groupe '${tontine.nom}'.`,
      );
    } catch (err) {
      await this.envoyer(utilisateur.telephone, `TontinePro: Impossible de rejoindre : ${err.message}`);
    }
  }

  private async gererCommandeSolde(utilisateur: any) {
    const tontines = await this.prisma.tontine.findMany({
      where: { proprietaireId: utilisateur.id, statut: 'ACTIVE' },
      select: { nom: true, soldeActuel: true },
    });

    if (tontines.length === 0) {
      return this.envoyer(utilisateur.telephone, "TontinePro: Vous n'avez aucune tontine active.");
    }

    const total = tontines.reduce((sum, t) => sum + t.soldeActuel, 0);
    const detail = tontines.map(t => `${t.nom}: ${t.soldeActuel}F`).join(', ');
    
    await this.envoyer(
      utilisateur.telephone,
      `TontinePro: Solde Total: ${total} FCFA. Détails: ${detail}.`,
    );
  }

  private async gererCommandeRetrait(utilisateur: any, montantStr?: string) {
    if (!montantStr || isNaN(Number(montantStr))) {
      return this.envoyer(
        utilisateur.telephone,
        "TontinePro: Précisez le montant. Exemple: RETRAIT 5000",
      );
    }

    const montant = Number(montantStr);
    
    // Trouver la tontine avec le solde suffisant (la plus remplie)
    const tontine = await this.prisma.tontine.findFirst({
      where: { proprietaireId: utilisateur.id, soldeActuel: { gte: montant }, statut: 'ACTIVE' },
      orderBy: { soldeActuel: 'desc' },
    });

    if (!tontine) {
      return this.envoyer(
        utilisateur.telephone,
        `TontinePro: Solde insuffisant pour retirer ${montant} FCFA sur vos tontines actives.`,
      );
    }

    await this.envoyer(
      utilisateur.telephone,
      `TontinePro: Demande de retrait de ${montant}F sur '${tontine.nom}' reçue.`,
    );

    // Déclencher la logique de retrait réelle (Génération OTP + envoi SMS OTP)
    await this.retraitsService.demanderOtp(utilisateur.id, {
      tontineId: tontine.id,
      montant: montant,
      telephone: utilisateur.telephone,
    });
  }
}
