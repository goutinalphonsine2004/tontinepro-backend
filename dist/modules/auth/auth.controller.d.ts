import type { Request } from 'express';
import { AuthService } from './auth.service';
import { InscriptionDto } from './dto/inscription.dto';
import { VerifierOtpDto } from './dto/verifier-otp.dto';
import { CreerPinDto } from './dto/creer-pin.dto';
import { ConnexionDto } from './dto/connexion.dto';
import { RafraichirTokenDto } from './dto/rafraichir-token.dto';
import { DemanderResetPinDto } from './dto/demander-reset-pin.dto';
import { VerifierOtpResetPinDto } from './dto/verifier-otp-reset-pin.dto';
import { ReinitialiserPinDto } from './dto/reinitialiser-pin.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    inscription(dto: InscriptionDto): Promise<{
        succes: boolean;
        message: string;
        donnees: Record<string, unknown>;
    }>;
    verifierOtp(dto: VerifierOtpDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            tokenTemporaire: string;
        };
    }>;
    creerPin(utilisateur: {
        id: string;
    }, dto: CreerPinDto, req: Request): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            sessionId: string;
            accessToken: string;
            refreshToken: string;
        };
    }>;
    connexion(dto: ConnexionDto, req: Request): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            sessionId: string;
            role: import("@prisma/client").$Enums.Role;
            nom: string;
            accessToken: string;
            refreshToken: string;
        };
    }>;
    demanderResetPin(dto: DemanderResetPinDto): Promise<{
        succes: boolean;
        message: string;
        donnees: Record<string, unknown>;
    }>;
    verifierOtpResetPin(dto: VerifierOtpResetPinDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            tokenReset: string;
        };
    }>;
    reinitialiserPin(dto: ReinitialiserPinDto): Promise<{
        succes: boolean;
        message: string;
    }>;
    rafraichirToken(utilisateur: {
        id: string;
        telephone: string;
        role: any;
        sessionId: string;
        refreshTokenBrut?: string;
    }, _dto: RafraichirTokenDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            sessionId: string;
            accessToken: string;
            refreshToken: string;
        };
    }>;
    deconnexion(utilisateur: {
        id: string;
        sessionId?: string;
    }): Promise<{
        succes: boolean;
        message: string;
    }>;
    deconnexionTout(utilisateur: {
        id: string;
        sessionId?: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            sessionCouranteRevoquee: boolean;
        };
    }>;
    mesSessions(utilisateur: {
        id: string;
        sessionId?: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            sessionCourante: boolean;
            id: string;
            expireLe: Date;
            creeLe: Date;
            deviceId: string | null;
            userAgent: string | null;
            adresseIP: string | null;
            actif: boolean;
            derniereUtilisation: Date;
            revoqueLe: Date | null;
        }[];
    }>;
    revoquerSession(utilisateur: {
        id: string;
        sessionId?: string;
    }, sessionId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            sessionCouranteRevoquee: boolean;
        };
    }>;
    enregistrerAppareil(u: {
        id: string;
    }, dto: any): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            appareilId: string;
            deviceId: string;
            nomAppareil: string | null;
        };
    }>;
    connexionBiometrique(dto: any, req: Request): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            accessToken: string;
            utilisateur: {
                id: string;
                nom: string;
                role: import("@prisma/client").$Enums.Role;
            };
        };
    }>;
    mesAppareils(u: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            id: string;
            creeLe: Date;
            deviceId: string;
            nomAppareil: string | null;
            modeleAppareil: string | null;
            systemeExploitation: string | null;
            derniereAuthentification: Date | null;
        }[];
    }>;
    revoquerAppareil(u: {
        id: string;
    }, appareilId: string): Promise<{
        succes: boolean;
        message: string;
    }>;
    connexionsSuspectes(page: number, limite: number): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            alertes: {
                utilisateur: {
                    id: string;
                    nom: string;
                    telephone: string;
                    role: string;
                };
                nbrIPs: number;
                ips: string[];
                derniereSession: Date;
                derniereIP: string;
                suspicion: string;
            }[];
            total: number;
            page: number;
            pages: number;
        };
    }>;
}
