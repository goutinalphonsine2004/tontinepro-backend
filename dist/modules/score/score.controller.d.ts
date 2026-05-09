import { ScoreService } from './score.service';
export declare class ScoreController {
    private service;
    constructor(service: ScoreService);
    monScore(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            score: number;
            composantes: {
                tauxRegularite: number;
                pointsRegularite: number;
                ancienneteEnMois: number;
                pointsAnciennete: number;
                scoreRemboursement: number;
                pointsRemboursement: number;
                bonusObjectif: number;
                pointsBonus: number;
            };
            eligibleMicroCredit: boolean;
            eligiblePADME: boolean;
            plafondDisponible: number;
            seuilMicroCredit: number;
            seuilPADME: number;
            dernierCalcul: Date | null;
        };
    }>;
    evolution(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            mois: string;
            nbDepots: number;
            score: number;
        }[];
    }>;
    conseils(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            score: number;
            titre: string;
            conseils: string[];
            prochainSeuil: {
                seuil: number;
                label: string;
                pointsRestants: number;
            };
        };
    }>;
    projection(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            scoreActuel: number;
            gainMensuelEstime: number;
            projections: {
                mois: number;
                scoreEstime: number;
                etape: string;
            }[];
            etapes: {
                microCredit: {
                    seuil: number;
                    moisEstimes: number;
                    label: string;
                };
                padme: {
                    seuil: number;
                    moisEstimes: number;
                    label: string;
                };
                plafondMax: {
                    seuil: number;
                    moisEstimes: number;
                    label: string;
                };
            };
        };
    }>;
    calendrierRegularite(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            calendrier: {
                mois: string;
                label: string;
                jours: {
                    date: string;
                    cotise: boolean;
                    montant: number;
                }[];
                nbJoursCotises: number;
                nbJoursOuvres: number;
                tauxMois: number;
            }[];
            resume: {
                totalJours: number;
                totalCotises: number;
                tauxGlobal: number;
            };
        };
    }>;
}
