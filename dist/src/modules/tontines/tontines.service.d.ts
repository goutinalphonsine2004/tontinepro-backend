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
                id: string;
                nom: string;
                telephone: string;
            };
        } & {
            id: string;
            nom: string;
            type: import("@prisma/client").$Enums.TypeTontine;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            creeLe: Date;
            misAJourLe: Date;
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
                id: string;
                nom: string;
                type: import("@prisma/client").$Enums.TypeTontine;
                politique: import("@prisma/client").$Enums.PolitiqueRetrait;
                soldeActuel: number;
                objectifMontant: number | null;
                dateDeverrouillage: Date | null;
                montantJournalier: number;
                creeLe: Date;
                misAJourLe: Date;
                proprietaireId: string;
            })[];
            membre: {
                monStatut: import("@prisma/client").$Enums.StatutMembreGroupe;
                caution: number;
                _count: {
                    membres: number;
                };
                id: string;
                nom: string;
                type: import("@prisma/client").$Enums.TypeTontine;
                politique: import("@prisma/client").$Enums.PolitiqueRetrait;
                soldeActuel: number;
                objectifMontant: number | null;
                dateDeverrouillage: Date | null;
                montantJournalier: number;
                creeLe: Date;
                misAJourLe: Date;
                proprietaireId: string;
            }[];
        };
    }>;
    getTontine(id: string, utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            proprietaire: {
                id: string;
                nom: string;
                telephone: string;
            };
            _count: {
                transactions: number;
                membres: number;
            };
        } & {
            id: string;
            nom: string;
            type: import("@prisma/client").$Enums.TypeTontine;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            creeLe: Date;
            misAJourLe: Date;
            proprietaireId: string;
        };
    }>;
    modifier(id: string, proprietaireId: string, dto: ModifierTontineDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            nom: string;
            type: import("@prisma/client").$Enums.TypeTontine;
            politique: import("@prisma/client").$Enums.PolitiqueRetrait;
            soldeActuel: number;
            objectifMontant: number | null;
            dateDeverrouillage: Date | null;
            montantJournalier: number;
            creeLe: Date;
            misAJourLe: Date;
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
            tontineId: string;
            utilisateurId: string;
            cautionBloquee: boolean;
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
                id: string;
                nom: string;
                telephone: string;
                kycVerifie: boolean;
            };
        } & {
            id: string;
            statut: import("@prisma/client").$Enums.StatutMembreGroupe;
            montantCaution: number;
            tontineId: string;
            utilisateurId: string;
            cautionBloquee: boolean;
            rejointLe: Date;
            excluLe: Date | null;
            motifExclusion: string | null;
        })[];
    }>;
    ordreTirage(tontineId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            tontineId: string;
            utilisateurId: string;
            position: number;
            aRecu: boolean;
            recuLe: Date | null;
            montantRecu: number | null;
        }[];
    }>;
    distribuer(tontineId: string, proprietaireId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            beneficiaire: any;
            montantNet: number;
            refKKiaPay: string;
        };
    }>;
    private verifierPolitique;
}
