import { Injectable } from '@nestjs/common';
import { NiveauBadge, Role, StatutCompte } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { PushService } from '../notifications/push.service';

const REGLES_BADGES: {
  mois: number;
  regulariteMin: number;
  niveau: NiveauBadge;
  label: string;
  nom: string;
  description: string;
  emoji: string;
}[] = [
  {
    mois: 12, regulariteMin: 0.8, niveau: NiveauBadge.DIAMANT,
    label: 'DIAMANT 💎', emoji: '💎',
    nom: 'Badge Diamant',
    description: '12 mois d\'épargne continue avec un taux de régularité ≥ 80%.',
  },
  {
    mois: 6, regulariteMin: 0.7, niveau: NiveauBadge.OR,
    label: 'OR 🥇', emoji: '🥇',
    nom: 'Badge Or',
    description: '6 mois d\'épargne continue avec un taux de régularité ≥ 70%.',
  },
  {
    mois: 3, regulariteMin: 0.6, niveau: NiveauBadge.ARGENT,
    label: 'ARGENT 🥈', emoji: '🥈',
    nom: 'Badge Argent',
    description: '3 mois d\'épargne continue avec un taux de régularité ≥ 60%.',
  },
  {
    mois: 1, regulariteMin: 0.5, niveau: NiveauBadge.BRONZE,
    label: 'BRONZE 🥉', emoji: '🥉',
    nom: 'Badge Bronze',
    description: '1 mois d\'épargne avec un taux de régularité ≥ 50%.',
  },
];

// Enrichit un enregistrement BadgeClient avec nom/description/emoji
function enrichirBadge(b: { id: string; niveau: NiveauBadge; obtenuLe: Date }) {
  const regle = REGLES_BADGES.find((r) => r.niveau === b.niveau);
  return {
    ...b,
    nom: regle?.nom ?? b.niveau,
    description: regle?.description ?? '',
    emoji: regle?.emoji ?? '🏅',
    obtenu: true,
  };
}

@Injectable()
export class BadgesService {
  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
    private push: PushService,
  ) {}

  // Appelé par le cron après chaque scoring
  async attribuerBadgesSiEligible(clientId: string) {
    const scoreCredit = await this.prisma.scoreCredit.findUnique({
      where: { utilisateurId: clientId },
    });
    const client = await this.prisma.utilisateur.findUnique({
      where: { id: clientId },
      select: { telephone: true, nom: true, tokenPush: true },
    });
    if (!scoreCredit || !client) return;

    const { totalMois, tauxRegularite } = scoreCredit;

    // Trouver le badge le plus élevé auquel le client est éligible
    const badgeEligible = REGLES_BADGES.find(
      (r) => totalMois >= r.mois && tauxRegularite >= r.regulariteMin,
    );
    if (!badgeEligible) return;

    // Vérifier si le client a déjà ce badge ou un badge supérieur
    const badgeExistant = await this.prisma.badgeClient.findFirst({
      where: {
        clientId,
        niveau: { in: REGLES_BADGES.map((r) => r.niveau) },
      },
      orderBy: { obtenuLe: 'desc' },
    });

    // Ordre de prestige : DIAMANT > OR > ARGENT > BRONZE
    const ordreBadge: Record<NiveauBadge, number> = {
      [NiveauBadge.BRONZE]: 1,
      [NiveauBadge.ARGENT]: 2,
      [NiveauBadge.OR]: 3,
      [NiveauBadge.DIAMANT]: 4,
    };

    if (
      badgeExistant &&
      ordreBadge[badgeExistant.niveau] >= ordreBadge[badgeEligible.niveau]
    ) {
      return; // Badge déjà atteint ou supérieur
    }

    // Attribuer le nouveau badge
    await this.prisma.badgeClient.create({
      data: { clientId, niveau: badgeEligible.niveau },
    });

    const msgFelicitations = `🎉 Félicitations ${client.nom} ! Vous venez d'obtenir le badge ${badgeEligible.label} TontineBénin. Continuez à épargner régulièrement !`;

    // SMS
    await this.sms.envoyer(client.telephone, `TontineBénin: ${msgFelicitations}`);

    // Push FCM (si token disponible)
    if (client.tokenPush) {
      await this.push.envoyerNotification(
        client.tokenPush,
        `Nouveau badge ${badgeEligible.label} !`,
        msgFelicitations,
        { type: 'BADGE', niveau: badgeEligible.niveau },
      ).catch(() => { /* FCM non critique */ });
    }
  }

  async attribuerBadgesATous() {
    const clients = await this.prisma.utilisateur.findMany({
      where: { role: Role.CLIENT, statut: StatutCompte.ACTIF },
      select: { id: true },
    });
    for (const client of clients) {
      await this.attribuerBadgesSiEligible(client.id);
    }
  }

  // ─── GET /badges/mes-badges ───────────────────────
  async mesBadges(clientId: string) {
    const [badges, scoreCredit] = await Promise.all([
      this.prisma.badgeClient.findMany({
        where: { clientId },
        orderBy: { obtenuLe: 'desc' },
      }),
      this.prisma.scoreCredit.findUnique({ where: { utilisateurId: clientId } }),
    ]);

    const badgesEnrichis = badges.map(enrichirBadge);

    const ordre: Record<NiveauBadge, number> = {
      [NiveauBadge.BRONZE]: 1,
      [NiveauBadge.ARGENT]: 2,
      [NiveauBadge.OR]: 3,
      [NiveauBadge.DIAMANT]: 4,
    };

    const niveauActuel = badges.length > 0
      ? badges.reduce((best, b) => ordre[b.niveau] > ordre[best.niveau] ? b : best).niveau
      : null;

    // Prochain badge non encore obtenu
    const niveauxObtenus = new Set(badges.map((b) => b.niveau));
    const prochainBadge = REGLES_BADGES
      .slice()
      .reverse() // du plus bas au plus élevé
      .find((r) => !niveauxObtenus.has(r.niveau));

    // Progression vers le prochain badge
    let progressionProchaineEtape: number | null = null;
    if (prochainBadge && scoreCredit) {
      const { totalMois, tauxRegularite } = scoreCredit;
      const progMois = Math.min(totalMois / prochainBadge.mois, 1);
      const progRegularite = Math.min(tauxRegularite / prochainBadge.regulariteMin, 1);
      progressionProchaineEtape = Math.round(((progMois + progRegularite) / 2) * 100);
    }

    return {
      succes: true,
      message: `${badges.length} badge(s) obtenu(s).`,
      donnees: {
        badges: badgesEnrichis,
        niveauActuel,
        prochainBadge: prochainBadge
          ? {
              niveau: prochainBadge.niveau,
              nom: prochainBadge.nom,
              description: prochainBadge.description,
              emoji: prochainBadge.emoji,
              criteres: {
                moisRequis: prochainBadge.mois,
                regulariteMinimum: prochainBadge.regulariteMin,
              },
              progression: progressionProchaineEtape,
            }
          : null,
      },
    };
  }

  // ─── GET /badges/classement ───────────────────────
  async classement() {
    // Top 10 épargnants par score global, avec leur badge
    const top = await this.prisma.scoreCredit.findMany({
      orderBy: { score: 'desc' },
      take: 10,
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            zoneId: true,
            zone: { select: { nom: true, ville: true } },
            badges: { orderBy: { obtenuLe: 'desc' }, take: 1 },
          },
        },
      },
    });

    const classement = top.map((s, index) => ({
      rang: index + 1,
      nom: s.utilisateur.nom,
      score: s.score,
      badge: s.utilisateur.badges[0]?.niveau ?? 'Aucun',
      zone: s.utilisateur.zone?.nom ?? 'N/A',
      ville: s.utilisateur.zone?.ville ?? 'N/A',
    }));

    return {
      succes: true,
      message: 'Classement top 10 épargnants.',
      donnees: classement,
    };
  }
}
