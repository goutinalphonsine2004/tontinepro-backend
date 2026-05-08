import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const DUREE_QR_JOURS = 30;

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

    let qr = await this.prisma.qRCodeCollecteur.findUnique({ where: { collecteurId: utilisateurId } });

    // Générer ou régénérer si expiré / inexistant
    if (!qr || qr.expireLe < new Date()) {
      const expireLe = new Date(Date.now() + DUREE_QR_JOURS * 24 * 60 * 60 * 1000);
      qr = await this.prisma.qRCodeCollecteur.upsert({
        where: { collecteurId: utilisateurId },
        create: { collecteurId: utilisateurId, codeQR: randomUUID(), expireLe, actif: true },
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
          select: { id: true, nom: true, telephone: true, role: true, kycVerifie: true, statut: true },
        },
      },
    });

    if (!qr) throw new NotFoundException({ message: 'QR code inconnu', code: 'QR_INVALIDE' });
    if (!qr.actif) throw new BadRequestException({ message: 'QR code désactivé', code: 'QR_DESACTIVE' });
    if (qr.expireLe < new Date()) {
      throw new BadRequestException({ message: 'QR code expiré', code: 'QR_EXPIRE' });
    }

    return {
      succes: true,
      message: 'Collecteur authentifié.',
      donnees: { collecteur: qr.collecteur, expireLe: qr.expireLe },
    };
  }

  // ─── POST /qrcode/regenerer (Admin) ───────────────
  async regenerer(agentId: string) {
    const agent = await this.prisma.utilisateur.findUnique({
      where: { id: agentId },
      select: { id: true, role: true, nom: true },
    });
    if (!agent) throw new NotFoundException('Agent introuvable');
    if (!([Role.AGENT, Role.INDEPENDANT] as Role[]).includes(agent.role)) {
      throw new BadRequestException({ message: 'Cet utilisateur n\'est pas un collecteur', code: 'ROLE_INVALIDE' });
    }

    const expireLe = new Date(Date.now() + DUREE_QR_JOURS * 24 * 60 * 60 * 1000);
    const qr = await this.prisma.qRCodeCollecteur.upsert({
      where: { collecteurId: agentId },
      create: { collecteurId: agentId, codeQR: randomUUID(), expireLe, actif: true },
      update: { codeQR: randomUUID(), expireLe, actif: true },
    });

    return { succes: true, message: `QR code régénéré pour ${agent.nom}.`, donnees: qr };
  }
}
