import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FiltrerAlertesDto } from './dto/filtrer-alertes.dto';
import { ResoudreAlerteDto } from './dto/resoudre-alerte.dto';

@Injectable()
export class AlertesService {
  constructor(private prisma: PrismaService) {}

  async lister(dto: FiltrerAlertesDto) {
    const page = dto.page ?? 1;
    const limite = Math.min(dto.limite ?? 20, 100);
    const skip = (page - 1) * limite;

    const where: Record<string, unknown> = {};
    if (dto.type) where.type = dto.type;
    if (dto.severite) where.severite = dto.severite;
    if (dto.statut) where.statut = dto.statut;
    if (dto.resourceType) where.resourceType = dto.resourceType;
    if (dto.resourceId) where.resourceId = dto.resourceId;
    if (dto.dateDebut || dto.dateFin) {
      where.detecteeLe = {
        ...(dto.dateDebut && { gte: new Date(dto.dateDebut) }),
        ...(dto.dateFin && { lte: this.finDeJournee(dto.dateFin) }),
      };
    }

    const [total, alertes] = await Promise.all([
      this.prisma.alerteSysteme.count({ where }),
      this.prisma.alerteSysteme.findMany({
        where,
        orderBy: [{ statut: 'asc' }, { detecteeLe: 'desc' }],
        skip,
        take: limite,
      }),
    ]);

    return {
      succes: true,
      message: `${total} alerte(s) système.`,
      donnees: {
        alertes,
        total,
        page,
        limite,
        pages: Math.ceil(total / limite),
      },
    };
  }

  async statistiques() {
    const [parStatut, parSeverite, critiquesOuvertes, dernieres] =
      await Promise.all([
        this.prisma.alerteSysteme.groupBy({ by: ['statut'], _count: true }),
        this.prisma.alerteSysteme.groupBy({ by: ['severite'], _count: true }),
        this.prisma.alerteSysteme.count({
          where: { statut: 'OUVERTE', severite: 'CRITIQUE' },
        }),
        this.prisma.alerteSysteme.findMany({
          where: { statut: 'OUVERTE' },
          orderBy: { detecteeLe: 'desc' },
          take: 5,
        }),
      ]);

    return {
      succes: true,
      message: 'Statistiques des alertes système.',
      donnees: { parStatut, parSeverite, critiquesOuvertes, dernieres },
    };
  }

  async detail(id: string) {
    const alerte = await this.prisma.alerteSysteme.findUnique({
      where: { id },
    });
    if (!alerte) throw new NotFoundException('Alerte introuvable');
    return { succes: true, message: 'Alerte récupérée.', donnees: alerte };
  }

  async resoudre(id: string, adminId: string, dto: ResoudreAlerteDto) {
    const alerte = await this.prisma.alerteSysteme.findUnique({
      where: { id },
    });
    if (!alerte) throw new NotFoundException('Alerte introuvable');
    if (alerte.statut === 'RESOLUE') {
      throw new BadRequestException({
        message: 'Cette alerte est déjà résolue',
        code: 'ALERTE_DEJA_RESOLUE',
      });
    }

    const metadata = this.ajouterResolutionMetadata(
      alerte.metadata,
      adminId,
      dto.commentaire,
    );
    const maj = await this.prisma.alerteSysteme.update({
      where: { id },
      data: {
        statut: 'RESOLUE',
        resolueLe: new Date(),
        metadata,
      },
    });

    await this.prisma.journalAudit.create({
      data: {
        utilisateurId: adminId,
        action: 'ALERTE_RESOLUE',
        details: JSON.stringify({
          alerteId: id,
          type: alerte.type,
          commentaire: dto.commentaire ?? null,
        }),
      },
    });

    return { succes: true, message: 'Alerte résolue.', donnees: maj };
  }

  async rouvrir(id: string, adminId: string, dto: ResoudreAlerteDto) {
    const alerte = await this.prisma.alerteSysteme.findUnique({
      where: { id },
    });
    if (!alerte) throw new NotFoundException('Alerte introuvable');
    if (alerte.statut === 'OUVERTE') {
      throw new BadRequestException({
        message: 'Cette alerte est déjà ouverte',
        code: 'ALERTE_DEJA_OUVERTE',
      });
    }

    const metadata = this.ajouterReouvertureMetadata(
      alerte.metadata,
      adminId,
      dto.commentaire,
    );
    const maj = await this.prisma.alerteSysteme.update({
      where: { id },
      data: {
        statut: 'OUVERTE',
        resolueLe: null,
        metadata,
      },
    });

    await this.prisma.journalAudit.create({
      data: {
        utilisateurId: adminId,
        action: 'ALERTE_ROUVERTE',
        details: JSON.stringify({
          alerteId: id,
          type: alerte.type,
          commentaire: dto.commentaire ?? null,
        }),
      },
    });

    return { succes: true, message: 'Alerte rouverte.', donnees: maj };
  }

  private ajouterResolutionMetadata(
    metadata: string | null,
    adminId: string,
    commentaire?: string,
  ) {
    return JSON.stringify({
      ...this.parseMetadata(metadata),
      resolution: {
        adminId,
        commentaire: commentaire ?? null,
        date: new Date().toISOString(),
      },
    });
  }

  private ajouterReouvertureMetadata(
    metadata: string | null,
    adminId: string,
    commentaire?: string,
  ) {
    return JSON.stringify({
      ...this.parseMetadata(metadata),
      reouverture: {
        adminId,
        commentaire: commentaire ?? null,
        date: new Date().toISOString(),
      },
    });
  }

  private parseMetadata(metadata: string | null) {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      return { metadataOriginale: metadata };
    }
  }

  private finDeJournee(date: string) {
    const fin = new Date(date);
    fin.setHours(23, 59, 59, 999);
    return fin;
  }
}
