import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, StatutCompte } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ModifierProfilDto } from './dto/modifier-profil.dto';
import { ChangerPinDto } from './dto/changer-pin.dto';
import { FiltrerUtilisateursDto } from './dto/filtrer-utilisateurs.dto';
import { ChangerStatutDto } from './dto/changer-statut.dto';
import { ChangerRoleDto } from './dto/changer-role.dto';
import { ConfigurerEmpreinteDto } from './dto/configurer-empreinte.dto';

const SELECT_PROFIL = {
  id: true,
  telephone: true,
  nom: true,
  photo: true,
  role: true,
  typeCollecteur: true,
  statut: true,
  empreinteActive: true,
  kycVerifie: true,
  soldeCommissionFcfa: true,
  montantCautionFcfa: true,
  zoneId: true,
  collecteurId: true,
  creeLe: true,
  misAJourLe: true,
};

@Injectable()
export class UtilisateursService {
  constructor(private prisma: PrismaService) {}

  // ─── GET /utilisateurs/profil ──────────────────────
  async getProfil(utilisateurId: string) {
    const u = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: SELECT_PROFIL,
    });
    if (!u) throw new NotFoundException('Utilisateur introuvable');
    return { succes: true, message: 'Profil récupéré.', donnees: u };
  }

  // ─── GET /utilisateurs/mon-qr-code ─────────────────
  async monQrCode(utilisateurId: string) {
    const u = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { id: true, nom: true, telephone: true },
    });
    if (!u) throw new NotFoundException('Utilisateur introuvable');

    // Générer un code QR basé sur l'ID utilisateur
    const codeQR = `TONTINEPRO-CLIENT-${u.id}`;
    const expireLe = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    return {
      succes: true,
      message: 'QR code personnel généré.',
      donnees: {
        codeQR,
        expireLe,
        actif: true,
      },
    };
  }

  // ─── PUT /utilisateurs/profil ──────────────────────
  async modifierProfil(utilisateurId: string, dto: ModifierProfilDto) {
    if (!dto.nom && !dto.photo) {
      throw new BadRequestException('Au moins un champ à modifier est requis');
    }
    const u = await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: {
        ...(dto.nom && { nom: dto.nom }),
        ...(dto.photo && { photo: dto.photo }),
      },
      select: SELECT_PROFIL,
    });
    return { succes: true, message: 'Profil mis à jour.', donnees: u };
  }

  // ─── PUT /utilisateurs/pin ─────────────────────────
  async changerPin(utilisateurId: string, dto: ChangerPinDto) {
    const u = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });
    if (!u || !u.pinHash)
      throw new NotFoundException('Utilisateur introuvable');

    const valide = await bcrypt.compare(dto.ancienPin, u.pinHash);
    if (!valide) {
      throw new BadRequestException({
        message: 'Ancien PIN incorrect',
        code: 'PIN_INCORRECT',
      });
    }
    const pinHash = await bcrypt.hash(dto.nouveauPin, 10);
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { pinHash },
    });
    return { succes: true, message: 'PIN modifié avec succès.' };
  }

  // ─── PUT /utilisateurs/empreinte ───────────────────
  async configurerEmpreinte(
    utilisateurId: string,
    dto: ConfigurerEmpreinteDto,
  ) {
    const u = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });
    if (!u || !u.pinHash)
      throw new NotFoundException('Utilisateur introuvable');
    if (u.statut !== StatutCompte.ACTIF) {
      throw new ForbiddenException({
        message: 'Seul un compte actif peut modifier l’empreinte digitale',
        code: 'COMPTE_INACTIF',
      });
    }

    const pinValide = await bcrypt.compare(dto.pin, u.pinHash);
    if (!pinValide) {
      throw new BadRequestException({
        message: 'PIN incorrect',
        code: 'PIN_INCORRECT',
      });
    }

    const utilisateur = await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { empreinteActive: dto.actif },
      select: SELECT_PROFIL,
    });

    return {
      succes: true,
      message: dto.actif
        ? 'Empreinte digitale activée.'
        : 'Empreinte digitale désactivée.',
      donnees: utilisateur,
    };
  }

  // ─── GET /utilisateurs (Admin) ─────────────────────
  async listerUtilisateurs(dto: FiltrerUtilisateursDto) {
    const page = dto.page ?? 1;
    const limite = dto.limite ?? 20;
    const skip = (page - 1) * limite;

    const where: Record<string, unknown> = {};
    if (dto.role) where.role = dto.role;
    if (dto.statut) where.statut = dto.statut;
    if (dto.recherche) {
      where.OR = [
        { nom: { contains: dto.recherche, mode: 'insensitive' } },
        { telephone: { contains: dto.recherche } },
      ];
    }

    const [total, utilisateurs] = await Promise.all([
      this.prisma.utilisateur.count({ where }),
      this.prisma.utilisateur.findMany({
        where,
        select: SELECT_PROFIL,
        skip,
        take: limite,
        orderBy: { creeLe: 'desc' },
      }),
    ]);

    return {
      succes: true,
      message: `${total} utilisateur(s) trouvé(s).`,
      donnees: {
        utilisateurs,
        total,
        page,
        limite,
        pages: Math.ceil(total / limite),
      },
    };
  }

  // ─── PUT /utilisateurs/:id/statut (Admin) ──────────
  async changerStatut(adminId: string, cibleId: string, dto: ChangerStatutDto) {
    if (adminId === cibleId) {
      throw new ForbiddenException(
        'Impossible de modifier votre propre statut',
      );
    }
    const cible = await this.prisma.utilisateur.findUnique({
      where: { id: cibleId },
      select: { id: true, role: true },
    });
    if (!cible) throw new NotFoundException('Utilisateur introuvable');
    if (cible.role === Role.ADMIN) {
      throw new ForbiddenException(
        "Impossible de modifier le statut d'un Admin",
      );
    }
    const u = await this.prisma.utilisateur.update({
      where: { id: cibleId },
      data: { statut: dto.statut },
      select: SELECT_PROFIL,
    });
    return {
      succes: true,
      message: `Statut mis à jour → ${dto.statut}.`,
      donnees: u,
    };
  }

  // ─── PUT /utilisateurs/:id/role (Admin) ────────────
  async changerRole(adminId: string, cibleId: string, dto: ChangerRoleDto) {
    if (adminId === cibleId) {
      throw new ForbiddenException('Impossible de modifier votre propre rôle');
    }
    const cible = await this.prisma.utilisateur.findUnique({
      where: { id: cibleId },
      select: { id: true },
    });
    if (!cible) throw new NotFoundException('Utilisateur introuvable');

    const u = await this.prisma.utilisateur.update({
      where: { id: cibleId },
      data: { role: dto.role },
      select: SELECT_PROFIL,
    });
    return {
      succes: true,
      message: `Rôle mis à jour → ${dto.role}.`,
      donnees: u,
    };
  }

  async assignerSuperviseur(
    adminId: string,
    agentId: string,
    superviseurId: string | null,
  ) {
    const agent = await this.prisma.utilisateur.findUnique({
      where: { id: agentId },
      select: { id: true, role: true },
    });
    if (!agent) throw new NotFoundException('Agent introuvable');
    if (!([Role.AGENT, Role.INDEPENDANT] as any[]).includes(agent.role)) {
      throw new BadRequestException(
        'Seul un collecteur (Agent ou Indépendant) peut avoir un superviseur',
      );
    }

    if (superviseurId) {
      const superviseur = await this.prisma.utilisateur.findUnique({
        where: { id: superviseurId },
        select: { id: true, role: true },
      });
      if (!superviseur) throw new NotFoundException('Superviseur introuvable');
      if (superviseur.role !== Role.SUPERVISEUR) {
        throw new BadRequestException(
          "L'utilisateur spécifié n'est pas un superviseur",
        );
      }
    }

    await this.prisma.utilisateur.update({
      where: { id: agentId },
      data: { superviseurId },
    });

    return {
      succes: true,
      message: superviseurId
        ? 'Superviseur assigné avec succès'
        : 'Superviseur retiré avec succès',
    };
  }

  // ─── GET /utilisateurs/mon-dashboard ──────────────
  async monDashboard(clientId: string) {
    const maintenant = new Date();
    const sixMoisDate = new Date(maintenant);
    sixMoisDate.setMonth(sixMoisDate.getMonth() - 5);
    sixMoisDate.setDate(1);

    const [
      utilisateur,
      scoreCredit,
      badge,
      dernieresTransactions,
      creditActif,
      prochainsGroupes,
    ] = await Promise.all([
      this.prisma.utilisateur.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          nom: true,
          photo: true,
          telephone: true,
          tontines: {
            select: {
              id: true,
              nom: true,
              soldeActuelFcfa: true,
              objectifMontantFcfa: true,
              montantJournalierFcfa: true,
              type: true,
              dateDeverrouillage: true,
            },
          },
        },
      }),
      this.prisma.scoreCredit.findUnique({
        where: { utilisateurId: clientId },
      }),
      this.prisma.badgeClient.findFirst({
        where: { clientId },
        orderBy: { obtenuLe: 'desc' },
      }),
      this.prisma.transaction.findMany({
        where: { utilisateurId: clientId },
        orderBy: { creeLe: 'desc' },
        take: 5,
        include: { tontine: { select: { nom: true } } },
      }),
      this.prisma.microCredit.findFirst({
        where: { clientId, statut: { in: ['ACTIF'] as any } },
        select: {
          id: true,
          montantRestantFcfa: true,
          paiementJournalierFcfa: true,
          joursPayes: true,
          totalJours: true,
        },
      }),
      this.prisma.ordreTirage.findMany({
        where: { utilisateurId: clientId, aRecu: false },
        include: {
          tontine: { select: { id: true, nom: true, montantJournalierFcfa: true } },
        },
        orderBy: { position: 'asc' },
        take: 1,
      }),
    ]);

    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');

    // Graphique épargne 6 mois
    const cotisations6mois = await this.prisma.transaction.findMany({
      where: {
        utilisateurId: clientId,
        type: 'COTISATION' as any,
        statut: 'SUCCES' as any,
        creeLe: { gte: sixMoisDate },
      },
      select: { montantNetFcfa: true, creeLe: true },
    });

    const graphique: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(maintenant);
      d.setMonth(d.getMonth() - i);
      graphique[
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      ] = 0;
    }
    for (const tx of cotisations6mois) {
      const key = `${tx.creeLe.getFullYear()}-${String(tx.creeLe.getMonth() + 1).padStart(2, '0')}`;
      if (graphique[key] !== undefined) graphique[key] += tx.montantNetFcfa;
    }

    const soldeTotal = utilisateur.tontines.reduce(
      (s, t) => s + t.soldeActuelFcfa,
      0,
    );
    const score = scoreCredit?.score ?? 0;
    const eligibleMicroCredit = scoreCredit?.eligibleMicroCredit ?? false;
    const eligiblePADME = scoreCredit?.eligiblePADME ?? false;

    return {
      succes: true,
      message: 'Tableau de bord récupéré.',
      donnees: {
        profil: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          photo: utilisateur.photo,
        },
        soldeTotal,
        tontines: utilisateur.tontines,
        graphiqueEpargne: Object.entries(graphique).map(([mois, montantFcfa]) => ({
          mois,
          montantFcfa: Math.round(montantFcfa),
        })),
        badge: badge
          ? { niveau: badge.niveau, obtenuLe: badge.obtenuLe }
          : null,
        score: {
          valeur: score,
          eligibleMicroCredit,
          eligiblePADME,
          dernierCalcul: scoreCredit?.dernierCalcul ?? null,
        },
        creditActif,
        alertes: {
          microCreditDisponible: eligibleMicroCredit && !creditActif,
          eligiblePADME,
        },
        prochaineDistribution: prochainsGroupes[0] ?? null,
        dernieresTransactions,
      },
    };
  }

  // ─── DELETE /utilisateurs/:id (Admin) ──────────────
  async supprimerUtilisateur(adminId: string, cibleId: string) {
    if (adminId === cibleId) {
      throw new ForbiddenException(
        'Impossible de supprimer votre propre compte',
      );
    }
    const cible = await this.prisma.utilisateur.findUnique({
      where: { id: cibleId },
      include: {
        _count: {
          select: { transactions: true, tontines: true, microCredits: true },
        },
      },
    });
    if (!cible) throw new NotFoundException('Utilisateur introuvable');
    if (cible.role === Role.ADMIN) {
      throw new ForbiddenException('Impossible de supprimer un Admin');
    }
    if (
      cible._count.transactions > 0 ||
      cible._count.tontines > 0 ||
      cible._count.microCredits > 0
    ) {
      // Soft delete : bannissement (intégrité des données financières)
      await this.prisma.utilisateur.update({
        where: { id: cibleId },
        data: { statut: StatutCompte.BANNI },
      });
      return {
        succes: true,
        message: 'Compte banni (données financières conservées).',
        donnees: { id: cibleId },
      };
    }
    await this.prisma.utilisateur.delete({ where: { id: cibleId } });
    return {
      succes: true,
      message: 'Utilisateur supprimé définitivement.',
      donnees: { id: cibleId },
    };
  }

  // ─── PUT /utilisateurs/:id/reassigner (Admin/Superviseur) ──
  async reassignerClient(
    clientId: string,
    nouveauCollecteurId: string,
    adminId: string,
  ) {
    const client = await this.prisma.utilisateur.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        nom: true,
        telephone: true,
        collecteurId: true,
        role: true,
      },
    });
    if (!client) throw new NotFoundException('Client introuvable');
    if (client.role !== Role.CLIENT) {
      throw new BadRequestException({
        message: 'Seul un client peut être réassigné',
        code: 'ROLE_INVALIDE',
      });
    }

    const nouveauCollecteur = await this.prisma.utilisateur.findUnique({
      where: { id: nouveauCollecteurId },
      select: { id: true, nom: true, role: true, statut: true },
    });
    if (!nouveauCollecteur)
      throw new NotFoundException('Nouveau collecteur introuvable');
    if (
      !([Role.AGENT, Role.INDEPENDANT] as any[]).includes(
        nouveauCollecteur.role,
      )
    ) {
      throw new BadRequestException({
        message: 'Le destinataire doit être un collecteur',
        code: 'ROLE_INVALIDE',
      });
    }
    if (nouveauCollecteur.statut !== StatutCompte.ACTIF) {
      throw new BadRequestException({
        message: 'Collecteur inactif',
        code: 'COLLECTEUR_INACTIF',
      });
    }

    const ancienCollecteurId = client.collecteurId;
    await this.prisma.utilisateur.update({
      where: { id: clientId },
      data: { collecteurId: nouveauCollecteurId },
    });

    // Journaliser la réassignation
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId: adminId,
        action: 'REASSIGNER_CLIENT',
        details: JSON.stringify({
          clientId,
          clientNom: client.nom,
          ancienCollecteurId,
          nouveauCollecteurId,
          nouveauCollecteurNom: nouveauCollecteur.nom,
        }),
      },
    });

    return {
      succes: true,
      message: `${client.nom} réassigné à ${nouveauCollecteur.nom}.`,
      donnees: { clientId, ancienCollecteurId, nouveauCollecteurId },
    };
  }

  // ─── DELETE /utilisateurs/mon-compte ──────────────
  // Le client supprime lui-même son propre compte
  async supprimerMonCompte(clientId: string, pin: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: clientId },
      include: {
        _count: { select: { microCredits: true } },
        tontines: { select: { soldeActuelFcfa: true } },
      },
    });
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');

    // Vérifier le PIN avant suppression
    const pinValide = await bcrypt.compare(pin, utilisateur.pinHash ?? '');
    if (!pinValide) {
      throw new UnauthorizedException({
        message: 'Code PIN incorrect',
        code: 'PIN_INVALIDE',
      });
    }

    // Bloquer si solde non nul
    const soldeTotal = utilisateur.tontines.reduce(
      (s, t) => s + t.soldeActuelFcfa,
      0,
    );
    if (soldeTotal > 0) {
      throw new BadRequestException({
        message: `Impossible de supprimer votre compte : vous avez ${soldeTotal} FCFA de solde. Faites d'abord un retrait.`,
        code: 'SOLDE_NON_NUL',
      });
    }

    // Bloquer si crédit actif
    const creditActif = await this.prisma.microCredit.findFirst({
      where: { clientId, statut: { in: ['ACTIF', 'EN_DEFAUT'] as any } },
    });
    if (creditActif) {
      throw new BadRequestException({
        message:
          'Impossible de supprimer votre compte : vous avez un micro-crédit en cours.',
        code: 'CREDIT_ACTIF',
      });
    }

    // Soft-delete si historique financier (intégrité comptable)
    const aHistorique = utilisateur._count.microCredits > 0;
    if (aHistorique) {
      await this.prisma.utilisateur.update({
        where: { id: clientId },
        data: {
          statut: StatutCompte.BANNI,
          nom: '[Compte supprimé]',
          telephone: `DELETED_${clientId}`,
        },
      });
      return {
        succes: true,
        message: 'Compte supprimé. Vos données financières sont anonymisées.',
      };
    }

    await this.prisma.utilisateur.delete({ where: { id: clientId } });
    return { succes: true, message: 'Compte supprimé définitivement.' };
  }

  // ─── GET /utilisateurs/mes-stats ──────────────────
  async mesStats(clientId: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        _count: {
          select: {
            tontines: true,
            transactions: true,
            retraits: true,
          },
        },
      },
    });

    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');

    // Calculer solde total et régularité
    const transactions = await this.prisma.transaction.findMany({
      where: { utilisateurId: clientId },
      select: { montantFcfa: true, creeLe: true },
    });

    const retraits = await this.prisma.retrait.findMany({
      where: { utilisateurId: clientId },
      select: { montantFcfa: true, statut: true },
    });

    const soldeTotal = transactions.reduce((acc, t) => acc + t.montantFcfa, 0) -
      retraits.reduce((acc, r) => acc + r.montantFcfa, 0);

    // Régularité = % de mois avec au moins 1 cotisation
    const moisActifs = new Set<string>();
    for (const t of transactions) {
      const mois = `${t.creeLe.getFullYear()}-${t.creeLe.getMonth()}`;
      moisActifs.add(mois);
    }
    
    // Derniers 12 mois
    const tauxRegularite = Math.min(
      100,
      Math.round((moisActifs.size / 12) * 100),
    );

    return {
      succes: true,
      message: 'Statistiques récupérées',
      donnees: {
        totalTontines: utilisateur._count.tontines,
        totalCotisations: utilisateur._count.transactions,
        totalRetraits: utilisateur._count.retraits,
        soldeTotal,
        tauxRegularite,
      },
    };
  }
}
