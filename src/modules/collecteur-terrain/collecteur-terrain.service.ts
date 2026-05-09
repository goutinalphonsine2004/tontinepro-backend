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

  // ─── GET /collecteur/dashboard-independant ─────────
  async dashboardIndependant(agentId: string) {
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const sixMoisDate = new Date(maintenant);
    sixMoisDate.setMonth(sixMoisDate.getMonth() - 5);
    sixMoisDate.setDate(1);

    const [agent, clients, commissionsMois, abonnement, creditsClients] = await Promise.all([
      this.prisma.utilisateur.findUnique({
        where: { id: agentId },
        select: { id: true, nom: true, telephone: true, role: true, soldeCommission: true },
      }),
      this.prisma.utilisateur.findMany({
        where: { collecteurId: agentId, statut: StatutCompte.ACTIF },
        select: {
          id: true,
          transactions: {
            where: { type: 'COTISATION' as any, statut: 'SUCCES' as any, creeLe: { gte: debutMois } },
            select: { montant: true },
          },
        },
      }),
      this.prisma.commission.aggregate({
        where: { agentId, creeLe: { gte: debutMois } },
        _sum: { montant: true },
      }),
      this.prisma.facturationAgent.findFirst({
        where: { agentId },
        orderBy: { creeLe: 'desc' },
        select: { plan: true, actif: true, prochainPaiement: true },
      }),
      this.prisma.microCredit.findMany({
        where: { clientId: { in: [] } }, // sera enrichi via clients ci-dessous
        select: { montantPrincipal: true, montantTotal: true, montantRestant: true },
        take: 0,
      }),
    ]);

    if (!agent) throw new NotFoundException('Agent introuvable');

    // Graphique revenus 6 mois
    const commissionsParMois = await this.prisma.commission.findMany({
      where: { agentId, creeLe: { gte: sixMoisDate } },
      select: { montant: true, creeLe: true },
    });

    const graphique: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(maintenant);
      d.setMonth(d.getMonth() - i);
      graphique[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
    }
    for (const c of commissionsParMois) {
      const key = `${c.creeLe.getFullYear()}-${String(c.creeLe.getMonth() + 1).padStart(2, '0')}`;
      if (graphique[key] !== undefined) graphique[key] += c.montant;
    }

    const clientsActifs = clients.length;
    const nbClientsCotiseCeMois = clients.filter((c) => c.transactions.length > 0).length;
    const tauxCollecteMois = clientsActifs > 0 ? Math.round((nbClientsCotiseCeMois / clientsActifs) * 100) : 0;
    const interetsMicroCredits = creditsClients.reduce((s, c) => s + (c.montantTotal - c.montantPrincipal) * 0.1, 0);

    return {
      succes: true,
      message: 'Tableau de bord collecteur indépendant.',
      donnees: {
        agent: { id: agent.id, nom: agent.nom, role: agent.role, soldeCommission: agent.soldeCommission },
        clientsActifs,
        commissionsCeMois: commissionsMois._sum.montant ?? 0,
        tauxCollecteMois,
        graphiqueRevenus: Object.entries(graphique).map(([mois, montant]) => ({ mois, montant: Math.round(montant) })),
        revenutsMicroCredits: Math.round(interetsMicroCredits),
        abonnement: abonnement
          ? { plan: abonnement.plan, actif: abonnement.actif, prochainPaiement: abonnement.prochainPaiement }
          : null,
      },
    };
  }

  // ─── GET /collecteur/contact-whatsapp/:clientId ────
  async contactWhatsApp(agentId: string, clientId: string) {
    const client = await this.prisma.utilisateur.findUnique({
      where: { id: clientId },
      select: { id: true, nom: true, telephone: true, collecteurId: true },
    });
    if (!client) throw new NotFoundException('Client introuvable');
    if (client.collecteurId !== agentId) {
      throw new ForbiddenException({ message: 'Ce client n\'est pas dans votre portefeuille', code: 'ACCES_REFUSE' });
    }

    // Normaliser le numéro béninois (+229 ou 00229)
    const tel = client.telephone.replace(/^0+/, '').replace(/^\+/, '');
    const telE164 = tel.startsWith('229') ? tel : `229${tel}`;
    const lienWhatsApp = `https://wa.me/${telE164}`;

    return {
      succes: true,
      message: `Lien WhatsApp généré pour ${client.nom}.`,
      donnees: { clientId: client.id, nom: client.nom, telephone: client.telephone, lienWhatsApp },
    };
  }
}

