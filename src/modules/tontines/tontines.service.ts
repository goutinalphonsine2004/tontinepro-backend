import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PolitiqueRetrait, StatutMembreGroupe, TypeTontine, TypeTransaction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { BUSINESS } from '../../common/constants/business.constants';
import { CreerTontineDto } from './dto/creer-tontine.dto';
import { ModifierTontineDto } from './dto/modifier-tontine.dto';
import { RejoindreTonitneDto } from './dto/rejoindre-tontine.dto';

@Injectable()
export class TontinesService {
  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
  ) {}

  // ─── POST /tontines ────────────────────────────────
  async creer(proprietaireId: string, dto: CreerTontineDto) {
    const tontine = await this.prisma.tontine.create({
      data: {
        nom: dto.nom,
        type: dto.type ?? TypeTontine.PERSONNEL,
        politique: dto.politique ?? PolitiqueRetrait.FLEXIBLE,
        objectifMontant: dto.objectifMontant,
        montantJournalier: dto.montantJournalier ?? 500,
        dateDeverrouillage: dto.dateDeverrouillage,
        proprietaireId,
      },
      include: { proprietaire: { select: { id: true, nom: true, telephone: true } } },
    });
    return { succes: true, message: 'Tontine créée.', donnees: tontine };
  }

  // ─── GET /tontines/mes-tontines ───────────────────
  async mesTontines(utilisateurId: string) {
    const [proprietes, membre] = await Promise.all([
      this.prisma.tontine.findMany({
        where: { proprietaireId: utilisateurId },
        include: { _count: { select: { membres: true, transactions: true } } },
      }),
      this.prisma.membreTontineGroupe.findMany({
        where: { utilisateurId, statut: StatutMembreGroupe.ACTIF },
        include: { tontine: { include: { _count: { select: { membres: true } } } } },
      }),
    ]);
    return {
      succes: true,
      message: 'Tontines récupérées.',
      donnees: {
        proprietaire: proprietes,
        membre: membre.map((m) => ({ ...m.tontine, monStatut: m.statut, caution: m.montantCaution })),
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
      },
    });
    if (!t) throw new NotFoundException('Tontine introuvable');
    // Vérifier accès : propriétaire ou membre
    const estMembre = await this.prisma.membreTontineGroupe.findFirst({
      where: { tontineId: id, utilisateurId },
    });
    if (t.proprietaireId !== utilisateurId && !estMembre) {
      throw new ForbiddenException('Accès refusé à cette tontine');
    }
    return { succes: true, message: 'Tontine récupérée.', donnees: t };
  }

  // ─── PUT /tontines/:id ─────────────────────────────
  async modifier(id: string, proprietaireId: string, dto: ModifierTontineDto) {
    const t = await this.prisma.tontine.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId) throw new ForbiddenException('Seul le propriétaire peut modifier cette tontine');

    const maj = await this.prisma.tontine.update({
      where: { id },
      data: {
        ...(dto.politique && { politique: dto.politique }),
        ...(dto.objectifMontant !== undefined && { objectifMontant: dto.objectifMontant }),
        ...(dto.montantJournalier && { montantJournalier: dto.montantJournalier }),
        ...(dto.dateDeverrouillage && { dateDeverrouillage: dto.dateDeverrouillage }),
      },
    });
    return { succes: true, message: 'Tontine mise à jour.', donnees: maj };
  }

  // ─── POST /tontines/:id/rejoindre ─────────────────
  async rejoindre(tontineId: string, utilisateurId: string, dto: RejoindreTonitneDto) {
    const t = await this.prisma.tontine.findUnique({ where: { id: tontineId } });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.type !== TypeTontine.GROUPE) {
      throw new BadRequestException({ message: 'Seules les tontines de groupe peuvent être rejointes', code: 'TYPE_INVALIDE' });
    }
    if (t.proprietaireId === utilisateurId) {
      throw new BadRequestException({ message: 'Vous êtes déjà propriétaire de cette tontine', code: 'DEJA_PROPRIETAIRE' });
    }

    const existant = await this.prisma.membreTontineGroupe.findUnique({
      where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
    });
    if (existant && existant.statut === StatutMembreGroupe.ACTIF) {
      throw new BadRequestException({ message: 'Vous êtes déjà membre de cette tontine', code: 'DEJA_MEMBRE' });
    }

    const nbMembres = await this.prisma.membreTontineGroupe.count({ where: { tontineId } });

    const membre = await this.prisma.membreTontineGroupe.upsert({
      where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
      create: {
        tontineId,
        utilisateurId,
        statut: StatutMembreGroupe.ACTIF,
        montantCaution: dto.montantCaution ?? 0,
        cautionBloquee: true,
      },
      update: { statut: StatutMembreGroupe.ACTIF, montantCaution: dto.montantCaution ?? 0 },
    });

    // Assigner une position dans l'ordre de tirage
    await this.prisma.ordreTirage.upsert({
      where: { id: `${tontineId}_${utilisateurId}` },
      create: { tontineId, utilisateurId, position: nbMembres + 1 },
      update: {},
    }).catch(async () => {
      const existing = await this.prisma.ordreTirage.findFirst({ where: { tontineId, utilisateurId } });
      if (!existing) {
        await this.prisma.ordreTirage.create({ data: { tontineId, utilisateurId, position: nbMembres + 1 } });
      }
    });

    return { succes: true, message: 'Vous avez rejoint la tontine.', donnees: membre };
  }

  // ─── POST /tontines/:id/quitter ───────────────────
  async quitter(tontineId: string, utilisateurId: string) {
    const membre = await this.prisma.membreTontineGroupe.findUnique({
      where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
    });
    if (!membre || membre.statut !== StatutMembreGroupe.ACTIF) {
      throw new BadRequestException({ message: 'Vous n\'êtes pas membre actif de cette tontine', code: 'PAS_MEMBRE' });
    }
    if (membre.statut === StatutMembreGroupe.A_RECU) {
      throw new BadRequestException({ message: 'Impossible de quitter après avoir reçu la distribution', code: 'DEJA_RECU' });
    }

    await this.prisma.membreTontineGroupe.update({
      where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
      data: { statut: StatutMembreGroupe.EXCLU, excluLe: new Date(), motifExclusion: 'Départ volontaire' },
    });
    return { succes: true, message: 'Vous avez quitté la tontine.' };
  }

  // ─── GET /tontines/:id/membres ────────────────────
  async membres(tontineId: string) {
    const t = await this.prisma.tontine.findUnique({ where: { id: tontineId } });
    if (!t) throw new NotFoundException('Tontine introuvable');
    const membres = await this.prisma.membreTontineGroupe.findMany({
      where: { tontineId },
      include: { utilisateur: { select: { id: true, nom: true, telephone: true, kycVerifie: true } } },
      orderBy: { rejointLe: 'asc' },
    });
    return { succes: true, message: `${membres.length} membre(s).`, donnees: membres };
  }

  // ─── GET /tontines/:id/ordre-tirage ───────────────
  async ordreTirage(tontineId: string) {
    const ordres = await this.prisma.ordreTirage.findMany({
      where: { tontineId },
      include: { utilisateur: { select: { id: true, nom: true, telephone: true } } },
      orderBy: { position: 'asc' },
    });
    return { succes: true, message: `Ordre de tirage (${ordres.length} membres).`, donnees: ordres };
  }

  // ─── POST /tontines/:id/distribuer ────────────────
  async distribuer(tontineId: string, proprietaireId: string) {
    const t = await this.prisma.tontine.findUnique({ where: { id: tontineId } });
    if (!t) throw new NotFoundException('Tontine introuvable');
    if (t.proprietaireId !== proprietaireId) {
      throw new ForbiddenException('Seul le propriétaire peut déclencher la distribution');
    }
    if (t.type !== TypeTontine.GROUPE) {
      throw new BadRequestException({ message: 'Distribution uniquement pour les tontines groupe', code: 'TYPE_INVALIDE' });
    }
    if (t.soldeActuel <= 0) {
      throw new BadRequestException({ message: 'Solde insuffisant pour distribuer', code: 'SOLDE_INSUFFISANT' });
    }

    // Vérifier politique
    this.verifierPolitique(t);

    // Prochain bénéficiaire
    const prochainTirage = await this.prisma.ordreTirage.findFirst({
      where: { tontineId, aRecu: false },
      orderBy: { position: 'asc' },
      include: { utilisateur: { select: { id: true, nom: true, telephone: true } } },
    });
    if (!prochainTirage) {
      throw new BadRequestException({ message: 'Tous les membres ont déjà reçu leur distribution', code: 'CYCLE_TERMINE' });
    }

    // Vérifier si le membre est défaillant → utiliser sa caution
    const membreInfo = await this.prisma.membreTontineGroupe.findFirst({
      where: { tontineId, utilisateurId: prochainTirage.utilisateurId },
    });

    const montantDistribution = t.soldeActuel;
    const montantNet = montantDistribution - BUSINESS.calculerFraisPlateforme(montantDistribution);

    // Transfert via KKiaPay
    const transfert = await this.kkiapay.initierTransfert({
      montant: montantNet,
      telephone: prochainTirage.utilisateur.telephone,
      reference: `dist_${tontineId}_${prochainTirage.id}`,
      motif: `Distribution tontine ${t.nom}`,
    });

    if (!transfert.succes) {
      throw new BadRequestException({ message: 'Échec du transfert KKiaPay', code: 'TRANSFERT_ECHOUE' });
    }

    // Mise à jour en transaction atomique
    await this.prisma.$transaction([
      this.prisma.ordreTirage.update({
        where: { id: prochainTirage.id },
        data: { aRecu: true, recuLe: new Date(), montantRecu: montantNet },
      }),
      this.prisma.membreTontineGroupe.update({
        where: { tontineId_utilisateurId: { tontineId, utilisateurId: prochainTirage.utilisateurId } },
        data: { statut: StatutMembreGroupe.A_RECU },
      }),
      this.prisma.tontine.update({
        where: { id: tontineId },
        data: { soldeActuel: 0 },
      }),
      this.prisma.transaction.create({
        data: {
          montant: montantDistribution,
          montantNet,
          type: TypeTransaction.DISTRIBUTION_GROUPE,
          tontineId,
          utilisateurId: prochainTirage.utilisateurId,
          refKKiaPay: transfert.refKKiaPay,
          fraisPlateforme: BUSINESS.calculerFraisPlateforme(montantDistribution),
        },
      }),
    ]);

    return {
      succes: true,
      message: `Distribution de ${montantNet} FCFA envoyée à ${prochainTirage.utilisateur.nom}.`,
      donnees: { beneficiaire: prochainTirage.utilisateur, montantNet, refKKiaPay: transfert.refKKiaPay },
    };
  }

  private verifierPolitique(tontine: { politique: PolitiqueRetrait; dateDeverrouillage: Date | null }) {
    if (tontine.politique === PolitiqueRetrait.BLOQUE) {
      if (!tontine.dateDeverrouillage || tontine.dateDeverrouillage > new Date()) {
        const date = tontine.dateDeverrouillage?.toLocaleDateString('fr-FR') ?? 'indéfinie';
        throw new BadRequestException({ message: `Tontine bloquée jusqu'au ${date}`, code: 'TONTINE_BLOQUEE' });
      }
    }
    if (tontine.politique === PolitiqueRetrait.PROGRAMME) {
      if (!tontine.dateDeverrouillage || tontine.dateDeverrouillage > new Date()) {
        throw new BadRequestException({ message: 'Retrait non autorisé : date programmée non atteinte', code: 'DATE_NON_ATTEINTE' });
      }
    }
  }
}
