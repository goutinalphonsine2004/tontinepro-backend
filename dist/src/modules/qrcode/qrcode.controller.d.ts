import { Role } from '@prisma/client';
import { QrcodeService } from './qrcode.service';
declare class RegénérerDto {
    agentId: string;
}
export declare class QrcodeController {
    private service;
    constructor(service: QrcodeService);
    monCode(u: {
        id: string;
        role: Role;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            collecteurId: string;
            creeLe: Date;
            expireLe: Date;
            codeQR: string;
            actif: boolean;
        };
    }>;
    scanner(code: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            collecteur: {
                telephone: string;
                nom: string;
                role: import("@prisma/client").$Enums.Role;
                id: string;
                statut: import("@prisma/client").$Enums.StatutCompte;
                kycVerifie: boolean;
            };
            expireLe: Date;
        };
    }>;
    regenerer(dto: RegénérerDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            collecteurId: string;
            creeLe: Date;
            expireLe: Date;
            codeQR: string;
            actif: boolean;
        };
    }>;
}
export {};
