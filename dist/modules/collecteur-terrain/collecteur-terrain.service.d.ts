import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { CheckInDto } from './dto/check-in.dto';
export declare class CollecteurTerrainService {
    private prisma;
    private sms;
    constructor(prisma: PrismaService, sms: SmsService);
    checkIn(agentId: string, dto: CheckInDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            presenceId: string;
            distance: number;
            estValide: boolean;
        };
    }>;
    clientsDuJour(agentId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            clients: {
                id: string;
                nom: string;
                telephone: string;
                kycVerifie: boolean;
                solde: number;
                montantJournalier: number;
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
    carteClients(agentId: string): Promise<{
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
    mesPresences(agentId: string, page?: number, limite?: number): Promise<{
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
    dashboardIndependant(agentId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            agent: {
                id: string;
                nom: string;
                role: import("@prisma/client").$Enums.Role;
                soldeCommission: number;
            };
            clientsActifs: number;
            commissionsCeMois: number;
            tauxCollecteMois: number;
            graphiqueRevenus: {
                mois: string;
                montant: number;
            }[];
            revenutsMicroCredits: number;
            abonnement: {
                plan: string;
                actif: boolean;
                prochainPaiement: Date;
            } | null;
        };
    }>;
    contactWhatsApp(agentId: string, clientId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            clientId: string;
            nom: string;
            telephone: string;
            lienWhatsApp: string;
        };
    }>;
    monCollecteur(clientId: string): Promise<{
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
