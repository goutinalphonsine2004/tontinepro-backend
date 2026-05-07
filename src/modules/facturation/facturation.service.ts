import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BUSINESS } from '../../common/constants/business.constants';
import { PayerAbonnementDto } from './dto/payer-abonnement.dto';

const MONTANTS: Record<string, number> = {
  STANDARD: BUSINESS.ABONNEMENT_STANDARD,
  PRO: BUSINESS.ABONNEMENT_PRO,
};

@Injectable()
export class FacturationService {
  constructor(private prisma: PrismaService) {}

  // ─── GET /facturation/mon-statut ──────────────────
  async monStatut(utilisateurId: string, role: Role) {
    if (!([Role.AGENT, Role.INDEPENDANT] as Role[]).includes(role)) {
      throw new BadRequestException({ message: 'Seuls les collecteurs ont une facturation', code: 'ROLE_INSUFFISANT' });
    }

    const facturation = await this.prisma.facturationAgent.findUnique({
      where: { agentId: utilisateurId },
    });

    if (!facturation) {
      // Créer facturation STANDARD par défaut
      const prochainPaiement = new Date();
      prochainPaiement.setMonth(prochainPaiement.getMonth() + 1);
      const fact = await this.prisma.facturationAgent.create({
        data: {
          agentId: utilisateurId,
          plan: 'STANDARD',
          fraisMensuels: BUSINESS.ABONNEMENT_STANDARD,
          fraisParClient: 10,
          prochainPaiement,
          actif: true,
        },
      });
      return { succes: true, message: 'Facturation STANDARD initialisée.', donnees: fact };
    }

    return { succes: true, message: 'Statut de facturation récupéré.', donnees: facturation };
  }

  // ─── POST /facturation/payer-abonnement ───────────
  async payerAbonnement(utilisateurId: string, dto: PayerAbonnementDto) {
    const montant = MONTANTS[dto.plan];
    const prochainPaiement = new Date();
    prochainPaiement.setMonth(prochainPaiement.getMonth() + 1);

    const facturation = await this.prisma.facturationAgent.upsert({
      where: { agentId: utilisateurId },
      create: {
        agentId: utilisateurId,
        plan: dto.plan,
        fraisMensuels: montant,
        fraisParClient: 10,
        dernierPaiement: new Date(),
        prochainPaiement,
        actif: true,
      },
      update: {
        plan: dto.plan,
        fraisMensuels: montant,
        dernierPaiement: new Date(),
        prochainPaiement,
        actif: true,
      },
    });

    return {
      succes: true,
      message: `Abonnement ${dto.plan} payé — ${montant} FCFA. Prochain paiement: ${prochainPaiement.toLocaleDateString('fr-FR')}.`,
      donnees: facturation,
    };
  }

  // ─── PUT /facturation/upgrader ────────────────────
  async upgrader(utilisateurId: string) {
    const facturation = await this.prisma.facturationAgent.findUnique({ where: { agentId: utilisateurId } });
    if (!facturation) throw new NotFoundException('Aucune facturation trouvée. Payez d\'abord un abonnement.');
    if (facturation.plan === 'PRO') {
      throw new BadRequestException({ message: 'Vous êtes déjà sur le plan PRO', code: 'DEJA_PRO' });
    }

    const prochainPaiement = new Date();
    prochainPaiement.setMonth(prochainPaiement.getMonth() + 1);

    const maj = await this.prisma.facturationAgent.update({
      where: { agentId: utilisateurId },
      data: {
        plan: 'PRO',
        fraisMensuels: BUSINESS.ABONNEMENT_PRO,
        dernierPaiement: new Date(),
        prochainPaiement,
      },
    });

    return {
      succes: true,
      message: `Passage au plan PRO — ${BUSINESS.ABONNEMENT_PRO} FCFA/mois.`,
      donnees: maj,
    };
  }

  // ─── GET /facturation/tous (Admin) ────────────────
  async tous() {
    const facturations = await this.prisma.facturationAgent.findMany({
      include: { agent: { select: { id: true, nom: true, telephone: true, role: true } } },
      orderBy: { prochainPaiement: 'asc' },
    });
    const totalMensuel = facturations.reduce((s, f) => s + f.fraisMensuels, 0);
    return {
      succes: true,
      message: `${facturations.length} facturation(s). Total mensuel: ${totalMensuel} FCFA.`,
      donnees: { facturations, totalMensuel },
    };
  }
}
