import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  FrequenceTontine,
  ModeTirageGroupe,
  PolitiqueRetrait,
  Role,
  StatutMembreGroupe,
  StatutTontine,
  TypeNotification,
  TypeTontine,
  TypeTransaction,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { BUSINESS } from '../../common/constants/business.constants';
import { CreerTontineDto } from './dto/creer-tontine.dto';
import { ModifierTontineDto } from './dto/modifier-tontine.dto';
import { RejoindreTonitneDto } from './dto/rejoindre-tontine.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TontinesService {
  private readonly logger = new Logger(TontinesService.name);

  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
    @Inject(forwardRef(() => NotificationsService))
    private notifications: NotificationsService,
  ) {}

  // ─── POST /tontines ────────────────────────────────
  async creer(requesterId: string, dto: CreerTontineDto) {
    const requester = await this.prisma.utilisateur.findUnique({
      where: { id: requesterId },
    });
    if (!requester) throw new NotFoundException('Requérant introuvable');

    let actualOwnerId = requesterId;

    // Si initié par un collecteur pour un client (Création assistée)
    if (dto.clientId && dto.clientId !== requesterId) {
      if (
        !([Role.AGENT, Role.INDEPENDANT] as Role[]).includes(requester.role)
      ) {
        throw new ForbiddenException(
          'Seuls les collecteurs peuvent créer une tontine pour un tiers.',
        );
      }
      const client = await this.prisma.utilisateur.findUnique({
        where: { id: dto.clientId },
      });
      if (!client) throw new NotFoundException('Client introuvable');
      if (client.collecteurId !== requesterId) {
        throw new ForbiddenException(
          "Ce client n'est pas dans votre portefeuille.",
        );
      }
      actualOwnerId = dto.clientId;
    }

    // PROJET : dateFin + objectifMontantFcfa obligatoires
    if (dto.type === TypeTontine.PROJET) {
      if (!dto.dateFin) {
        throw new BadRequestException({
          message: 'Une tontine de type PROJET doit avoir une dateFin.',
          code: 'DATE_FIN_REQUISE',
        });
      }
      if (!dto.objectifMontantFcfa) {
        throw new BadRequestException({
          message:
            'Une tontine de type PROJET doit avoir un objectifMontantFcfa.',
          code: 'OBJECTIF_REQUIS',
        });
      }
      if (new Date(dto.dateFin) <= new Date()) {
        throw new BadRequestException({
          message: 'La dateFin doit être dans le futur.',
          code: 'DATE_FIN_INVALIDE',
        });
      }
    }

    // DATE_FIXE : jourFixe obligatoire
    if (dto.frequence === FrequenceTontine.DATE_FIXE && !dto.jourFixe) {
      throw new BadRequestException({
        message: 'La fréquence DATE_FIXE exige un jourFixe (1-28).',
        code: 'JOUR_FIXE_REQUIS',
      });
    }

    this.verifierConfigurationGroupe(dto);

    this.verifierConfigurationPolitiqueRetrait({
      politique: dto.politique ?? PolitiqueRetrait.FLEXIBLE,
      dateDeverrouillage: dto.dateDeverrouillage,
      objectifMontantFcfa: dto.objectifMontantFcfa,
      montantJournalierFcfa: dto.montantJournalierFcfa ?? 500,
      frequence: dto.frequence ?? FrequenceTontine.MENSUEL,
    });

    const dateProchaineCotisation = this.calculerProchaineDateCotisation(
      dto.frequence ?? FrequenceTontine.MENSUEL,
      dto.jourFixe,
    );

    // Gérer le code d'invitation pour les groupes
    let codeInvitation: string | undefined;
    let qrInvitation: string | undefined;
    if (dto.type === TypeTontine.GROUPE) {
      codeInvitation = Math.random().toString(36).substring(2, 8).toUpperCase();
      qrInvitation = this.genererPayloadInvitation(codeInvitation);
    }

    const tontine = await this.prisma.tontine.create({
      data: {
        nom: dto.nom,
        description: dto.description,
        type: dto.type ?? TypeTontine.PERSONNEL,
        statut: StatutTontine.CREATION,
        frequence: dto.frequence ?? FrequenceTontine.MENSUEL,
        jourFixe: dto.jourFixe,
        politique: dto.politique ?? PolitiqueRetrait.FLEXIBLE,
        objectifMontantFcfa: dto.objectifMontantFcfa,
        montantJournalierFcfa: dto.montantJournalierFcfa ?? 500,
        dateDeverrouillage: dto.dateDeverrouillage,
        dateFin: dto.dateFin,
        dateProchaineCotisation,
        codeInvitation,
        qrInvitation,
        nbMembresMax:
          dto.type === TypeTontine.GROUPE ? dto.nbMembresMax : undefined,
        montantParMembreFcfa:
          dto.type === TypeTontine.GROUPE
            ? (dto.montantParMembreFcfa ?? dto.montantJournalierFcfa ?? 500)
            : undefined,
        cautionObligatoire:
          dto.type === TypeTontine.GROUPE
            ? (dto.cautionObligatoire ?? false)
            : false,
        montantCautionObligatoireFcfa:
          dto.type === TypeTontine.GROUPE
            ? (dto.montantCautionFcfaObligatoireFcfa ?? 0)
            : 0,
        penaliteRetardActive:
          dto.type === TypeTontine.GROUPE
            ? (dto.penaliteRetardActive ?? false)
            : false,
        montantPenaliteRetardFcfa:
          dto.type === TypeTontine.GROUPE
            ? (dto.montantPenaliteRetardFcfa ?? 0)
            : 0,
        modeTirage:
          dto.type === TypeTontine.GROUPE
            ? (dto.modeTirage ?? ModeTirageGroupe.MANUEL)
            : ModeTirageGroupe.MANUEL,
        proprietaireId: actualOwnerId,
      },
      include: {
        proprietaire: { select: { id: true, nom: true, telephone: true } },
      },
    });

    // Notification push création
    this.notifications.envoyerAUtilisateur(
      actualOwnerId,
      '🎉 Tontine créée !',
      `"${tontine.nom}" a été créée. Activez-la pour commencer les cotisations.`,
    ).catch(() => {});

    return {
      succes: true,
      message:
        'Tontine créée (statut: CREATION). Invitez vos membres puis activez-la.',
      donnees: tontine,
    };
  }

  // ─── POST /tontines/:id/activer ────────────────────
  // Transition CREATION → ACTIVE
  async activerTontine(id: string, proprietaireId: string) {
    const t = await this.prisma.tontine.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId)
      throw new ForbiddenException(
        'Seul le propriétaire peut activer cette tontine',
      );

    if (t.statut !== StatutTontine.CREATION) {
      throw new BadRequestException({
        message: `La tontine est en statut ${t.statut}. Seule une tontine CREATION peut être activée.`,
        code: 'TRANSITION_INVALIDE',
      });
    }

    // GROUPE : minimum 2 membres
    if (t.type === TypeTontine.GROUPE) {
      const nbMembres = await this.prisma.membreTontineGroupe.count({
        where: { tontineId: id, statut: StatutMembreGroupe.ACTIF },
      });
      if (nbMembres < 2) {
        throw new BadRequestException({
          message: `Une tontine GROUPE nécessite au minimum 2 membres avant activation (actuellement ${nbMembres}).`,
          code: 'MEMBRES_INSUFFISANTS',
        });
      }
      if (t.modeTirage === ModeTirageGroupe.ALEATOIRE) {
        await this.randomiserOrdreTirage(id, proprietaireId);
      } else {
        const nbOrdres = await this.prisma.ordreTirage.count({
          where: { tontineId: id },
        });
        if (nbOrdres < nbMembres) {
          throw new BadRequestException({
            message:
              'Définissez l’ordre de passage de tous les membres avant activation.',
            code: 'ORDRE_TIRAGE_INCOMPLET',
          });
        }
      }
    }

    // PROJET : dateFin dans le futur
    if (t.type === TypeTontine.PROJET) {
      if (!t.dateFin) {
        throw new BadRequestException({
          message:
            "Impossible d'activer : dateFin manquante pour une tontine PROJET.",
          code: 'DATE_FIN_MANQUANTE',
        });
      }
      if (t.dateFin <= new Date()) {
        throw new BadRequestException({
          message: "Impossible d'activer : la dateFin est déjà passée.",
          code: 'DATE_FIN_PASSEE',
        });
      }
    }

    const maj = await this.prisma.tontine.update({
      where: { id },
      data: { statut: StatutTontine.ACTIVE },
    });

    // Notification push activation
    this.notifications.envoyerAUtilisateur(
      proprietaireId,
      '✅ Tontine activée !',
      `"${t.nom}" est maintenant active. Vous pouvez commencer à cotiser.`,
    ).catch(() => {});

    return {
      succes: true,
      message: 'Tontine activée. Les cotisations sont maintenant possibles.',
      donnees: maj,
    };
  }

  // ─── POST /tontines/:id/terminer ───────────────────
  // Transition ACTIVE → TERMINEE (manuelle)
  async terminerTontine(id: string, proprietaireId: string) {
    const t = await this.prisma.tontine.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId)
      throw new ForbiddenException(
        'Seul le propriétaire peut terminer cette tontine',
      );

    if (t.statut !== StatutTontine.ACTIVE) {
      throw new BadRequestException({
        message: `La tontine est en statut ${t.statut}. Seule une tontine ACTIVE peut être terminée manuellement.`,
        code: 'TRANSITION_INVALIDE',
      });
    }

    // GROUPE : tous les membres doivent avoir reçu
    if (t.type === TypeTontine.GROUPE) {
      const membresSansDistribution = await this.prisma.ordreTirage.count({
        where: { tontineId: id, aRecu: false },
      });
      if (membresSansDistribution > 0) {
        throw new BadRequestException({
          message: `${membresSansDistribution} membre(s) n'ont pas encore reçu leur distribution. Terminez le cycle avant de clôturer.`,
          code: 'CYCLE_INCOMPLET',
        });
      }
    }

    if (t.soldeActuelFcfa > 0) {
      throw new BadRequestException({
        message: `Solde restant de ${t.soldeActuelFcfa} FCFA. Effectuez d'abord un retrait total.`,
        code: 'SOLDE_NON_NUL',
      });
    }

    const maj = await this.prisma.tontine.update({
      where: { id },
      data: { statut: StatutTontine.TERMINEE },
    });

    return {
      succes: true,
      message: 'Tontine clôturée définitivement.',
      donnees: maj,
    };
  }

  // ─── POST /tontines/:id/suspendre ──────────────────
  async suspendre(id: string, proprietaireId: string) {
    const t = await this.prisma.tontine.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId)
      throw new ForbiddenException(
        'Seul le propriétaire peut suspendre cette tontine',
      );
    if (t.statut !== StatutTontine.ACTIVE)
      throw new BadRequestException({
        message: 'Seule une tontine ACTIVE peut être suspendue.',
        code: 'TRANSITION_INVALIDE',
      });

    const maj = await this.prisma.tontine.update({
      where: { id },
      data: { statut: StatutTontine.SUSPENDUE },
    });
    return { succes: true, message: 'Tontine suspendue.', donnees: maj };
  }

  // ─── POST /tontines/:id/reactiver ──────────────────
  async reactiver(id: string, proprietaireId: string) {
    const t = await this.prisma.tontine.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId)
      throw new ForbiddenException(
        'Seul le propriétaire peut réactiver cette tontine',
      );
    if (t.statut !== StatutTontine.SUSPENDUE)
      throw new BadRequestException({
        message: 'Seule une tontine SUSPENDUE peut être réactivée.',
        code: 'TRANSITION_INVALIDE',
      });

    const maj = await this.prisma.tontine.update({
      where: { id },
      data: { statut: StatutTontine.ACTIVE },
    });
    return { succes: true, message: 'Tontine réactivée.', donnees: maj };
  }

  // ─── GET /tontines/mes-tontines ───────────────────
  async mesTontines(utilisateurId: string) {
    const [proprietes, membre] = await Promise.all([
      this.prisma.tontine.findMany({
        where: { proprietaireId: utilisateurId },
        include: { _count: { select: { membres: true, transactions: true } } },
        orderBy: { creeLe: 'desc' },
      }),
      this.prisma.membreTontineGroupe.findMany({
        where: { utilisateurId, statut: StatutMembreGroupe.ACTIF },
        include: {
          tontine: { include: { _count: { select: { membres: true } } } },
        },
      }),
    ]);
    return {
      succes: true,
      message: 'Tontines récupérées.',
      donnees: {
        proprietaire: proprietes,
        membre: membre.map((m) => ({
          ...m.tontine,
          monStatut: m.statut,
          caution: m.montantCautionFcfa,
        })),
      },
    };
  }

  // ─── GET /tontines/:id ─────────────────────────────
  async getTontine(id: string, utilisateurId: string) {
    const t = await this.prisma.tontine.findUnique({
      where: { id },
      include: {
        proprietaire: { select: { id: true, nom: true, telephone: true } },
        _count: { select: { membres: true, transactions: true } },
        membres: {
          include: {
            utilisateur: { select: { id: true, nom: true, telephone: true } },
          },
          orderBy: { rejointLe: 'asc' },
        },
      },
    });
    if (!t) throw new NotFoundException('Tontine introuvable');
    const estMembre = await this.prisma.membreTontineGroupe.findFirst({
      where: { tontineId: id, utilisateurId },
    });
    if (t.proprietaireId !== utilisateurId && !estMembre)
      throw new ForbiddenException('Accès refusé à cette tontine');

    // Formater la liste membres pour le client Flutter
    const membres = (t.membres ?? []).map((m) => ({
      id: m.utilisateurId,
      nom: m.utilisateur.nom,
      telephone: m.utilisateur.telephone,
      statut: m.statut,
      aRecu: false,
      ordrePassage: 0,
      nbCotisations: 0,
      estMoi: m.utilisateurId === utilisateurId,
    }));

    return {
      succes: true,
      message: 'Tontine récupérée.',
      donnees: { ...t, membres },
    };
  }

  // ─── PUT /tontines/:id ─────────────────────────────
  async modifier(id: string, proprietaireId: string, dto: ModifierTontineDto) {
    const t = await this.prisma.tontine.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId)
      throw new ForbiddenException(
        'Seul le propriétaire peut modifier cette tontine',
      );
    if (t.statut === StatutTontine.TERMINEE)
      throw new BadRequestException({
        message: 'Une tontine terminée ne peut plus être modifiée.',
        code: 'TONTINE_TERMINEE',
      });

    this.verifierConfigurationGroupe({
      ...dto,
      type: t.type,
      nbMembresMax: dto.nbMembresMax ?? t.nbMembresMax ?? undefined,
      montantParMembreFcfa:
        dto.montantParMembreFcfa ?? t.montantParMembreFcfa ?? undefined,
      cautionObligatoire: dto.cautionObligatoire ?? t.cautionObligatoire,
      montantCautionObligatoireFcfa:
        dto.montantCautionFcfaObligatoireFcfa ??
        t.montantCautionObligatoireFcfa,
      penaliteRetardActive: dto.penaliteRetardActive ?? t.penaliteRetardActive,
      montantPenaliteRetardFcfa:
        dto.montantPenaliteRetardFcfa ?? t.montantPenaliteRetardFcfa,
      modeTirage: dto.modeTirage ?? t.modeTirage,
    });

    this.verifierConfigurationPolitiqueRetrait({
      politique: dto.politique ?? t.politique,
      dateDeverrouillage:
        dto.dateDeverrouillage ?? t.dateDeverrouillage ?? undefined,
      objectifMontantFcfa:
        dto.objectifMontantFcfa ?? t.objectifMontantFcfa ?? undefined,
      montantJournalierFcfa:
        dto.montantJournalierFcfa ?? t.montantJournalierFcfa,
      frequence: dto.frequence ?? t.frequence,
    });

    const maj = await this.prisma.tontine.update({
      where: { id },
      data: {
        ...(dto.nom && { nom: dto.nom }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.politique && { politique: dto.politique }),
        ...(dto.frequence && { frequence: dto.frequence }),
        ...(dto.jourFixe !== undefined && { jourFixe: dto.jourFixe }),
        ...(dto.objectifMontantFcfa !== undefined && {
          objectifMontantFcfa: dto.objectifMontantFcfa,
        }),
        ...(dto.montantJournalierFcfa && {
          montantJournalierFcfa: dto.montantJournalierFcfa,
        }),
        ...(dto.dateDeverrouillage && {
          dateDeverrouillage: dto.dateDeverrouillage,
        }),
        ...(dto.dateFin && { dateFin: dto.dateFin }),
        ...(dto.nbMembresMax !== undefined && {
          nbMembresMax: dto.nbMembresMax,
        }),
        ...(dto.montantParMembreFcfa !== undefined && {
          montantParMembreFcfa: dto.montantParMembreFcfa,
        }),
        ...(dto.cautionObligatoire !== undefined && {
          cautionObligatoire: dto.cautionObligatoire,
        }),
        ...(dto.montantCautionFcfaObligatoireFcfa !== undefined && {
          montantCautionObligatoireFcfa: dto.montantCautionFcfaObligatoireFcfa,
        }),
        ...(dto.penaliteRetardActive !== undefined && {
          penaliteRetardActive: dto.penaliteRetardActive,
        }),
        ...(dto.montantPenaliteRetardFcfa !== undefined && {
          montantPenaliteRetardFcfa: dto.montantPenaliteRetardFcfa,
        }),
        ...(dto.modeTirage && { modeTirage: dto.modeTirage }),
      },
    });
    return { succes: true, message: 'Tontine mise à jour.', donnees: maj };
  }

  // ─── POST /tontines/:id/rejoindre ─────────────────
  // On ne peut rejoindre qu'une tontine GROUPE en phase CREATION
  async rejoindre(
    tontineId: string,
    utilisateurId: string,
    dto: RejoindreTonitneDto,
  ) {
    const t = await this.prisma.tontine.findUnique({
      where: { id: tontineId },
    });
    if (!t) throw new NotFoundException('Tontine introuvable');

    if (t.type !== TypeTontine.GROUPE) {
      throw new BadRequestException({
        message: 'Seules les tontines GROUPE peuvent être rejointes',
        code: 'TYPE_INVALIDE',
      });
    }
    if (t.statut !== StatutTontine.CREATION) {
      throw new BadRequestException({
        message:
          'Cette tontine a déjà démarré, vous ne pouvez plus la rejoindre.',
        code: 'TONTINE_DEJA_DEMARREE',
      });
    }
    if (t.proprietaireId === utilisateurId) {
      throw new BadRequestException({
        message: 'Vous êtes déjà propriétaire de cette tontine',
        code: 'DEJA_PROPRIETAIRE',
      });
    }

    const existant = await this.prisma.membreTontineGroupe.findUnique({
      where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
    });
    if (existant?.statut === StatutMembreGroupe.ACTIF) {
      throw new BadRequestException({
        message: 'Vous êtes déjà membre de cette tontine',
        code: 'DEJA_MEMBRE',
      });
    }

    const nbMembres = await this.prisma.membreTontineGroupe.count({
      where: { tontineId },
    });
    if (t.nbMembresMax && nbMembres >= t.nbMembresMax) {
      throw new BadRequestException({
        message: `Nombre maximum de membres atteint (${t.nbMembresMax}).`,
        code: 'GROUPE_COMPLET',
      });
    }

    if (
      t.cautionObligatoire &&
      (dto.montantCautionFcfa ?? 0) < t.montantCautionObligatoireFcfa
    ) {
      throw new BadRequestException({
        message: `Caution obligatoire de ${t.montantCautionObligatoireFcfa} FCFA requise.`,
        code: 'CAUTION_REQUISE',
      });
    }

    const membre = await this.prisma.membreTontineGroupe.upsert({
      where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
      create: {
        tontineId,
        utilisateurId,
        statut: StatutMembreGroupe.ACTIF,
        montantCautionFcfa: dto.montantCautionFcfa ?? 0,
        cautionBloquee: true,
      },
      update: {
        statut: StatutMembreGroupe.ACTIF,
        montantCautionFcfa: dto.montantCautionFcfa ?? 0,
      },
      include: {
        utilisateur: { select: { id: true, nom: true, collecteurId: true } },
      },
    });

    // Notifier l'équipe (Collecteur + Superviseur) si le client en a un
    if (membre.utilisateur.collecteurId) {
      await this.notifications.envoyerAEquipe(
        membre.utilisateur.collecteurId,
        'Nouveau membre de groupe',
        `Votre client ${membre.utilisateur.nom} vient de rejoindre le groupe '${t.nom}'.`,
      );
    }

    // Attribution d'un rang dans l'ordre de tirage
    const dejaOrdre = await this.prisma.ordreTirage.findFirst({
      where: { tontineId, utilisateurId },
    });
    if (!dejaOrdre) {
      try {
        const nbOrdres = await this.prisma.ordreTirage.count({
          where: { tontineId },
        });
        await this.prisma.ordreTirage.create({
          data: { tontineId, utilisateurId, position: nbOrdres + 1 },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Erreur notifications adhésion tontine ${tontineId}: ${message}`,
        );
      }
    }

    return {
      succes: true,
      message:
        "Vous avez rejoint la tontine. En attente d'activation par le propriétaire.",
      donnees: membre,
    };
  }

  // ─── Joindre via Code (QR ou Manuel) ──────────────
  async getDetailsParCode(code: string) {
    const t = await this.prisma.tontine.findUnique({
      where: { codeInvitation: code.toUpperCase() },
      include: { proprietaire: { select: { nom: true } } },
    });
    if (!t) throw new NotFoundException("Code d'invitation invalide");

    return {
      succes: true,
      message: 'Tontine trouvée.',
      donnees: {
        id: t.id,
        nom: t.nom,
        type: t.type,
        montantJournalierFcfa: t.montantJournalierFcfa,
        montantParMembreFcfa: t.montantParMembreFcfa,
        frequence: t.frequence,
        president: t.proprietaire.nom,
        statut: t.statut,
        cautionObligatoire: t.cautionObligatoire,
        montantCautionObligatoireFcfa: t.montantCautionObligatoireFcfa,
        nbMembresMax: t.nbMembresMax,
      },
    };
  }

  async rejoindreParCode(
    code: string,
    utilisateurId: string,
    dto: RejoindreTonitneDto,
  ) {
    const t = await this.prisma.tontine.findUnique({
      where: { codeInvitation: code.toUpperCase() },
    });
    if (!t) throw new NotFoundException("Code d'invitation invalide");

    return this.rejoindre(t.id, utilisateurId, dto);
  }

  // ─── POST /tontines/:id/quitter ───────────────────
  async quitter(tontineId: string, utilisateurId: string) {
    const membre = await this.prisma.membreTontineGroupe.findUnique({
      where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
    });
    if (!membre)
      throw new BadRequestException({
        message: "Vous n'êtes pas membre de cette tontine",
        code: 'PAS_MEMBRE',
      });
    if (membre.statut === StatutMembreGroupe.A_RECU)
      throw new BadRequestException({
        message: 'Impossible de quitter après avoir reçu la distribution',
        code: 'DEJA_RECU',
      });
    if (membre.statut !== StatutMembreGroupe.ACTIF)
      throw new BadRequestException({
        message: "Vous n'êtes plus membre actif",
        code: 'PAS_MEMBRE',
      });

    await this.prisma.membreTontineGroupe.update({
      where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
      data: {
        statut: StatutMembreGroupe.EXCLU,
        excluLe: new Date(),
        motifExclusion: 'Départ volontaire',
      },
    });
    return { succes: true, message: 'Vous avez quitté la tontine.' };
  }

  async invitation(tontineId: string, proprietaireId: string) {
    const t = await this.prisma.tontine.findUnique({
      where: { id: tontineId },
      include: { _count: { select: { membres: true } } },
    });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId)
      throw new ForbiddenException(
        'Seul le propriétaire peut voir cette invitation',
      );
    if (t.type !== TypeTontine.GROUPE)
      throw new BadRequestException({
        message: 'Invitation disponible uniquement pour les tontines GROUPE',
        code: 'TYPE_INVALIDE',
      });

    return {
      succes: true,
      message: 'Invitation groupe.',
      donnees: {
        codeInvitation: t.codeInvitation,
        qrInvitation:
          t.qrInvitation ??
          (t.codeInvitation
            ? this.genererPayloadInvitation(t.codeInvitation)
            : null),
        membresInvites: t._count.membres,
        minimumActivation: 2,
        nbMembresMax: t.nbMembresMax,
      },
    };
  }

  // ─── GET /tontines/:id/membres ────────────────────
  async membres(tontineId: string) {
    const t = await this.prisma.tontine.findUnique({
      where: { id: tontineId },
    });
    if (!t) throw new NotFoundException('Tontine introuvable');
    const membres = await this.prisma.membreTontineGroupe.findMany({
      where: { tontineId },
      include: {
        utilisateur: {
          select: { id: true, nom: true, telephone: true, kycVerifie: true },
        },
      },
      orderBy: { rejointLe: 'asc' },
    });
    return {
      succes: true,
      message: `${membres.length} membre(s).`,
      donnees: membres,
    };
  }

  // ─── GET /tontines/:id/ordre-tirage ───────────────
  async ordreTirage(tontineId: string) {
    const ordres = await this.prisma.ordreTirage.findMany({
      where: { tontineId },
      include: {
        utilisateur: { select: { id: true, nom: true, telephone: true } },
      },
      orderBy: { position: 'asc' },
    });
    return {
      succes: true,
      message: `Ordre de tirage (${ordres.length} membres).`,
      donnees: ordres,
    };
  }

  async definirOrdreTirage(
    tontineId: string,
    proprietaireId: string,
    utilisateurIds: string[],
  ) {
    const t = await this.prisma.tontine.findUnique({
      where: { id: tontineId },
    });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId)
      throw new ForbiddenException('Seul le propriétaire peut définir l’ordre');
    if (t.type !== TypeTontine.GROUPE)
      throw new BadRequestException({
        message: 'Ordre réservé aux groupes',
        code: 'TYPE_INVALIDE',
      });
    if (t.statut !== StatutTontine.CREATION)
      throw new BadRequestException({
        message: 'L’ordre ne peut être modifié qu’avant activation.',
        code: 'TONTINE_DEJA_DEMARREE',
      });

    const membres = await this.prisma.membreTontineGroupe.findMany({
      where: { tontineId, statut: StatutMembreGroupe.ACTIF },
      select: { utilisateurId: true },
    });
    const membresIds = new Set(membres.map((m) => m.utilisateurId));
    const idsUniques = new Set(utilisateurIds);
    if (
      idsUniques.size !== utilisateurIds.length ||
      utilisateurIds.some((id) => !membresIds.has(id))
    ) {
      throw new BadRequestException({
        message:
          'La liste doit contenir uniquement des membres actifs, sans doublon.',
        code: 'ORDRE_TIRAGE_INVALIDE',
      });
    }
    if (utilisateurIds.length !== membres.length) {
      throw new BadRequestException({
        message:
          'Tous les membres actifs doivent être dans l’ordre de passage.',
        code: 'ORDRE_TIRAGE_INCOMPLET',
      });
    }

    await this.prisma.$transaction([
      this.prisma.ordreTirage.deleteMany({ where: { tontineId } }),
      ...utilisateurIds.map((utilisateurId, index) =>
        this.prisma.ordreTirage.create({
          data: { tontineId, utilisateurId, position: index + 1 },
        }),
      ),
      this.prisma.tontine.update({
        where: { id: tontineId },
        data: { modeTirage: ModeTirageGroupe.MANUEL },
      }),
    ]);

    return this.ordreTirage(tontineId);
  }

  async randomiserOrdreTirage(tontineId: string, proprietaireId: string) {
    const t = await this.prisma.tontine.findUnique({
      where: { id: tontineId },
    });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId)
      throw new ForbiddenException(
        'Seul le propriétaire peut lancer le tirage',
      );
    if (t.type !== TypeTontine.GROUPE)
      throw new BadRequestException({
        message: 'Tirage réservé aux groupes',
        code: 'TYPE_INVALIDE',
      });
    if (t.statut !== StatutTontine.CREATION)
      throw new BadRequestException({
        message: 'Le tirage aléatoire ne peut être lancé qu’avant activation.',
        code: 'TONTINE_DEJA_DEMARREE',
      });

    const membres = await this.prisma.membreTontineGroupe.findMany({
      where: { tontineId, statut: StatutMembreGroupe.ACTIF },
      select: { utilisateurId: true },
    });
    if (membres.length < 2) {
      throw new BadRequestException({
        message: 'Au moins 2 membres actifs sont requis pour tirer un ordre.',
        code: 'MEMBRES_INSUFFISANTS',
      });
    }

    const melanges = [...membres].sort(() => Math.random() - 0.5);
    await this.prisma.$transaction([
      this.prisma.ordreTirage.deleteMany({ where: { tontineId } }),
      ...melanges.map((membre, index) =>
        this.prisma.ordreTirage.create({
          data: {
            tontineId,
            utilisateurId: membre.utilisateurId,
            position: index + 1,
          },
        }),
      ),
      this.prisma.tontine.update({
        where: { id: tontineId },
        data: { modeTirage: ModeTirageGroupe.ALEATOIRE },
      }),
    ]);

    return this.ordreTirage(tontineId);
  }

  // ─── POST /tontines/:id/distribuer ────────────────
  async distribuer(tontineId: string, proprietaireId: string) {
    const t = await this.prisma.tontine.findUnique({
      where: { id: tontineId },
    });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId)
      throw new ForbiddenException(
        'Seul le propriétaire peut déclencher la distribution',
      );
    if (t.type !== TypeTontine.GROUPE)
      throw new BadRequestException({
        message: 'Distribution uniquement pour les tontines GROUPE',
        code: 'TYPE_INVALIDE',
      });

    // Gate statut ACTIVE obligatoire
    if (t.statut !== StatutTontine.ACTIVE) {
      throw new BadRequestException({
        message: 'La tontine doit être active pour distribuer.',
        code: 'TONTINE_NON_ACTIVE',
      });
    }

    const membresActifs = await this.prisma.membreTontineGroupe.count({
      where: { tontineId, statut: StatutMembreGroupe.ACTIF },
    });
    const montantParMembreFcfa =
      t.montantParMembreFcfa ?? t.montantJournalierFcfa;
    const cagnotteAttendue = membresActifs * montantParMembreFcfa;
    if (t.soldeActuelFcfa < cagnotteAttendue) {
      throw new BadRequestException({
        message: `Cotisations du tour incomplètes. Cagnotte attendue: ${cagnotteAttendue} FCFA, disponible: ${t.soldeActuelFcfa} FCFA.`,
        code: 'COTISATIONS_TOUR_INCOMPLETES',
      });
    }

    if (t.soldeActuelFcfa <= 0)
      throw new BadRequestException({
        message: 'Solde insuffisant pour distribuer',
        code: 'SOLDE_INSUFFISANT',
      });

    this.verifierPolitique(t);
    await this.verifierAucuneAlerteBloquante(tontineId);

    const prochainTirage = await this.prisma.ordreTirage.findFirst({
      where: { tontineId, aRecu: false },
      orderBy: { position: 'asc' },
      include: {
        utilisateur: {
          include: {
            badges: { where: { niveau: 'DIAMANT' }, take: 1 },
          },
        },
      },
    });

    if (!prochainTirage) {
      // Tous ont reçu → clôture automatique
      await this.prisma.tontine.update({
        where: { id: tontineId },
        data: { statut: StatutTontine.TERMINEE },
      });
      throw new BadRequestException({
        message: 'Tous les membres ont reçu. Tontine marquée TERMINEE.',
        code: 'CYCLE_TERMINE',
      });
    }

    const montantFcfaDistribution = t.soldeActuelFcfa;
    // Distribution GROUPE = sortie de fonds → barème progressif, pas de commission agent
    const fraisDistrib = BUSINESS.calculerFraisRetrait(
      montantFcfaDistribution,
      false,  // pas de badge Diamant sur les distributions groupe
      false,  // pas de commission agent
    );
    const fraisDistribution = fraisDistrib.fraisTotal;
    const montantNetFcfa = fraisDistrib.montantNet;

    const transfert = await this.kkiapay.initierTransfert({
      montant: montantNetFcfa,
      telephone: prochainTirage.utilisateur.telephone,
      reference: `dist_${tontineId}_${prochainTirage.id}`,
      motif: `Distribution tontine ${t.nom}`,
    });

    if (!transfert.succes)
      throw new BadRequestException({
        message: 'Échec du transfert KKiaPay',
        code: 'TRANSFERT_ECHOUE',
      });

    // Y a-t-il encore des membres à servir après celui-ci ?
    const nbRestants = await this.prisma.ordreTirage.count({
      where: { tontineId, aRecu: false },
    });
    const estDerniere = nbRestants === 1;

    // Calcul de la prochaine date de cotisation pour le prochain cycle
    const prochaineDateCotisation = this.calculerProchaineDateCotisation(
      t.frequence,
      t.jourFixe ?? undefined,
    );

    await this.prisma.$transaction([
      this.prisma.ordreTirage.update({
        where: { id: prochainTirage.id },
        data: {
          aRecu: true,
          recuLe: new Date(),
          montantRecuFcfa: montantNetFcfa,
        },
      }),
      this.prisma.membreTontineGroupe.update({
        where: {
          tontineId_utilisateurId: {
            tontineId,
            utilisateurId: prochainTirage.utilisateurId,
          },
        },
        data: { statut: StatutMembreGroupe.A_RECU },
      }),
      this.prisma.tontine.update({
        where: { id: tontineId },
        data: {
          soldeActuelFcfa: 0,
          dateProchaineCotisation: estDerniere ? null : prochaineDateCotisation,
          ...(!estDerniere && { tourActuel: { increment: 1 } }),
          ...(estDerniere && { statut: StatutTontine.TERMINEE }),
        },
      }),
      this.prisma.transaction.create({
        data: {
          montantFcfa: montantFcfaDistribution,
          montantNetFcfa,
          type: TypeTransaction.DISTRIBUTION_GROUPE,
          tontineId,
          utilisateurId: prochainTirage.utilisateurId,
          refKKiaPay: transfert.refKKiaPay,
          // frais retrait 5% (distribution = sortie de fonds)
          fraisPlateformeFcfa: fraisDistribution,
        },
      }),
    ]);

    // --- NOTIFICATIONS (Ne bloquent pas la distribution) ---
    try {
      const beneficiaire = prochainTirage.utilisateur;
      const tontineNom = t.nom;
      const montantFcfaFmt = montantNetFcfa.toLocaleString('fr-FR');

      // 1. Notification au bénéficiaire (Push + SMS)
      const titreBeneficiaire = "C'est ton tour ! 🎉";
      const messagePushBeneficiaire = `Félicitations ${beneficiaire.nom} ! Ta cagnotte de ${montantFcfaFmt} FCFA de '${tontineNom}' vient d'être envoyée sur ton Mobile Money.`;
      const messageSmsBeneficiaire = `TontineBénin: ${beneficiaire.nom}, ta cagnotte ${montantFcfaFmt}F de '${tontineNom}' est envoyee sur ton MoMo. Verifie ton solde.`;

      await this.notifications.envoyerAUtilisateur(
        beneficiaire.id,
        titreBeneficiaire,
        messagePushBeneficiaire,
        'PUSH',
        TypeNotification.TOUR_TONTINE,
      );
      await this.notifications.envoyerAUtilisateur(
        beneficiaire.id,
        titreBeneficiaire,
        messageSmsBeneficiaire,
        'SMS',
        TypeNotification.TOUR_TONTINE,
      );

      // 2. Notification au collecteur du bénéficiaire (Push uniquement)
      if (beneficiaire.collecteurId) {
        const messageCollector = `Votre client ${beneficiaire.nom} a reçu sa cagnotte de ${montantFcfaFmt} FCFA dans la tontine '${tontineNom}'.`;
        await this.notifications.envoyerAUtilisateur(
          beneficiaire.collecteurId,
          'Cagnotte reçue par un client',
          messageCollector,
          'PUSH',
          TypeNotification.TOUR_TONTINE,
        );
      }

      // 3. Notification aux autres membres actifs de la tontine (Push uniquement)
      const libelleFreq = this.getLibelleFrequence(t.frequence);
      const messageMembres = `${beneficiaire.nom} a reçu la cagnotte de '${tontineNom}'. Prochain tour dans ${libelleFreq}.`;

      const autresMembres = await this.prisma.membreTontineGroupe.findMany({
        where: {
          tontineId,
          utilisateurId: { not: beneficiaire.id },
          statut: { in: [StatutMembreGroupe.ACTIF, StatutMembreGroupe.A_RECU] },
        },
        select: { utilisateurId: true },
      });

      for (const membre of autresMembres) {
        await this.notifications.envoyerAUtilisateur(
          membre.utilisateurId,
          'Cagnotte distribuée',
          messageMembres,
          'PUSH',
          TypeNotification.TOUR_TONTINE,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Erreur notifications distribution tontine ${tontineId}: ${message}`,
      );
    }

    return {
      succes: true,
      message: `Distribution de ${montantNetFcfa} FCFA envoyée à ${prochainTirage.utilisateur.nom}.${estDerniere ? ' Tontine clôturée automatiquement.' : ''}`,
      donnees: {
        beneficiaire: prochainTirage.utilisateur,
        montantNetFcfa,
        refKKiaPay: transfert.refKKiaPay,
        tontineTerminee: estDerniere,
        prochaineDateCotisation: estDerniere ? null : prochaineDateCotisation,
      },
    };
  }

  // ─── Helpers privés ───────────────────────────────

  /** Calcule la prochaine date de cotisation selon la fréquence */
  calculerProchaineDateCotisation(
    frequence: FrequenceTontine,
    jourFixe?: number,
  ): Date {
    const now = new Date();
    switch (frequence) {
      case FrequenceTontine.JOURNALIER:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);

      case FrequenceTontine.HEBDOMADAIRE:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      case FrequenceTontine.MENSUEL: {
        const date = new Date(now);
        date.setMonth(date.getMonth() + 1);
        return date;
      }

      case FrequenceTontine.DATE_FIXE: {
        const jour = jourFixe ?? 1;
        // Essayer ce mois-ci
        const dateCeMois = new Date(now.getFullYear(), now.getMonth(), jour);
        if (dateCeMois > now) return dateCeMois;
        // Sinon mois prochain
        return new Date(now.getFullYear(), now.getMonth() + 1, jour);
      }
    }
  }

  private verifierConfigurationPolitiqueRetrait(input: {
    politique: PolitiqueRetrait;
    dateDeverrouillage?: Date | string | null;
    objectifMontantFcfa?: number | null;
    montantJournalierFcfa?: number | null;
    frequence: FrequenceTontine;
  }) {
    if (
      input.politique !== PolitiqueRetrait.PROGRAMME &&
      input.politique !== PolitiqueRetrait.BLOQUE
    )
      return;

    if (!input.dateDeverrouillage) {
      throw new BadRequestException({
        message: `Une tontine ${input.politique} doit avoir une dateDeverrouillage.`,
        code: 'DATE_DEVERROUILLAGE_REQUISE',
      });
    }

    const dateDeverrouillage = new Date(input.dateDeverrouillage);
    const now = new Date();
    if (
      Number.isNaN(dateDeverrouillage.getTime()) ||
      dateDeverrouillage <= now
    ) {
      throw new BadRequestException({
        message: 'La dateDeverrouillage doit être une date future.',
        code: 'DATE_DEVERROUILLAGE_INVALIDE',
      });
    }

    if (input.politique === PolitiqueRetrait.PROGRAMME) return;

    if (!input.objectifMontantFcfa || input.objectifMontantFcfa <= 0) {
      throw new BadRequestException({
        message:
          'Une tontine BLOQUE doit avoir un objectifMontantFcfa positif.',
        code: 'OBJECTIF_REQUIS',
      });
    }

    const montantFcfaCotisation = input.montantJournalierFcfa ?? 500;
    if (montantFcfaCotisation < 100) {
      throw new BadRequestException({
        message: 'Le montantFcfa de cotisation doit être au moins 100 FCFA.',
        code: 'MONTANT_COTISATION_INVALIDE',
      });
    }

    const dateFinEstimee = this.calculerDateFinEstimee(
      input.objectifMontantFcfa,
      montantFcfaCotisation,
      input.frequence,
    );
    if (this.debutJour(dateDeverrouillage) < this.debutJour(dateFinEstimee)) {
      throw new BadRequestException({
        message: `La dateDeverrouillage doit être supérieure ou égale à la date de fin estimée (${dateFinEstimee.toLocaleDateString('fr-FR')}).`,
        code: 'DATE_DEVERROUILLAGE_AVANT_OBJECTIF',
      });
    }
  }

  private verifierConfigurationGroupe(input: {
    type?: TypeTontine;
    nbMembresMax?: number | null;
    montantParMembreFcfa?: number | null;
    cautionObligatoire?: boolean | null;
    montantCautionObligatoireFcfa?: number | null;
    penaliteRetardActive?: boolean | null;
    montantPenaliteRetardFcfa?: number | null;
    modeTirage?: ModeTirageGroupe | null;
  }) {
    if (input.type !== TypeTontine.GROUPE) return;

    if (!input.nbMembresMax || input.nbMembresMax < 2) {
      throw new BadRequestException({
        message: 'Une tontine GROUPE doit définir au moins 2 membres.',
        code: 'NB_MEMBRES_INVALIDE',
      });
    }
    if (!input.montantParMembreFcfa || input.montantParMembreFcfa < 100) {
      throw new BadRequestException({
        message:
          'Une tontine GROUPE doit définir un montantFcfa par membre d’au moins 100 FCFA.',
        code: 'MONTANT_PAR_MEMBRE_INVALIDE',
      });
    }
    if (
      input.cautionObligatoire &&
      (!input.montantCautionObligatoireFcfa ||
        input.montantCautionObligatoireFcfa <= 0)
    ) {
      throw new BadRequestException({
        message:
          'Le montantFcfa de caution est obligatoire si la caution est activée.',
        code: 'MONTANT_CAUTION_REQUIS',
      });
    }
    if (
      input.penaliteRetardActive &&
      (!input.montantPenaliteRetardFcfa || input.montantPenaliteRetardFcfa <= 0)
    ) {
      throw new BadRequestException({
        message:
          'Le montantFcfa de pénalité est obligatoire si la pénalité retard est activée.',
        code: 'MONTANT_PENALITE_REQUIS',
      });
    }
  }

  private genererPayloadInvitation(codeInvitation: string): string {
    return `tontinebenin://tontines/rejoindre?code=${codeInvitation}`;
  }

  private calculerDateFinEstimee(
    objectifMontantFcfa: number,
    montantFcfaCotisation: number,
    frequence: FrequenceTontine,
  ): Date {
    const nombreCotisations = Math.max(
      Math.ceil(objectifMontantFcfa / montantFcfaCotisation),
      1,
    );
    const joursParCotisation: Record<FrequenceTontine, number> = {
      [FrequenceTontine.JOURNALIER]: 1,
      [FrequenceTontine.HEBDOMADAIRE]: 7,
      [FrequenceTontine.MENSUEL]: 30,
      [FrequenceTontine.DATE_FIXE]: 30,
    };
    const dateFin = new Date();
    dateFin.setDate(
      dateFin.getDate() + nombreCotisations * joursParCotisation[frequence],
    );
    return dateFin;
  }

  private debutJour(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private verifierPolitique(tontine: {
    politique: PolitiqueRetrait;
    soldeActuelFcfa: number;
    objectifMontantFcfa: number | null;
    dateDeverrouillage: Date | null;
  }) {
    if (tontine.politique === PolitiqueRetrait.BLOQUE) {
      if (
        !tontine.dateDeverrouillage ||
        tontine.dateDeverrouillage > new Date()
      ) {
        const date =
          tontine.dateDeverrouillage?.toLocaleDateString('fr-FR') ??
          'indéfinie';
        throw new BadRequestException({
          message: `Tontine bloquée jusqu'au ${date}`,
          code: 'TONTINE_BLOQUEE',
        });
      }
      if (!tontine.objectifMontantFcfa) {
        throw new BadRequestException({
          message: 'Objectif requis pour une tontine bloquée.',
          code: 'OBJECTIF_REQUIS',
        });
      }
      if (tontine.soldeActuelFcfa < tontine.objectifMontantFcfa) {
        throw new BadRequestException({
          message: `Objectif non atteint. Progression: ${tontine.soldeActuelFcfa}/${tontine.objectifMontantFcfa} FCFA`,
          code: 'OBJECTIF_NON_ATTEINT',
        });
      }
    }
    if (tontine.politique === PolitiqueRetrait.PROGRAMME) {
      if (
        !tontine.dateDeverrouillage ||
        tontine.dateDeverrouillage > new Date()
      ) {
        throw new BadRequestException({
          message: 'Date programmée non atteinte',
          code: 'DATE_NON_ATTEINTE',
        });
      }
    }
  }

  private async verifierAucuneAlerteBloquante(tontineId: string) {
    const alerte = await this.prisma.alerteSysteme.findFirst({
      where: {
        type: 'COHERENCE_COMPTABLE',
        severite: 'CRITIQUE',
        statut: 'OUVERTE',
        resourceType: 'TONTINE',
        resourceId: tontineId,
      },
      select: { id: true },
    });
    if (alerte) {
      throw new ForbiddenException({
        message:
          'Distribution temporairement bloquée : anomalie comptable en cours de vérification.',
        code: 'CIRCUIT_BREAKER_COMPTABLE',
        alerteId: alerte.id,
      });
    }
  }

  // ─── DELETE /tontines/:id ─────────────────────────
  async supprimerTontine(id: string, proprietaireId: string) {
    const t = await this.prisma.tontine.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId)
      throw new ForbiddenException('Seul le propriétaire peut supprimer cette tontine');

    if (t.soldeActuelFcfa > 0)
      throw new BadRequestException({
        message: 'Impossible de supprimer : une cotisation a déjà été effectuée sur cette tontine.',
        code: 'COTISATION_EXISTANTE',
      });

    await this.prisma.tontine.delete({ where: { id } });
    return { succes: true, message: 'Tontine supprimée avec succès.' };
  }

  private getLibelleFrequence(frequence: FrequenceTontine): string {
    switch (frequence) {
      case FrequenceTontine.JOURNALIER:
        return '24h';
      case FrequenceTontine.HEBDOMADAIRE:
        return '7 jours';
      case FrequenceTontine.MENSUEL:
      case FrequenceTontine.DATE_FIXE:
        return '1 mois';
      default:
        return 'un cycle';
    }
  }
}
