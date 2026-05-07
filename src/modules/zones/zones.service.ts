import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreerZoneDto } from './dto/creer-zone.dto';

const SELECT_ZONE = { id: true, nom: true, ville: true, description: true, creeLe: true };

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  // ─── POST /zones (Admin) ───────────────────────────
  async creer(dto: CreerZoneDto) {
    const zone = await this.prisma.zone.create({ data: dto, select: SELECT_ZONE });
    return { succes: true, message: 'Zone créée.', donnees: zone };
  }

  // ─── GET /zones ────────────────────────────────────
  async lister() {
    const zones = await this.prisma.zone.findMany({
      select: { ...SELECT_ZONE, _count: { select: { agents: true } } },
      orderBy: { ville: 'asc' },
    });
    return { succes: true, message: `${zones.length} zone(s).`, donnees: zones };
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
      select: { id: true, nom: true, telephone: true, role: true, statut: true, kycVerifie: true },
    });
    return {
      succes: true,
      message: `${agents.length} agent(s) dans la zone "${zone.nom}".`,
      donnees: { zone: { id: zone.id, nom: zone.nom, ville: zone.ville }, agents },
    };
  }
}
