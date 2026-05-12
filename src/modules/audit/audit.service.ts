import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FiltrerAuditDto } from './dto/filtrer-audit.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async lister(dto: FiltrerAuditDto) {
    const page = dto.page ?? 1;
    const limite = dto.limite ?? 20;
    const skip = (page - 1) * limite;

    const where: Record<string, unknown> = {};
    if (dto.utilisateurId) where.utilisateurId = dto.utilisateurId;
    if (dto.action)
      where.action = { contains: dto.action, mode: 'insensitive' };
    if (dto.dateDebut || dto.dateFin) {
      where.creeLe = {
        ...(dto.dateDebut && { gte: new Date(dto.dateDebut) }),
        ...(dto.dateFin && { lte: new Date(dto.dateFin) }),
      };
    }

    const [total, journaux] = await Promise.all([
      this.prisma.journalAudit.count({ where }),
      this.prisma.journalAudit.findMany({
        where,
        skip,
        take: limite,
        orderBy: { creeLe: 'desc' },
        include: {
          utilisateur: {
            select: { id: true, nom: true, telephone: true, role: true },
          },
        },
      }),
    ]);

    return {
      succes: true,
      message: `${total} journal(aux) d’audit.`,
      donnees: {
        journaux,
        total,
        page,
        limite,
        pages: Math.ceil(total / limite),
      },
    };
  }
}
