import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { InscriptionDto } from './dto/inscription.dto';
import { VerifierOtpDto } from './dto/verifier-otp.dto';
import { CreerPinDto } from './dto/creer-pin.dto';
import { ConnexionDto } from './dto/connexion.dto';
import { DemanderResetPinDto } from './dto/demander-reset-pin.dto';
import { VerifierOtpResetPinDto } from './dto/verifier-otp-reset-pin.dto';
import { ReinitialiserPinDto } from './dto/reinitialiser-pin.dto';
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    private sms;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, sms: SmsService);
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
    creerPin(utilisateurId: string, dto: CreerPinDto, req?: Request): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            sessionId: string;
            accessToken: string;
            refreshToken: string;
        };
    }>;
    connexion(dto: ConnexionDto, req?: Request): Promise<{
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
    rafraichirToken(utilisateurId: string, telephone: string, role: Role, sessionId: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            sessionId: string;
            accessToken: string;
            refreshToken: string;
        };
    }>;
    deconnexion(utilisateurId: string, sessionId?: string): Promise<{
        succes: boolean;
        message: string;
    }>;
    deconnexionTout(utilisateurId: string, sessionCouranteId?: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            sessionCouranteRevoquee: boolean;
        };
    }>;
    mesSessions(utilisateurId: string, sessionCouranteId?: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            sessionCourante: boolean;
            deviceId: string | null;
            id: string;
            creeLe: Date;
            expireLe: Date;
            userAgent: string | null;
            adresseIP: string | null;
            actif: boolean;
            derniereUtilisation: Date;
            revoqueLe: Date | null;
        }[];
    }>;
    revoquerSession(utilisateurId: string, sessionId: string, sessionCouranteId?: string): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            sessionCouranteRevoquee: boolean;
        };
    }>;
    private genererTokens;
    private creerSession;
    private dureeRefreshMs;
    private extraireAdresseIP;
    private creerOTP;
}
