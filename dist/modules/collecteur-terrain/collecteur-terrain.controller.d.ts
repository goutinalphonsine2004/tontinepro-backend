import { CollecteurTerrainService } from './collecteur-terrain.service';
import { CheckInDto } from './dto/check-in.dto';
export declare class CollecteurTerrainController {
    private readonly service;
    constructor(service: CollecteurTerrainService);
    checkIn(u: {
        id: string;
    }, dto: CheckInDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            presenceId: string;
            distance: number;
            estValide: boolean;
        };
    }>;
    clientsDuJour(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            clients: {
                id: string;
                nom: string;
                telephone: string;
                kycVerifie: boolean;
                solde: number;
                montantJournalierFcfa: number;
                score: number;
                dejaVisite: boolean;
            }[];
            stats: {
                total: number;
                visites: number;
                restantes: number;
            };
        };
    }>;
    carteClients(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            nom: string;
            telephone: string;
            position: {
                latitude: number;
                longitude: number;
                dernierCheckIn: Date;
            } | null;
        }[];
    }>;
    mesPresences(u: {
        id: string;
    }, page?: string, limite?: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            presences: ({} & {
                id: string;
                creeLe: Date;
                clientId: string;
                agentId: string;
                latitude: number;
                longitude: number;
                distance: number;
                estValide: boolean;
            })[];
            total: number;
            page: number;
            pages: number;
        };
    }>;
    dashboardIndependant(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            agent: {
                id: string;
                nom: string;
                role: import("@prisma/client").$Enums.Role;
                soldeCommissionFcfa: number;
            };
            clientsActifs: number;
            commissionsCeMois: number;
            tauxCollecteMois: number;
            graphiqueRevenus: {
                mois: string;
                montantFcfa: number;
            }[];
            revenutsMicroCredits: number;
            abonnement: {
                plan: string;
                actif: boolean;
                prochainPaiement: Date;
            } | null;
        };
    }>;
    contactWhatsApp(u: {
        id: string;
    }, clientId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            clientId: string;
            nom: string;
            telephone: string;
            lienWhatsApp: string;
        };
    }>;
    monCollecteur(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            nom: string;
            telephone: string;
            region: string | null;
            kycVerifie: boolean;
            commissionPercent: number;
        } | null;
    }>;
}
