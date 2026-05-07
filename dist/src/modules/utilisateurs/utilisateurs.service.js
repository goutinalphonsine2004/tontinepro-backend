"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilisateursService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const SELECT_PROFIL = {
    id: true, telephone: true, nom: true, photo: true, role: true,
    typeCollecteur: true, statut: true, empreinteActive: true,
    kycVerifie: true, soldeCommission: true, montantCaution: true,
    zoneId: true, collecteurId: true, creeLe: true, misAJourLe: true,
};
let UtilisateursService = class UtilisateursService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfil(utilisateurId) {
        const u = await this.prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
            select: SELECT_PROFIL,
        });
        if (!u)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        return { succes: true, message: 'Profil récupéré.', donnees: u };
    }
    async modifierProfil(utilisateurId, dto) {
        if (!dto.nom && !dto.photo) {
            throw new common_1.BadRequestException('Au moins un champ à modifier est requis');
        }
        const u = await this.prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: { ...(dto.nom && { nom: dto.nom }), ...(dto.photo && { photo: dto.photo }) },
            select: SELECT_PROFIL,
        });
        return { succes: true, message: 'Profil mis à jour.', donnees: u };
    }
    async changerPin(utilisateurId, dto) {
        const u = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
        if (!u || !u.pinHash)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const valide = await bcrypt.compare(dto.ancienPin, u.pinHash);
        if (!valide) {
            throw new common_1.BadRequestException({ message: 'Ancien PIN incorrect', code: 'PIN_INCORRECT' });
        }
        const pinHash = await bcrypt.hash(dto.nouveauPin, 10);
        await this.prisma.utilisateur.update({ where: { id: utilisateurId }, data: { pinHash } });
        return { succes: true, message: 'PIN modifié avec succès.' };
    }
    async listerUtilisateurs(dto) {
        const page = dto.page ?? 1;
        const limite = dto.limite ?? 20;
        const skip = (page - 1) * limite;
        const where = {};
        if (dto.role)
            where.role = dto.role;
        if (dto.statut)
            where.statut = dto.statut;
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
    async changerStatut(adminId, cibleId, dto) {
        if (adminId === cibleId) {
            throw new common_1.ForbiddenException('Impossible de modifier votre propre statut');
        }
        const cible = await this.prisma.utilisateur.findUnique({ where: { id: cibleId }, select: { id: true, role: true } });
        if (!cible)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (cible.role === client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Impossible de modifier le statut d\'un Admin');
        }
        const u = await this.prisma.utilisateur.update({
            where: { id: cibleId },
            data: { statut: dto.statut },
            select: SELECT_PROFIL,
        });
        return { succes: true, message: `Statut mis à jour → ${dto.statut}.`, donnees: u };
    }
    async changerRole(adminId, cibleId, dto) {
        if (adminId === cibleId) {
            throw new common_1.ForbiddenException('Impossible de modifier votre propre rôle');
        }
        const cible = await this.prisma.utilisateur.findUnique({ where: { id: cibleId }, select: { id: true } });
        if (!cible)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const u = await this.prisma.utilisateur.update({
            where: { id: cibleId },
            data: { role: dto.role },
            select: SELECT_PROFIL,
        });
        return { succes: true, message: `Rôle mis à jour → ${dto.role}.`, donnees: u };
    }
    async supprimerUtilisateur(adminId, cibleId) {
        if (adminId === cibleId) {
            throw new common_1.ForbiddenException('Impossible de supprimer votre propre compte');
        }
        const cible = await this.prisma.utilisateur.findUnique({
            where: { id: cibleId },
            include: { _count: { select: { transactions: true, tontines: true, microCredits: true } } },
        });
        if (!cible)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (cible.role === client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Impossible de supprimer un Admin');
        }
        if (cible._count.transactions > 0 || cible._count.tontines > 0 || cible._count.microCredits > 0) {
            await this.prisma.utilisateur.update({ where: { id: cibleId }, data: { statut: client_1.StatutCompte.BANNI } });
            return { succes: true, message: 'Compte banni (données financières conservées).', donnees: { id: cibleId } };
        }
        await this.prisma.utilisateur.delete({ where: { id: cibleId } });
        return { succes: true, message: 'Utilisateur supprimé définitivement.', donnees: { id: cibleId } };
    }
};
exports.UtilisateursService = UtilisateursService;
exports.UtilisateursService = UtilisateursService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UtilisateursService);
//# sourceMappingURL=utilisateurs.service.js.map