import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { FiltrerDossiersDto } from './dto/filtrer-dossiers.dto';
import { ResultatPadmeDto } from './dto/resultat-padme.dto';
export declare class PadmeService {
    private prisma;
    private sms;
    constructor(prisma: PrismaService, sms: SmsService);
    private journaliser;
    mesDossiers(clientId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: ({
            scoreCredit: {
                score: number;
            };
        } & {
            id: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutDossierPADME;
            clientId: string;
            tauxRegularite: number;
            scoreAuMoment: number;
            scoreCreditId: string;
            totalEpargne: number;
            creditsRembourses: number;
            urlPDF: string | null;
            genereePar: string;
            soumisLe: Date | null;
            examineLE: Date | null;
        })[];
    }>;
    tous(dto: FiltrerDossiersDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            dossiers: ({
                scoreCredit: {
                    score: number;
                    tauxRegularite: number;
                };
                client: {
                    telephone: string;
                    id: string;
                    nom: string;
                    kycVerifie: boolean;
                };
            } & {
                id: string;
                creeLe: Date;
                statut: import("@prisma/client").$Enums.StatutDossierPADME;
                clientId: string;
                tauxRegularite: number;
                scoreAuMoment: number;
                scoreCreditId: string;
                totalEpargne: number;
                creditsRembourses: number;
                urlPDF: string | null;
                genereePar: string;
                soumisLe: Date | null;
                examineLE: Date | null;
            })[];
            total: number;
            page: number;
            pages: number;
        };
    }>;
    getById(dossierId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            scoreCredit: {
                id: string;
                utilisateurId: string;
                score: number;
                totalDepots: number;
                tauxRegularite: number;
                totalMois: number;
                scoreRemboursement: number;
                eligiblePADME: boolean;
                eligibleMicroCredit: boolean;
                dernierCalcul: Date;
            };
            client: {
                telephone: string;
                id: string;
                creeLe: Date;
                nom: string;
                kycVerifie: boolean;
            };
        } & {
            id: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutDossierPADME;
            clientId: string;
            tauxRegularite: number;
            scoreAuMoment: number;
            scoreCreditId: string;
            totalEpargne: number;
            creditsRembourses: number;
            urlPDF: string | null;
            genereePar: string;
            soumisLe: Date | null;
            examineLE: Date | null;
        };
    }>;
    pdf(dossierId: string, utilisateurId: string, role: Role): Promise<{
        buffer: NonSharedBuffer;
        filename: string;
    }>;
    valider(dossierId: string, adminId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutDossierPADME;
            clientId: string;
            tauxRegularite: number;
            scoreAuMoment: number;
            scoreCreditId: string;
            totalEpargne: number;
            creditsRembourses: number;
            urlPDF: string | null;
            genereePar: string;
            soumisLe: Date | null;
            examineLE: Date | null;
        };
    }>;
    soumettre(dossierId: string, adminId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutDossierPADME;
            clientId: string;
            tauxRegularite: number;
            scoreAuMoment: number;
            scoreCreditId: string;
            totalEpargne: number;
            creditsRembourses: number;
            urlPDF: string | null;
            genereePar: string;
            soumisLe: Date | null;
            examineLE: Date | null;
        };
    }>;
    resultat(dossierId: string, adminId: string, dto: ResultatPadmeDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            statut: import("@prisma/client").$Enums.StatutDossierPADME;
            clientId: string;
            tauxRegularite: number;
            scoreAuMoment: number;
            scoreCreditId: string;
            totalEpargne: number;
            creditsRembourses: number;
            urlPDF: string | null;
            genereePar: string;
            soumisLe: Date | null;
            examineLE: Date | null;
        };
    }>;
}
