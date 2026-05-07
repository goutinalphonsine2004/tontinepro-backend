import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StatutKYC } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SoumettreKycDto } from './dto/soumettre-kyc.dto';
import { RejeterKycDto } from './dto/rejeter-kyc.dto';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  // ─── POST /kyc/soumettre ───────────────────────────
  async soumettre(utilisateurId: string, dto: SoumettreKycDto) {
    // Un seul document par type autorisé (en attente ou validé)
    const existant = await this.prisma.documentKYC.findFirst({
      where: {
        utilisateurId,
        typeDocument: dto.typeDocument,
        statut: { in: [StatutKYC.EN_ATTENTE, StatutKYC.VALIDE] },
      },
    });
    if (existant) {
      throw new BadRequestException({
        message: `Un document ${dto.typeDocument} est déjà soumis ou validé`,
        code: 'DOCUMENT_EXISTANT',
      });
    }

    const doc = await this.prisma.documentKYC.create({
      data: { utilisateurId, typeDocument: dto.typeDocument, urlDocument: dto.urlDocument },
    });
    return { succes: true, message: 'Document soumis. En attente de validation Admin.', donnees: doc };
  }

  // ─── GET /kyc/mes-documents ────────────────────────
  async mesDocuments(utilisateurId: string) {
    const docs = await this.prisma.documentKYC.findMany({
      where: { utilisateurId },
      orderBy: { creeLe: 'desc' },
    });
    return { succes: true, message: `${docs.length} document(s).`, donnees: docs };
  }

  // ─── GET /kyc/en-attente (Admin) ──────────────────
  async enAttente() {
    const docs = await this.prisma.documentKYC.findMany({
      where: { statut: StatutKYC.EN_ATTENTE },
      include: { utilisateur: { select: { id: true, nom: true, telephone: true, role: true } } },
      orderBy: { creeLe: 'asc' },
    });
    return { succes: true, message: `${docs.length} document(s) en attente.`, donnees: docs };
  }

  // ─── PUT /kyc/:id/valider (Admin) ─────────────────
  async valider(docId: string, adminId: string) {
    const doc = await this.prisma.documentKYC.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document introuvable');
    if (doc.statut !== StatutKYC.EN_ATTENTE) {
      throw new BadRequestException({ message: 'Ce document n\'est plus en attente', code: 'STATUT_INVALIDE' });
    }

    const [docMaj] = await this.prisma.$transaction([
      this.prisma.documentKYC.update({
        where: { id: docId },
        data: { statut: StatutKYC.VALIDE, verifiePar: adminId },
      }),
      this.prisma.utilisateur.update({
        where: { id: doc.utilisateurId },
        data: { kycVerifie: true },
      }),
    ]);

    return { succes: true, message: 'Document KYC validé. Compte marqué vérifié.', donnees: docMaj };
  }

  // ─── PUT /kyc/:id/rejeter (Admin) ─────────────────
  async rejeter(docId: string, adminId: string, dto: RejeterKycDto) {
    const doc = await this.prisma.documentKYC.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document introuvable');
    if (doc.statut !== StatutKYC.EN_ATTENTE) {
      throw new BadRequestException({ message: 'Ce document n\'est plus en attente', code: 'STATUT_INVALIDE' });
    }

    const docMaj = await this.prisma.documentKYC.update({
      where: { id: docId },
      data: { statut: StatutKYC.REJETE, verifiePar: adminId, motifRejet: dto.motifRejet },
    });
    return { succes: true, message: 'Document rejeté.', donnees: docMaj };
  }
}
