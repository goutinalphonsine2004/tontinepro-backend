import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, StatutCompte } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ModifierProfilDto } from './dto/modifier-profil.dto';
import { ChangerPinDto } from './dto/changer-pin.dto';
import { FiltrerUtilisateursDto } from './dto/filtrer-utilisateurs.dto';
import { ChangerStatutDto } from './dto/changer-statut.dto';
import { ChangerRoleDto } from './dto/changer-role.dto';

const SELECT_PROFIL = {
  id: true, telephone: true, nom: true, photo: true, role: true,
  typeCollecteur: true, statut: true, empreinteActive: true,
  kycVerifie: true, soldeCommission: true, montantCaution: true,
  zoneId: true, collecteurId: true, creeLe: true, misAJourLe: true,
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

  // ─── PUT /utilisateurs/profil ──────────────────────
  async modifierProfil(utilisateurId: string, dto: ModifierProfilDto) {
    if (!dto.nom && !dto.photo) {
      throw new BadRequestException('Au moins un champ à modifier est requis');
    }
    const u = await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { ...(dto.nom && { nom: dto.nom }), ...(dto.photo && { photo: dto.photo }) },
      select: SELECT_PROFIL,
    });
    return { succes: true, message: 'Profil mis à jour.', donnees: u };
  }

  // ─── PUT /utilisateurs/pin ─────────────────────────
  async changerPin(utilisateurId: string, dto: ChangerPinDto) {
    const u = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (!u || !u.pinHash) throw new NotFoundException('Utilisateur introuvable');

    const valide = await bcrypt.compare(dto.ancienPin, u.pinHash);
    if (!valide) {
      throw new BadRequestException({ message: 'Ancien PIN incorrect', code: 'PIN_INCORRECT' });
    }
    const pinHash = await bcrypt.hash(dto.nouveauPin, 10);
    await this.prisma.utilisateur.update({ where: { id: utilisateurId }, data: { pinHash } });
    return { succes: true, message: 'PIN modifié avec succès.' };
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
      this.prisma.utilisateur.findMany({ where, select: SELECT_PROFIL, skip, take: limite, orderBy: { creeLe: 'desc' } }),
    ]);

    return {
      succes: true,
      message: `${total} utilisateur(s) trouvé(s).`,
      donnees: { utilisateurs, total, page, limite, pages: Math.ceil(total / limite) },
    };
  }

  // ─── PUT /utilisateurs/:id/statut (Admin) ──────────
  async changerStatut(adminId: string, cibleId: string, dto: ChangerStatutDto) {
    if (adminId === cibleId) {
      throw new ForbiddenException('Impossible de modifier votre propre statut');
    }
    const cible = await this.prisma.utilisateur.findUnique({ where: { id: cibleId }, select: { id: true, role: true } });
    if (!cible) throw new NotFoundException('Utilisateur introuvable');
    if (cible.role === Role.ADMIN) {
      throw new ForbiddenException('Impossible de modifier le statut d\'un Admin');
    }
    const u = await this.prisma.utilisateur.update({
      where: { id: cibleId },
      data: { statut: dto.statut },
      select: SELECT_PROFIL,
    });
    return { succes: true, message: `Statut mis à jour → ${dto.statut}.`, donnees: u };
  }

  // ─── PUT /utilisateurs/:id/role (Admin) ────────────
  async changerRole(adminId: string, cibleId: string, dto: ChangerRoleDto) {
    if (adminId === cibleId) {
      throw new ForbiddenException('Impossible de modifier votre propre rôle');
    }
    const cible = await this.prisma.utilisateur.findUnique({ where: { id: cibleId }, select: { id: true } });
    if (!cible) throw new NotFoundException('Utilisateur introuvable');

    const u = await this.prisma.utilisateur.update({
      where: { id: cibleId },
      data: { role: dto.role },
      select: SELECT_PROFIL,
    });
    return { succes: true, message: `Rôle mis à jour → ${dto.role}.`, donnees: u };
  }

  // ─── DELETE /utilisateurs/:id (Admin) ──────────────
  async supprimerUtilisateur(adminId: string, cibleId: string) {
    if (adminId === cibleId) {
      throw new ForbiddenException('Impossible de supprimer votre propre compte');
    }
    const cible = await this.prisma.utilisateur.findUnique({
      where: { id: cibleId },
      include: { _count: { select: { transactions: true, tontines: true, microCredits: true } } },
    });
    if (!cible) throw new NotFoundException('Utilisateur introuvable');
    if (cible.role === Role.ADMIN) {
      throw new ForbiddenException('Impossible de supprimer un Admin');
    }
    if (cible._count.transactions > 0 || cible._count.tontines > 0 || cible._count.microCredits > 0) {
      // Soft delete : bannissement (intégrité des données financières)
      await this.prisma.utilisateur.update({ where: { id: cibleId }, data: { statut: StatutCompte.BANNI } });
      return { succes: true, message: 'Compte banni (données financières conservées).', donnees: { id: cibleId } };
    }
    await this.prisma.utilisateur.delete({ where: { id: cibleId } });
    return { succes: true, message: 'Utilisateur supprimé définitivement.', donnees: { id: cibleId } };
  }
}
