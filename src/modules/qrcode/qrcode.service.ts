import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const DUREE_QR_MS = 24 * 60 * 60 * 1000;

// Note de profil collecteur (1–5) calculée depuis des données réelles
function _calculerNoteProfile(
  kycVerifie: boolean,
  badge: string | null,
  nbClients: number,
): number {
  let note = kycVerifie ? 3.0 : 1.5;               // KYC = base fiable
  if (badge === 'BRONZE')  note = Math.max(note, 3.0);
  if (badge === 'ARGENT')  note = Math.max(note, 3.5);
  if (badge === 'OR')      note = Math.max(note, 4.0);
  if (badge === 'DIAMANT') note = Math.max(note, 5.0);
  if (nbClients >= 5)  note = Math.min(note + 0.5, 5);  // expérience terrain
  if (nbClients >= 20) note = Math.min(note + 0.5, 5);
  return Math.round(note * 2) / 2;                  // arrondi au 0.5 près
}

@Injectable()
export class QrcodeService {
  constructor(private prisma: PrismaService) {}

  // ─── GET /qrcode/mon-code ──────────────────────────
  async monCode(utilisateurId: string, role: Role) {
    if (!([Role.AGENT, Role.INDEPENDANT] as Role[]).includes(role)) {
      throw new BadRequestException({
        message: 'Seuls les agents et collecteurs indépendants ont un QR code',
        code: 'ROLE_INSUFFISANT',
      });
    }

    let qr = await this.prisma.qRCodeCollecteur.findUnique({
      where: { collecteurId: utilisateurId },
    });

    // Générer ou régénérer si expiré / inexistant
    if (!qr || qr.expireLe < new Date()) {
      const expireLe = new Date(Date.now() + DUREE_QR_MS);
      qr = await this.prisma.qRCodeCollecteur.upsert({
        where: { collecteurId: utilisateurId },
        create: {
          collecteurId: utilisateurId,
          codeQR: randomUUID(),
          expireLe,
          actif: true,
        },
        update: { codeQR: randomUUID(), expireLe, actif: true },
      });
    }

    return { succes: true, message: 'QR code récupéré.', donnees: qr };
  }

  // ─── POST /qrcode/scanner/:code ────────────────────
  async scanner(code: string) {
    const qr = await this.prisma.qRCodeCollecteur.findUnique({
      where: { codeQR: code },
      include: {
        collecteur: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            role: true,
            kycVerifie: true,
            statut: true,
            badges: { orderBy: { obtenuLe: 'desc' }, take: 1 },
            _count: { select: { clients: true } },
          },
        },
      },
    });

    if (!qr)
      throw new NotFoundException({
        message: 'QR code inconnu',
        code: 'QR_INVALIDE',
      });
    if (!qr.actif)
      throw new BadRequestException({
        message: 'QR code désactivé',
        code: 'QR_DESACTIVE',
      });
    if (qr.expireLe < new Date()) {
      throw new BadRequestException({
        message: 'QR code expiré',
        code: 'QR_EXPIRE',
      });
    }

    const c = qr.collecteur;
    const badgeNiveau = c.badges[0]?.niveau ?? null;
    const nbClients = c._count.clients;

    // Note de profil 1-5 calculée depuis des données réelles
    const noteProfile = _calculerNoteProfile(c.kycVerifie, badgeNiveau, nbClients);

    const { badges: _b, _count, ...collecteurBase } = c;

    return {
      succes: true,
      message: 'Collecteur authentifié.',
      donnees: {
        collecteur: collecteurBase,
        expireLe: qr.expireLe,
        noteProfile,            // 1.0 – 5.0
        niveauBadge: badgeNiveau,
        nbClients,
      },
    };
  }

  // ─── POST /qrcode/lier/:code ───────────────────────
  async lierCollecteur(codeQR: string, clientId: string) {
    const qr = await this.prisma.qRCodeCollecteur.findUnique({
      where: { codeQR },
      select: { collecteurId: true, actif: true, expireLe: true },
    });

    if (!qr)
      throw new NotFoundException({ message: 'QR code inconnu', code: 'QR_INVALIDE' });
    if (!qr.actif)
      throw new BadRequestException({ message: 'QR code désactivé', code: 'QR_DESACTIVE' });
    if (qr.expireLe < new Date())
      throw new BadRequestException({ message: 'QR code expiré', code: 'QR_EXPIRE' });
    if (qr.collecteurId === clientId)
      throw new BadRequestException({ message: 'Vous ne pouvez pas vous lier à vous-même', code: 'AUTO_LIEN_INTERDIT' });

    await this.prisma.utilisateur.update({
      where: { id: clientId },
      data: { collecteurId: qr.collecteurId },
    });

    return { succes: true, message: 'Collecteur lié avec succès.' };
  }

  // ─── POST /qrcode/regenerer (Admin) ───────────────
  async regenerer(agentId: string) {
    const agent = await this.prisma.utilisateur.findUnique({
      where: { id: agentId },
      select: { id: true, role: true, nom: true },
    });
    if (!agent) throw new NotFoundException('Agent introuvable');
    if (!([Role.AGENT, Role.INDEPENDANT] as Role[]).includes(agent.role)) {
      throw new BadRequestException({
        message: "Cet utilisateur n'est pas un collecteur",
        code: 'ROLE_INVALIDE',
      });
    }

    const expireLe = new Date(Date.now() + DUREE_QR_MS);
    const qr = await this.prisma.qRCodeCollecteur.upsert({
      where: { collecteurId: agentId },
      create: {
        collecteurId: agentId,
        codeQR: randomUUID(),
        expireLe,
        actif: true,
      },
      update: { codeQR: randomUUID(), expireLe, actif: true },
    });

    return {
      succes: true,
      message: `QR code régénéré pour ${agent.nom}.`,
      donnees: qr,
    };
  }
}
