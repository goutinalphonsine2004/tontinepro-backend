import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
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
    if (
      !([Role.AGENT, Role.INDEPENDANT, Role.SUPERVISEUR] as Role[]).includes(
        role,
      )
    ) {
      throw new ForbiddenException({
        message: 'Seuls les collecteurs ont des commissions',
        code: 'ROLE_INSUFFISANT',
      });
    }
    const u = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { id: true, nom: true, soldeCommissionFcfa: true },
    });
    const totalCommissions = await this.prisma.commission.aggregate({
      where: { agentId: utilisateurId },
      _sum: { montantFcfa: true },
      _count: true,
    });
    return {
      succes: true,
      message: 'Solde de commission récupéré.',
      donnees: this.presenterFinancesParRole(role, {
        nom: u?.nom,
        soldeDisponible: u?.soldeCommissionFcfa ?? 0,
        totalGagne: totalCommissions._sum.montantFcfa ?? 0,
        nombreTransactions: totalCommissions._count,
        tauxCommission: `${BUSINESS.TAUX_COMMISSION_COTISATION * 100 * 0.5}% (50% des frais plateforme)`,
      }),
    };
  }

  // ─── GET /commissions/historique ───────────────────
  async historique(utilisateurId: string, role: Role) {
    this.verifierRoleFinanceTerrain(role);
    const commissions = await this.prisma.commission.findMany({
      where: { agentId: utilisateurId },
      include: {
        transaction: {
          select: {
            reference: true,
            montantFcfa: true,
            type: true,
            creeLe: true,
            utilisateur: { select: { nom: true } },
          },
        },
      },
      orderBy: { creeLe: 'desc' },
      take: 50,
    });
    return {
      succes: true,
      message:
        role === Role.INDEPENDANT
          ? `${commissions.length} commission(s).`
          : `${commissions.length} élément(s) de performance.`,
      donnees: {
        peutRetirer: role === Role.INDEPENDANT,
        libelle:
          role === Role.INDEPENDANT
            ? 'Historique des gains'
            : role === Role.AGENT
              ? 'Historique des primes estimées'
              : 'Historique bonus/statistiques',
        commissions,
      },
    };
  }

  // ─── POST /commissions/retirer ─────────────────────
  async retirer(utilisateurId: string, role: Role, dto: RetirerCommissionDto) {
    if (role !== Role.INDEPENDANT) {
      throw new ForbiddenException({
        message:
          role === Role.AGENT
            ? "Les agents salariés ne peuvent pas retirer de primes dans l'application. Le paiement est traité par l'administration."
            : 'Les superviseurs ne peuvent pas effectuer de retrait de commissions.',
        code: 'CASHOUT_NON_AUTORISE',
        donnees: {
          peutRetirer: false,
          role,
          paiement: 'ADMINISTRATION',
        },
      });
    }

    const agent = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: {
        id: true,
        nom: true,
        role: true,
        telephone: true,
        soldeCommissionFcfa: true,
      },
    });
    if (!agent) throw new BadRequestException('Agent introuvable');
    if (agent.role !== Role.INDEPENDANT) {
      throw new ForbiddenException({
        message: 'Seul un collecteur indépendant peut retirer ses commissions.',
        code: 'ROLE_CASHOUT_INVALIDE',
      });
    }
    if (agent.soldeCommissionFcfa < dto.montant) {
      throw new BadRequestException({
        message: `Solde insuffisant. Disponible: ${agent.soldeCommissionFcfa} FCFA`,
        code: 'SOLDE_INSUFFISANT',
      });
    }

    const telephone = dto.telephone ?? agent.telephone;
    const transfert = this.kkiapay.initierTransfert({
      montant: dto.montant,
      telephone,
      reference: `comm_${utilisateurId}_${Date.now()}`,
      motif: 'Retrait commission TontineBénin',
    });

    if (!transfert.succes) {
      throw new BadRequestException({
        message: 'Échec du transfert',
        code: 'TRANSFERT_ECHOUE',
      });
    }

    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { soldeCommissionFcfa: { decrement: dto.montant } },
    });

    return {
      succes: true,
      message: `${dto.montant} FCFA transférés vers ${telephone}.`,
      donnees: {
        montant: dto.montant,
        telephone,
        refKKiaPay: transfert.refKKiaPay,
        soldeRestant: agent.soldeCommissionFcfa - dto.montant,
      },
    };
  }

  private verifierRoleFinanceTerrain(role: Role) {
    if (
      !([Role.AGENT, Role.INDEPENDANT, Role.SUPERVISEUR] as Role[]).includes(
        role,
      )
    ) {
      throw new ForbiddenException({
        message: 'Accès réservé aux rôles terrain',
        code: 'ROLE_INSUFFISANT',
      });
    }
  }

  private prochainePaieEstimee() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(5);
    date.setHours(9, 0, 0, 0);
    return date;
  }

  private presenterFinancesParRole(
    role: Role,
    base: {
      nom?: string;
      soldeDisponible: number;
      totalGagne: number;
      nombreTransactions: number;
      tauxCommission: string;
    },
  ) {
    this.verifierRoleFinanceTerrain(role);
    if (role === Role.INDEPENDANT) {
      return {
        ...base,
        type: 'COMMISSIONS_INDEPENDANT',
        peutRetirer: true,
        modePaiement: 'MOBILE_MONEY',
        libellePrincipal: 'Commissions disponibles',
      };
    }

    if (role === Role.AGENT) {
      return {
        nom: base.nom,
        type: 'PRIME_AGENT',
        peutRetirer: false,
        soldeDisponible: 0,
        primeEstimee: base.totalGagne,
        totalGagne: base.totalGagne,
        nombreTransactions: base.nombreTransactions,
        paiementAdministration: true,
        prochainePaieEstimee: this.prochainePaieEstimee(),
        libellePrincipal: 'Prime estimée',
        messagePaie:
          "Paiement traité par l'administration selon validation mensuelle.",
      };
    }

    return {
      nom: base.nom,
      type: 'BONUS_SUPERVISEUR',
      peutRetirer: false,
      soldeDisponible: 0,
      bonusEstime: base.totalGagne,
      totalGagne: base.totalGagne,
      nombreTransactions: base.nombreTransactions,
      paiementAdministration: true,
      prochainePaieEstimee: this.prochainePaieEstimee(),
      libellePrincipal: 'Bonus/statistiques superviseur',
      messagePaie:
        "Bonus traité par l'administration. Aucun cashout superviseur dans l'application.",
    };
  }
}
