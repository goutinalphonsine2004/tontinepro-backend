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
exports.OperationsAssisteesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const sms_service_1 = require("../notifications/sms.service");
const business_constants_1 = require("../../common/constants/business.constants");
const OTP_MINUTES = 10;
const MAX_OTP_TENTATIVES = 3;
let OperationsAssisteesService = class OperationsAssisteesService {
    prisma;
    kkiapay;
    sms;
    constructor(prisma, kkiapay, sms) {
        this.prisma = prisma;
        this.kkiapay = kkiapay;
        this.sms = sms;
    }
    async enrolerClientSansSmartphone(collecteurId, role, dto) {
        this.verifierCollecteur(role);
        await this.verifierCollecteurActif(collecteurId);
        const existant = await this.prisma.utilisateur.findUnique({
            where: { telephone: dto.telephone },
        });
        if (existant) {
            throw new common_1.BadRequestException({
                message: 'Ce numéro est déjà associé à un compte TontineBénin.',
                code: 'TELEPHONE_EXISTANT',
            });
        }
        const identifiantTerrain = `TP-${Date.now().toString(36).toUpperCase()}-${(0, crypto_1.randomInt)(100, 999)}`;
        const qrCode = `TPP-${(0, crypto_1.randomUUID)()}`;
        const tontineNom = dto.nomTontine || `Tontine terrain - ${dto.nom.split(' ')[0]}`;
        const resultat = await this.prisma.$transaction(async (tx) => {
            const client = await tx.utilisateur.create({
                data: {
                    telephone: dto.telephone,
                    nom: dto.nom,
                    role: client_1.Role.CLIENT,
                    statut: client_1.StatutCompte.ACTIF,
                    collecteurId,
                    enroleParId: collecteurId,
                    kycVerifie: false,
                },
            });
            const profile = await tx.clientTerrainProfile.create({
                data: {
                    clientId: client.id,
                    identifiantTerrain,
                    cip: dto.cip,
                    npi: dto.npi,
                    quartier: dto.quartier,
                    adresse: dto.adresse,
                    telephoneSecondaire: dto.telephoneSecondaire,
                    photoUrl: dto.photoUrl,
                    signatureUrl: dto.signatureUrl,
                    kycMinimalValide: Boolean(dto.cip || dto.npi),
                    modeAcces: 'SANS_SMARTPHONE',
                    latitudeEnrolement: dto.latitude,
                    longitudeEnrolement: dto.longitude,
                    enroleParId: collecteurId,
                },
            });
            const qr = await tx.qrPapierClient.create({
                data: {
                    clientId: client.id,
                    code: qrCode,
                    genereParId: collecteurId,
                },
            });
            const tontine = await tx.tontine.create({
                data: {
                    nom: tontineNom,
                    type: dto.typeTontine,
                    politique: client_1.PolitiqueRetrait.FLEXIBLE,
                    montantJournalierFcfa: dto.montantJournalierFcfa ?? 0,
                    proprietaireId: client.id,
                    statut: 'ACTIVE',
                    description: 'Compte créé via enrôlement terrain sans smartphone.',
                },
            });
            await tx.journalAudit.create({
                data: {
                    utilisateurId: collecteurId,
                    action: 'ENROLER_CLIENT_SANS_SMARTPHONE',
                    details: JSON.stringify({
                        clientId: client.id,
                        identifiantTerrain,
                        quartier: dto.quartier,
                        latitude: dto.latitude,
                        longitude: dto.longitude,
                        consentement: dto.consentementTexte ?? 'SIGNATURE_TERRAIN',
                    }),
                },
            });
            return { client, profile, qr, tontine };
        });
        await this.sms.envoyer(dto.telephone, `TontineBénin: Bienvenue ${dto.nom}. Votre compte terrain est créé. ID: ${identifiantTerrain}. Gardez le contrôle: toute opération sensible exige votre confirmation SMS/Mobile Money.`);
        return {
            succes: true,
            message: 'Client sans smartphone enrôlé avec succès.',
            donnees: resultat,
        };
    }
    async ficheTerrain(utilisateurId, role, clientId) {
        const client = await this.prisma.utilisateur.findUnique({
            where: { id: clientId },
            include: {
                terrainProfile: true,
                qrPapierClient: true,
                tontines: true,
                transactions: { orderBy: { creeLe: 'desc' }, take: 8 },
                scoreCredit: true,
            },
        });
        if (!client)
            throw new common_1.NotFoundException('Client introuvable');
        await this.verifierAccesClient(utilisateurId, role, client);
        const clientData = client;
        const soldeTotal = clientData.tontines.reduce((s, t) => s + t.soldeActuelFcfa, 0);
        return {
            succes: true,
            message: 'Fiche terrain récupérée.',
            donnees: {
                client: {
                    id: client.id,
                    nom: client.nom,
                    telephone: client.telephone,
                    collecteurId: client.collecteurId,
                },
                terrainProfile: clientData.terrainProfile,
                qrPapierClient: clientData.qrPapierClient,
                soldeTotal,
                tontines: clientData.tontines,
                score: clientData.scoreCredit?.score ?? 0,
                historique: clientData.transactions,
            },
        };
    }
    async initierCotisationAssistee(initiateurId, role, dto) {
        this.verifierCollecteur(role);
        const { client, tontine } = await this.preparerOperationClient(initiateurId, role, dto, true);
        if (!tontine)
            throw new common_1.BadRequestException('Tontine manquante');
        const telephone = dto.telephone ?? client.telephone;
        const otp = await this.creerOtp();
        const fraisPlateformeFcfa = business_constants_1.BUSINESS.calculerFraisPlateforme(dto.montant);
        const montantNetFcfa = dto.montant - fraisPlateformeFcfa;
        const fraisAgentFcfa = role === client_1.Role.INDEPENDANT
            ? business_constants_1.BUSINESS.calculerCommissionAgent(dto.montant, true)
            : 0;
        const transaction = await this.prisma.transaction.create({
            data: {
                montantFcfa: dto.montant,
                montantNetFcfa,
                type: client_1.TypeTransaction.COTISATION,
                statut: client_1.StatutTransaction.EN_ATTENTE,
                fraisPlateformeFcfa,
                fraisAgentFcfa,
                operateur: dto.operateur,
                tontineId: tontine.id,
                utilisateurId: client.id,
            },
        });
        const paiement = await this.kkiapay.initierPaiement({
            montant: dto.montant,
            telephone,
            reference: transaction.reference,
            description: `Cotisation assistée ${tontine.nom}`,
            operateur: dto.operateur,
        });
        await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: { refKKiaPay: paiement.refKKiaPay },
        });
        const operation = await this.prisma.operationAssistee.create({
            data: {
                type: 'COTISATION',
                statut: 'OTP_ENVOYE',
                clientId: client.id,
                initiateurId,
                tontineId: tontine.id,
                transactionId: transaction.id,
                montant: dto.montant,
                operateur: dto.operateur,
                telephone,
                refMobileMoney: paiement.refKKiaPay,
                otpHash: otp.hash,
                otpExpireLe: otp.expireLe,
                latitude: dto.latitude,
                longitude: dto.longitude,
                deviceId: dto.deviceId,
                metadata: JSON.stringify({ paymentUrl: paiement.paymentUrl }),
            },
        });
        await this.sms.envoyer(telephone, `TontineBénin: Cotisation ${dto.montant} FCFA initiée par votre collecteur. Confirmez Mobile Money sur votre téléphone. Code contrôle: ${otp.code}. Ne le donnez qu'après vérification.`);
        return {
            succes: true,
            message: 'Cotisation assistée initiée. Demande Mobile Money et OTP envoyés au client.',
            donnees: {
                operation,
                transactionId: transaction.id,
                refKKiaPay: paiement.refKKiaPay,
            },
        };
    }
    async initierRetraitAssiste(initiateurId, role, dto) {
        this.verifierCollecteur(role);
        const { client, tontine } = await this.preparerOperationClient(initiateurId, role, dto, true);
        if (!tontine)
            throw new common_1.BadRequestException('Tontine manquante');
        await this.verifierRetraitPossible(client.id, tontine, dto.montant);
        const telephone = dto.telephone ?? client.telephone;
        const otp = await this.creerOtp();
        const operation = await this.prisma.operationAssistee.create({
            data: {
                type: 'RETRAIT',
                statut: 'OTP_ENVOYE',
                clientId: client.id,
                initiateurId,
                tontineId: tontine.id,
                montant: dto.montant,
                operateur: dto.operateur,
                telephone,
                otpHash: otp.hash,
                otpExpireLe: otp.expireLe,
                latitude: dto.latitude,
                longitude: dto.longitude,
                deviceId: dto.deviceId,
            },
        });
        await this.sms.envoyer(telephone, `TontineBénin: Retrait ${dto.montant} FCFA demandé avec assistance. Code OTP: ${otp.code}. Si vous n'avez pas demandé ce retrait, répondez AIDE ou contactez le support.`);
        return {
            succes: true,
            message: 'Retrait assisté initié. OTP envoyé au client.',
            donnees: operation,
        };
    }
    async confirmerParClient(operationId, dto) {
        const operation = await this.prisma.operationAssistee.findUnique({
            where: { id: operationId },
            include: { client: true },
        });
        if (!operation)
            throw new common_1.NotFoundException('Opération introuvable');
        if (!['OTP_ENVOYE', 'EN_ATTENTE_MOBILE_MONEY'].includes(operation.statut)) {
            throw new common_1.BadRequestException({
                message: 'Cette opération ne peut plus être confirmée.',
                code: 'STATUT_OPERATION_INVALIDE',
            });
        }
        if (!operation.otpExpireLe || operation.otpExpireLe < new Date()) {
            await this.prisma.operationAssistee.update({
                where: { id: operationId },
                data: { statut: 'EXPIREE' },
            });
            throw new common_1.BadRequestException({
                message: 'OTP expiré',
                code: 'OTP_EXPIRE',
            });
        }
        if (operation.otpTentatives >= MAX_OTP_TENTATIVES) {
            throw new common_1.BadRequestException({
                message: 'OTP bloqué après trop de tentatives',
                code: 'OTP_BLOQUE',
            });
        }
        const valide = await bcrypt.compare(dto.code, operation.otpHash ?? '');
        if (!valide) {
            await this.prisma.operationAssistee.update({
                where: { id: operationId },
                data: { otpTentatives: { increment: 1 } },
            });
            throw new common_1.BadRequestException({
                message: 'Code OTP invalide',
                code: 'OTP_INVALIDE',
            });
        }
        if (operation.type === 'RETRAIT') {
            const retrait = await this.executerRetraitApresConfirmation(operation);
            return {
                succes: true,
                message: 'Retrait confirmé par le client et traité.',
                donnees: retrait,
            };
        }
        const updated = await this.prisma.operationAssistee.update({
            where: { id: operationId },
            data: {
                statut: 'CONFIRMEE_CLIENT',
                confirmationCanal: dto.canal,
                confirmeParClientLe: new Date(),
                deviceId: dto.deviceId ?? operation.deviceId,
            },
        });
        await this.sms.envoyer(operation.telephone, `TontineBénin: Confirmation reçue pour ${operation.montantFcfa} FCFA. Le paiement Mobile Money reste validé uniquement depuis votre téléphone.`);
        return {
            succes: true,
            message: 'Confirmation client enregistrée.',
            donnees: updated,
        };
    }
    async statut(utilisateurId, role, operationId) {
        const operation = await this.prisma.operationAssistee.findUnique({
            where: { id: operationId },
            include: { client: true },
        });
        if (!operation)
            throw new common_1.NotFoundException('Opération introuvable');
        await this.verifierAccesClient(utilisateurId, role, operation.client);
        return {
            succes: true,
            message: 'Statut opération assistée.',
            donnees: operation,
        };
    }
    verifierCollecteur(role) {
        if (![client_1.Role.AGENT, client_1.Role.INDEPENDANT].includes(role)) {
            throw new common_1.ForbiddenException({
                message: 'Seuls les collecteurs terrain peuvent initier cette action.',
                code: 'ROLE_COLLECTEUR_REQUIS',
            });
        }
    }
    async verifierCollecteurActif(collecteurId) {
        const collecteur = await this.prisma.utilisateur.findUnique({
            where: { id: collecteurId },
            select: { statut: true },
        });
        if (!collecteur || collecteur.statut !== client_1.StatutCompte.ACTIF) {
            throw new common_1.ForbiddenException({
                message: 'Collecteur inactif ou introuvable.',
                code: 'COLLECTEUR_INACTIF',
            });
        }
    }
    async verifierAccesClient(utilisateurId, role, client) {
        if (role === client_1.Role.ADMIN)
            return;
        if ([client_1.Role.AGENT, client_1.Role.INDEPENDANT].includes(role)) {
            if (client.collecteurId !== utilisateurId) {
                throw new common_1.ForbiddenException({
                    message: "Ce client n'appartient pas à votre portefeuille.",
                    code: 'ACCES_CLIENT_REFUSE',
                });
            }
            return;
        }
        if (role === client_1.Role.SUPERVISEUR) {
            const rattache = await this.prisma.utilisateur.findFirst({
                where: {
                    id: client.collecteurId ?? undefined,
                    superviseurId: utilisateurId,
                },
            });
            if (!rattache) {
                throw new common_1.ForbiddenException({
                    message: "Ce client n'est pas dans votre zone.",
                    code: 'ACCES_ZONE_REFUSE',
                });
            }
        }
    }
    async preparerOperationClient(initiateurId, role, dto, tontineObligatoire) {
        const client = await this.prisma.utilisateur.findUnique({
            where: { id: dto.clientId },
            include: { tontines: true },
        });
        if (!client)
            throw new common_1.NotFoundException('Client introuvable');
        await this.verifierAccesClient(initiateurId, role, client);
        const tontine = dto.tontineId
            ? await this.prisma.tontine.findUnique({ where: { id: dto.tontineId } })
            : client.tontines[0];
        if (tontineObligatoire && !tontine) {
            throw new common_1.BadRequestException({
                message: 'Aucune tontine disponible pour ce client.',
                code: 'TONTINE_MANQUANTE',
            });
        }
        if (tontine && tontine.proprietaireId !== client.id) {
            throw new common_1.ForbiddenException({
                message: "La tontine n'appartient pas au client.",
                code: 'TONTINE_CLIENT_INVALIDE',
            });
        }
        return { client, tontine };
    }
    async verifierRetraitPossible(clientId, tontine, montantFcfa) {
        if (tontine.proprietaireId !== clientId) {
            throw new common_1.ForbiddenException('Accès tontine refusé');
        }
        if (tontine.soldeActuelFcfa < montantFcfa) {
            throw new common_1.BadRequestException({
                message: `Solde insuffisant. Disponible: ${tontine.soldeActuelFcfa} FCFA`,
                code: 'SOLDE_INSUFFISANT',
            });
        }
        if (tontine.politique === client_1.PolitiqueRetrait.PROGRAMME &&
            tontine.dateDeverrouillage &&
            tontine.dateDeverrouillage > new Date()) {
            throw new common_1.BadRequestException({
                message: 'Date de retrait programmée non atteinte',
                code: 'DATE_NON_ATTEINTE',
            });
        }
        if (tontine.politique === client_1.PolitiqueRetrait.BLOQUE) {
            throw new common_1.BadRequestException({
                message: 'Retrait assisté indisponible pour une tontine bloquée.',
                code: 'TONTINE_BLOQUEE',
            });
        }
    }
    async executerRetraitApresConfirmation(operation) {
        const fraisRetrait = business_constants_1.BUSINESS.calculerFraisRetrait(operation.montantFcfa);
        const montantNetFcfa = operation.montantFcfa - fraisRetrait;
        const transfert = await this.kkiapay.initierTransfert({
            montant: montantNetFcfa,
            telephone: operation.telephone,
            reference: `assist_retrait_${operation.id}`,
            motif: 'Retrait assisté client terrain',
        });
        const retrait = await this.prisma.$transaction(async (tx) => {
            const r = await tx.retrait.create({
                data: {
                    utilisateurId: operation.clientId,
                    tontineId: operation.tontineId,
                    montantFcfa: operation.montantFcfa,
                    statut: client_1.StatutRetrait.EXECUTE,
                    refKKiaPay: transfert.refKKiaPay,
                    executeLe: new Date(),
                },
            });
            await tx.tontine.update({
                where: { id: operation.tontineId },
                data: { soldeActuelFcfa: { decrement: operation.montantFcfa } },
            });
            await tx.operationAssistee.update({
                where: { id: operation.id },
                data: {
                    statut: 'SUCCES',
                    retraitId: r.id,
                    refMobileMoney: transfert.refKKiaPay,
                    confirmationCanal: 'OTP_SMS',
                    confirmeParClientLe: new Date(),
                },
            });
            return r;
        });
        await this.sms.envoyer(operation.telephone, `TontineBénin: Retrait ${montantNetFcfa} FCFA exécuté après votre confirmation. Frais ${fraisRetrait} FCFA. Réf: ${transfert.refKKiaPay}.`);
        return retrait;
    }
    async creerOtp() {
        const code = (0, crypto_1.randomInt)(100000, 1000000).toString();
        const hash = await bcrypt.hash(code, 10);
        const expireLe = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
        return { code, hash, expireLe };
    }
};
exports.OperationsAssisteesService = OperationsAssisteesService;
exports.OperationsAssisteesService = OperationsAssisteesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kkiapay_service_1.KkiapayService,
        sms_service_1.SmsService])
], OperationsAssisteesService);
//# sourceMappingURL=operations-assistees.service.js.map