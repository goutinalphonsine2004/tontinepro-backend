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
exports.KycService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let KycService = class KycService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async soumettre(utilisateurId, dto) {
        const existant = await this.prisma.documentKYC.findFirst({
            where: {
                utilisateurId,
                typeDocument: dto.typeDocument,
                statut: { in: [client_1.StatutKYC.EN_ATTENTE, client_1.StatutKYC.VALIDE] },
            },
        });
        if (existant) {
            throw new common_1.BadRequestException({
                message: `Un document ${dto.typeDocument} est déjà soumis ou validé`,
                code: 'DOCUMENT_EXISTANT',
            });
        }
        const doc = await this.prisma.documentKYC.create({
            data: { utilisateurId, typeDocument: dto.typeDocument, urlDocument: dto.urlDocument },
        });
        return { succes: true, message: 'Document soumis. En attente de validation Admin.', donnees: doc };
    }
    async mesDocuments(utilisateurId) {
        const docs = await this.prisma.documentKYC.findMany({
            where: { utilisateurId },
            orderBy: { creeLe: 'desc' },
        });
        return { succes: true, message: `${docs.length} document(s).`, donnees: docs };
    }
    async enAttente() {
        const docs = await this.prisma.documentKYC.findMany({
            where: { statut: client_1.StatutKYC.EN_ATTENTE },
            include: { utilisateur: { select: { id: true, nom: true, telephone: true, role: true } } },
            orderBy: { creeLe: 'asc' },
        });
        return { succes: true, message: `${docs.length} document(s) en attente.`, donnees: docs };
    }
    async valider(docId, adminId) {
        const doc = await this.prisma.documentKYC.findUnique({ where: { id: docId } });
        if (!doc)
            throw new common_1.NotFoundException('Document introuvable');
        if (doc.statut !== client_1.StatutKYC.EN_ATTENTE) {
            throw new common_1.BadRequestException({ message: 'Ce document n\'est plus en attente', code: 'STATUT_INVALIDE' });
        }
        const [docMaj] = await this.prisma.$transaction([
            this.prisma.documentKYC.update({
                where: { id: docId },
                data: { statut: client_1.StatutKYC.VALIDE, verifiePar: adminId },
            }),
            this.prisma.utilisateur.update({
                where: { id: doc.utilisateurId },
                data: { kycVerifie: true },
            }),
        ]);
        return { succes: true, message: 'Document KYC validé. Compte marqué vérifié.', donnees: docMaj };
    }
    async rejeter(docId, adminId, dto) {
        const doc = await this.prisma.documentKYC.findUnique({ where: { id: docId } });
        if (!doc)
            throw new common_1.NotFoundException('Document introuvable');
        if (doc.statut !== client_1.StatutKYC.EN_ATTENTE) {
            throw new common_1.BadRequestException({ message: 'Ce document n\'est plus en attente', code: 'STATUT_INVALIDE' });
        }
        const docMaj = await this.prisma.documentKYC.update({
            where: { id: docId },
            data: { statut: client_1.StatutKYC.REJETE, verifiePar: adminId, motifRejet: dto.motifRejet },
        });
        return { succes: true, message: 'Document rejeté.', donnees: docMaj };
    }
};
exports.KycService = KycService;
exports.KycService = KycService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KycService);
//# sourceMappingURL=kyc.service.js.map