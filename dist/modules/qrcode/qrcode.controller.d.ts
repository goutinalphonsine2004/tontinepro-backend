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
            creeLe: Date;
            collecteurId: string;
            expireLe: Date;
            actif: boolean;
            codeQR: string;
        };
    }>;
    scanner(code: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            collecteur: {
                telephone: string;
                id: string;
                nom: string;
                role: import("@prisma/client").$Enums.Role;
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
            creeLe: Date;
            collecteurId: string;
            expireLe: Date;
            actif: boolean;
            codeQR: string;
        };
    }>;
}
export {};
