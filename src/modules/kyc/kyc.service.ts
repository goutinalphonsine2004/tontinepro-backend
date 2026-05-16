import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { StatutKYC } from '@prisma/client';
import { createHash } from 'crypto';
import axios from 'axios';
import FormData from 'form-data';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SoumettreKycDto } from './dto/soumettre-kyc.dto';
import { RejeterKycDto } from './dto/rejeter-kyc.dto';

const TYPES_VALIDES = ['CNI', 'PASSEPORT', 'PERMIS', 'ACTE_NAISSANCE'];
const MIME_AUTORISES = ['image/jpeg', 'image/png', 'application/pdf'];
const TAILLE_MAX_OCTETS = 5 * 1024 * 1024; // 5 Mo

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ─── POST /kyc/upload ─────────────────────────────────────
  // Endpoint principal : reçoit le fichier, l'upload, crée le document

  async uploadEtSoumettre(
    utilisateurId: string,
    typeDocument: string,
    fichier: Express.Multer.File,
  ) {
    // Validation type document
    if (!TYPES_VALIDES.includes(typeDocument)) {
      throw new BadRequestException({
        message: `Type de document invalide. Valeurs autorisées : ${TYPES_VALIDES.join(', ')}`,
        code: 'TYPE_DOCUMENT_INVALIDE',
      });
    }

    // Validation MIME
    if (!MIME_AUTORISES.includes(fichier.mimetype)) {
      throw new BadRequestException({
        message: 'Format non accepté. Utilisez JPG, PNG ou PDF.',
        code: 'FORMAT_INVALIDE',
      });
    }

    // Validation taille
    if (fichier.size > TAILLE_MAX_OCTETS) {
      throw new BadRequestException({
        message: 'Fichier trop volumineux. Maximum 5 Mo.',
        code: 'FICHIER_TROP_GRAND',
      });
    }

    // Vérifier document existant du même type EN_ATTENTE ou VALIDE
    const existant = await this.prisma.documentKYC.findFirst({
      where: {
        utilisateurId,
        typeDocument,
        statut: { in: [StatutKYC.EN_ATTENTE, StatutKYC.VALIDE] },
      },
    });
    if (existant) {
      throw new BadRequestException({
        message: `Un document ${typeDocument} est déjà soumis ou validé.`,
        code: 'DOCUMENT_EXISTANT',
      });
    }

    // Upload du fichier
    const urlDocument = await this.uploaderFichier(fichier);

    // Créer l'enregistrement KYC
    const doc = await this.prisma.documentKYC.create({
      data: { utilisateurId, typeDocument, urlDocument },
    });

    this.logger.log(
      `KYC soumis — utilisateur ${utilisateurId} — type ${typeDocument}`,
    );

    return {
      succes: true,
      message: 'Document soumis. En attente de validation Admin.',
      donnees: {
        id: doc.id,
        typeDocument: doc.typeDocument,
        statut: doc.statut,
        creeLe: doc.creeLe,
      },
    };
  }

  // ─── Upload fichier (Cloudinary ou base64 dev) ────────────

  private async uploaderFichier(fichier: Express.Multer.File): Promise<string> {
    const cloudinaryUrl = this.config.get<string>('CLOUDINARY_URL');

    if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
      try {
        return await this.uploadCloudinary(fichier, cloudinaryUrl);
      } catch (err) {
        this.logger.error('Cloudinary upload failed, fallback base64', err);
        return this.creerDataUrl(fichier);
      }
    }

    // Dev fallback : data URI base64
    return this.creerDataUrl(fichier);
  }

  private async uploadCloudinary(
    fichier: Express.Multer.File,
    cloudinaryUrl: string,
  ): Promise<string> {
    // Parse cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    const without = cloudinaryUrl.replace('cloudinary://', '');
    const atIdx = without.lastIndexOf('@');
    const credentials = without.substring(0, atIdx);
    const cloudName = without.substring(atIdx + 1);
    const [apiKey, apiSecret] = credentials.split(':');

    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `folder=kyc&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash('sha1').update(toSign).digest('hex');

    const form = new FormData();
    form.append('file', fichier.buffer, {
      filename: fichier.originalname,
      contentType: fichier.mimetype,
    });
    form.append('timestamp', timestamp.toString());
    form.append('api_key', apiKey);
    form.append('signature', signature);
    form.append('folder', 'kyc');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    const resp = await axios.post<{ secure_url: string }>(uploadUrl, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    return resp.data.secure_url;
  }

  private creerDataUrl(fichier: Express.Multer.File): string {
    const base64 = fichier.buffer.toString('base64');
    return `data:${fichier.mimetype};base64,${base64}`;
  }

  // ─── POST /kyc/soumettre (URL manuelle — compatibilité) ──

  async soumettre(utilisateurId: string, dto: SoumettreKycDto) {
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
      data: {
        utilisateurId,
        typeDocument: dto.typeDocument,
        urlDocument: dto.urlDocument,
      },
    });
    return {
      succes: true,
      message: 'Document soumis. En attente de validation Admin.',
      donnees: doc,
    };
  }

  // ─── GET /kyc/mes-documents ────────────────────────

  async mesDocuments(utilisateurId: string) {
    const docs = await this.prisma.documentKYC.findMany({
      where: { utilisateurId },
      orderBy: { creeLe: 'desc' },
      select: {
        id: true,
        typeDocument: true,
        statut: true,
        motifRejet: true,
        creeLe: true,
      },
    });
    return {
      succes: true,
      message: `${docs.length} document(s).`,
      donnees: docs,
    };
  }

  // ─── GET /kyc/en-attente (Admin) ──────────────────

  async enAttente() {
    const docs = await this.prisma.documentKYC.findMany({
      where: { statut: StatutKYC.EN_ATTENTE },
      include: {
        utilisateur: {
          select: { id: true, nom: true, telephone: true, role: true },
        },
      },
      orderBy: { creeLe: 'asc' },
    });
    return {
      succes: true,
      message: `${docs.length} document(s) en attente.`,
      donnees: docs,
    };
  }

  // ─── PUT /kyc/:id/valider (Admin) ─────────────────

  async valider(docId: string, adminId: string) {
    const doc = await this.prisma.documentKYC.findUnique({
      where: { id: docId },
    });
    if (!doc) throw new NotFoundException('Document introuvable');
    if (doc.statut !== StatutKYC.EN_ATTENTE) {
      throw new BadRequestException({
        message: "Ce document n'est plus en attente",
        code: 'STATUT_INVALIDE',
      });
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

    return {
      succes: true,
      message: 'Document KYC validé. Compte marqué vérifié.',
      donnees: docMaj,
    };
  }

  // ─── PUT /kyc/:id/rejeter (Admin) ─────────────────

  async rejeter(docId: string, adminId: string, dto: RejeterKycDto) {
    const doc = await this.prisma.documentKYC.findUnique({
      where: { id: docId },
    });
    if (!doc) throw new NotFoundException('Document introuvable');
    if (doc.statut !== StatutKYC.EN_ATTENTE) {
      throw new BadRequestException({
        message: "Ce document n'est plus en attente",
        code: 'STATUT_INVALIDE',
      });
    }

    const docMaj = await this.prisma.documentKYC.update({
      where: { id: docId },
      data: {
        statut: StatutKYC.REJETE,
        verifiePar: adminId,
        motifRejet: dto.motifRejet,
      },
    });
    return { succes: true, message: 'Document rejeté.', donnees: docMaj };
  }
}
