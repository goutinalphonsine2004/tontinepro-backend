import { Injectable } from '@nestjs/common';
import { NiveauBadge, Role, StatutCompte } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';

const REGLES_BADGES: { mois: number; regulariteMin: number; niveau: NiveauBadge; label: string }[] = [
  { mois: 12, regulariteMin: 0.8, niveau: NiveauBadge.DIAMANT, label: 'DIAMANT 💎' },
  { mois: 6,  regulariteMin: 0.7, niveau: NiveauBadge.OR,      label: 'OR 🥇' },
  { mois: 3,  regulariteMin: 0.6, niveau: NiveauBadge.ARGENT,  label: 'ARGENT 🥈' },
  { mois: 1,  regulariteMin: 0.5, niveau: NiveauBadge.BRONZE,  label: 'BRONZE 🥉' },
];

@Injectable()
export class BadgesService {
  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
  ) {}

  // Appelé par le cron après chaque scoring
  async attribuerBadgesSiEligible(clientId: string) {
    const scoreCredit = await this.prisma.scoreCredit.findUnique({
      where: { utilisateurId: clientId },
    });
    const client = await this.prisma.utilisateur.findUnique({
      where: { id: clientId },
      select: { telephone: true, nom: true },
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

    await this.sms.envoyer(
      client.telephone,
      `TontinePro: 🎉 Félicitations ${client.nom} ! Vous venez d'obtenir le badge ${badgeEligible.label} TontinePro. Continuez à épargner régulièrement !`,
    );
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
    const badges = await this.prisma.badgeClient.findMany({
      where: { clientId },
      orderBy: { obtenuLe: 'desc' },
    });

    const niveauActuel = badges.length > 0
      ? badges.reduce((best, b) => {
          const ordre: Record<string, number> = { BRONZE: 1, ARGENT: 2, OR: 3, DIAMANT: 4 };
          return ordre[b.niveau] > ordre[best.niveau] ? b : best;
        })
      : null;

    return {
      succes: true,
      message: `${badges.length} badge(s) obtenu(s).`,
      donnees: { badges, niveauActuel: niveauActuel?.niveau ?? null },
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

    return { succes: true, message: 'Classement top 10 épargnants.', donnees: classement };
  }
}
