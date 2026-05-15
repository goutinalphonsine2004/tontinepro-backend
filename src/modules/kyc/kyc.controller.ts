import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { KycService } from './kyc.service';
import { SoumettreKycDto } from './dto/soumettre-kyc.dto';
import { RejeterKycDto } from './dto/rejeter-kyc.dto';

const TAILLE_MAX = 5 * 1024 * 1024; // 5 Mo
const MIME_AUTORISES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private service: KycService) {}

  // ─── POST /kyc/upload ─────────────────────────────────────
  // Upload direct depuis Flutter : caméra / galerie / PDF
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('fichier', {
      storage: memoryStorage(),
      limits: {
        fileSize: TAILLE_MAX,
        files: 1,
      },
      fileFilter: (req, file, cb) => {
        if (MIME_AUTORISES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException({
              message: 'Format non accepté. Utilisez JPG, PNG ou PDF.',
              code: 'FORMAT_INVALIDE',
            }),
            false,
          );
        }
      },
    }),
  )
  async uploadDocument(
    @UtilisateurCourant() u: { id: string },
    @UploadedFile() fichier: Express.Multer.File,
    @Body('typeDocument') typeDocument: string,
  ) {
    if (!fichier) {
      throw new BadRequestException({
        message: 'Aucun fichier reçu.',
        code: 'FICHIER_MANQUANT',
      });
    }
    if (!typeDocument) {
      throw new BadRequestException({
        message: 'Le type de document est obligatoire.',
        code: 'TYPE_DOCUMENT_MANQUANT',
      });
    }
    return this.service.uploadEtSoumettre(u.id, typeDocument, fichier);
  }

  // ─── POST /kyc/soumettre (compatibilité — URL manuelle) ──
  @Post('soumettre')
  soumettre(
    @UtilisateurCourant() u: { id: string },
    @Body() dto: SoumettreKycDto,
  ) {
    return this.service.soumettre(u.id, dto);
  }

  // ─── GET /kyc/mes-documents ───────────────────────────────
  @Get('mes-documents')
  mesDocuments(@UtilisateurCourant() u: { id: string }) {
    return this.service.mesDocuments(u.id);
  }

  // ─── Admin ───────────────────────────────────────────────

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  @Get('en-attente')
  enAttente() {
    return this.service.enAttente();
  }

  @Roles(Role.ADMIN, Role.SUPERVISEUR)
  @UseGuards(RolesGuard)
  @Put(':id/valider')
  valider(@Param('id') id: string, @UtilisateurCourant() u: { id: string }) {
    return this.service.valider(id, u.id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put(':id/rejeter')
  rejeter(
    @Param('id') id: string,
    @UtilisateurCourant() u: { id: string },
    @Body() dto: RejeterKycDto,
  ) {
    return this.service.rejeter(id, u.id, dto);
  }
}
