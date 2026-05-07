import { AuthService } from './auth.service';
import { InscriptionDto } from './dto/inscription.dto';
import { VerifierOtpDto } from './dto/verifier-otp.dto';
import { CreerPinDto } from './dto/creer-pin.dto';
import { ConnexionDto } from './dto/connexion.dto';
import { RafraichirTokenDto } from './dto/rafraichir-token.dto';
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
    }, dto: CreerPinDto): Promise<{
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
    rafraichirToken(utilisateur: {
        id: string;
        telephone: string;
        role: any;
    }, _dto: RafraichirTokenDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    deconnexion(utilisateur: {
        id: string;
    }): Promise<{
        succes: boolean;
        message: string;
    }>;
}
