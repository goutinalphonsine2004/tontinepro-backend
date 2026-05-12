import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatutCredit } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { BUSINESS } from '../../common/constants/business.constants';
import { DemanderCreditDto } from './dto/demander-credit.dto';
import { ConfirmerPinDto } from './dto/confirmer-pin.dto';
import { ConsentementSmsDto } from './dto/consentement-sms.dto';
import { RefuserCreditDto } from './dto/refuser-credit.dto';

const DUREE_CONSENTEMENT_MIN = 30;
const DUREE_CREDIT_JOURS = 30;

@Injectable()
export class MicroCreditsService {
  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
    private sms: SmsService,
  ) {}

  // ─── GET /micro-credits/mon-eligibilite ───────────
  async monEligibilite(clientId: string) {
    const scoreCredit = await this.prisma.scoreCredit.findUnique({
      where: { utilisateurId: clientId },
    });

    const score = scoreCredit?.score ?? 0;
    const eligible = score >= BUSINESS.SEUIL_SCORE_MICRO_CREDIT;
    const plafond = BUSINESS.getPlafondMicroCredit(score);
    const montantTotal = eligible ? BUSINESS.calculerMontantTotal(plafond) : 0;
    const paiementJournalier = eligible
      ? BUSINESS.calculerPaiementJournalier(montantTotal, DUREE_CREDIT_JOURS)
      : 0;

    // Vérifier si crédit en cours
    const creditActif = await this.prisma.microCredit.findFirst({
      where: { clientId, statut: StatutCredit.ACTIF },
    });

    return {
      succes: true,
      message: eligible
        ? 'Vous êtes éligible au micro-crédit.'
        : 'Score insuffisant pour un micro-crédit.',
      donnees: {
        score,
        eligible,
        plafondMaximum: plafond,
        tauxInteret: `${BUSINESS.TAUX_INTERET_MICRO_CREDIT * 100}%`,
        dureeJours: DUREE_CREDIT_JOURS,
        exempleCalcul: eligible
          ? {
              montantPrincipal: plafond,
              interet: BUSINESS.calculerInteretMicroCredit(plafond),
              montantTotal,
              paiementJournalier,
            }
          : null,
        scoreRequis: BUSINESS.SEUIL_SCORE_MICRO_CREDIT,
        creditActifEnCours: !!creditActif,
      },
    };
  }

  // ─── POST /micro-credits/demander ─────────────────
  async demander(clientId: string, dto: DemanderCreditDto) {
    const [client, scoreCredit] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { id: clientId } }),
      this.prisma.scoreCredit.findUnique({
        where: { utilisateurId: clientId },
      }),
    ]);
    if (!client) throw new NotFoundException('Client introuvable');

    const score = scoreCredit?.score ?? 0;

    // Vérifier éligibilité
    if (score < BUSINESS.SEUIL_SCORE_MICRO_CREDIT) {
      throw new BadRequestException({
        message: `Score insuffisant pour un micro-crédit. Score actuel: ${score}, requis: ${BUSINESS.SEUIL_SCORE_MICRO_CREDIT}`,
        code: 'SCORE_INSUFFISANT',
        scoreActuel: score,
        scoreRequis: BUSINESS.SEUIL_SCORE_MICRO_CREDIT,
      });
    }

    // Vérifier pas de crédit ACTIF en cours
    const creditActif = await this.prisma.microCredit.findFirst({
      where: { clientId, statut: StatutCredit.ACTIF },
    });
    if (creditActif) {
      throw new BadRequestException({
        message: 'Vous avez déjà un micro-crédit actif en cours.',
        code: 'CREDIT_EN_COURS',
      });
    }

    // Vérifier plafond
    const plafond = BUSINESS.getPlafondMicroCredit(score);
    if (dto.montantPrincipal > plafond) {
      throw new BadRequestException({
        message: `Montant demandé (${dto.montantPrincipal} FCFA) dépasse votre plafond (${plafond} FCFA).`,
        code: 'MONTANT_DEPASSE_PLAFOND',
        plafond,
      });
    }

    const montantTotal = BUSINESS.calculerMontantTotal(dto.montantPrincipal);
    const paiementJournalier = BUSINESS.calculerPaiementJournalier(
      montantTotal,
      DUREE_CREDIT_JOURS,
    );
    const dateEcheance = new Date(
      Date.now() + DUREE_CREDIT_JOURS * 24 * 60 * 60 * 1000,
    );
    const methode = dto.methodeConsentement ?? 'SMARTPHONE';

    const credit = await this.prisma.microCredit.create({
      data: {
        clientId,
        montantPrincipal: dto.montantPrincipal,
        tauxInteret: BUSINESS.TAUX_INTERET_MICRO_CREDIT,
        montantTotal,
        paiementJournalier,
        totalJours: DUREE_CREDIT_JOURS,
        montantRestant: montantTotal,
        scoreAuMoment: score,
        initiePar: clientId,
        methodeConsentement: methode,
        consentementObtenu: false,
        dateEcheance,
      },
    });

    if (methode === 'SMS') {
      const telephone = dto.telephone ?? client.telephone;
      await this.sms.envoyer(
        telephone,
        `TontineBénin: Votre collecteur vous propose un micro-crédit de ${dto.montantPrincipal} FCFA (remb. ${paiementJournalier} FCFA/jour pendant 30j). Répondez 1 pour ACCEPTER ou 2 pour REFUSER. Offre valable ${DUREE_CONSENTEMENT_MIN} minutes.`,
      );
    }

    return {
      succes: true,
      message:
        methode === 'SMS'
          ? 'Demande créée. SMS de consentement envoyé au client.'
          : 'Demande créée. Confirmez avec votre PIN.',
      donnees: {
        creditId: credit.id,
        montantPrincipal: dto.montantPrincipal,
        montantTotal,
        paiementJournalier,
        tauxInteret: `${BUSINESS.TAUX_INTERET_MICRO_CREDIT * 100}%`,
        methodeConsentement: methode,
        dateEcheance,
      },
    };
  }

  // ─── POST /micro-credits/consentement-sms ─────────
  async consentementSms(dto: ConsentementSmsDto) {
    // Normaliser le numéro (AT peut envoyer sans +)
    const telephone = dto.from.startsWith('+') ? dto.from : `+${dto.from}`;

    const client = await this.prisma.utilisateur.findUnique({
      where: { telephone },
    });
    if (!client) {
      return { succes: true, message: 'Numéro inconnu — ignoré' };
    }

    const credit = await this.prisma.microCredit.findFirst({
      where: {
        clientId: client.id,
        statut: StatutCredit.EN_ATTENTE,
        methodeConsentement: 'SMS',
        consentementObtenu: false,
      },
      orderBy: { creeLe: 'desc' },
    });

    if (!credit) {
      return {
        succes: true,
        message: 'Aucune demande en attente de consentement',
      };
    }

    // Vérifier délai 30 minutes
    const delaiExpire =
      Date.now() - credit.creeLe.getTime() > DUREE_CONSENTEMENT_MIN * 60 * 1000;

    if (delaiExpire) {
      await this.prisma.microCredit.update({
        where: { id: credit.id },
        data: { statut: StatutCredit.EXPIRE },
      });
      return {
        succes: true,
        message: 'Délai de consentement expiré — demande annulée',
      };
    }

    const reponse = dto.text.trim();

    if (reponse === '1') {
      await this.prisma.microCredit.update({
        where: { id: credit.id },
        data: { consentementObtenu: true, consentementObtenuLe: new Date() },
      });
      await this.sms.envoyer(
        telephone,
        "TontineBénin: Consentement reçu ✅. Votre dossier est transmis à l'administration pour validation.",
      );
      return { succes: true, message: 'Consentement enregistré.' };
    }

    if (reponse === '2') {
      await this.prisma.microCredit.update({
        where: { id: credit.id },
        data: { statut: StatutCredit.REFUSE },
      });
      await this.sms.envoyer(
        telephone,
        'TontineBénin: Vous avez refusé le micro-crédit. Aucun prélèvement ne sera effectué.',
      );
      return { succes: true, message: 'Crédit refusé par le client.' };
    }

    return { succes: true, message: 'Réponse non reconnue — ignorée' };
  }

  // ─── POST /micro-credits/:id/confirmer-pin ────────
  async confirmerPin(creditId: string, clientId: string, dto: ConfirmerPinDto) {
    const [credit, client] = await Promise.all([
      this.prisma.microCredit.findUnique({ where: { id: creditId } }),
      this.prisma.utilisateur.findUnique({ where: { id: clientId } }),
    ]);

    if (!credit) throw new NotFoundException('Micro-crédit introuvable');
    if (credit.clientId !== clientId)
      throw new ForbiddenException('Accès refusé');
    if (credit.statut !== StatutCredit.EN_ATTENTE) {
      throw new BadRequestException({
        message: 'Ce crédit ne peut plus être confirmé',
        code: 'STATUT_INVALIDE',
      });
    }
    if (credit.consentementObtenu) {
      throw new BadRequestException({
        message: 'Consentement déjà donné',
        code: 'DEJA_CONSENTI',
      });
    }
    if (!client?.pinHash) throw new BadRequestException('PIN non configuré');

    const pinValide = await bcrypt.compare(dto.pin, client.pinHash);
    if (!pinValide) {
      throw new BadRequestException({
        message: 'PIN incorrect',
        code: 'PIN_INCORRECT',
      });
    }

    await this.prisma.microCredit.update({
      where: { id: creditId },
      data: { consentementObtenu: true, consentementObtenuLe: new Date() },
    });

    return {
      succes: true,
      message:
        "Consentement confirmé avec PIN. Dossier transmis à l'administration.",
    };
  }

  // ─── GET /micro-credits/en-attente (Admin) ────────
  async enAttente() {
    const credits = await this.prisma.microCredit.findMany({
      where: { statut: StatutCredit.EN_ATTENTE, consentementObtenu: true },
      include: {
        client: {
          select: { id: true, nom: true, telephone: true, kycVerifie: true },
        },
      },
      orderBy: { creeLe: 'asc' },
    });
    return {
      succes: true,
      message: `${credits.length} crédit(s) en attente de validation.`,
      donnees: credits,
    };
  }

  // ─── PUT /micro-credits/:id/valider (Admin) ───────
  async valider(creditId: string, adminId: string) {
    const credit = await this.prisma.microCredit.findUnique({
      where: { id: creditId },
      include: { client: { select: { id: true, nom: true, telephone: true } } },
    });
    if (!credit) throw new NotFoundException('Micro-crédit introuvable');

    if (!credit.consentementObtenu) {
      throw new BadRequestException({
        message: 'Impossible de valider : consentement du client non obtenu',
        code: 'CONSENTEMENT_MANQUANT',
      });
    }
    if (credit.statut !== StatutCredit.EN_ATTENTE) {
      throw new BadRequestException({
        message: "Ce crédit n'est plus en attente",
        code: 'STATUT_INVALIDE',
      });
    }

    // Décaissement via KKiaPay
    const transfert = await this.kkiapay.initierTransfert({
      montant: credit.montantPrincipal,
      telephone: credit.client.telephone,
      reference: `credit_${creditId}`,
      motif: `Micro-crédit TontineBénin — ${credit.montantPrincipal} FCFA`,
    });

    if (!transfert.succes) {
      throw new BadRequestException({
        message: 'Échec du décaissement KKiaPay',
        code: 'DECAISSEMENT_ECHOUE',
      });
    }

    await this.prisma.microCredit.update({
      where: { id: creditId },
      data: { statut: StatutCredit.ACTIF, decaisseLE: new Date() },
    });

    await this.sms.envoyer(
      credit.client.telephone,
      `TontineBénin: Votre micro-crédit de ${credit.montantPrincipal} FCFA a été débloqué sur votre Mobile Money ✅. Remboursement: ${credit.paiementJournalier} FCFA/jour pendant 30 jours.`,
    );

    return {
      succes: true,
      message: `Micro-crédit de ${credit.montantPrincipal} FCFA décaissé vers ${credit.client.nom}.`,
      donnees: {
        creditId,
        refKKiaPay: transfert.refKKiaPay,
        montantDecaisse: credit.montantPrincipal,
      },
    };
  }

  // ─── PUT /micro-credits/:id/refuser (Admin) ───────
  async refuser(creditId: string, _adminId: string, dto: RefuserCreditDto) {
    const credit = await this.prisma.microCredit.findUnique({
      where: { id: creditId },
      include: { client: { select: { telephone: true } } },
    });
    if (!credit) throw new NotFoundException('Micro-crédit introuvable');
    if (credit.statut !== StatutCredit.EN_ATTENTE) {
      throw new BadRequestException({
        message: 'Ce crédit ne peut plus être refusé',
        code: 'STATUT_INVALIDE',
      });
    }

    await this.prisma.microCredit.update({
      where: { id: creditId },
      data: { statut: StatutCredit.REFUSE },
    });

    await this.sms.envoyer(
      credit.client.telephone,
      `TontineBénin: Votre demande de micro-crédit a été refusée. Motif: ${dto.motif}. Continuez à épargner pour améliorer votre score.`,
    );

    return { succes: true, message: 'Micro-crédit refusé. Client notifié.' };
  }

  // ─── GET /micro-credits/mes-credits ───────────────
  async mesCredits(clientId: string) {
    const credits = await this.prisma.microCredit.findMany({
      where: { clientId },
      include: { _count: { select: { remboursements: true } } },
      orderBy: { creeLe: 'desc' },
    });
    return {
      succes: true,
      message: `${credits.length} crédit(s).`,
      donnees: credits,
    };
  }

  // ─── GET /micro-credits/:id/remboursements ────────
  async remboursements(creditId: string, clientId: string) {
    const credit = await this.prisma.microCredit.findUnique({
      where: { id: creditId },
    });
    if (!credit) throw new NotFoundException('Micro-crédit introuvable');
    if (credit.clientId !== clientId)
      throw new ForbiddenException('Accès refusé');

    const rembList = await this.prisma.remboursementCredit.findMany({
      where: { microCreditId: creditId },
      orderBy: { payeLe: 'desc' },
    });

    const totalPaye = rembList
      .filter((r) => r.statut === 'SUCCES')
      .reduce((s, r) => s + r.montant, 0);

    return {
      succes: true,
      message: `${rembList.length} remboursement(s). Total payé: ${totalPaye} FCFA.`,
      donnees: {
        credit: {
          montantTotal: credit.montantTotal,
          montantRestant: credit.montantRestant,
          joursPayes: credit.joursPayes,
          totalJours: credit.totalJours,
          paiementJournalier: credit.paiementJournalier,
          statut: credit.statut,
        },
        remboursements: rembList,
      },
    };
  }
}
