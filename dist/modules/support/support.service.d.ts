import { PrismaService } from '../../prisma/prisma.service';
export declare class SupportService {
    private prisma;
    constructor(prisma: PrismaService);
    listerFAQ(categorie?: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            categories: string[];
            articles: {
                id: string;
                creeLe: Date;
                misAJourLe: Date;
                actif: boolean;
                categorie: string;
                question: string;
                reponse: string;
                ordre: number;
                creePar: string | null;
            }[];
        };
    }>;
    creerFAQ(dto: {
        categorie: string;
        question: string;
        reponse: string;
        ordre?: number;
    }, adminId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            actif: boolean;
            categorie: string;
            question: string;
            reponse: string;
            ordre: number;
            creePar: string | null;
        };
    }>;
    modifierFAQ(id: string, dto: Partial<{
        categorie: string;
        question: string;
        reponse: string;
        ordre: number;
        actif: boolean;
    }>): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            misAJourLe: Date;
            actif: boolean;
            categorie: string;
            question: string;
            reponse: string;
            ordre: number;
            creePar: string | null;
        };
    }>;
    supprimerFAQ(id: string): Promise<{
        succes: boolean;
        message: string;
    }>;
}
