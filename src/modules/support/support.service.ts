import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  // ─── GET /support/faq ─────────────────────────────
  async listerFAQ(categorie?: string) {
    const faq = await this.prisma.articleFAQ.findMany({
      where: { actif: true, ...(categorie ? { categorie } : {}) },
      orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }],
    });
    const categories = [...new Set(faq.map((a) => a.categorie))];
    return {
      succes: true,
      message: `${faq.length} article(s) FAQ.`,
      donnees: { categories, articles: faq },
    };
  }

  // ─── POST /support/faq (Admin) ────────────────────
  async creerFAQ(dto: { categorie: string; question: string; reponse: string; ordre?: number }, adminId: string) {
    const article = await this.prisma.articleFAQ.create({
      data: { ...dto, creePar: adminId },
    });
    return { succes: true, message: 'Article FAQ créé.', donnees: article };
  }

  // ─── PUT /support/faq/:id (Admin) ─────────────────
  async modifierFAQ(id: string, dto: Partial<{ categorie: string; question: string; reponse: string; ordre: number; actif: boolean }>) {
    const article = await this.prisma.articleFAQ.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article FAQ introuvable');
    const maj = await this.prisma.articleFAQ.update({ where: { id }, data: dto });
    return { succes: true, message: 'Article FAQ mis à jour.', donnees: maj };
  }

  // ─── DELETE /support/faq/:id (Admin) ──────────────
  async supprimerFAQ(id: string) {
    const article = await this.prisma.articleFAQ.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article FAQ introuvable');
    await this.prisma.articleFAQ.update({ where: { id }, data: { actif: false } });
    return { succes: true, message: 'Article désactivé.' };
  }
}
