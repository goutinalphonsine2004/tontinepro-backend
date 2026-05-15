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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var KycService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const TYPES_VALIDES = ['CNI', 'PASSEPORT', 'PERMIS', 'ACTE_NAISSANCE'];
const MIME_AUTORISES = ['image/jpeg', 'image/png', 'application/pdf'];
const TAILLE_MAX_OCTETS = 5 * 1024 * 1024;
let KycService = KycService_1 = class KycService {
    prisma;
    config;
    logger = new common_1.Logger(KycService_1.name);
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async uploadEtSoumettre(utilisateurId, typeDocument, fichier) {
        if (!TYPES_VALIDES.includes(typeDocument)) {
            throw new common_1.BadRequestException({
                message: `Type de document invalide. Valeurs autorisées : ${TYPES_VALIDES.join(', ')}`,
                code: 'TYPE_DOCUMENT_INVALIDE',
            });
        }
        if (!MIME_AUTORISES.includes(fichier.mimetype)) {
            throw new common_1.BadRequestException({
                message: 'Format non accepté. Utilisez JPG, PNG ou PDF.',
                code: 'FORMAT_INVALIDE',
            });
        }
        if (fichier.size > TAILLE_MAX_OCTETS) {
            throw new common_1.BadRequestException({
                message: 'Fichier trop volumineux. Maximum 5 Mo.',
                code: 'FICHIER_TROP_GRAND',
            });
        }
        const existant = await this.prisma.documentKYC.findFirst({
            where: {
                utilisateurId,
                typeDocument,
                statut: { in: [client_1.StatutKYC.EN_ATTENTE, client_1.StatutKYC.VALIDE] },
            },
        });
        if (existant) {
            throw new common_1.BadRequestException({
                message: `Un document ${typeDocument} est déjà soumis ou validé.`,
                code: 'DOCUMENT_EXISTANT',
            });
        }
        const urlDocument = await this.uploaderFichier(fichier);
        const doc = await this.prisma.documentKYC.create({
            data: { utilisateurId, typeDocument, urlDocument },
        });
        this.logger.log(`KYC soumis — utilisateur ${utilisateurId} — type ${typeDocument}`);
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
    async uploaderFichier(fichier) {
        const cloudinaryUrl = this.config.get('CLOUDINARY_URL');
        if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
            try {
                return await this.uploadCloudinary(fichier, cloudinaryUrl);
            }
            catch (err) {
                this.logger.error('Cloudinary upload failed, fallback base64', err);
                return this.creerDataUrl(fichier);
            }
        }
        return this.creerDataUrl(fichier);
    }
    async uploadCloudinary(fichier, cloudinaryUrl) {
        const without = cloudinaryUrl.replace('cloudinary://', '');
        const atIdx = without.lastIndexOf('@');
        const credentials = without.substring(0, atIdx);
        const cloudName = without.substring(atIdx + 1);
        const [apiKey, apiSecret] = credentials.split(':');
        const timestamp = Math.floor(Date.now() / 1000);
        const toSign = `folder=kyc&timestamp=${timestamp}${apiSecret}`;
        const signature = (0, crypto_1.createHash)('sha1').update(toSign).digest('hex');
        const form = new form_data_1.default();
        form.append('file', fichier.buffer, {
            filename: fichier.originalname,
            contentType: fichier.mimetype,
        });
        form.append('timestamp', timestamp.toString());
        form.append('api_key', apiKey);
        form.append('signature', signature);
        form.append('folder', 'kyc');
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
        const resp = await axios_1.default.post(uploadUrl, form, {
            headers: form.getHeaders(),
            timeout: 30000,
        });
        return resp.data.secure_url;
    }
    creerDataUrl(fichier) {
        const base64 = fichier.buffer.toString('base64');
        return `data:${fichier.mimetype};base64,${base64}`;
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
    async mesDocuments(utilisateurId) {
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
    async enAttente() {
        const docs = await this.prisma.documentKYC.findMany({
            where: { statut: client_1.StatutKYC.EN_ATTENTE },
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
    async valider(docId, adminId) {
        const doc = await this.prisma.documentKYC.findUnique({
            where: { id: docId },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document introuvable');
        if (doc.statut !== client_1.StatutKYC.EN_ATTENTE) {
            throw new common_1.BadRequestException({
                message: "Ce document n'est plus en attente",
                code: 'STATUT_INVALIDE',
            });
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
        return {
            succes: true,
            message: 'Document KYC validé. Compte marqué vérifié.',
            donnees: docMaj,
        };
    }
    async rejeter(docId, adminId, dto) {
        const doc = await this.prisma.documentKYC.findUnique({
            where: { id: docId },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document introuvable');
        if (doc.statut !== client_1.StatutKYC.EN_ATTENTE) {
            throw new common_1.BadRequestException({
                message: "Ce document n'est plus en attente",
                code: 'STATUT_INVALIDE',
            });
        }
        const docMaj = await this.prisma.documentKYC.update({
            where: { id: docId },
            data: {
                statut: client_1.StatutKYC.REJETE,
                verifiePar: adminId,
                motifRejet: dto.motifRejet,
            },
        });
        return { succes: true, message: 'Document rejeté.', donnees: docMaj };
    }
};
exports.KycService = KycService;
exports.KycService = KycService = KycService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], KycService);
//# sourceMappingURL=kyc.service.js.map