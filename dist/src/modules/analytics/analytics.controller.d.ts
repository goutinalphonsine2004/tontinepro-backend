import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private service;
    constructor(service: AnalyticsService);
    kpis(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            volumeTotal: number;
            totalClients: number;
            totalCollecteurs: number;
            revenusCommissions: number;
            revenusMicroCredits: number;
            revenusAbonnements: number;
            revenusTotal: number;
            tauxRemboursement: number;
            clientsEligiblesPADME: number;
            clientsEligiblesMicroCredit: number;
            tauxCommission: string;
            tauxInteret: string;
        };
    }>;
    scoreParZone(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            zone: string;
            ville: string;
            nbClients: number;
            scoreMoyen: number;
            eligiblesPADME: number;
        }[];
    }>;
    performanceCollecteurs(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            nom: string;
            telephone: string;
            role: import("@prisma/client").$Enums.Role;
            nbClients: number;
            totalCotisations: number;
            totalCommissions: number;
            tauxRegulariteClients: number;
        }[];
    }>;
    tauxRemboursement(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            global: {
                total: number;
                termines: number;
                taux: number;
            };
            parCollecteur: {
                collecteur: string;
                total: number;
                termines: number;
                taux: number;
            }[];
        };
    }>;
    evolutionRevenus(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            mois: string;
            commissions: number;
            padme: number;
            abonnements: number;
            total: number;
        }[];
    }>;
    clientsEligibles(): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            eligiblesPADME: {
                total: number;
                sansDossierEnCours: {
                    score: number;
                    telephone: string;
                    nom: string;
                    id: string;
                }[];
            };
            eligiblesMicroCredit: {
                total: number;
                sansCredit: {
                    id: string;
                    nom: string;
                    telephone: string;
                    score: number;
                }[];
            };
        };
    }>;
}
