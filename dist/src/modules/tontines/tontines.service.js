"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TontinesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const business_constants_1 = require("../../common/constants/business.constants");
let TontinesService = class TontinesService {
    prisma;
    kkiapay;
    constructor(prisma, kkiapay) {
        this.prisma = prisma;
        this.kkiapay = kkiapay;
    }
    async creer(proprietaireId, dto) {
        const tontine = await this.prisma.tontine.create({
            data: {
                nom: dto.nom,
                type: dto.type ?? client_1.TypeTontine.PERSONNEL,
                politique: dto.politique ?? client_1.PolitiqueRetrait.FLEXIBLE,
                objectifMontant: dto.objectifMontant,
                montantJournalier: dto.montantJournalier ?? 500,
                dateDeverrouillage: dto.dateDeverrouillage,
                proprietaireId,
            },
            include: { proprietaire: { select: { id: true, nom: true, telephone: true } } },
        });
        return { succes: true, message: 'Tontine créée.', donnees: tontine };
    }
    async mesTontines(utilisateurId) {
        const [proprietes, membre] = await Promise.all([
            this.prisma.tontine.findMany({
                where: { proprietaireId: utilisateurId },
                include: { _count: { select: { membres: true, transactions: true } } },
            }),
            this.prisma.membreTontineGroupe.findMany({
                where: { utilisateurId, statut: client_1.StatutMembreGroupe.ACTIF },
                include: { tontine: { include: { _count: { select: { membres: true } } } } },
            }),
        ]);
        return {
            succes: true,
            message: 'Tontines récupérées.',
            donnees: {
                proprietaire: proprietes,
                membre: membre.map((m) => ({ ...m.tontine, monStatut: m.statut, caution: m.montantCaution })),
            },
        };
    }
    async getTontine(id, utilisateurId) {
        const t = await this.prisma.tontine.findUnique({
            where: { id },
            include: {
                proprietaire: { select: { id: true, nom: true, telephone: true } },
                _count: { select: { membres: true, transactions: true } },
            },
        });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        const estMembre = await this.prisma.membreTontineGroupe.findFirst({
            where: { tontineId: id, utilisateurId },
        });
        if (t.proprietaireId !== utilisateurId && !estMembre) {
            throw new common_1.ForbiddenException('Accès refusé à cette tontine');
        }
        return { succes: true, message: 'Tontine récupérée.', donnees: t };
    }
    async modifier(id, proprietaireId, dto) {
        const t = await this.prisma.tontine.findUnique({ where: { id } });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.proprietaireId !== proprietaireId)
            throw new common_1.ForbiddenException('Seul le propriétaire peut modifier cette tontine');
        const maj = await this.prisma.tontine.update({
            where: { id },
            data: {
                ...(dto.politique && { politique: dto.politique }),
                ...(dto.objectifMontant !== undefined && { objectifMontant: dto.objectifMontant }),
                ...(dto.montantJournalier && { montantJournalier: dto.montantJournalier }),
                ...(dto.dateDeverrouillage && { dateDeverrouillage: dto.dateDeverrouillage }),
            },
        });
        return { succes: true, message: 'Tontine mise à jour.', donnees: maj };
    }
    async rejoindre(tontineId, utilisateurId, dto) {
        const t = await this.prisma.tontine.findUnique({ where: { id: tontineId } });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.type !== client_1.TypeTontine.GROUPE) {
            throw new common_1.BadRequestException({ message: 'Seules les tontines de groupe peuvent être rejointes', code: 'TYPE_INVALIDE' });
        }
        if (t.proprietaireId === utilisateurId) {
            throw new common_1.BadRequestException({ message: 'Vous êtes déjà propriétaire de cette tontine', code: 'DEJA_PROPRIETAIRE' });
        }
        const existant = await this.prisma.membreTontineGroupe.findUnique({
            where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
        });
        if (existant && existant.statut === client_1.StatutMembreGroupe.ACTIF) {
            throw new common_1.BadRequestException({ message: 'Vous êtes déjà membre de cette tontine', code: 'DEJA_MEMBRE' });
        }
        const nbMembres = await this.prisma.membreTontineGroupe.count({ where: { tontineId } });
        const membre = await this.prisma.membreTontineGroupe.upsert({
            where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
            create: {
                tontineId,
                utilisateurId,
                statut: client_1.StatutMembreGroupe.ACTIF,
                montantCaution: dto.montantCaution ?? 0,
                cautionBloquee: true,
            },
            update: { statut: client_1.StatutMembreGroupe.ACTIF, montantCaution: dto.montantCaution ?? 0 },
        });
        await this.prisma.ordreTirage.upsert({
            where: { id: `${tontineId}_${utilisateurId}` },
            create: { tontineId, utilisateurId, position: nbMembres + 1 },
            update: {},
        }).catch(async () => {
            const existing = await this.prisma.ordreTirage.findFirst({ where: { tontineId, utilisateurId } });
            if (!existing) {
                await this.prisma.ordreTirage.create({ data: { tontineId, utilisateurId, position: nbMembres + 1 } });
            }
        });
        return { succes: true, message: 'Vous avez rejoint la tontine.', donnees: membre };
    }
    async quitter(tontineId, utilisateurId) {
        const membre = await this.prisma.membreTontineGroupe.findUnique({
            where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
        });
        if (!membre || membre.statut !== client_1.StatutMembreGroupe.ACTIF) {
            throw new common_1.BadRequestException({ message: 'Vous n\'êtes pas membre actif de cette tontine', code: 'PAS_MEMBRE' });
        }
        if (membre.statut === client_1.StatutMembreGroupe.A_RECU) {
            throw new common_1.BadRequestException({ message: 'Impossible de quitter après avoir reçu la distribution', code: 'DEJA_RECU' });
        }
        await this.prisma.membreTontineGroupe.update({
            where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
            data: { statut: client_1.StatutMembreGroupe.EXCLU, excluLe: new Date(), motifExclusion: 'Départ volontaire' },
        });
        return { succes: true, message: 'Vous avez quitté la tontine.' };
    }
    async membres(tontineId) {
        const t = await this.prisma.tontine.findUnique({ where: { id: tontineId } });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        const membres = await this.prisma.membreTontineGroupe.findMany({
            where: { tontineId },
            include: { utilisateur: { select: { id: true, nom: true, telephone: true, kycVerifie: true } } },
            orderBy: { rejointLe: 'asc' },
        });
        return { succes: true, message: `${membres.length} membre(s).`, donnees: membres };
    }
    async ordreTirage(tontineId) {
        const ordres = await this.prisma.ordreTirage.findMany({
            where: { tontineId },
            include: { utilisateur: { select: { id: true, nom: true, telephone: true } } },
            orderBy: { position: 'asc' },
        });
        return { succes: true, message: `Ordre de tirage (${ordres.length} membres).`, donnees: ordres };
    }
    async distribuer(tontineId, proprietaireId) {
        const t = await this.prisma.tontine.findUnique({ where: { id: tontineId } });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.proprietaireId !== proprietaireId) {
            throw new common_1.ForbiddenException('Seul le propriétaire peut déclencher la distribution');
        }
        if (t.type !== client_1.TypeTontine.GROUPE) {
            throw new common_1.BadRequestException({ message: 'Distribution uniquement pour les tontines groupe', code: 'TYPE_INVALIDE' });
        }
        if (t.soldeActuel <= 0) {
            throw new common_1.BadRequestException({ message: 'Solde insuffisant pour distribuer', code: 'SOLDE_INSUFFISANT' });
        }
        this.verifierPolitique(t);
        const prochainTirage = await this.prisma.ordreTirage.findFirst({
            where: { tontineId, aRecu: false },
            orderBy: { position: 'asc' },
            include: { utilisateur: { select: { id: true, nom: true, telephone: true } } },
        });
        if (!prochainTirage) {
            throw new common_1.BadRequestException({ message: 'Tous les membres ont déjà reçu leur distribution', code: 'CYCLE_TERMINE' });
        }
        const membreInfo = await this.prisma.membreTontineGroupe.findFirst({
            where: { tontineId, utilisateurId: prochainTirage.utilisateurId },
        });
        const montantDistribution = t.soldeActuel;
        const montantNet = montantDistribution - business_constants_1.BUSINESS.calculerFraisPlateforme(montantDistribution);
        const transfert = await this.kkiapay.initierTransfert({
            montant: montantNet,
            telephone: prochainTirage.utilisateur.telephone,
            reference: `dist_${tontineId}_${prochainTirage.id}`,
            motif: `Distribution tontine ${t.nom}`,
        });
        if (!transfert.succes) {
            throw new common_1.BadRequestException({ message: 'Échec du transfert KKiaPay', code: 'TRANSFERT_ECHOUE' });
        }
        await this.prisma.$transaction([
            this.prisma.ordreTirage.update({
                where: { id: prochainTirage.id },
                data: { aRecu: true, recuLe: new Date(), montantRecu: montantNet },
            }),
            this.prisma.membreTontineGroupe.update({
                where: { tontineId_utilisateurId: { tontineId, utilisateurId: prochainTirage.utilisateurId } },
                data: { statut: client_1.StatutMembreGroupe.A_RECU },
            }),
            this.prisma.tontine.update({
                where: { id: tontineId },
                data: { soldeActuel: 0 },
            }),
            this.prisma.transaction.create({
                data: {
                    montant: montantDistribution,
                    montantNet,
                    type: client_1.TypeTransaction.DISTRIBUTION_GROUPE,
                    tontineId,
                    utilisateurId: prochainTirage.utilisateurId,
                    refKKiaPay: transfert.refKKiaPay,
                    fraisPlateforme: business_constants_1.BUSINESS.calculerFraisPlateforme(montantDistribution),
                },
            }),
        ]);
        return {
            succes: true,
            message: `Distribution de ${montantNet} FCFA envoyée à ${prochainTirage.utilisateur.nom}.`,
            donnees: { beneficiaire: prochainTirage.utilisateur, montantNet, refKKiaPay: transfert.refKKiaPay },
        };
    }
    verifierPolitique(tontine) {
        if (tontine.politique === client_1.PolitiqueRetrait.BLOQUE) {
            if (!tontine.dateDeverrouillage || tontine.dateDeverrouillage > new Date()) {
                const date = tontine.dateDeverrouillage?.toLocaleDateString('fr-FR') ?? 'indéfinie';
                throw new common_1.BadRequestException({ message: `Tontine bloquée jusqu'au ${date}`, code: 'TONTINE_BLOQUEE' });
            }
        }
        if (tontine.politique === client_1.PolitiqueRetrait.PROGRAMME) {
            if (!tontine.dateDeverrouillage || tontine.dateDeverrouillage > new Date()) {
                throw new common_1.BadRequestException({ message: 'Retrait non autorisé : date programmée non atteinte', code: 'DATE_NON_ATTEINTE' });
            }
        }
    }
};
exports.TontinesService = TontinesService;
exports.TontinesService = TontinesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kkiapay_service_1.KkiapayService])
], TontinesService);
//# sourceMappingURL=tontines.service.js.map