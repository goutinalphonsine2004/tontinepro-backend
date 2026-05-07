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
exports.RetraitsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const business_constants_1 = require("../../common/constants/business.constants");
let RetraitsService = class RetraitsService {
    prisma;
    kkiapay;
    constructor(prisma, kkiapay) {
        this.prisma = prisma;
        this.kkiapay = kkiapay;
    }
    async demander(utilisateurId, dto) {
        const [utilisateur, tontine] = await Promise.all([
            this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } }),
            this.prisma.tontine.findUnique({ where: { id: dto.tontineId } }),
        ]);
        if (!tontine)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (tontine.proprietaireId !== utilisateurId) {
            throw new common_1.ForbiddenException({ message: 'Seul le propriétaire peut demander un retrait', code: 'ACCES_REFUSE' });
        }
        if (tontine.soldeActuel < dto.montant) {
            throw new common_1.BadRequestException({
                message: `Solde insuffisant. Disponible: ${tontine.soldeActuel} FCFA`,
                code: 'SOLDE_INSUFFISANT',
            });
        }
        if (tontine.politique === client_1.PolitiqueRetrait.BLOQUE) {
            if (!tontine.dateDeverrouillage || tontine.dateDeverrouillage > new Date()) {
                throw new common_1.BadRequestException({
                    message: `Retrait bloqué jusqu'au ${tontine.dateDeverrouillage?.toLocaleDateString('fr-FR') ?? 'date indéfinie'}`,
                    code: 'TONTINE_BLOQUEE',
                });
            }
        }
        if (tontine.politique === client_1.PolitiqueRetrait.PROGRAMME) {
            if (!tontine.dateDeverrouillage || tontine.dateDeverrouillage > new Date()) {
                throw new common_1.BadRequestException({ message: 'Date de retrait programmée non atteinte', code: 'DATE_NON_ATTEINTE' });
            }
        }
        const seuilAdmin = business_constants_1.BUSINESS.SEUIL_RETRAIT_ADMIN;
        const needsAdmin = dto.montant >= seuilAdmin;
        const retrait = await this.prisma.retrait.create({
            data: {
                utilisateurId,
                montant: dto.montant,
                statut: needsAdmin ? client_1.StatutRetrait.EN_ATTENTE : client_1.StatutRetrait.VALIDE,
            },
        });
        if (!needsAdmin) {
            await this.executer(retrait.id, utilisateur.telephone, tontine.id, dto.montant);
        }
        return {
            succes: true,
            message: needsAdmin
                ? `Retrait de ${dto.montant} FCFA en attente de validation Admin (seuil: ${seuilAdmin} FCFA).`
                : `Retrait de ${dto.montant} FCFA validé automatiquement et en cours d'exécution.`,
            donnees: retrait,
        };
    }
    async executer(retraitId, telephone, tontineId, montant) {
        const transfert = await this.kkiapay.initierTransfert({
            montant,
            telephone,
            reference: `retrait_${retraitId}`,
            motif: 'Retrait tontine',
        });
        await this.prisma.$transaction([
            this.prisma.retrait.update({
                where: { id: retraitId },
                data: { statut: client_1.StatutRetrait.EXECUTE, executeLe: new Date(), refKKiaPay: transfert.refKKiaPay },
            }),
            this.prisma.tontine.update({
                where: { id: tontineId },
                data: { soldeActuel: { decrement: montant } },
            }),
        ]);
    }
    async mesRetraits(utilisateurId) {
        const retraits = await this.prisma.retrait.findMany({
            where: { utilisateurId },
            orderBy: { creeLe: 'desc' },
        });
        return { succes: true, message: `${retraits.length} retrait(s).`, donnees: retraits };
    }
    async enAttente() {
        const retraits = await this.prisma.retrait.findMany({
            where: { statut: client_1.StatutRetrait.EN_ATTENTE },
            include: { utilisateur: { select: { id: true, nom: true, telephone: true } } },
            orderBy: { creeLe: 'asc' },
        });
        const total = retraits.reduce((s, r) => s + r.montant, 0);
        return { succes: true, message: `${retraits.length} retrait(s) en attente. Total: ${total} FCFA.`, donnees: retraits };
    }
    async valider(retraitId, adminId) {
        const retrait = await this.prisma.retrait.findUnique({
            where: { id: retraitId },
            include: { utilisateur: true },
        });
        if (!retrait)
            throw new common_1.NotFoundException('Retrait introuvable');
        if (retrait.statut !== client_1.StatutRetrait.EN_ATTENTE) {
            throw new common_1.BadRequestException({ message: 'Ce retrait n\'est plus en attente', code: 'STATUT_INVALIDE' });
        }
        const tontine = await this.prisma.tontine.findFirst({
            where: { proprietaireId: retrait.utilisateurId },
        });
        if (!tontine || tontine.soldeActuel < retrait.montant) {
            throw new common_1.BadRequestException({ message: 'Solde tontine insuffisant', code: 'SOLDE_INSUFFISANT' });
        }
        await this.prisma.retrait.update({
            where: { id: retraitId },
            data: { statut: client_1.StatutRetrait.VALIDE, validePar: adminId },
        });
        await this.executer(retraitId, retrait.utilisateur.telephone, tontine.id, retrait.montant);
        return { succes: true, message: `Retrait de ${retrait.montant} FCFA validé et exécuté.` };
    }
    async rejeter(retraitId, adminId, dto) {
        const retrait = await this.prisma.retrait.findUnique({ where: { id: retraitId } });
        if (!retrait)
            throw new common_1.NotFoundException('Retrait introuvable');
        if (retrait.statut !== client_1.StatutRetrait.EN_ATTENTE) {
            throw new common_1.BadRequestException({ message: 'Ce retrait n\'est plus en attente', code: 'STATUT_INVALIDE' });
        }
        await this.prisma.retrait.update({
            where: { id: retraitId },
            data: { statut: client_1.StatutRetrait.REJETE, validePar: adminId, motifRejet: dto.motif },
        });
        return { succes: true, message: 'Retrait rejeté.' };
    }
};
exports.RetraitsService = RetraitsService;
exports.RetraitsService = RetraitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kkiapay_service_1.KkiapayService])
], RetraitsService);
//# sourceMappingURL=retraits.service.js.map