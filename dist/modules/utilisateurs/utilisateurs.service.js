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
    id: true,
    telephone: true,
    nom: true,
    photo: true,
    role: true,
    typeCollecteur: true,
    statut: true,
    empreinteActive: true,
    kycVerifie: true,
    soldeCommissionFcfa: true,
    montantCautionFcfa: true,
    zoneId: true,
    collecteurId: true,
    creeLe: true,
    misAJourLe: true,
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
    async monQrCode(utilisateurId) {
        const u = await this.prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
            select: { id: true, nom: true, telephone: true },
        });
        if (!u)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const codeQR = `TONTINEPRO-CLIENT-${u.id}`;
        const expireLe = new Date(Date.now() + 24 * 60 * 60 * 1000);
        return {
            succes: true,
            message: 'QR code personnel généré.',
            donnees: {
                codeQR,
                expireLe,
                actif: true,
            },
        };
    }
    async modifierProfil(utilisateurId, dto) {
        if (!dto.nom && !dto.photo) {
            throw new common_1.BadRequestException('Au moins un champ à modifier est requis');
        }
        const u = await this.prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: {
                ...(dto.nom && { nom: dto.nom }),
                ...(dto.photo && { photo: dto.photo }),
            },
            select: SELECT_PROFIL,
        });
        return { succes: true, message: 'Profil mis à jour.', donnees: u };
    }
    async changerPin(utilisateurId, dto) {
        const u = await this.prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
        });
        if (!u || !u.pinHash)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const valide = await bcrypt.compare(dto.ancienPin, u.pinHash);
        if (!valide) {
            throw new common_1.BadRequestException({
                message: 'Ancien PIN incorrect',
                code: 'PIN_INCORRECT',
            });
        }
        const pinHash = await bcrypt.hash(dto.nouveauPin, 10);
        await this.prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: { pinHash },
        });
        return { succes: true, message: 'PIN modifié avec succès.' };
    }
    async configurerEmpreinte(utilisateurId, dto) {
        const u = await this.prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
        });
        if (!u || !u.pinHash)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (u.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.ForbiddenException({
                message: 'Seul un compte actif peut modifier l’empreinte digitale',
                code: 'COMPTE_INACTIF',
            });
        }
        const pinValide = await bcrypt.compare(dto.pin, u.pinHash);
        if (!pinValide) {
            throw new common_1.BadRequestException({
                message: 'PIN incorrect',
                code: 'PIN_INCORRECT',
            });
        }
        const utilisateur = await this.prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: { empreinteActive: dto.actif },
            select: SELECT_PROFIL,
        });
        return {
            succes: true,
            message: dto.actif
                ? 'Empreinte digitale activée.'
                : 'Empreinte digitale désactivée.',
            donnees: utilisateur,
        };
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
            this.prisma.utilisateur.findMany({
                where,
                select: SELECT_PROFIL,
                skip,
                take: limite,
                orderBy: { creeLe: 'desc' },
            }),
        ]);
        return {
            succes: true,
            message: `${total} utilisateur(s) trouvé(s).`,
            donnees: {
                utilisateurs,
                total,
                page,
                limite,
                pages: Math.ceil(total / limite),
            },
        };
    }
    async changerStatut(adminId, cibleId, dto) {
        if (adminId === cibleId) {
            throw new common_1.ForbiddenException('Impossible de modifier votre propre statut');
        }
        const cible = await this.prisma.utilisateur.findUnique({
            where: { id: cibleId },
            select: { id: true, role: true },
        });
        if (!cible)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (cible.role === client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException("Impossible de modifier le statut d'un Admin");
        }
        const u = await this.prisma.utilisateur.update({
            where: { id: cibleId },
            data: { statut: dto.statut },
            select: SELECT_PROFIL,
        });
        return {
            succes: true,
            message: `Statut mis à jour → ${dto.statut}.`,
            donnees: u,
        };
    }
    async changerRole(adminId, cibleId, dto) {
        if (adminId === cibleId) {
            throw new common_1.ForbiddenException('Impossible de modifier votre propre rôle');
        }
        const cible = await this.prisma.utilisateur.findUnique({
            where: { id: cibleId },
            select: { id: true },
        });
        if (!cible)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const u = await this.prisma.utilisateur.update({
            where: { id: cibleId },
            data: { role: dto.role },
            select: SELECT_PROFIL,
        });
        return {
            succes: true,
            message: `Rôle mis à jour → ${dto.role}.`,
            donnees: u,
        };
    }
    async assignerSuperviseur(adminId, agentId, superviseurId) {
        const agent = await this.prisma.utilisateur.findUnique({
            where: { id: agentId },
            select: { id: true, role: true },
        });
        if (!agent)
            throw new common_1.NotFoundException('Agent introuvable');
        if (![client_1.Role.AGENT, client_1.Role.INDEPENDANT].includes(agent.role)) {
            throw new common_1.BadRequestException('Seul un collecteur (Agent ou Indépendant) peut avoir un superviseur');
        }
        if (superviseurId) {
            const superviseur = await this.prisma.utilisateur.findUnique({
                where: { id: superviseurId },
                select: { id: true, role: true },
            });
            if (!superviseur)
                throw new common_1.NotFoundException('Superviseur introuvable');
            if (superviseur.role !== client_1.Role.SUPERVISEUR) {
                throw new common_1.BadRequestException("L'utilisateur spécifié n'est pas un superviseur");
            }
        }
        await this.prisma.utilisateur.update({
            where: { id: agentId },
            data: { superviseurId },
        });
        return {
            succes: true,
            message: superviseurId
                ? 'Superviseur assigné avec succès'
                : 'Superviseur retiré avec succès',
        };
    }
    async monDashboard(clientId) {
        const maintenant = new Date();
        const sixMoisDate = new Date(maintenant);
        sixMoisDate.setMonth(sixMoisDate.getMonth() - 5);
        sixMoisDate.setDate(1);
        const [utilisateur, scoreCredit, badge, dernieresTransactions, creditActif, prochainsGroupes,] = await Promise.all([
            this.prisma.utilisateur.findUnique({
                where: { id: clientId },
                select: {
                    id: true,
                    nom: true,
                    photo: true,
                    telephone: true,
                    tontines: {
                        select: {
                            id: true,
                            nom: true,
                            soldeActuelFcfa: true,
                            objectifMontantFcfa: true,
                            montantJournalierFcfa: true,
                            type: true,
                            dateDeverrouillage: true,
                        },
                    },
                },
            }),
            this.prisma.scoreCredit.findUnique({
                where: { utilisateurId: clientId },
            }),
            this.prisma.badgeClient.findFirst({
                where: { clientId },
                orderBy: { obtenuLe: 'desc' },
            }),
            this.prisma.transaction.findMany({
                where: { utilisateurId: clientId },
                orderBy: { creeLe: 'desc' },
                take: 5,
                include: { tontine: { select: { nom: true } } },
            }),
            this.prisma.microCredit.findFirst({
                where: { clientId, statut: { in: ['ACTIF'] } },
                select: {
                    id: true,
                    montantRestantFcfa: true,
                    paiementJournalierFcfa: true,
                    joursPayes: true,
                    totalJours: true,
                },
            }),
            this.prisma.ordreTirage.findMany({
                where: { utilisateurId: clientId, aRecu: false },
                include: {
                    tontine: { select: { id: true, nom: true, montantJournalierFcfa: true } },
                },
                orderBy: { position: 'asc' },
                take: 1,
            }),
        ]);
        if (!utilisateur)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const cotisations6mois = await this.prisma.transaction.findMany({
            where: {
                utilisateurId: clientId,
                type: 'COTISATION',
                statut: 'SUCCES',
                creeLe: { gte: sixMoisDate },
            },
            select: { montantNetFcfa: true, creeLe: true },
        });
        const graphique = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(maintenant);
            d.setMonth(d.getMonth() - i);
            graphique[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
        }
        for (const tx of cotisations6mois) {
            const key = `${tx.creeLe.getFullYear()}-${String(tx.creeLe.getMonth() + 1).padStart(2, '0')}`;
            if (graphique[key] !== undefined)
                graphique[key] += tx.montantNetFcfa;
        }
        const soldeTotal = utilisateur.tontines.reduce((s, t) => s + t.soldeActuelFcfa, 0);
        const score = scoreCredit?.score ?? 0;
        const eligibleMicroCredit = scoreCredit?.eligibleMicroCredit ?? false;
        const eligiblePADME = scoreCredit?.eligiblePADME ?? false;
        return {
            succes: true,
            message: 'Tableau de bord récupéré.',
            donnees: {
                profil: {
                    id: utilisateur.id,
                    nom: utilisateur.nom,
                    photo: utilisateur.photo,
                },
                soldeTotal,
                tontines: utilisateur.tontines,
                graphiqueEpargne: Object.entries(graphique).map(([mois, montantFcfa]) => ({
                    mois,
                    montantFcfa: Math.round(montantFcfa),
                })),
                badge: badge
                    ? { niveau: badge.niveau, obtenuLe: badge.obtenuLe }
                    : null,
                score: {
                    valeur: score,
                    eligibleMicroCredit,
                    eligiblePADME,
                    dernierCalcul: scoreCredit?.dernierCalcul ?? null,
                },
                creditActif,
                alertes: {
                    microCreditDisponible: eligibleMicroCredit && !creditActif,
                    eligiblePADME,
                },
                prochaineDistribution: prochainsGroupes[0] ?? null,
                dernieresTransactions,
            },
        };
    }
    async supprimerUtilisateur(adminId, cibleId) {
        if (adminId === cibleId) {
            throw new common_1.ForbiddenException('Impossible de supprimer votre propre compte');
        }
        const cible = await this.prisma.utilisateur.findUnique({
            where: { id: cibleId },
            include: {
                _count: {
                    select: { transactions: true, tontines: true, microCredits: true },
                },
            },
        });
        if (!cible)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (cible.role === client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Impossible de supprimer un Admin');
        }
        if (cible._count.transactions > 0 ||
            cible._count.tontines > 0 ||
            cible._count.microCredits > 0) {
            await this.prisma.utilisateur.update({
                where: { id: cibleId },
                data: { statut: client_1.StatutCompte.BANNI },
            });
            return {
                succes: true,
                message: 'Compte banni (données financières conservées).',
                donnees: { id: cibleId },
            };
        }
        await this.prisma.utilisateur.delete({ where: { id: cibleId } });
        return {
            succes: true,
            message: 'Utilisateur supprimé définitivement.',
            donnees: { id: cibleId },
        };
    }
    async reassignerClient(clientId, nouveauCollecteurId, adminId) {
        const client = await this.prisma.utilisateur.findUnique({
            where: { id: clientId },
            select: {
                id: true,
                nom: true,
                telephone: true,
                collecteurId: true,
                role: true,
            },
        });
        if (!client)
            throw new common_1.NotFoundException('Client introuvable');
        if (client.role !== client_1.Role.CLIENT) {
            throw new common_1.BadRequestException({
                message: 'Seul un client peut être réassigné',
                code: 'ROLE_INVALIDE',
            });
        }
        const nouveauCollecteur = await this.prisma.utilisateur.findUnique({
            where: { id: nouveauCollecteurId },
            select: { id: true, nom: true, role: true, statut: true },
        });
        if (!nouveauCollecteur)
            throw new common_1.NotFoundException('Nouveau collecteur introuvable');
        if (![client_1.Role.AGENT, client_1.Role.INDEPENDANT].includes(nouveauCollecteur.role)) {
            throw new common_1.BadRequestException({
                message: 'Le destinataire doit être un collecteur',
                code: 'ROLE_INVALIDE',
            });
        }
        if (nouveauCollecteur.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.BadRequestException({
                message: 'Collecteur inactif',
                code: 'COLLECTEUR_INACTIF',
            });
        }
        const ancienCollecteurId = client.collecteurId;
        await this.prisma.utilisateur.update({
            where: { id: clientId },
            data: { collecteurId: nouveauCollecteurId },
        });
        await this.prisma.journalAudit.create({
            data: {
                utilisateurId: adminId,
                action: 'REASSIGNER_CLIENT',
                details: JSON.stringify({
                    clientId,
                    clientNom: client.nom,
                    ancienCollecteurId,
                    nouveauCollecteurId,
                    nouveauCollecteurNom: nouveauCollecteur.nom,
                }),
            },
        });
        return {
            succes: true,
            message: `${client.nom} réassigné à ${nouveauCollecteur.nom}.`,
            donnees: { clientId, ancienCollecteurId, nouveauCollecteurId },
        };
    }
    async supprimerMonCompte(clientId, pin) {
        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { id: clientId },
            include: {
                _count: { select: { microCredits: true } },
                tontines: { select: { soldeActuelFcfa: true } },
            },
        });
        if (!utilisateur)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const pinValide = await bcrypt.compare(pin, utilisateur.pinHash ?? '');
        if (!pinValide) {
            throw new common_1.UnauthorizedException({
                message: 'Code PIN incorrect',
                code: 'PIN_INVALIDE',
            });
        }
        const soldeTotal = utilisateur.tontines.reduce((s, t) => s + t.soldeActuelFcfa, 0);
        if (soldeTotal > 0) {
            throw new common_1.BadRequestException({
                message: `Impossible de supprimer votre compte : vous avez ${soldeTotal} FCFA de solde. Faites d'abord un retrait.`,
                code: 'SOLDE_NON_NUL',
            });
        }
        const creditActif = await this.prisma.microCredit.findFirst({
            where: { clientId, statut: { in: ['ACTIF', 'EN_DEFAUT'] } },
        });
        if (creditActif) {
            throw new common_1.BadRequestException({
                message: 'Impossible de supprimer votre compte : vous avez un micro-crédit en cours.',
                code: 'CREDIT_ACTIF',
            });
        }
        const aHistorique = utilisateur._count.microCredits > 0;
        if (aHistorique) {
            await this.prisma.utilisateur.update({
                where: { id: clientId },
                data: {
                    statut: client_1.StatutCompte.BANNI,
                    nom: '[Compte supprimé]',
                    telephone: `DELETED_${clientId}`,
                },
            });
            return {
                succes: true,
                message: 'Compte supprimé. Vos données financières sont anonymisées.',
            };
        }
        await this.prisma.utilisateur.delete({ where: { id: clientId } });
        return { succes: true, message: 'Compte supprimé définitivement.' };
    }
    async mesStats(clientId) {
        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { id: clientId },
            select: {
                id: true,
                _count: {
                    select: {
                        tontines: true,
                        transactions: true,
                        retraits: true,
                    },
                },
            },
        });
        if (!utilisateur)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const transactions = await this.prisma.transaction.findMany({
            where: { utilisateurId: clientId },
            select: { montantFcfa: true, creeLe: true },
        });
        const retraits = await this.prisma.retrait.findMany({
            where: { utilisateurId: clientId },
            select: { montantFcfa: true, statut: true },
        });
        const soldeTotal = transactions.reduce((acc, t) => acc + t.montantFcfa, 0) -
            retraits.reduce((acc, r) => acc + r.montantFcfa, 0);
        const moisActifs = new Set();
        for (const t of transactions) {
            const mois = `${t.creeLe.getFullYear()}-${t.creeLe.getMonth()}`;
            moisActifs.add(mois);
        }
        const tauxRegularite = Math.min(100, Math.round((moisActifs.size / 12) * 100));
        return {
            succes: true,
            message: 'Statistiques récupérées',
            donnees: {
                totalTontines: utilisateur._count.tontines,
                totalCotisations: utilisateur._count.transactions,
                totalRetraits: utilisateur._count.retraits,
                soldeTotal,
                tauxRegularite,
            },
        };
    }
};
exports.UtilisateursService = UtilisateursService;
exports.UtilisateursService = UtilisateursService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UtilisateursService);
//# sourceMappingURL=utilisateurs.service.js.map