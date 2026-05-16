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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TontinesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TontinesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const kkiapay_service_1 = require("../../common/services/kkiapay.service");
const business_constants_1 = require("../../common/constants/business.constants");
const notifications_service_1 = require("../notifications/notifications.service");
let TontinesService = TontinesService_1 = class TontinesService {
    prisma;
    kkiapay;
    notifications;
    logger = new common_1.Logger(TontinesService_1.name);
    constructor(prisma, kkiapay, notifications) {
        this.prisma = prisma;
        this.kkiapay = kkiapay;
        this.notifications = notifications;
    }
    async creer(requesterId, dto) {
        const requester = await this.prisma.utilisateur.findUnique({
            where: { id: requesterId },
        });
        if (!requester)
            throw new common_1.NotFoundException('Requérant introuvable');
        let actualOwnerId = requesterId;
        if (dto.clientId && dto.clientId !== requesterId) {
            if (![client_1.Role.AGENT, client_1.Role.INDEPENDANT].includes(requester.role)) {
                throw new common_1.ForbiddenException('Seuls les collecteurs peuvent créer une tontine pour un tiers.');
            }
            const client = await this.prisma.utilisateur.findUnique({
                where: { id: dto.clientId },
            });
            if (!client)
                throw new common_1.NotFoundException('Client introuvable');
            if (client.collecteurId !== requesterId) {
                throw new common_1.ForbiddenException("Ce client n'est pas dans votre portefeuille.");
            }
            actualOwnerId = dto.clientId;
        }
        if (dto.type === client_1.TypeTontine.PROJET) {
            if (!dto.dateFin) {
                throw new common_1.BadRequestException({
                    message: 'Une tontine de type PROJET doit avoir une dateFin.',
                    code: 'DATE_FIN_REQUISE',
                });
            }
            if (!dto.objectifMontantFcfa) {
                throw new common_1.BadRequestException({
                    message: 'Une tontine de type PROJET doit avoir un objectifMontantFcfa.',
                    code: 'OBJECTIF_REQUIS',
                });
            }
            if (new Date(dto.dateFin) <= new Date()) {
                throw new common_1.BadRequestException({
                    message: 'La dateFin doit être dans le futur.',
                    code: 'DATE_FIN_INVALIDE',
                });
            }
        }
        if (dto.frequence === client_1.FrequenceTontine.DATE_FIXE && !dto.jourFixe) {
            throw new common_1.BadRequestException({
                message: 'La fréquence DATE_FIXE exige un jourFixe (1-28).',
                code: 'JOUR_FIXE_REQUIS',
            });
        }
        this.verifierConfigurationGroupe(dto);
        this.verifierConfigurationPolitiqueRetrait({
            politique: dto.politique ?? client_1.PolitiqueRetrait.FLEXIBLE,
            dateDeverrouillage: dto.dateDeverrouillage,
            objectifMontantFcfa: dto.objectifMontantFcfa,
            montantJournalierFcfa: dto.montantJournalierFcfa ?? 500,
            frequence: dto.frequence ?? client_1.FrequenceTontine.MENSUEL,
        });
        const dateProchaineCotisation = this.calculerProchaineDateCotisation(dto.frequence ?? client_1.FrequenceTontine.MENSUEL, dto.jourFixe);
        let codeInvitation;
        let qrInvitation;
        if (dto.type === client_1.TypeTontine.GROUPE) {
            codeInvitation = Math.random().toString(36).substring(2, 8).toUpperCase();
            qrInvitation = this.genererPayloadInvitation(codeInvitation);
        }
        const tontine = await this.prisma.tontine.create({
            data: {
                nom: dto.nom,
                description: dto.description,
                type: dto.type ?? client_1.TypeTontine.PERSONNEL,
                statut: client_1.StatutTontine.CREATION,
                frequence: dto.frequence ?? client_1.FrequenceTontine.MENSUEL,
                jourFixe: dto.jourFixe,
                politique: dto.politique ?? client_1.PolitiqueRetrait.FLEXIBLE,
                objectifMontantFcfa: dto.objectifMontantFcfa,
                montantJournalierFcfa: dto.montantJournalierFcfa ?? 500,
                dateDeverrouillage: dto.dateDeverrouillage,
                dateFin: dto.dateFin,
                dateProchaineCotisation,
                codeInvitation,
                qrInvitation,
                nbMembresMax: dto.type === client_1.TypeTontine.GROUPE ? dto.nbMembresMax : undefined,
                montantParMembreFcfa: dto.type === client_1.TypeTontine.GROUPE
                    ? (dto.montantParMembreFcfa ?? dto.montantJournalierFcfa ?? 500)
                    : undefined,
                cautionObligatoire: dto.type === client_1.TypeTontine.GROUPE
                    ? (dto.cautionObligatoire ?? false)
                    : false,
                montantCautionObligatoireFcfa: dto.type === client_1.TypeTontine.GROUPE
                    ? (dto.montantCautionFcfaObligatoireFcfa ?? 0)
                    : 0,
                penaliteRetardActive: dto.type === client_1.TypeTontine.GROUPE
                    ? (dto.penaliteRetardActive ?? false)
                    : false,
                montantPenaliteRetardFcfa: dto.type === client_1.TypeTontine.GROUPE
                    ? (dto.montantPenaliteRetardFcfa ?? 0)
                    : 0,
                modeTirage: dto.type === client_1.TypeTontine.GROUPE
                    ? (dto.modeTirage ?? client_1.ModeTirageGroupe.MANUEL)
                    : client_1.ModeTirageGroupe.MANUEL,
                proprietaireId: actualOwnerId,
            },
            include: {
                proprietaire: { select: { id: true, nom: true, telephone: true } },
            },
        });
        return {
            succes: true,
            message: 'Tontine créée (statut: CREATION). Invitez vos membres puis activez-la.',
            donnees: tontine,
        };
    }
    async activerTontine(id, proprietaireId) {
        const t = await this.prisma.tontine.findUnique({ where: { id } });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.proprietaireId !== proprietaireId)
            throw new common_1.ForbiddenException('Seul le propriétaire peut activer cette tontine');
        if (t.statut !== client_1.StatutTontine.CREATION) {
            throw new common_1.BadRequestException({
                message: `La tontine est en statut ${t.statut}. Seule une tontine CREATION peut être activée.`,
                code: 'TRANSITION_INVALIDE',
            });
        }
        if (t.type === client_1.TypeTontine.GROUPE) {
            const nbMembres = await this.prisma.membreTontineGroupe.count({
                where: { tontineId: id, statut: client_1.StatutMembreGroupe.ACTIF },
            });
            if (nbMembres < 2) {
                throw new common_1.BadRequestException({
                    message: `Une tontine GROUPE nécessite au minimum 2 membres avant activation (actuellement ${nbMembres}).`,
                    code: 'MEMBRES_INSUFFISANTS',
                });
            }
            if (t.modeTirage === client_1.ModeTirageGroupe.ALEATOIRE) {
                await this.randomiserOrdreTirage(id, proprietaireId);
            }
            else {
                const nbOrdres = await this.prisma.ordreTirage.count({
                    where: { tontineId: id },
                });
                if (nbOrdres < nbMembres) {
                    throw new common_1.BadRequestException({
                        message: 'Définissez l’ordre de passage de tous les membres avant activation.',
                        code: 'ORDRE_TIRAGE_INCOMPLET',
                    });
                }
            }
        }
        if (t.type === client_1.TypeTontine.PROJET) {
            if (!t.dateFin) {
                throw new common_1.BadRequestException({
                    message: "Impossible d'activer : dateFin manquante pour une tontine PROJET.",
                    code: 'DATE_FIN_MANQUANTE',
                });
            }
            if (t.dateFin <= new Date()) {
                throw new common_1.BadRequestException({
                    message: "Impossible d'activer : la dateFin est déjà passée.",
                    code: 'DATE_FIN_PASSEE',
                });
            }
        }
        const maj = await this.prisma.tontine.update({
            where: { id },
            data: { statut: client_1.StatutTontine.ACTIVE },
        });
        return {
            succes: true,
            message: 'Tontine activée. Les cotisations sont maintenant possibles.',
            donnees: maj,
        };
    }
    async terminerTontine(id, proprietaireId) {
        const t = await this.prisma.tontine.findUnique({ where: { id } });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.proprietaireId !== proprietaireId)
            throw new common_1.ForbiddenException('Seul le propriétaire peut terminer cette tontine');
        if (t.statut !== client_1.StatutTontine.ACTIVE) {
            throw new common_1.BadRequestException({
                message: `La tontine est en statut ${t.statut}. Seule une tontine ACTIVE peut être terminée manuellement.`,
                code: 'TRANSITION_INVALIDE',
            });
        }
        if (t.type === client_1.TypeTontine.GROUPE) {
            const membresSansDistribution = await this.prisma.ordreTirage.count({
                where: { tontineId: id, aRecu: false },
            });
            if (membresSansDistribution > 0) {
                throw new common_1.BadRequestException({
                    message: `${membresSansDistribution} membre(s) n'ont pas encore reçu leur distribution. Terminez le cycle avant de clôturer.`,
                    code: 'CYCLE_INCOMPLET',
                });
            }
        }
        if (t.soldeActuelFcfa > 0) {
            throw new common_1.BadRequestException({
                message: `Solde restant de ${t.soldeActuelFcfa} FCFA. Effectuez d'abord un retrait total.`,
                code: 'SOLDE_NON_NUL',
            });
        }
        const maj = await this.prisma.tontine.update({
            where: { id },
            data: { statut: client_1.StatutTontine.TERMINEE },
        });
        return {
            succes: true,
            message: 'Tontine clôturée définitivement.',
            donnees: maj,
        };
    }
    async suspendre(id, proprietaireId) {
        const t = await this.prisma.tontine.findUnique({ where: { id } });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.proprietaireId !== proprietaireId)
            throw new common_1.ForbiddenException('Seul le propriétaire peut suspendre cette tontine');
        if (t.statut !== client_1.StatutTontine.ACTIVE)
            throw new common_1.BadRequestException({
                message: 'Seule une tontine ACTIVE peut être suspendue.',
                code: 'TRANSITION_INVALIDE',
            });
        const maj = await this.prisma.tontine.update({
            where: { id },
            data: { statut: client_1.StatutTontine.SUSPENDUE },
        });
        return { succes: true, message: 'Tontine suspendue.', donnees: maj };
    }
    async reactiver(id, proprietaireId) {
        const t = await this.prisma.tontine.findUnique({ where: { id } });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.proprietaireId !== proprietaireId)
            throw new common_1.ForbiddenException('Seul le propriétaire peut réactiver cette tontine');
        if (t.statut !== client_1.StatutTontine.SUSPENDUE)
            throw new common_1.BadRequestException({
                message: 'Seule une tontine SUSPENDUE peut être réactivée.',
                code: 'TRANSITION_INVALIDE',
            });
        const maj = await this.prisma.tontine.update({
            where: { id },
            data: { statut: client_1.StatutTontine.ACTIVE },
        });
        return { succes: true, message: 'Tontine réactivée.', donnees: maj };
    }
    async mesTontines(utilisateurId) {
        const [proprietes, membre] = await Promise.all([
            this.prisma.tontine.findMany({
                where: { proprietaireId: utilisateurId },
                include: { _count: { select: { membres: true, transactions: true } } },
                orderBy: { creeLe: 'desc' },
            }),
            this.prisma.membreTontineGroupe.findMany({
                where: { utilisateurId, statut: client_1.StatutMembreGroupe.ACTIF },
                include: {
                    tontine: { include: { _count: { select: { membres: true } } } },
                },
            }),
        ]);
        return {
            succes: true,
            message: 'Tontines récupérées.',
            donnees: {
                proprietaire: proprietes,
                membre: membre.map((m) => ({
                    ...m.tontine,
                    monStatut: m.statut,
                    caution: m.montantCautionFcfa,
                })),
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
        if (t.proprietaireId !== utilisateurId && !estMembre)
            throw new common_1.ForbiddenException('Accès refusé à cette tontine');
        return { succes: true, message: 'Tontine récupérée.', donnees: t };
    }
    async modifier(id, proprietaireId, dto) {
        const t = await this.prisma.tontine.findUnique({ where: { id } });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.proprietaireId !== proprietaireId)
            throw new common_1.ForbiddenException('Seul le propriétaire peut modifier cette tontine');
        if (t.statut === client_1.StatutTontine.TERMINEE)
            throw new common_1.BadRequestException({
                message: 'Une tontine terminée ne peut plus être modifiée.',
                code: 'TONTINE_TERMINEE',
            });
        this.verifierConfigurationGroupe({
            ...dto,
            type: t.type,
            nbMembresMax: dto.nbMembresMax ?? t.nbMembresMax ?? undefined,
            montantParMembreFcfa: dto.montantParMembreFcfa ?? t.montantParMembreFcfa ?? undefined,
            cautionObligatoire: dto.cautionObligatoire ?? t.cautionObligatoire,
            montantCautionObligatoireFcfa: dto.montantCautionFcfaObligatoireFcfa ??
                t.montantCautionObligatoireFcfa,
            penaliteRetardActive: dto.penaliteRetardActive ?? t.penaliteRetardActive,
            montantPenaliteRetardFcfa: dto.montantPenaliteRetardFcfa ?? t.montantPenaliteRetardFcfa,
            modeTirage: dto.modeTirage ?? t.modeTirage,
        });
        this.verifierConfigurationPolitiqueRetrait({
            politique: dto.politique ?? t.politique,
            dateDeverrouillage: dto.dateDeverrouillage ?? t.dateDeverrouillage ?? undefined,
            objectifMontantFcfa: dto.objectifMontantFcfa ?? t.objectifMontantFcfa ?? undefined,
            montantJournalierFcfa: dto.montantJournalierFcfa ?? t.montantJournalierFcfa,
            frequence: dto.frequence ?? t.frequence,
        });
        const maj = await this.prisma.tontine.update({
            where: { id },
            data: {
                ...(dto.nom && { nom: dto.nom }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.politique && { politique: dto.politique }),
                ...(dto.frequence && { frequence: dto.frequence }),
                ...(dto.jourFixe !== undefined && { jourFixe: dto.jourFixe }),
                ...(dto.objectifMontantFcfa !== undefined && {
                    objectifMontantFcfa: dto.objectifMontantFcfa,
                }),
                ...(dto.montantJournalierFcfa && {
                    montantJournalierFcfa: dto.montantJournalierFcfa,
                }),
                ...(dto.dateDeverrouillage && {
                    dateDeverrouillage: dto.dateDeverrouillage,
                }),
                ...(dto.dateFin && { dateFin: dto.dateFin }),
                ...(dto.nbMembresMax !== undefined && {
                    nbMembresMax: dto.nbMembresMax,
                }),
                ...(dto.montantParMembreFcfa !== undefined && {
                    montantParMembreFcfa: dto.montantParMembreFcfa,
                }),
                ...(dto.cautionObligatoire !== undefined && {
                    cautionObligatoire: dto.cautionObligatoire,
                }),
                ...(dto.montantCautionFcfaObligatoireFcfa !== undefined && {
                    montantCautionObligatoireFcfa: dto.montantCautionFcfaObligatoireFcfa,
                }),
                ...(dto.penaliteRetardActive !== undefined && {
                    penaliteRetardActive: dto.penaliteRetardActive,
                }),
                ...(dto.montantPenaliteRetardFcfa !== undefined && {
                    montantPenaliteRetardFcfa: dto.montantPenaliteRetardFcfa,
                }),
                ...(dto.modeTirage && { modeTirage: dto.modeTirage }),
            },
        });
        return { succes: true, message: 'Tontine mise à jour.', donnees: maj };
    }
    async rejoindre(tontineId, utilisateurId, dto) {
        const t = await this.prisma.tontine.findUnique({
            where: { id: tontineId },
        });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.type !== client_1.TypeTontine.GROUPE) {
            throw new common_1.BadRequestException({
                message: 'Seules les tontines GROUPE peuvent être rejointes',
                code: 'TYPE_INVALIDE',
            });
        }
        if (t.statut !== client_1.StatutTontine.CREATION) {
            throw new common_1.BadRequestException({
                message: 'Cette tontine a déjà démarré, vous ne pouvez plus la rejoindre.',
                code: 'TONTINE_DEJA_DEMARREE',
            });
        }
        if (t.proprietaireId === utilisateurId) {
            throw new common_1.BadRequestException({
                message: 'Vous êtes déjà propriétaire de cette tontine',
                code: 'DEJA_PROPRIETAIRE',
            });
        }
        const existant = await this.prisma.membreTontineGroupe.findUnique({
            where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
        });
        if (existant?.statut === client_1.StatutMembreGroupe.ACTIF) {
            throw new common_1.BadRequestException({
                message: 'Vous êtes déjà membre de cette tontine',
                code: 'DEJA_MEMBRE',
            });
        }
        const nbMembres = await this.prisma.membreTontineGroupe.count({
            where: { tontineId },
        });
        if (t.nbMembresMax && nbMembres >= t.nbMembresMax) {
            throw new common_1.BadRequestException({
                message: `Nombre maximum de membres atteint (${t.nbMembresMax}).`,
                code: 'GROUPE_COMPLET',
            });
        }
        if (t.cautionObligatoire &&
            (dto.montantCautionFcfa ?? 0) < t.montantCautionObligatoireFcfa) {
            throw new common_1.BadRequestException({
                message: `Caution obligatoire de ${t.montantCautionObligatoireFcfa} FCFA requise.`,
                code: 'CAUTION_REQUISE',
            });
        }
        const membre = await this.prisma.membreTontineGroupe.upsert({
            where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
            create: {
                tontineId,
                utilisateurId,
                statut: client_1.StatutMembreGroupe.ACTIF,
                montantCautionFcfa: dto.montantCautionFcfa ?? 0,
                cautionBloquee: true,
            },
            update: {
                statut: client_1.StatutMembreGroupe.ACTIF,
                montantCautionFcfa: dto.montantCautionFcfa ?? 0,
            },
            include: {
                utilisateur: { select: { id: true, nom: true, collecteurId: true } },
            },
        });
        if (membre.utilisateur.collecteurId) {
            await this.notifications.envoyerAEquipe(membre.utilisateur.collecteurId, 'Nouveau membre de groupe', `Votre client ${membre.utilisateur.nom} vient de rejoindre le groupe '${t.nom}'.`);
        }
        const dejaOrdre = await this.prisma.ordreTirage.findFirst({
            where: { tontineId, utilisateurId },
        });
        if (!dejaOrdre) {
            try {
                const nbOrdres = await this.prisma.ordreTirage.count({
                    where: { tontineId },
                });
                await this.prisma.ordreTirage.create({
                    data: { tontineId, utilisateurId, position: nbOrdres + 1 },
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.error(`Erreur notifications adhésion tontine ${tontineId}: ${message}`);
            }
        }
        return {
            succes: true,
            message: "Vous avez rejoint la tontine. En attente d'activation par le propriétaire.",
            donnees: membre,
        };
    }
    async getDetailsParCode(code) {
        const t = await this.prisma.tontine.findUnique({
            where: { codeInvitation: code.toUpperCase() },
            include: { proprietaire: { select: { nom: true } } },
        });
        if (!t)
            throw new common_1.NotFoundException("Code d'invitation invalide");
        return {
            succes: true,
            message: 'Tontine trouvée.',
            donnees: {
                id: t.id,
                nom: t.nom,
                type: t.type,
                montantJournalierFcfa: t.montantJournalierFcfa,
                montantParMembreFcfa: t.montantParMembreFcfa,
                frequence: t.frequence,
                president: t.proprietaire.nom,
                statut: t.statut,
                cautionObligatoire: t.cautionObligatoire,
                montantCautionObligatoireFcfa: t.montantCautionObligatoireFcfa,
                nbMembresMax: t.nbMembresMax,
            },
        };
    }
    async rejoindreParCode(code, utilisateurId, dto) {
        const t = await this.prisma.tontine.findUnique({
            where: { codeInvitation: code.toUpperCase() },
        });
        if (!t)
            throw new common_1.NotFoundException("Code d'invitation invalide");
        return this.rejoindre(t.id, utilisateurId, dto);
    }
    async quitter(tontineId, utilisateurId) {
        const membre = await this.prisma.membreTontineGroupe.findUnique({
            where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
        });
        if (!membre)
            throw new common_1.BadRequestException({
                message: "Vous n'êtes pas membre de cette tontine",
                code: 'PAS_MEMBRE',
            });
        if (membre.statut === client_1.StatutMembreGroupe.A_RECU)
            throw new common_1.BadRequestException({
                message: 'Impossible de quitter après avoir reçu la distribution',
                code: 'DEJA_RECU',
            });
        if (membre.statut !== client_1.StatutMembreGroupe.ACTIF)
            throw new common_1.BadRequestException({
                message: "Vous n'êtes plus membre actif",
                code: 'PAS_MEMBRE',
            });
        await this.prisma.membreTontineGroupe.update({
            where: { tontineId_utilisateurId: { tontineId, utilisateurId } },
            data: {
                statut: client_1.StatutMembreGroupe.EXCLU,
                excluLe: new Date(),
                motifExclusion: 'Départ volontaire',
            },
        });
        return { succes: true, message: 'Vous avez quitté la tontine.' };
    }
    async invitation(tontineId, proprietaireId) {
        const t = await this.prisma.tontine.findUnique({
            where: { id: tontineId },
            include: { _count: { select: { membres: true } } },
        });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.proprietaireId !== proprietaireId)
            throw new common_1.ForbiddenException('Seul le propriétaire peut voir cette invitation');
        if (t.type !== client_1.TypeTontine.GROUPE)
            throw new common_1.BadRequestException({
                message: 'Invitation disponible uniquement pour les tontines GROUPE',
                code: 'TYPE_INVALIDE',
            });
        return {
            succes: true,
            message: 'Invitation groupe.',
            donnees: {
                codeInvitation: t.codeInvitation,
                qrInvitation: t.qrInvitation ??
                    (t.codeInvitation
                        ? this.genererPayloadInvitation(t.codeInvitation)
                        : null),
                membresInvites: t._count.membres,
                minimumActivation: 2,
                nbMembresMax: t.nbMembresMax,
            },
        };
    }
    async membres(tontineId) {
        const t = await this.prisma.tontine.findUnique({
            where: { id: tontineId },
        });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        const membres = await this.prisma.membreTontineGroupe.findMany({
            where: { tontineId },
            include: {
                utilisateur: {
                    select: { id: true, nom: true, telephone: true, kycVerifie: true },
                },
            },
            orderBy: { rejointLe: 'asc' },
        });
        return {
            succes: true,
            message: `${membres.length} membre(s).`,
            donnees: membres,
        };
    }
    async ordreTirage(tontineId) {
        const ordres = await this.prisma.ordreTirage.findMany({
            where: { tontineId },
            include: {
                utilisateur: { select: { id: true, nom: true, telephone: true } },
            },
            orderBy: { position: 'asc' },
        });
        return {
            succes: true,
            message: `Ordre de tirage (${ordres.length} membres).`,
            donnees: ordres,
        };
    }
    async definirOrdreTirage(tontineId, proprietaireId, utilisateurIds) {
        const t = await this.prisma.tontine.findUnique({
            where: { id: tontineId },
        });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.proprietaireId !== proprietaireId)
            throw new common_1.ForbiddenException('Seul le propriétaire peut définir l’ordre');
        if (t.type !== client_1.TypeTontine.GROUPE)
            throw new common_1.BadRequestException({
                message: 'Ordre réservé aux groupes',
                code: 'TYPE_INVALIDE',
            });
        if (t.statut !== client_1.StatutTontine.CREATION)
            throw new common_1.BadRequestException({
                message: 'L’ordre ne peut être modifié qu’avant activation.',
                code: 'TONTINE_DEJA_DEMARREE',
            });
        const membres = await this.prisma.membreTontineGroupe.findMany({
            where: { tontineId, statut: client_1.StatutMembreGroupe.ACTIF },
            select: { utilisateurId: true },
        });
        const membresIds = new Set(membres.map((m) => m.utilisateurId));
        const idsUniques = new Set(utilisateurIds);
        if (idsUniques.size !== utilisateurIds.length ||
            utilisateurIds.some((id) => !membresIds.has(id))) {
            throw new common_1.BadRequestException({
                message: 'La liste doit contenir uniquement des membres actifs, sans doublon.',
                code: 'ORDRE_TIRAGE_INVALIDE',
            });
        }
        if (utilisateurIds.length !== membres.length) {
            throw new common_1.BadRequestException({
                message: 'Tous les membres actifs doivent être dans l’ordre de passage.',
                code: 'ORDRE_TIRAGE_INCOMPLET',
            });
        }
        await this.prisma.$transaction([
            this.prisma.ordreTirage.deleteMany({ where: { tontineId } }),
            ...utilisateurIds.map((utilisateurId, index) => this.prisma.ordreTirage.create({
                data: { tontineId, utilisateurId, position: index + 1 },
            })),
            this.prisma.tontine.update({
                where: { id: tontineId },
                data: { modeTirage: client_1.ModeTirageGroupe.MANUEL },
            }),
        ]);
        return this.ordreTirage(tontineId);
    }
    async randomiserOrdreTirage(tontineId, proprietaireId) {
        const t = await this.prisma.tontine.findUnique({
            where: { id: tontineId },
        });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.proprietaireId !== proprietaireId)
            throw new common_1.ForbiddenException('Seul le propriétaire peut lancer le tirage');
        if (t.type !== client_1.TypeTontine.GROUPE)
            throw new common_1.BadRequestException({
                message: 'Tirage réservé aux groupes',
                code: 'TYPE_INVALIDE',
            });
        if (t.statut !== client_1.StatutTontine.CREATION)
            throw new common_1.BadRequestException({
                message: 'Le tirage aléatoire ne peut être lancé qu’avant activation.',
                code: 'TONTINE_DEJA_DEMARREE',
            });
        const membres = await this.prisma.membreTontineGroupe.findMany({
            where: { tontineId, statut: client_1.StatutMembreGroupe.ACTIF },
            select: { utilisateurId: true },
        });
        if (membres.length < 2) {
            throw new common_1.BadRequestException({
                message: 'Au moins 2 membres actifs sont requis pour tirer un ordre.',
                code: 'MEMBRES_INSUFFISANTS',
            });
        }
        const melanges = [...membres].sort(() => Math.random() - 0.5);
        await this.prisma.$transaction([
            this.prisma.ordreTirage.deleteMany({ where: { tontineId } }),
            ...melanges.map((membre, index) => this.prisma.ordreTirage.create({
                data: {
                    tontineId,
                    utilisateurId: membre.utilisateurId,
                    position: index + 1,
                },
            })),
            this.prisma.tontine.update({
                where: { id: tontineId },
                data: { modeTirage: client_1.ModeTirageGroupe.ALEATOIRE },
            }),
        ]);
        return this.ordreTirage(tontineId);
    }
    async distribuer(tontineId, proprietaireId) {
        const t = await this.prisma.tontine.findUnique({
            where: { id: tontineId },
        });
        if (!t)
            throw new common_1.NotFoundException('Tontine introuvable');
        if (t.proprietaireId !== proprietaireId)
            throw new common_1.ForbiddenException('Seul le propriétaire peut déclencher la distribution');
        if (t.type !== client_1.TypeTontine.GROUPE)
            throw new common_1.BadRequestException({
                message: 'Distribution uniquement pour les tontines GROUPE',
                code: 'TYPE_INVALIDE',
            });
        if (t.statut !== client_1.StatutTontine.ACTIVE) {
            throw new common_1.BadRequestException({
                message: 'La tontine doit être active pour distribuer.',
                code: 'TONTINE_NON_ACTIVE',
            });
        }
        const membresActifs = await this.prisma.membreTontineGroupe.count({
            where: { tontineId, statut: client_1.StatutMembreGroupe.ACTIF },
        });
        const montantParMembreFcfa = t.montantParMembreFcfa ?? t.montantJournalierFcfa;
        const cagnotteAttendue = membresActifs * montantParMembreFcfa;
        if (t.soldeActuelFcfa < cagnotteAttendue) {
            throw new common_1.BadRequestException({
                message: `Cotisations du tour incomplètes. Cagnotte attendue: ${cagnotteAttendue} FCFA, disponible: ${t.soldeActuelFcfa} FCFA.`,
                code: 'COTISATIONS_TOUR_INCOMPLETES',
            });
        }
        if (t.soldeActuelFcfa <= 0)
            throw new common_1.BadRequestException({
                message: 'Solde insuffisant pour distribuer',
                code: 'SOLDE_INSUFFISANT',
            });
        this.verifierPolitique(t);
        await this.verifierAucuneAlerteBloquante(tontineId);
        const prochainTirage = await this.prisma.ordreTirage.findFirst({
            where: { tontineId, aRecu: false },
            orderBy: { position: 'asc' },
            include: {
                utilisateur: {
                    include: {
                        badges: { where: { niveau: 'DIAMANT' }, take: 1 },
                    },
                },
            },
        });
        if (!prochainTirage) {
            await this.prisma.tontine.update({
                where: { id: tontineId },
                data: { statut: client_1.StatutTontine.TERMINEE },
            });
            throw new common_1.BadRequestException({
                message: 'Tous les membres ont reçu. Tontine marquée TERMINEE.',
                code: 'CYCLE_TERMINE',
            });
        }
        const montantFcfaDistribution = t.soldeActuelFcfa;
        const fraisDistribution = business_constants_1.BUSINESS.calculerFraisRetrait(montantFcfaDistribution);
        const montantNetFcfa = montantFcfaDistribution - fraisDistribution;
        const transfert = await this.kkiapay.initierTransfert({
            montant: montantNetFcfa,
            telephone: prochainTirage.utilisateur.telephone,
            reference: `dist_${tontineId}_${prochainTirage.id}`,
            motif: `Distribution tontine ${t.nom}`,
        });
        if (!transfert.succes)
            throw new common_1.BadRequestException({
                message: 'Échec du transfert KKiaPay',
                code: 'TRANSFERT_ECHOUE',
            });
        const nbRestants = await this.prisma.ordreTirage.count({
            where: { tontineId, aRecu: false },
        });
        const estDerniere = nbRestants === 1;
        const prochaineDateCotisation = this.calculerProchaineDateCotisation(t.frequence, t.jourFixe ?? undefined);
        await this.prisma.$transaction([
            this.prisma.ordreTirage.update({
                where: { id: prochainTirage.id },
                data: {
                    aRecu: true,
                    recuLe: new Date(),
                    montantRecuFcfa: montantNetFcfa,
                },
            }),
            this.prisma.membreTontineGroupe.update({
                where: {
                    tontineId_utilisateurId: {
                        tontineId,
                        utilisateurId: prochainTirage.utilisateurId,
                    },
                },
                data: { statut: client_1.StatutMembreGroupe.A_RECU },
            }),
            this.prisma.tontine.update({
                where: { id: tontineId },
                data: {
                    soldeActuelFcfa: 0,
                    dateProchaineCotisation: estDerniere ? null : prochaineDateCotisation,
                    ...(!estDerniere && { tourActuel: { increment: 1 } }),
                    ...(estDerniere && { statut: client_1.StatutTontine.TERMINEE }),
                },
            }),
            this.prisma.transaction.create({
                data: {
                    montantFcfa: montantFcfaDistribution,
                    montantNetFcfa,
                    type: client_1.TypeTransaction.DISTRIBUTION_GROUPE,
                    tontineId,
                    utilisateurId: prochainTirage.utilisateurId,
                    refKKiaPay: transfert.refKKiaPay,
                    fraisPlateformeFcfa: business_constants_1.BUSINESS.calculerFraisPlateforme(montantFcfaDistribution),
                },
            }),
        ]);
        try {
            const beneficiaire = prochainTirage.utilisateur;
            const tontineNom = t.nom;
            const montantFcfaFmt = montantNetFcfa.toLocaleString('fr-FR');
            const titreBeneficiaire = "C'est ton tour ! 🎉";
            const messagePushBeneficiaire = `Félicitations ${beneficiaire.nom} ! Ta cagnotte de ${montantFcfaFmt} FCFA de '${tontineNom}' vient d'être envoyée sur ton Mobile Money.`;
            const messageSmsBeneficiaire = `TontineBénin: ${beneficiaire.nom}, ta cagnotte ${montantFcfaFmt}F de '${tontineNom}' est envoyee sur ton MoMo. Verifie ton solde.`;
            await this.notifications.envoyerAUtilisateur(beneficiaire.id, titreBeneficiaire, messagePushBeneficiaire, 'PUSH', client_1.TypeNotification.TOUR_TONTINE);
            await this.notifications.envoyerAUtilisateur(beneficiaire.id, titreBeneficiaire, messageSmsBeneficiaire, 'SMS', client_1.TypeNotification.TOUR_TONTINE);
            if (beneficiaire.collecteurId) {
                const messageCollector = `Votre client ${beneficiaire.nom} a reçu sa cagnotte de ${montantFcfaFmt} FCFA dans la tontine '${tontineNom}'.`;
                await this.notifications.envoyerAUtilisateur(beneficiaire.collecteurId, 'Cagnotte reçue par un client', messageCollector, 'PUSH', client_1.TypeNotification.TOUR_TONTINE);
            }
            const libelleFreq = this.getLibelleFrequence(t.frequence);
            const messageMembres = `${beneficiaire.nom} a reçu la cagnotte de '${tontineNom}'. Prochain tour dans ${libelleFreq}.`;
            const autresMembres = await this.prisma.membreTontineGroupe.findMany({
                where: {
                    tontineId,
                    utilisateurId: { not: beneficiaire.id },
                    statut: { in: [client_1.StatutMembreGroupe.ACTIF, client_1.StatutMembreGroupe.A_RECU] },
                },
                select: { utilisateurId: true },
            });
            for (const membre of autresMembres) {
                await this.notifications.envoyerAUtilisateur(membre.utilisateurId, 'Cagnotte distribuée', messageMembres, 'PUSH', client_1.TypeNotification.TOUR_TONTINE);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Erreur notifications distribution tontine ${tontineId}: ${message}`);
        }
        return {
            succes: true,
            message: `Distribution de ${montantNetFcfa} FCFA envoyée à ${prochainTirage.utilisateur.nom}.${estDerniere ? ' Tontine clôturée automatiquement.' : ''}`,
            donnees: {
                beneficiaire: prochainTirage.utilisateur,
                montantNetFcfa,
                refKKiaPay: transfert.refKKiaPay,
                tontineTerminee: estDerniere,
                prochaineDateCotisation: estDerniere ? null : prochaineDateCotisation,
            },
        };
    }
    calculerProchaineDateCotisation(frequence, jourFixe) {
        const now = new Date();
        switch (frequence) {
            case client_1.FrequenceTontine.JOURNALIER:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case client_1.FrequenceTontine.HEBDOMADAIRE:
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case client_1.FrequenceTontine.MENSUEL: {
                const date = new Date(now);
                date.setMonth(date.getMonth() + 1);
                return date;
            }
            case client_1.FrequenceTontine.DATE_FIXE: {
                const jour = jourFixe ?? 1;
                const dateCeMois = new Date(now.getFullYear(), now.getMonth(), jour);
                if (dateCeMois > now)
                    return dateCeMois;
                return new Date(now.getFullYear(), now.getMonth() + 1, jour);
            }
        }
    }
    verifierConfigurationPolitiqueRetrait(input) {
        if (input.politique !== client_1.PolitiqueRetrait.PROGRAMME &&
            input.politique !== client_1.PolitiqueRetrait.BLOQUE)
            return;
        if (!input.dateDeverrouillage) {
            throw new common_1.BadRequestException({
                message: `Une tontine ${input.politique} doit avoir une dateDeverrouillage.`,
                code: 'DATE_DEVERROUILLAGE_REQUISE',
            });
        }
        const dateDeverrouillage = new Date(input.dateDeverrouillage);
        const now = new Date();
        if (Number.isNaN(dateDeverrouillage.getTime()) ||
            dateDeverrouillage <= now) {
            throw new common_1.BadRequestException({
                message: 'La dateDeverrouillage doit être une date future.',
                code: 'DATE_DEVERROUILLAGE_INVALIDE',
            });
        }
        if (input.politique === client_1.PolitiqueRetrait.PROGRAMME)
            return;
        if (!input.objectifMontantFcfa || input.objectifMontantFcfa <= 0) {
            throw new common_1.BadRequestException({
                message: 'Une tontine BLOQUE doit avoir un objectifMontantFcfa positif.',
                code: 'OBJECTIF_REQUIS',
            });
        }
        const montantFcfaCotisation = input.montantJournalierFcfa ?? 500;
        if (montantFcfaCotisation < 100) {
            throw new common_1.BadRequestException({
                message: 'Le montantFcfa de cotisation doit être au moins 100 FCFA.',
                code: 'MONTANT_COTISATION_INVALIDE',
            });
        }
        const dateFinEstimee = this.calculerDateFinEstimee(input.objectifMontantFcfa, montantFcfaCotisation, input.frequence);
        if (this.debutJour(dateDeverrouillage) < this.debutJour(dateFinEstimee)) {
            throw new common_1.BadRequestException({
                message: `La dateDeverrouillage doit être supérieure ou égale à la date de fin estimée (${dateFinEstimee.toLocaleDateString('fr-FR')}).`,
                code: 'DATE_DEVERROUILLAGE_AVANT_OBJECTIF',
            });
        }
    }
    verifierConfigurationGroupe(input) {
        if (input.type !== client_1.TypeTontine.GROUPE)
            return;
        if (!input.nbMembresMax || input.nbMembresMax < 2) {
            throw new common_1.BadRequestException({
                message: 'Une tontine GROUPE doit définir au moins 2 membres.',
                code: 'NB_MEMBRES_INVALIDE',
            });
        }
        if (!input.montantParMembreFcfa || input.montantParMembreFcfa < 100) {
            throw new common_1.BadRequestException({
                message: 'Une tontine GROUPE doit définir un montantFcfa par membre d’au moins 100 FCFA.',
                code: 'MONTANT_PAR_MEMBRE_INVALIDE',
            });
        }
        if (input.cautionObligatoire &&
            (!input.montantCautionObligatoireFcfa ||
                input.montantCautionObligatoireFcfa <= 0)) {
            throw new common_1.BadRequestException({
                message: 'Le montantFcfa de caution est obligatoire si la caution est activée.',
                code: 'MONTANT_CAUTION_REQUIS',
            });
        }
        if (input.penaliteRetardActive &&
            (!input.montantPenaliteRetardFcfa || input.montantPenaliteRetardFcfa <= 0)) {
            throw new common_1.BadRequestException({
                message: 'Le montantFcfa de pénalité est obligatoire si la pénalité retard est activée.',
                code: 'MONTANT_PENALITE_REQUIS',
            });
        }
    }
    genererPayloadInvitation(codeInvitation) {
        return `tontinebenin://tontines/rejoindre?code=${codeInvitation}`;
    }
    calculerDateFinEstimee(objectifMontantFcfa, montantFcfaCotisation, frequence) {
        const nombreCotisations = Math.max(Math.ceil(objectifMontantFcfa / montantFcfaCotisation), 1);
        const joursParCotisation = {
            [client_1.FrequenceTontine.JOURNALIER]: 1,
            [client_1.FrequenceTontine.HEBDOMADAIRE]: 7,
            [client_1.FrequenceTontine.MENSUEL]: 30,
            [client_1.FrequenceTontine.DATE_FIXE]: 30,
        };
        const dateFin = new Date();
        dateFin.setDate(dateFin.getDate() + nombreCotisations * joursParCotisation[frequence]);
        return dateFin;
    }
    debutJour(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
    verifierPolitique(tontine) {
        if (tontine.politique === client_1.PolitiqueRetrait.BLOQUE) {
            if (!tontine.dateDeverrouillage ||
                tontine.dateDeverrouillage > new Date()) {
                const date = tontine.dateDeverrouillage?.toLocaleDateString('fr-FR') ??
                    'indéfinie';
                throw new common_1.BadRequestException({
                    message: `Tontine bloquée jusqu'au ${date}`,
                    code: 'TONTINE_BLOQUEE',
                });
            }
            if (!tontine.objectifMontantFcfa) {
                throw new common_1.BadRequestException({
                    message: 'Objectif requis pour une tontine bloquée.',
                    code: 'OBJECTIF_REQUIS',
                });
            }
            if (tontine.soldeActuelFcfa < tontine.objectifMontantFcfa) {
                throw new common_1.BadRequestException({
                    message: `Objectif non atteint. Progression: ${tontine.soldeActuelFcfa}/${tontine.objectifMontantFcfa} FCFA`,
                    code: 'OBJECTIF_NON_ATTEINT',
                });
            }
        }
        if (tontine.politique === client_1.PolitiqueRetrait.PROGRAMME) {
            if (!tontine.dateDeverrouillage ||
                tontine.dateDeverrouillage > new Date()) {
                throw new common_1.BadRequestException({
                    message: 'Date programmée non atteinte',
                    code: 'DATE_NON_ATTEINTE',
                });
            }
        }
    }
    async verifierAucuneAlerteBloquante(tontineId) {
        const alerte = await this.prisma.alerteSysteme.findFirst({
            where: {
                type: 'COHERENCE_COMPTABLE',
                severite: 'CRITIQUE',
                statut: 'OUVERTE',
                resourceType: 'TONTINE',
                resourceId: tontineId,
            },
            select: { id: true },
        });
        if (alerte) {
            throw new common_1.ForbiddenException({
                message: 'Distribution temporairement bloquée : anomalie comptable en cours de vérification.',
                code: 'CIRCUIT_BREAKER_COMPTABLE',
                alerteId: alerte.id,
            });
        }
    }
    getLibelleFrequence(frequence) {
        switch (frequence) {
            case client_1.FrequenceTontine.JOURNALIER:
                return '24h';
            case client_1.FrequenceTontine.HEBDOMADAIRE:
                return '7 jours';
            case client_1.FrequenceTontine.MENSUEL:
            case client_1.FrequenceTontine.DATE_FIXE:
                return '1 mois';
            default:
                return 'un cycle';
        }
    }
};
exports.TontinesService = TontinesService;
exports.TontinesService = TontinesService = TontinesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kkiapay_service_1.KkiapayService,
        notifications_service_1.NotificationsService])
], TontinesService);
//# sourceMappingURL=tontines.service.js.map