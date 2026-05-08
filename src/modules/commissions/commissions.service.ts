import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { BUSINESS } from '../../common/constants/business.constants';
import { RetirerCommissionDto } from './dto/retirer-commission.dto';

@Injectable()
export class CommissionsService {
  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
  ) {}

  // ─── GET /commissions/mon-solde ────────────────────
  async monSolde(utilisateurId: string, role: Role) {
    if (!([Role.AGENT, Role.INDEPENDANT, Role.SUPERVISEUR] as Role[]).includes(role)) {
      throw new ForbiddenException({ message: 'Seuls les collecteurs ont des commissions', code: 'ROLE_INSUFFISANT' });
    }
    const u = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { id: true, nom: true, soldeCommission: true },
    });
    const totalCommissions = await this.prisma.commission.aggregate({
      where: { agentId: utilisateurId },
      _sum: { montant: true },
      _count: true,
    });
    return {
      succes: true,
      message: 'Solde de commission récupéré.',
      donnees: {
        nom: u?.nom,
        soldeDisponible: u?.soldeCommission ?? 0,
        totalGagne: totalCommissions._sum.montant ?? 0,
        nombreTransactions: totalCommissions._count,
        tauxCommission: `${BUSINESS.TAUX_COMMISSION_COTISATION * 100 * 0.5}% (50% des frais plateforme)`,
      },
    };
  }

  // ─── GET /commissions/historique ───────────────────
  async historique(utilisateurId: string) {
    const commissions = await this.prisma.commission.findMany({
      where: { agentId: utilisateurId },
      include: {
        transaction: {
          select: { reference: true, montant: true, type: true, creeLe: true, utilisateur: { select: { nom: true } } },
        },
      },
      orderBy: { creeLe: 'desc' },
      take: 50,
    });
    return { succes: true, message: `${commissions.length} commission(s).`, donnees: commissions };
  }

  // ─── POST /commissions/retirer ─────────────────────
  async retirer(utilisateurId: string, dto: RetirerCommissionDto) {
    const agent = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { id: true, nom: true, telephone: true, soldeCommission: true },
    });
    if (!agent) throw new BadRequestException('Agent introuvable');
    if (agent.soldeCommission < dto.montant) {
      throw new BadRequestException({
        message: `Solde insuffisant. Disponible: ${agent.soldeCommission} FCFA`,
        code: 'SOLDE_INSUFFISANT',
      });
    }

    const telephone = dto.telephone ?? agent.telephone;
    const transfert = await this.kkiapay.initierTransfert({
      montant: dto.montant,
      telephone,
      reference: `comm_${utilisateurId}_${Date.now()}`,
      motif: 'Retrait commission TontineBénin',
    });

    if (!transfert.succes) {
      throw new BadRequestException({ message: 'Échec du transfert', code: 'TRANSFERT_ECHOUE' });
    }

    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { soldeCommission: { decrement: dto.montant } },
    });

    return {
      succes: true,
      message: `${dto.montant} FCFA transférés vers ${telephone}.`,
      donnees: {
        montant: dto.montant,
        telephone,
        refKKiaPay: transfert.refKKiaPay,
        soldeRestant: agent.soldeCommission - dto.montant,
      },
    };
  }
}
