import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { EnrolerClientTerrainDto } from './dto/enroler-client-terrain.dto';
import { InitierOperationAssisteeDto } from './dto/initier-operation-assistee.dto';
import { ConfirmerOperationAssisteeDto } from './dto/confirmer-operation-assistee.dto';
export declare class OperationsAssisteesService {
    private prisma;
    private kkiapay;
    private sms;
    constructor(prisma: PrismaService, kkiapay: KkiapayService, sms: SmsService);
    enrolerClientSansSmartphone(collecteurId: string, role: Role, dto: EnrolerClientTerrainDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            client: {
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
                enroleParId: string | null;
                soldeCommissionFcfa: number;
                montantCautionFcfa: number;
                tokenPush: string | null;
            };
            profile: any;
            qr: any;
            tontine: {
                id: string;
                type: import("@prisma/client").$Enums.TypeTontine;
                creeLe: Date;
                misAJourLe: Date;
                nom: string;
                statut: import("@prisma/client").$Enums.StatutTontine;
                codeInvitation: string | null;
                politique: import("@prisma/client").$Enums.PolitiqueRetrait;
                soldeActuelFcfa: number;
                objectifMontantFcfa: number | null;
                dateDeverrouillage: Date | null;
                montantJournalierFcfa: number;
                proprietaireId: string;
                dateFin: Date | null;
                dateProchaineCotisation: Date | null;
                description: string | null;
                frequence: import("@prisma/client").$Enums.FrequenceTontine;
                jourFixe: number | null;
                qrInvitation: string | null;
                nbMembresMax: number | null;
                montantParMembreFcfa: number | null;
                cautionObligatoire: boolean;
                montantCautionObligatoireFcfa: number;
                penaliteRetardActive: boolean;
                montantPenaliteRetardFcfa: number;
                modeTirage: import("@prisma/client").$Enums.ModeTirageGroupe;
                tourActuel: number;
            };
        };
    }>;
    ficheTerrain(utilisateurId: string, role: Role, clientId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            client: {
                id: string;
                nom: string;
                telephone: string;
                collecteurId: string | null;
            };
            terrainProfile: any;
            qrPapierClient: any;
            soldeTotal: any;
            tontines: any;
            score: any;
            historique: any;
        };
    }>;
    initierCotisationAssistee(initiateurId: string, role: Role, dto: InitierOperationAssisteeDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            operation: any;
            transactionId: string;
            refKKiaPay: string;
        };
    }>;
    initierRetraitAssiste(initiateurId: string, role: Role, dto: InitierOperationAssisteeDto): Promise<{
        succes: boolean;
        message: string;
        donnees: any;
    }>;
    confirmerParClient(operationId: string, dto: ConfirmerOperationAssisteeDto): Promise<{
        succes: boolean;
        message: string;
        donnees: any;
    }>;
    statut(utilisateurId: string, role: Role, operationId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: any;
    }>;
    private verifierCollecteur;
    private verifierCollecteurActif;
    private verifierAccesClient;
    private preparerOperationClient;
    private verifierRetraitPossible;
    private executerRetraitApresConfirmation;
    private creerOtp;
}
