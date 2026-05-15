import { Injectable, NotFoundException } from '@nestjs/common';
import { StatutTransaction, TypeTransaction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BUSINESS } from '../../common/constants/business.constants';

@Injectable()
export class ScoreService {
  constructor(private prisma: PrismaService) {}

  // ─── GET /score/mon-score ─────────────────────────
  async monScore(clientId: string) {
    const [scoreCredit, utilisateur] = await Promise.all([
      this.prisma.scoreCredit.findUnique({
        where: { utilisateurId: clientId },
      }),
      this.prisma.utilisateur.findUnique({
        where: { id: clientId },
        select: {
          creeLe: true,
          tontines: { select: { soldeActuelFcfa: true, objectifMontantFcfa: true } },
        },
      }),
    ]);

    const score = scoreCredit?.score ?? 0;
    const plafond = BUSINESS.getPlafondMicroCredit(score);
    const ancienneteEnMois = scoreCredit?.totalMois ?? 0;
    const bonusObjectif = utilisateur?.tontines.some(
      (t) => t.objectifMontantFcfa && t.soldeActuelFcfa >= t.objectifMontantFcfa,
    )
      ? 1
      : 0;

    return {
      succes: true,
      message: 'Score de crédit récupéré.',
      donnees: {
        score,
        composantes: {
          tauxRegularite: scoreCredit?.tauxRegularite ?? 0,
          pointsRegularite: Math.round((scoreCredit?.tauxRegularite ?? 0) * 40),
          ancienneteEnMois,
          pointsAnciennete: Math.min(ancienneteEnMois * 2, 20),
          scoreRemboursement: scoreCredit?.scoreRemboursement ?? 1,
          pointsRemboursement: Math.round(
            (scoreCredit?.scoreRemboursement ?? 1) * 30,
          ),
          bonusObjectif,
          pointsBonus: bonusObjectif * 10,
        },
        eligibleMicroCredit: scoreCredit?.eligibleMicroCredit ?? false,
        eligiblePADME: scoreCredit?.eligiblePADME ?? false,
        plafondDisponible: plafond,
        seuilMicroCredit: BUSINESS.SEUIL_SCORE_MICRO_CREDIT,
        seuilPADME: BUSINESS.SEUIL_SCORE_PADME,
        dernierCalcul: scoreCredit?.dernierCalcul ?? null,
      },
    };
  }

  // ─── GET /score/evolution ─────────────────────────
  async evolution(clientId: string) {
    const sixMoisDate = new Date();
    sixMoisDate.setMonth(sixMoisDate.getMonth() - 5);
    sixMoisDate.setDate(1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        utilisateurId: clientId,
        type: TypeTransaction.COTISATION,
        statut: StatutTransaction.SUCCES,
        creeLe: { gte: sixMoisDate },
      },
      select: { creeLe: true },
    });

    const parMois: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      parMois[key] = 0;
    }
    for (const tx of transactions) {
      const key = `${tx.creeLe.getFullYear()}-${String(tx.creeLe.getMonth() + 1).padStart(2, '0')}`;
      if (parMois[key] !== undefined) parMois[key]++;
    }

    const scoreCredit = await this.prisma.scoreCredit.findUnique({
      where: { utilisateurId: clientId },
    });
    const ancienneteMois = scoreCredit?.totalMois ?? 0;

    const donnees = Object.entries(parMois).map(([mois, nbDepots], index) => {
      const tauxMois = Math.min(nbDepots / 30, 1);
      const ancMonsMois = Math.min((ancienneteMois - 5 + index) * 2, 20);
      const scoreMois = Math.round(
        tauxMois * 40 +
          Math.max(0, ancMonsMois) +
          (scoreCredit?.scoreRemboursement ?? 1) * 30,
      );
      return { mois, nbDepots, score: Math.min(Math.max(scoreMois, 0), 100) };
    });

    return { succes: true, message: 'Évolution du score sur 6 mois.', donnees };
  }

  // ─── GET /score/conseils ──────────────────────────
  async conseils(clientId: string) {
    const scoreCredit = await this.prisma.scoreCredit.findUnique({
      where: { utilisateurId: clientId },
    });
    const score = scoreCredit?.score ?? 0;
    const tauxRegularite = scoreCredit?.tauxRegularite ?? 0;

    const conseils: string[] = [];
    let titre = '';

    if (score < 40) {
      titre = 'Score faible — Commencez à épargner régulièrement';
      conseils.push('Faites au moins 1 cotisation par jour pendant 30 jours.');
      conseils.push(
        'Même un petit montantFcfa (500 FCFA) compte pour votre régularité.',
      );
      conseils.push(
        `Il vous faut encore ${BUSINESS.SEUIL_SCORE_MICRO_CREDIT - score} points pour accéder au micro-crédit.`,
      );
    } else if (score < BUSINESS.SEUIL_SCORE_MICRO_CREDIT) {
      titre = 'Bon début — Continuez vos efforts !';
      conseils.push(
        `Plus que ${BUSINESS.SEUIL_SCORE_MICRO_CREDIT - score} points pour débloquer le micro-crédit.`,
      );
      conseils.push(
        'Cotisez chaque jour sans interruption pour booster votre taux de régularité.',
      );
      if (tauxRegularite < 0.7)
        conseils.push(
          'Votre régularité est le critère le plus important (40% du score).',
        );
    } else if (score < BUSINESS.SEUIL_SCORE_PADME) {
      titre = 'Éligible micro-crédit — En route vers PADME !';
      conseils.push(
        `Plus que ${BUSINESS.SEUIL_SCORE_PADME - score} points pour le dossier PADME.`,
      );
      conseils.push(
        'Remboursez votre micro-crédit à temps pour booster votre score de remboursement.',
      );
      conseils.push(
        "Atteignez votre objectif d'épargne pour gagner 10 points bonus.",
      );
    } else {
      titre = 'Excellent score — Vous êtes éligible PADME ! 🎉';
      conseils.push(
        "Votre dossier PADME est en cours de traitement par l'administration.",
      );
      conseils.push('Maintenez votre régularité pour rester éligible.');
      if (score < 90)
        conseils.push(
          `${90 - score} points supplémentaires pour atteindre le plafond maximum (100 000 FCFA).`,
        );
    }

    return {
      succes: true,
      message: titre,
      donnees: {
        score,
        titre,
        conseils,
        prochainSeuil:
          score < BUSINESS.SEUIL_SCORE_MICRO_CREDIT
            ? {
                seuil: BUSINESS.SEUIL_SCORE_MICRO_CREDIT,
                label: 'Micro-crédit',
                pointsRestants: BUSINESS.SEUIL_SCORE_MICRO_CREDIT - score,
              }
            : score < BUSINESS.SEUIL_SCORE_PADME
              ? {
                  seuil: BUSINESS.SEUIL_SCORE_PADME,
                  label: 'PADME',
                  pointsRestants: BUSINESS.SEUIL_SCORE_PADME - score,
                }
              : {
                  seuil: 90,
                  label: 'Plafond maximum',
                  pointsRestants: Math.max(0, 90 - score),
                },
      },
    };
  }

  // ─── GET /score/projection ────────────────────────
  async projection(clientId: string) {
    const scoreCredit = await this.prisma.scoreCredit.findUnique({
      where: { utilisateurId: clientId },
    });
    const score = scoreCredit?.score ?? 0;
    const ancienneteMois = scoreCredit?.totalMois ?? 0;

    // Gain mensuel estimé : +2 pts/mois (ancienneté) + amélioration régularité
    const gainMensuelBase = ancienneteMois < 10 ? 2 : 0; // ancienneté capped à 10 mois
    const gainMensuelTotal = gainMensuelBase + 1; // +1 pt/mois d'amélioration potentielle

    const projections: { mois: number; scoreEstime: number; etape: string }[] =
      [];
    let scoreProjecte = score;

    for (let i = 1; i <= 24; i++) {
      scoreProjecte = Math.min(scoreProjecte + gainMensuelTotal, 100);
      projections.push({ mois: i, scoreEstime: scoreProjecte, etape: '' });
    }

    const moisPour60 =
      score >= BUSINESS.SEUIL_SCORE_MICRO_CREDIT
        ? 0
        : (projections.find(
            (p) => p.scoreEstime >= BUSINESS.SEUIL_SCORE_MICRO_CREDIT,
          )?.mois ?? -1);
    const moisPour70 =
      score >= BUSINESS.SEUIL_SCORE_PADME
        ? 0
        : (projections.find((p) => p.scoreEstime >= BUSINESS.SEUIL_SCORE_PADME)
            ?.mois ?? -1);
    const moisPour90 =
      score >= 90
        ? 0
        : (projections.find((p) => p.scoreEstime >= 90)?.mois ?? -1);

    return {
      succes: true,
      message: 'Projection de score.',
      donnees: {
        scoreActuel: score,
        gainMensuelEstime: gainMensuelTotal,
        projections: projections.slice(0, 12),
        etapes: {
          microCredit: {
            seuil: BUSINESS.SEUIL_SCORE_MICRO_CREDIT,
            moisEstimes: moisPour60,
            label:
              moisPour60 === 0
                ? 'Déjà atteint ✅'
                : moisPour60 === -1
                  ? 'Augmentez votre activité'
                  : `Dans ~${moisPour60} mois`,
          },
          padme: {
            seuil: BUSINESS.SEUIL_SCORE_PADME,
            moisEstimes: moisPour70,
            label:
              moisPour70 === 0
                ? 'Déjà atteint ✅'
                : moisPour70 === -1
                  ? 'Augmentez votre activité'
                  : `Dans ~${moisPour70} mois`,
          },
          plafondMax: {
            seuil: 90,
            moisEstimes: moisPour90,
            label:
              moisPour90 === 0
                ? 'Déjà atteint ✅'
                : moisPour90 === -1
                  ? 'Augmentez votre activité'
                  : `Dans ~${moisPour90} mois`,
          },
        },
      },
    };
  }

  // ─── GET /score/calendrier-regularite ─────────────
  async calendrierRegularite(clientId: string) {
    const maintenant = new Date();
    const sixMoisDate = new Date(maintenant);
    sixMoisDate.setMonth(sixMoisDate.getMonth() - 5);
    sixMoisDate.setDate(1);
    sixMoisDate.setHours(0, 0, 0, 0);

    // Toutes les cotisations réussies sur 6 mois
    const cotisations = await this.prisma.transaction.findMany({
      where: {
        utilisateurId: clientId,
        type: 'COTISATION' as any,
        statut: 'SUCCES' as any,
        creeLe: { gte: sixMoisDate },
      },
      select: { creeLe: true, montantFcfa: true },
      orderBy: { creeLe: 'asc' },
    });

    // Construire une map jour → montantFcfa
    const parJour = new Map<string, number>();
    for (const tx of cotisations) {
      const clé = tx.creeLe.toISOString().split('T')[0]; // "2025-03-07"
      parJour.set(clé, (parJour.get(clé) ?? 0) + tx.montantFcfa);
    }

    // Construire le calendrier mois par mois
    const calendrier: {
      mois: string;
      label: string;
      jours: { date: string; cotise: boolean; montantFcfa: number }[];
      nbJoursCotises: number;
      nbJoursOuvres: number;
      tauxMois: number;
    }[] = [];

    for (let m = 5; m >= 0; m--) {
      const d = new Date(maintenant);
      d.setMonth(d.getMonth() - m);
      const annee = d.getFullYear();
      const mois = d.getMonth();
      const label = d.toLocaleString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
      const cleMois = `${annee}-${String(mois + 1).padStart(2, '0')}`;

      const nbJoursDansMois = new Date(annee, mois + 1, 0).getDate();
      const estMoisCourant =
        mois === maintenant.getMonth() && annee === maintenant.getFullYear();
      const jourMax = estMoisCourant ? maintenant.getDate() : nbJoursDansMois;

      const jours: { date: string; cotise: boolean; montantFcfa: number }[] = [];
      let nbCotises = 0;

      for (let j = 1; j <= jourMax; j++) {
        const dateStr = `${annee}-${String(mois + 1).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
        const montantFcfa = parJour.get(dateStr) ?? 0;
        const cotise = montantFcfa > 0;
        if (cotise) nbCotises++;
        jours.push({ date: dateStr, cotise, montantFcfa });
      }

      calendrier.push({
        mois: cleMois,
        label,
        jours,
        nbJoursCotises: nbCotises,
        nbJoursOuvres: jourMax,
        tauxMois: jourMax > 0 ? Math.round((nbCotises / jourMax) * 100) : 0,
      });
    }

    const totalJours = calendrier.reduce((s, m) => s + m.nbJoursOuvres, 0);
    const totalCotises = calendrier.reduce((s, m) => s + m.nbJoursCotises, 0);

    return {
      succes: true,
      message: 'Calendrier de régularité sur 6 mois.',
      donnees: {
        calendrier,
        resume: {
          totalJours,
          totalCotises,
          tauxGlobal:
            totalJours > 0 ? Math.round((totalCotises / totalJours) * 100) : 0,
        },
      },
    };
  }
}
