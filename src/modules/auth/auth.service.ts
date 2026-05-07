import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role, StatutCompte } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { InscriptionDto } from './dto/inscription.dto';
import { VerifierOtpDto } from './dto/verifier-otp.dto';
import { CreerPinDto } from './dto/creer-pin.dto';
import { ConnexionDto } from './dto/connexion.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private sms: SmsService,
  ) {}

  // ─── Inscription ──────────────────────────────────────
  async inscription(dto: InscriptionDto) {
    const existant = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.telephone },
    });
    if (existant) {
      throw new ConflictException({
        message: 'Ce numéro de téléphone est déjà inscrit',
        code: 'TELEPHONE_EXISTANT',
      });
    }

    const roleAutorise: Role[] = [Role.CLIENT, Role.INDEPENDANT, Role.AGENT];
    const role = dto.role && roleAutorise.includes(dto.role) ? dto.role : Role.CLIENT;

    const utilisateur = await this.prisma.utilisateur.create({
      data: { telephone: dto.telephone, nom: dto.nom, role, statut: StatutCompte.EN_ATTENTE },
    });

    const { id: otpId, code } = await this.creerOTP(utilisateur.id, dto.telephone, 'INSCRIPTION');
    await this.sms.envoyer(
      dto.telephone,
      `TontinePro: Votre code de vérification est ${code}. Valable ${this.config.get('DUREE_OTP_MINUTES', 10)} min.`,
    );

    const donnees: Record<string, unknown> = { otpId, telephone: dto.telephone };
    if (this.config.get('NODE_ENV') === 'development') donnees.otp = code;

    return { succes: true, message: 'Inscription initiée. Code OTP envoyé par SMS.', donnees };
  }

  // ─── Vérification OTP ─────────────────────────────────
  async verifierOtp(dto: VerifierOtpDto) {
    const otp = await this.prisma.codeOTP.findFirst({
      where: {
        telephone: dto.telephone,
        code: dto.code,
        type: 'INSCRIPTION',
        utilise: false,
        expireLe: { gt: new Date() },
      },
      include: { utilisateur: true },
    });

    if (!otp) {
      throw new BadRequestException({
        message: 'Code OTP invalide ou expiré',
        code: 'OTP_INVALIDE',
      });
    }

    await this.prisma.codeOTP.update({ where: { id: otp.id }, data: { utilise: true } });

    // Token temporaire (1h) pour la création du PIN
    const tokenTemporaire = this.jwt.sign(
      { sub: otp.utilisateurId, telephone: dto.telephone, role: otp.utilisateur.role, scope: 'ONBOARDING' },
      { expiresIn: '1h' },
    );

    return {
      succes: true,
      message: 'Numéro de téléphone vérifié avec succès.',
      donnees: { tokenTemporaire },
    };
  }

  // ─── Créer PIN ────────────────────────────────────────
  async creerPin(utilisateurId: string, dto: CreerPinDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');

    if (utilisateur.statut === StatutCompte.ACTIF && utilisateur.pinHash) {
      throw new BadRequestException({
        message: 'Un PIN est déjà défini. Utilisez la réinitialisation de PIN.',
        code: 'PIN_DEJA_DEFINI',
      });
    }

    const pinHash = await bcrypt.hash(dto.pin, 10);
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { pinHash, statut: StatutCompte.ACTIF },
    });

    const tokens = await this.genererTokens(utilisateurId, utilisateur.telephone, utilisateur.role);
    return {
      succes: true,
      message: 'PIN créé avec succès. Compte activé.',
      donnees: tokens,
    };
  }

  // ─── Connexion ────────────────────────────────────────
  async connexion(dto: ConnexionDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.telephone },
    });
    if (!utilisateur) {
      throw new UnauthorizedException({
        message: 'Numéro de téléphone ou PIN incorrect',
        code: 'IDENTIFIANTS_INVALIDES',
      });
    }

    if (utilisateur.statut === StatutCompte.SUSPENDU) {
      throw new ForbiddenException({
        message: 'Votre compte est suspendu. Contactez le support.',
        code: 'COMPTE_SUSPENDU',
      });
    }
    if (utilisateur.statut === StatutCompte.BANNI) {
      throw new ForbiddenException({
        message: 'Votre compte a été banni.',
        code: 'COMPTE_BANNI',
      });
    }
    if (utilisateur.statut !== StatutCompte.ACTIF) {
      throw new ForbiddenException({
        message: 'Compte non activé. Veuillez vérifier votre OTP et créer votre PIN.',
        code: 'COMPTE_INACTIF',
      });
    }

    // Vérifier si bloqué après trop de tentatives
    const maxTentatives = parseInt(this.config.get('MAX_TENTATIVES_PIN', '3'));
    if (utilisateur.bloqueLe && utilisateur.bloqueLe > new Date()) {
      const minutesRestantes = Math.ceil((utilisateur.bloqueLe.getTime() - Date.now()) / 60000);
      throw new ForbiddenException({
        message: `Compte temporairement bloqué. Réessayez dans ${minutesRestantes} minute(s).`,
        code: 'COMPTE_BLOQUE',
      });
    }

    if (!utilisateur.pinHash) {
      throw new BadRequestException({ message: 'PIN non défini', code: 'PIN_NON_DEFINI' });
    }

    const pinValide = await bcrypt.compare(dto.pin, utilisateur.pinHash);
    if (!pinValide) {
      const tentatives = utilisateur.tentativesEchouees + 1;
      const data: Record<string, unknown> = { tentativesEchouees: tentatives };
      if (tentatives >= maxTentatives) {
        data.bloqueLe = new Date(Date.now() + 30 * 60 * 1000); // bloqué 30 min
      }
      await this.prisma.utilisateur.update({ where: { id: utilisateur.id }, data });

      const restantes = maxTentatives - tentatives;
      throw new UnauthorizedException({
        message:
          restantes > 0
            ? `PIN incorrect. ${restantes} tentative(s) restante(s).`
            : 'Compte bloqué après trop de tentatives.',
        code: 'PIN_INCORRECT',
      });
    }

    // Réinitialiser les tentatives et mettre à jour le deviceId
    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { tentativesEchouees: 0, bloqueLe: null, deviceId: dto.deviceId ?? utilisateur.deviceId },
    });

    const tokens = await this.genererTokens(utilisateur.id, utilisateur.telephone, utilisateur.role);
    return {
      succes: true,
      message: 'Connexion réussie.',
      donnees: { ...tokens, role: utilisateur.role, nom: utilisateur.nom },
    };
  }

  // ─── Rafraîchir token ─────────────────────────────────
  async rafraichirToken(utilisateurId: string, telephone: string, role: Role) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { statut: true },
    });
    if (!utilisateur || utilisateur.statut !== StatutCompte.ACTIF) {
      throw new UnauthorizedException('Session invalide');
    }
    const tokens = await this.genererTokens(utilisateurId, telephone, role);
    return { succes: true, message: 'Token rafraîchi.', donnees: tokens };
  }

  // ─── Déconnexion ──────────────────────────────────────
  async deconnexion(utilisateurId: string) {
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { deviceId: null },
    });
    return { succes: true, message: 'Déconnexion réussie.' };
  }

  // ─── Helpers ──────────────────────────────────────────
  private async genererTokens(id: string, telephone: string, role: Role) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: id, telephone, role },
        { expiresIn: this.config.get('JWT_EXPIRES_IN', '24h') },
      ),
      this.jwt.signAsync(
        { sub: id, telephone, role },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async creerOTP(utilisateurId: string, telephone: string, type: string) {
    // Invalider les OTP précédents du même type
    await this.prisma.codeOTP.updateMany({
      where: { utilisateurId, type, utilise: false },
      data: { utilise: true },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expireLe = new Date(
      Date.now() + parseInt(this.config.get('DUREE_OTP_MINUTES', '10')) * 60 * 1000,
    );

    const otp = await this.prisma.codeOTP.create({
      data: { utilisateurId, telephone, code, type, expireLe },
    });
    return otp;
  }
}
