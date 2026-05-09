import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, StatutCompte } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { CheckInDto } from './dto/check-in.dto';

// Distance max (mètres) autorisée pour valider un check-in
const DISTANCE_MAX_METRES = 500;

@Injectable()
export class CollecteurTerrainService {
  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
  ) {}

  // ─── POST /collecteur/check-in ─────────────────────
  async checkIn(agentId: string, dto: CheckInDto) {
    const agent = await this.prisma.utilisateur.findUnique({
      where: { id: agentId },
      select: { id: true, nom: true, role: true, statut: true },
    });
    if (!agent) throw new NotFoundException('Agent introuvable');
    if (!([Role.AGENT, Role.INDEPENDANT] as Role[]).includes(agent.role)) {
      throw new ForbiddenException({ message: 'Seuls les collecteurs peuvent faire un check-in', code: 'ROLE_INSUFFISANT' });
    }
    if (agent.statut !== StatutCompte.ACTIF) {
      throw new ForbiddenException({ message: 'Compte non actif', code: 'COMPTE_INACTIF' });
    }

    // Récupérer la position GPS du client
    const client = await this.prisma.utilisateur.findUnique({
      where: { id: dto.clientId },
      select: { id: true, nom: true, telephone: true, collecteurId: true },
    });
    if (!client) throw new NotFoundException('Client introuvable');
    if (client.collecteurId !== agentId) {
      throw new ForbiddenException({ message: 'Ce client n\'appartient pas à votre portefeuille', code: 'ACCES_REFUSE' });
    }

    // Calcul de la distance via formule de Haversine
    // On n'a pas de coordonnées client en base, on valide que le collecteur a bien fait son check-in
    // Le clientId + lat/lon de l'agent sont enregistrés comme preuve de présence terrain
    const distance = 0; // Distance = 0 car pas de coordonnées client persistées (feature future)
    const estValide = true;

    const presence = await this.prisma.presenceCollecteur.create({
      data: {
        agentId,
        clientId: dto.clientId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        distance,
        estValide,
      },
    });

    return {
      succes: true,
      message: estValide
        ? `Check-in validé pour ${client.nom} ✅`
        : `Check-in refusé : vous êtes trop loin du client (${Math.round(distance)}m > ${DISTANCE_MAX_METRES}m)`,
      donnees: { presenceId: presence.id, distance: Math.round(distance), estValide },
    };
  }

  // ─── GET /collecteur/clients-du-jour ───────────────
  async clientsDuJour(agentId: string) {
    const clients = await this.prisma.utilisateur.findMany({
      where: { collecteurId: agentId, statut: StatutCompte.ACTIF },
      select: {
        id: true,
        nom: true,
        telephone: true,
        kycVerifie: true,
        tontines: { select: { soldeActuel: true, objectifMontant: true, montantJournalier: true }, take: 1 },
        scoreCredit: { select: { score: true, tauxRegularite: true } },
      },
      orderBy: { nom: 'asc' },
    });

    // Visites déjà effectuées aujourd'hui
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);

    const visitesAujourdHui = await this.prisma.presenceCollecteur.findMany({
      where: {
        agentId,
        creeLe: { gte: debutJour },
        estValide: true,
      },
      select: { clientId: true },
    });

    const clientsDejaVisites = new Set(visitesAujourdHui.map((v) => v.clientId));

    const donnees = clients.map((c) => ({
      id: c.id,
      nom: c.nom,
      telephone: c.telephone,
      kycVerifie: c.kycVerifie,
      solde: c.tontines[0]?.soldeActuel ?? 0,
      montantJournalier: c.tontines[0]?.montantJournalier ?? 0,
      score: c.scoreCredit?.score ?? 0,
      dejaVisite: clientsDejaVisites.has(c.id),
    }));

    const nbVisites = clientsDejaVisites.size;
    const nbRestantes = clients.length - nbVisites;

    return {
      succes: true,
      message: `${clients.length} client(s) — ${nbVisites} visité(s), ${nbRestantes} restant(s)`,
      donnees: {
        clients: donnees,
        stats: { total: clients.length, visites: nbVisites, restantes: nbRestantes },
      },
    };
  }

  // ─── GET /collecteur/carte-clients ─────────────────
  async carteClients(agentId: string) {
    const clients = await this.prisma.utilisateur.findMany({
      where: { collecteurId: agentId, statut: StatutCompte.ACTIF },
      select: { id: true, nom: true, telephone: true },
    });

    // Les dernières positions GPS des check-ins par client
    const dernieresPresences = await this.prisma.presenceCollecteur.findMany({
      where: { agentId, estValide: true },
      orderBy: { creeLe: 'desc' },
      distinct: ['clientId'],
      select: { clientId: true, latitude: true, longitude: true, creeLe: true },
    });

    const positionsParClient = new Map(dernieresPresences.map((p) => [p.clientId, p]));

    const donnees = clients.map((c) => {
      const pos = positionsParClient.get(c.id);
      return {
        id: c.id,
        nom: c.nom,
        telephone: c.telephone,
        position: pos ? { latitude: pos.latitude, longitude: pos.longitude, dernierCheckIn: pos.creeLe } : null,
      };
    });

    return {
      succes: true,
      message: `${clients.length} client(s) dans votre carte.`,
      donnees,
    };
  }

  // ─── GET /collecteur/mes-presences ─────────────────
  async mesPresences(agentId: string, page = 1, limite = 20) {
    const skip = (page - 1) * limite;
    const [presences, total] = await this.prisma.$transaction([
      this.prisma.presenceCollecteur.findMany({
        where: { agentId },
        orderBy: { creeLe: 'desc' },
        skip,
        take: limite,
        include: {
          // no direct relation to Utilisateur for clientId, hack via raw
        },
      }),
      this.prisma.presenceCollecteur.count({ where: { agentId } }),
    ]);

    return {
      succes: true,
      message: `${total} check-in(s).`,
      donnees: { presences, total, page, pages: Math.ceil(total / limite) },
    };
  }
}
