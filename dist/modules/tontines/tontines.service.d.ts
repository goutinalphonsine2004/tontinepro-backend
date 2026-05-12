import { FrequenceTontine } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { CreerTontineDto } from './dto/creer-tontine.dto';
import { ModifierTontineDto } from './dto/modifier-tontine.dto';
import { RejoindreTonitneDto } from './dto/rejoindre-tontine.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class TontinesService {
    private prisma;
    private kkiapay;
    private notifications;
    private readonly logger;
    constructor(prisma: PrismaService, kkiapay: KkiapayService, notifications: NotificationsService);
    creer(requesterId: string, dto: CreerTontineDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            proprietaire: {
                telephone: string;
                id: string;
                nom: string;
            };
        } & {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembre: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoire: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetard: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    activerTontine(id: string, proprietaireId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembre: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoire: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetard: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    terminerTontine(id: string, proprietaireId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembre: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoire: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetard: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    suspendre(id: string, proprietaireId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembre: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoire: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetard: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    reactiver(id: string, proprietaireId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembre: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoire: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetard: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    mesTontines(utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            proprietaire: ({
                _count: {
                    transactions: number;
                    membres: number;
                };
            } & {
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                type: import("@prisma/client").$Enums.TypeTontine;
                nom: string;
                statut: import("@prisma/client").$Enums.StatutTontine;
                codeInvitation: string | null;
                politique: import("@prisma/client").$Enums.PolitiqueRetrait;
                soldeActuel: number;
                objectifMontant: number | null;
                dateDeverrouillage: Date | null;
                montantJournalier: number;
                proprietaireId: string;
                dateFin: Date | null;
                dateProchaineCotisation: Date | null;
                description: string | null;
                frequence: import("@prisma/client").$Enums.FrequenceTontine;
                jourFixe: number | null;
                qrInvitation: string | null;
                nbMembresMax: number | null;
                montantParMembre: number | null;
                cautionObligatoire: boolean;
                montantCautionObligatoire: number;
                penaliteRetardActive: boolean;
                montantPenaliteRetard: number;
                modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
                tourActuel: number;
            })[];
            membre: {
                monStatut: import("@prisma/client").$Enums.StatutMembreGroupe;
                caution: number;
                _count: {
                    membres: number;
                };
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                type: import("@prisma/client").$Enums.TypeTontine;
                nom: string;
                statut: import("@prisma/client").$Enums.StatutTontine;
                codeInvitation: string | null;
                politique: import("@prisma/client").$Enums.PolitiqueRetrait;
                soldeActuel: number;
                objectifMontant: number | null;
                dateDeverrouillage: Date | null;
                montantJournalier: number;
                proprietaireId: string;
                dateFin: Date | null;
                dateProchaineCotisation: Date | null;
                description: string | null;
                frequence: import("@prisma/client").$Enums.FrequenceTontine;
                jourFixe: number | null;
                qrInvitation: string | null;
                nbMembresMax: number | null;
                montantParMembre: number | null;
                cautionObligatoire: boolean;
                montantCautionObligatoire: number;
                penaliteRetardActive: boolean;
                montantPenaliteRetard: number;
                modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
                tourActuel: number;
            }[];
        };
    }>;
    getTontine(id: string, utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            _count: {
                transactions: number;
                membres: number;
            };
            proprietaire: {
                telephone: string;
                id: string;
                nom: string;
            };
        } & {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembre: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoire: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetard: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    modifier(id: string, proprietaireId: string, dto: ModifierTontineDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            nom: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            codeInvitation: string | null;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
            dateFin: Date | null;
            dateProchaineCotisation: Date | null;
            description: string | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            jourFixe: number | null;
            qrInvitation: string | null;
            nbMembresMax: number | null;
            montantParMembre: number | null;
            cautionObligatoire: boolean;
            montantCautionObligatoire: number;
            penaliteRetardActive: boolean;
            montantPenaliteRetard: number;
            modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
            tourActuel: number;
        };
    }>;
    rejoindre(tontineId: string, utilisateurId: string, dto: RejoindreTonitneDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            utilisateur: {
                id: string;
                nom: string;
                collecteurId: string | null;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            statut: import("@prisma/client").$Enums.StatutMembreGroupe;
            montantCaution: number;
            cautionBloquee: boolean;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
            nombreDefaillances: number;
            derniereDefaillanceLe: Date | null;
        };
    }>;
    getDetailsParCode(code: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            nom: string;
            type: import("@prisma/client").$Enums.TypeTontine;
            montantJournalier: number;
            montantParMembre: number | null;
            frequence: import("@prisma/client").$Enums.FrequenceTontine;
            president: string;
            statut: import("@prisma/client").$Enums.StatutTontine;
            cautionObligatoire: boolean;
            montantCautionObligatoire: number;
            nbMembresMax: number | null;
        };
    }>;
    rejoindreParCode(code: string, utilisateurId: string, dto: RejoindreTonitneDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            utilisateur: {
                id: string;
                nom: string;
                collecteurId: string | null;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            statut: import("@prisma/client").$Enums.StatutMembreGroupe;
            montantCaution: number;
            cautionBloquee: boolean;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
            nombreDefaillances: number;
            derniereDefaillanceLe: Date | null;
        };
    }>;
    quitter(tontineId: string, utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
    }>;
    invitation(tontineId: string, proprietaireId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            codeInvitation: string | null;
            qrInvitation: string | null;
            membresInvites: number;
            minimumActivation: number;
            nbMembresMax: number | null;
        };
    }>;
    membres(tontineId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                id: string;
                nom: string;
                kycVerifie: boolean;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            statut: import("@prisma/client").$Enums.StatutMembreGroupe;
            montantCaution: number;
            cautionBloquee: boolean;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
            nombreDefaillances: number;
            derniereDefaillanceLe: Date | null;
        })[];
    }>;
    ordreTirage(tontineId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                id: string;
                nom: string;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            position: number;
            aRecu: boolean;
            recuLe: Date | null;
            montantRecu: number | null;
        })[];
    }>;
    definirOrdreTirage(tontineId: string, proprietaireId: string, utilisateurIds: string[]): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                id: string;
                nom: string;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            position: number;
            aRecu: boolean;
            recuLe: Date | null;
            montantRecu: number | null;
        })[];
    }>;
    randomiserOrdreTirage(tontineId: string, proprietaireId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                id: string;
                nom: string;
            };
        } & {
            tontineId: string;
            id: string;
            utilisateurId: string;
            creeLe: Date;
            position: number;
            aRecu: boolean;
            recuLe: Date | null;
            montantRecu: number | null;
        })[];
    }>;
    distribuer(tontineId: string, proprietaireId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            beneficiaire: {
                badges: {
                    id: string;
                    clientId: string;
                    niveau: import("@prisma/client").$Enums.NiveauBadge;
                    obtenuLe: Date;
                }[];
            } & {
                telephone: string;
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                nom: string;
                photo: string | null;
                role: import("@prisma/client").$Enums.Role;
                typeCollecteur: import("@prisma/client").$Enums.TypeCollecteur | null;
                statut: import("@prisma/client").$Enums.StatutCompte;
                pinHash: string | null;
                deviceId: string | null;
                empreinteActive: boolean;
                kycVerifie: boolean;
                tentativesEchouees: number;
                bloqueLe: Date | null;
                collecteurId: string | null;
                superviseurId: string | null;
                zoneId: string | null;
                soldeCommission: number;
                montantCaution: number;
                tokenPush: string | null;
            };
            montantNet: number;
            refKKiaPay: string;
            tontineTerminee: boolean;
            prochaineDateCotisation: Date | null;
        };
    }>;
    calculerProchaineDateCotisation(frequence: FrequenceTontine, jourFixe?: number): Date;
    private verifierConfigurationPolitiqueRetrait;
    private verifierConfigurationGroupe;
    private genererPayloadInvitation;
    private calculerDateFinEstimee;
    private debutJour;
    private verifierPolitique;
    private verifierAucuneAlerteBloquante;
    private getLibelleFrequence;
}
