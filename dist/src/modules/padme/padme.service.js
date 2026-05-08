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
exports.PadmeService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const sms_service_1 = require("../notifications/sms.service");
const business_constants_1 = require("../../common/constants/business.constants");
let PadmeService = class PadmeService {
    prisma;
    sms;
    constructor(prisma, sms) {
        this.prisma = prisma;
        this.sms = sms;
    }
    async journaliser(adminId, action, details) {
        await this.prisma.journalAudit.create({
            data: { utilisateurId: adminId, action, details },
        });
    }
    async mesDossiers(clientId) {
        const dossiers = await this.prisma.dossierPADME.findMany({
            where: { clientId },
            include: { scoreCredit: { select: { score: true } } },
            orderBy: { creeLe: 'desc' },
        });
        return { succes: true, message: `${dossiers.length} dossier(s) PADME.`, donnees: dossiers };
    }
    async tous(dto) {
        const skip = ((dto.page ?? 1) - 1) * (dto.limite ?? 20);
        const where = dto.statut ? { statut: dto.statut } : {};
        const [total, dossiers] = await Promise.all([
            this.prisma.dossierPADME.count({ where }),
            this.prisma.dossierPADME.findMany({
                where,
                include: {
                    client: { select: { id: true, nom: true, telephone: true, kycVerifie: true } },
                    scoreCredit: { select: { score: true, tauxRegularite: true } },
                },
                skip,
                take: dto.limite ?? 20,
                orderBy: { creeLe: 'desc' },
            }),
        ]);
        return {
            succes: true,
            message: `${total} dossier(s) PADME.`,
            donnees: { dossiers, total, page: dto.page ?? 1, pages: Math.ceil(total / (dto.limite ?? 20)) },
        };
    }
    async getById(dossierId) {
        const dossier = await this.prisma.dossierPADME.findUnique({
            where: { id: dossierId },
            include: {
                client: { select: { id: true, nom: true, telephone: true, kycVerifie: true, creeLe: true } },
                scoreCredit: true,
            },
        });
        if (!dossier)
            throw new common_1.NotFoundException('Dossier PADME introuvable');
        return { succes: true, message: 'Dossier récupéré.', donnees: dossier };
    }
    async valider(dossierId, adminId) {
        const dossier = await this.prisma.dossierPADME.findUnique({ where: { id: dossierId } });
        if (!dossier)
            throw new common_1.NotFoundException('Dossier introuvable');
        if (dossier.statut !== client_1.StatutDossierPADME.GENERE) {
            throw new common_1.BadRequestException({ message: `Statut actuel: ${dossier.statut}. Attendu: GENERE`, code: 'STATUT_INVALIDE' });
        }
        const maj = await this.prisma.dossierPADME.update({
            where: { id: dossierId },
            data: { statut: client_1.StatutDossierPADME.VALIDE_ADMIN, examineLE: new Date() },
        });
        await this.journaliser(adminId, 'PADME_VALIDE', `Dossier ${dossierId} validé par Admin`);
        return { succes: true, message: 'Dossier PADME validé par Admin.', donnees: maj };
    }
    async soumettre(dossierId, adminId) {
        const dossier = await this.prisma.dossierPADME.findUnique({
            where: { id: dossierId },
            include: { client: { select: { telephone: true, nom: true } } },
        });
        if (!dossier)
            throw new common_1.NotFoundException('Dossier introuvable');
        if (dossier.statut !== client_1.StatutDossierPADME.VALIDE_ADMIN) {
            throw new common_1.BadRequestException({ message: `Statut actuel: ${dossier.statut}. Attendu: VALIDE_ADMIN`, code: 'STATUT_INVALIDE' });
        }
        const maj = await this.prisma.dossierPADME.update({
            where: { id: dossierId },
            data: { statut: client_1.StatutDossierPADME.SOUMIS_PADME, soumisLe: new Date() },
        });
        await this.journaliser(adminId, 'PADME_SOUMIS', `Dossier ${dossierId} soumis à PADME`);
        await this.sms.envoyer(dossier.client.telephone, `TontinePro: Votre dossier PADME a été soumis. Vous serez contacté par PADME sous 72h. Score: ${dossier.scoreAuMoment}/100.`);
        return { succes: true, message: 'Dossier soumis à PADME. Client notifié.', donnees: maj };
    }
    async resultat(dossierId, adminId, dto) {
        const dossier = await this.prisma.dossierPADME.findUnique({
            where: { id: dossierId },
            include: { client: { select: { id: true, telephone: true, nom: true } } },
        });
        if (!dossier)
            throw new common_1.NotFoundException('Dossier introuvable');
        if (dossier.statut !== client_1.StatutDossierPADME.SOUMIS_PADME) {
            throw new common_1.BadRequestException({ message: `Statut actuel: ${dossier.statut}. Attendu: SOUMIS_PADME`, code: 'STATUT_INVALIDE' });
        }
        const nouveauStatut = dto.statut === 'ACCEPTE'
            ? client_1.StatutDossierPADME.ACCEPTE
            : client_1.StatutDossierPADME.REJETE;
        const maj = await this.prisma.dossierPADME.update({
            where: { id: dossierId },
            data: { statut: nouveauStatut },
        });
        await this.journaliser(adminId, `PADME_${dto.statut}`, `Dossier ${dossierId} — ${dto.statut}${dto.montantAccorde ? ` — ${dto.montantAccorde} FCFA` : ''}`);
        if (dto.statut === 'ACCEPTE' && dto.montantAccorde && dto.montantAccorde > 0) {
            const commission = business_constants_1.BUSINESS.calculerCommissionPADME(dto.montantAccorde);
            await this.prisma.commission.create({
                data: {
                    agentId: adminId,
                    transactionId: (await this.prisma.transaction.findFirst({ where: { utilisateurId: dossier.client.id } }))?.id ?? adminId,
                    montant: commission,
                    type: 'PADME',
                },
            }).catch(() => { });
            await this.sms.envoyer(dossier.client.telephone, `TontinePro: 🎉 Félicitations ${dossier.client.nom} ! PADME a accepté votre dossier. Montant accordé: ${dto.montantAccorde.toLocaleString('fr-FR')} FCFA. Vous serez contacté prochainement.`);
        }
        else if (dto.statut === 'REJETE') {
            await this.sms.envoyer(dossier.client.telephone, `TontinePro: Votre dossier PADME n'a pas été retenu. ${dto.motif ? `Motif: ${dto.motif}.` : ''} Continuez à épargner pour renforcer votre dossier.`);
        }
        return {
            succes: true,
            message: `Dossier PADME ${dto.statut}.${dto.montantAccorde ? ` Commission TontinePro: ${business_constants_1.BUSINESS.calculerCommissionPADME(dto.montantAccorde)} FCFA` : ''}`,
            donnees: maj,
        };
    }
};
exports.PadmeService = PadmeService;
exports.PadmeService = PadmeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sms_service_1.SmsService])
], PadmeService);
//# sourceMappingURL=padme.service.js.map