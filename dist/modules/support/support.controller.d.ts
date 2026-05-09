import { SupportService } from './support.service';
export declare class SupportController {
    private readonly service;
    constructor(service: SupportService);
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
    }, u: {
        id: string;
    }): Promise<{
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
    modifierFAQ(id: string, dto: any): Promise<{
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
