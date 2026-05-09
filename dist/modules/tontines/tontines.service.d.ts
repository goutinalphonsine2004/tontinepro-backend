import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { CreerTontineDto } from './dto/creer-tontine.dto';
import { ModifierTontineDto } from './dto/modifier-tontine.dto';
import { RejoindreTonitneDto } from './dto/rejoindre-tontine.dto';
export declare class TontinesService {
    private prisma;
    private kkiapay;
    constructor(prisma: PrismaService, kkiapay: KkiapayService);
    creer(proprietaireId: string, dto: CreerTontineDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            proprietaire: {
                telephone: string;
                nom: string;
                id: string;
            };
        } & {
            nom: string;
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
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
                nom: string;
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                type: import("@prisma/client").$Enums.TypeTontine;
                politique: import("@prisma/client").$Enums.PolitiqueRetrait;
                soldeActuel: number;
                objectifMontant: number | null;
                dateDeverrouillage: Date | null;
                montantJournalier: number;
                proprietaireId: string;
            })[];
            membre: {
                monStatut: import("@prisma/client").$Enums.StatutMembreGroupe;
                caution: number;
                _count: {
                    membres: number;
                };
                nom: string;
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                type: import("@prisma/client").$Enums.TypeTontine;
                politique: import("@prisma/client").$Enums.PolitiqueRetrait;
                soldeActuel: number;
                objectifMontant: number | null;
                dateDeverrouillage: Date | null;
                montantJournalier: number;
                proprietaireId: string;
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
                nom: string;
                id: string;
            };
        } & {
            nom: string;
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
        };
    }>;
    modifier(id: string, proprietaireId: string, dto: ModifierTontineDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            nom: string;
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            type: import("@prisma/client").$Enums.TypeTontine;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            proprietaireId: string;
        };
    }>;
    rejoindre(tontineId: string, utilisateurId: string, dto: RejoindreTonitneDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            statut: import("@prisma/client").$Enums.StatutMembreGroupe;
            montantCaution: number;
            utilisateurId: string;
            tontineId: string;
            cautionBloquee: boolean;
            nombreDefaillances: number;
            derniereDefaillanceLe: Date | null;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
        };
    }>;
    quitter(tontineId: string, utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
    }>;
    membres(tontineId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                nom: string;
                id: string;
                kycVerifie: boolean;
            };
        } & {
            id: string;
            statut: import("@prisma/client").$Enums.StatutMembreGroupe;
            montantCaution: number;
            utilisateurId: string;
            tontineId: string;
            cautionBloquee: boolean;
            nombreDefaillances: number;
            derniereDefaillanceLe: Date | null;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
        })[];
    }>;
    ordreTirage(tontineId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            utilisateur: {
                telephone: string;
                nom: string;
                id: string;
            };
        } & {
            id: string;
            creeLe: Date;
            utilisateurId: string;
            tontineId: string;
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
                telephone: string;
                nom: string;
                id: string;
            };
            montantNet: number;
            refKKiaPay: string;
        };
    }>;
    private verifierPolitique;
    private verifierAucuneAlerteBloquante;
}
