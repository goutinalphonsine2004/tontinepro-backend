import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreerZoneDto } from './dto/creer-zone.dto';

const SELECT_ZONE = {
  id: true,
  nom: true,
  ville: true,
  description: true,
  creeLe: true,
};

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  // ─── POST /zones (Admin) ───────────────────────────
  async creer(dto: CreerZoneDto) {
    const zone = await this.prisma.zone.create({
      data: dto,
      select: SELECT_ZONE,
    });
    return { succes: true, message: 'Zone créée.', donnees: zone };
  }

  // ─── GET /zones ────────────────────────────────────
  async lister() {
    const zones = await this.prisma.zone.findMany({
      select: { ...SELECT_ZONE, _count: { select: { agents: true } } },
      orderBy: { ville: 'asc' },
    });
    return {
      succes: true,
      message: `${zones.length} zone(s).`,
      donnees: zones,
    };
  }

  // ─── PUT /zones/:id (Admin) ────────────────────────
  async modifier(zoneId: string, dto: Partial<CreerZoneDto>) {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new NotFoundException('Zone introuvable');
    const maj = await this.prisma.zone.update({
      where: { id: zoneId },
      data: dto,
      select: SELECT_ZONE,
    });
    return { succes: true, message: 'Zone mise à jour.', donnees: maj };
  }

  // ─── GET /zones/:id/agents (Admin) ────────────────
  async agentsDeLaZone(zoneId: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new NotFoundException('Zone introuvable');
    const agents = await this.prisma.utilisateur.findMany({
      where: { zoneId },
      select: {
        id: true,
        nom: true,
        telephone: true,
        role: true,
        statut: true,
        kycVerifie: true,
      },
    });
    return {
      succes: true,
      message: `${agents.length} agent(s) dans la zone "${zone.nom}".`,
      donnees: {
        zone: { id: zone.id, nom: zone.nom, ville: zone.ville },
        agents,
      },
    };
  }

  // ─── PUT /zones/:id/superviseur (Admin) ───────────
  async assignerSuperviseur(zoneId: string, superviseurId: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new NotFoundException('Zone introuvable');

    const superviseur = await this.prisma.utilisateur.findUnique({
      where: { id: superviseurId },
      select: { id: true, nom: true, role: true },
    });
    if (!superviseur) throw new NotFoundException('Superviseur introuvable');

    await this.prisma.zone.update({
      where: { id: zoneId },
      data: { superviseurId },
    });

    return {
      succes: true,
      message: `${superviseur.nom} nommé superviseur de la zone "${zone.nom}".`,
      donnees: { zoneId, superviseurId, superviseurNom: superviseur.nom },
    };
  }

  // ─── GET /zones/:id/stats (Admin) ─────────────────
  async statsZone(zoneId: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new NotFoundException('Zone introuvable');

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const [agents, clients, volumeMois] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where: { zoneId },
        select: { id: true, nom: true, role: true, statut: true },
      }),
      this.prisma.utilisateur.findMany({
        where: { collecteur: { zoneId } },
        select: {
          id: true,
          scoreCredit: { select: { score: true, tauxRegularite: true } },
        },
      }),
      this.prisma.transaction.aggregate({
        where: {
          statut: 'SUCCES' as any,
          type: 'COTISATION' as any,
          creeLe: { gte: debutMois },
          utilisateur: { collecteur: { zoneId } },
        },
        _sum: { montant: true },
        _count: true,
      }),
    ]);

    const scores = clients
      .filter((c) => c.scoreCredit)
      .map((c) => c.scoreCredit!.score);
    const scoreMoyen =
      scores.length > 0
        ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
        : 0;

    return {
      succes: true,
      message: `Statistiques zone "${zone.nom}".`,
      donnees: {
        zone: { id: zone.id, nom: zone.nom, ville: zone.ville },
        nbAgents: agents.length,
        nbClients: clients.length,
        scoreMoyen,
        volumeCeMois: volumeMois._sum.montant ?? 0,
        transactionsCeMois: volumeMois._count,
        agents,
      },
    };
  }

  // ─── GET /zones/heatmap (Admin) ───────────────────
  async heatmap() {
    const zones = await this.prisma.zone.findMany({
      select: {
        id: true,
        nom: true,
        ville: true,
        superviseurId: true,
        agents: {
          select: {
            id: true,
            role: true,
            statut: true,
            clients: {
              select: {
                transactions: {
                  where: { statut: 'SUCCES' as any, type: 'COTISATION' as any },
                  select: { montant: true },
                },
                scoreCredit: { select: { score: true, eligiblePADME: true } },
              },
            },
          },
        },
      },
    });

    const donnees = zones.map((zone) => {
      const clients = zone.agents.flatMap((a) => a.clients);
      const volumeTotal = clients
        .flatMap((c) => c.transactions)
        .reduce((s, tx) => s + tx.montant, 0);
      const scores = clients
        .filter((c) => c.scoreCredit)
        .map((c) => c.scoreCredit!.score);
      const scoreMoyen =
        scores.length > 0
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : 0;
      const eligiblesPADME = clients.filter(
        (c) => c.scoreCredit?.eligiblePADME,
      ).length;
      const activite =
        volumeTotal > 1_000_000
          ? 'HAUTE'
          : volumeTotal > 200_000
            ? 'MOYENNE'
            : 'FAIBLE';

      return {
        id: zone.id,
        nom: zone.nom,
        ville: zone.ville,
        nbAgents: zone.agents.length,
        nbClients: clients.length,
        volumeTotal: Math.round(volumeTotal),
        scoreMoyen,
        eligiblesPADME,
        activite,
      };
    });

    const totalVolume = donnees.reduce((s, z) => s + z.volumeTotal, 0);
    return {
      succes: true,
      message: `Heatmap de ${donnees.length} zone(s).`,
      donnees: { zones: donnees, totalVolume },
    };
  }
}
