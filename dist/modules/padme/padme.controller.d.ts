import type { Response } from 'express';
import { Role } from '@prisma/client';
import { PadmeService } from './padme.service';
import { FiltrerDossiersDto } from './dto/filtrer-dossiers.dto';
import { ResultatPadmeDto } from './dto/resultat-padme.dto';
export declare class PadmeController {
    private service;
    constructor(service: PadmeService);
    mesDossiers(u: {
        id: string;
    }): Promise<{
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
    pdf(id: string, u: {
        id: string;
        role: Role;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    getById(id: string): Promise<{
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
    valider(id: string, u: {
        id: string;
    }): Promise<{
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
    soumettre(id: string, u: {
        id: string;
    }): Promise<{
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
    resultat(id: string, u: {
        id: string;
    }, dto: ResultatPadmeDto): Promise<{
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
