import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { InscriptionDto } from './dto/inscription.dto';
import { VerifierOtpDto } from './dto/verifier-otp.dto';
import { CreerPinDto } from './dto/creer-pin.dto';
import { ConnexionDto } from './dto/connexion.dto';
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
    creerPin(utilisateurId: string, dto: CreerPinDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    connexion(dto: ConnexionDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            role: import("@prisma/client").$Enums.Role;
            nom: string;
            accessToken: string;
            refreshToken: string;
        };
    }>;
    rafraichirToken(utilisateurId: string, telephone: string, role: Role): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    deconnexion(utilisateurId: string): Promise<{
        succes: boolean;
        message: string;
    }>;
    private genererTokens;
    private creerOTP;
}
