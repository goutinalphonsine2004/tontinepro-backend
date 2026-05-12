import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { StatutLitige } from '@prisma/client';
import { OuvrirLitigeDto } from './dto/ouvrir-litige.dto';
import { ResoudreLitigeDto } from './dto/resoudre-litige.dto';
import { RejeterLitigeDto } from './dto/rejeter-litige.dto';

@Injectable()
export class LitigesService {
  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
  ) {}

  async ouvrirLitige(clientId: string, dto: OuvrirLitigeDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
      select: { id: true, utilisateurId: true, montant: true },
    });

    if (!transaction) throw new NotFoundException('Transaction introuvable');
    if (transaction.utilisateurId !== clientId) {
      throw new ForbiddenException('Cette transaction ne vous appartient pas');
    }

    const litigeExistant = await this.prisma.litige.findFirst({
      where: {
        transactionId: dto.transactionId,
        clientId,
        statut: { in: [StatutLitige.OUVERT, StatutLitige.EN_EXAMEN] },
      },
    });
    if (litigeExistant) {
      throw new BadRequestException(
        'Un litige est déjà ouvert pour cette transaction',
      );
    }

    const litige = await this.prisma.litige.create({
      data: {
        transactionId: dto.transactionId,
        clientId,
        motif: dto.motif,
        statut: StatutLitige.OUVERT,
      },
      include: {
        transaction: {
          select: { id: true, montant: true, type: true, creeLe: true },
        },
      },
    });

    return {
      succes: true,
      message:
        'Litige ouvert avec succès. Notre équipe va examiner votre dossier.',
      donnees: { litige },
    };
  }

  async mesList(clientId: string) {
    const litiges = await this.prisma.litige.findMany({
      where: { clientId },
      include: {
        transaction: {
          select: { id: true, montant: true, type: true, creeLe: true },
        },
      },
      orderBy: { creeLe: 'desc' },
    });
    return { succes: true, message: 'Litiges récupérés', donnees: { litiges } };
  }

  async listeEnCours(page = 1, limite = 20) {
    const skip = (page - 1) * limite;
    const [litiges, total] = await this.prisma.$transaction([
      this.prisma.litige.findMany({
        where: {
          statut: { in: [StatutLitige.OUVERT, StatutLitige.EN_EXAMEN] },
        },
        include: {
          client: { select: { id: true, nom: true, telephone: true } },
          transaction: {
            select: { id: true, montant: true, type: true, creeLe: true },
          },
        },
        orderBy: { creeLe: 'asc' },
        skip,
        take: limite,
      }),
      this.prisma.litige.count({
        where: {
          statut: { in: [StatutLitige.OUVERT, StatutLitige.EN_EXAMEN] },
        },
      }),
    ]);
    return {
      succes: true,
      message: 'Litiges en cours',
      donnees: { litiges, total, page, totalPages: Math.ceil(total / limite) },
    };
  }

  async examiner(litigeId: string, adminId: string) {
    const litige = await this.prisma.litige.findUnique({
      where: { id: litigeId },
      include: { client: { select: { telephone: true, nom: true } } },
    });
    if (!litige) throw new NotFoundException('Litige introuvable');
    if (litige.statut !== StatutLitige.OUVERT) {
      throw new BadRequestException(
        `Ce litige est déjà en statut ${litige.statut}`,
      );
    }

    const litigeMaj = await this.prisma.litige.update({
      where: { id: litigeId },
      data: { statut: StatutLitige.EN_EXAMEN, resoluPar: adminId },
    });

    await this.sms.envoyer(
      litige.client.telephone,
      `TontineBénin: Votre litige est en cours d'examen par notre équipe. Nous reviendrons vers vous sous 48h.`,
    );

    return {
      succes: true,
      message: 'Litige pris en charge',
      donnees: { litige: litigeMaj },
    };
  }

  async resoudre(litigeId: string, adminId: string, dto: ResoudreLitigeDto) {
    const litige = await this.prisma.litige.findUnique({
      where: { id: litigeId },
      include: { client: { select: { telephone: true, nom: true } } },
    });
    if (!litige) throw new NotFoundException('Litige introuvable');
    if (
      litige.statut === StatutLitige.RESOLU ||
      litige.statut === StatutLitige.REJETE
    ) {
      throw new BadRequestException('Ce litige est déjà clôturé');
    }

    const litigeMaj = await this.prisma.litige.update({
      where: { id: litigeId },
      data: {
        statut: StatutLitige.RESOLU,
        resolution: dto.resolution,
        resoluPar: adminId,
        resoluLe: new Date(),
      },
    });

    await this.sms.envoyer(
      litige.client.telephone,
      `TontineBénin: ✅ Votre litige a été résolu. ${dto.resolution}`,
    );

    return {
      succes: true,
      message: 'Litige résolu avec succès',
      donnees: { litige: litigeMaj },
    };
  }

  async rejeter(litigeId: string, adminId: string, dto: RejeterLitigeDto) {
    const litige = await this.prisma.litige.findUnique({
      where: { id: litigeId },
      include: { client: { select: { telephone: true, nom: true } } },
    });
    if (!litige) throw new NotFoundException('Litige introuvable');
    if (
      litige.statut === StatutLitige.RESOLU ||
      litige.statut === StatutLitige.REJETE
    ) {
      throw new BadRequestException('Ce litige est déjà clôturé');
    }

    const litigeMaj = await this.prisma.litige.update({
      where: { id: litigeId },
      data: {
        statut: StatutLitige.REJETE,
        resolution: dto.motifRejet,
        resoluPar: adminId,
        resoluLe: new Date(),
      },
    });

    await this.sms.envoyer(
      litige.client.telephone,
      `TontineBénin: Votre litige a été rejeté. Motif: ${dto.motifRejet}. Pour toute question, contactez notre support.`,
    );

    return {
      succes: true,
      message: 'Litige rejeté',
      donnees: { litige: litigeMaj },
    };
  }

  async detail(litigeId: string, userId: string, role: string) {
    const litige = await this.prisma.litige.findUnique({
      where: { id: litigeId },
      include: {
        client: { select: { id: true, nom: true, telephone: true } },
        transaction: {
          select: { id: true, montant: true, type: true, creeLe: true },
        },
        commentaires: { orderBy: { creeLe: 'asc' } },
      },
    });
    if (!litige) throw new NotFoundException('Litige introuvable');

    const isAdmin = ['ADMIN', 'SUPERVISEUR'].includes(role);
    if (!isAdmin && litige.clientId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    return { succes: true, message: 'Détail du litige', donnees: { litige } };
  }

  // ─── POST /litiges/:id/commentaire ────────────────
  async ajouterCommentaire(
    litigeId: string,
    auteurId: string,
    dto: { message: string; pieceJointeUrl?: string },
    role: string,
  ) {
    const litige = await this.prisma.litige.findUnique({
      where: { id: litigeId },
      select: { id: true, clientId: true, statut: true },
    });
    if (!litige) throw new NotFoundException('Litige introuvable');

    const isAdmin = ['ADMIN', 'SUPERVISEUR'].includes(role);
    if (!isAdmin && litige.clientId !== auteurId) {
      throw new ForbiddenException('Accès refusé au litige');
    }
    if (['RESOLU', 'REJETE'].includes(litige.statut)) {
      throw new BadRequestException({
        message: 'Impossible de commenter un litige clôturé',
        code: 'LITIGE_CLOTURE',
      });
    }

    const commentaire = await this.prisma.commentaireLitige.create({
      data: {
        litigeId,
        auteurId,
        message: dto.message,
        pieceJointeUrl: dto.pieceJointeUrl,
      },
    });

    return {
      succes: true,
      message: 'Commentaire ajouté.',
      donnees: commentaire,
    };
  }

  // ─── GET /litiges/:id/commentaires ────────────────
  async commentaires(litigeId: string, userId: string, role: string) {
    const litige = await this.prisma.litige.findUnique({
      where: { id: litigeId },
      select: { id: true, clientId: true },
    });
    if (!litige) throw new NotFoundException('Litige introuvable');

    const isAdmin = ['ADMIN', 'SUPERVISEUR'].includes(role);
    if (!isAdmin && litige.clientId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    const commentaires = await this.prisma.commentaireLitige.findMany({
      where: { litigeId },
      orderBy: { creeLe: 'asc' },
    });

    return {
      succes: true,
      message: `${commentaires.length} commentaire(s).`,
      donnees: commentaires,
    };
  }
}
