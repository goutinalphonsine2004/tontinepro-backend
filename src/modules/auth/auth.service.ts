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

const OTP_TYPE_INSCRIPTION = 'INSCRIPTION';
const OTP_TYPE_RESET_PIN = 'RESET_PIN';
const JWT_SCOPE_RESET_PIN = 'RESET_PIN';

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

    const { id: otpId, code } = await this.creerOTP(utilisateur.id, dto.telephone, OTP_TYPE_INSCRIPTION);
    await this.sms.envoyer(
      dto.telephone,
      `TontineBénin: Votre code de vérification est ${code}. Valable ${this.config.get('DUREE_OTP_MINUTES', 10)} min.`,
    );

    const donnees: Record<string, unknown> = { otpId, telephone: dto.telephone };
    if (this.config.get('NODE_ENV') === 'development') {
      donnees.otpTest = code;
      donnees.messageTest = '⚠️ Mode test - En production ce code ne sera pas visible';
    }

    return { succes: true, message: 'Code OTP envoyé par SMS', donnees };
  }

  // ─── Vérification OTP ─────────────────────────────────
  async verifierOtp(dto: VerifierOtpDto) {
    const otp = await this.prisma.codeOTP.findFirst({
      where: {
        telephone: dto.telephone,
        code: dto.code,
        type: OTP_TYPE_INSCRIPTION,
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
  async creerPin(utilisateurId: string, dto: CreerPinDto, req?: Request) {
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

    const session = await this.creerSession(utilisateurId, undefined, req);
    const tokens = await this.genererTokens(utilisateurId, utilisateur.telephone, utilisateur.role, session.id);
    return {
      succes: true,
      message: 'PIN créé avec succès. Compte activé.',
      donnees: { ...tokens, sessionId: session.id },
    };
  }

  // ─── Connexion ────────────────────────────────────────
  async connexion(dto: ConnexionDto, req?: Request) {
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

    const session = await this.creerSession(utilisateur.id, dto.deviceId, req);
    const tokens = await this.genererTokens(utilisateur.id, utilisateur.telephone, utilisateur.role, session.id);
    return {
      succes: true,
      message: 'Connexion réussie.',
      donnees: { ...tokens, sessionId: session.id, role: utilisateur.role, nom: utilisateur.nom },
    };
  }

  // ─── Demander réinitialisation PIN ───────────────────
  async demanderResetPin(dto: DemanderResetPinDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.telephone },
    });

    if (!utilisateur || utilisateur.statut === StatutCompte.BANNI) {
      throw new NotFoundException({
        message: 'Aucun compte actif ne correspond à ce numéro',
        code: 'COMPTE_INTROUVABLE',
      });
    }

    if (utilisateur.statut !== StatutCompte.ACTIF) {
      throw new ForbiddenException({
        message: 'Ce compte ne peut pas encore réinitialiser son PIN',
        code: 'COMPTE_INACTIF',
      });
    }

    const { id: otpId, code } = await this.creerOTP(utilisateur.id, dto.telephone, OTP_TYPE_RESET_PIN);
    await this.sms.envoyer(
      dto.telephone,
      `TontineBénin: Code de réinitialisation PIN ${code}. Valable ${this.config.get('DUREE_OTP_MINUTES', 10)} min.`,
    );

    const donnees: Record<string, unknown> = { otpId, telephone: dto.telephone };
    if (this.config.get('NODE_ENV') === 'development') {
      donnees.otpTest = code;
      donnees.messageTest = 'Mode test - En production ce code ne sera pas visible';
    }

    return { succes: true, message: 'Code de réinitialisation envoyé par SMS.', donnees };
  }

  // ─── Vérifier OTP reset PIN ──────────────────────────
  async verifierOtpResetPin(dto: VerifierOtpResetPinDto) {
    const otp = await this.prisma.codeOTP.findFirst({
      where: {
        telephone: dto.telephone,
        code: dto.code,
        type: OTP_TYPE_RESET_PIN,
        utilise: false,
        expireLe: { gt: new Date() },
      },
      include: { utilisateur: true },
    });

    if (!otp) {
      throw new BadRequestException({
        message: 'Code OTP invalide ou expiré',
        code: 'OTP_RESET_INVALIDE',
      });
    }

    if (otp.utilisateur.statut !== StatutCompte.ACTIF) {
      throw new ForbiddenException({
        message: 'Ce compte ne peut pas réinitialiser son PIN',
        code: 'COMPTE_INACTIF',
      });
    }

    await this.prisma.codeOTP.update({ where: { id: otp.id }, data: { utilise: true } });

    const tokenReset = this.jwt.sign(
      {
        sub: otp.utilisateurId,
        telephone: dto.telephone,
        role: otp.utilisateur.role,
        scope: JWT_SCOPE_RESET_PIN,
      },
      { expiresIn: '15m' },
    );

    return {
      succes: true,
      message: 'Code vérifié. Vous pouvez définir un nouveau PIN.',
      donnees: { tokenReset },
    };
  }

  // ─── Réinitialiser PIN ───────────────────────────────
  async reinitialiserPin(dto: ReinitialiserPinDto) {
    let payload: { sub?: string; telephone?: string; scope?: string };

    try {
      payload = await this.jwt.verifyAsync(dto.tokenReset);
    } catch {
      throw new UnauthorizedException({
        message: 'Token de réinitialisation invalide ou expiré',
        code: 'TOKEN_RESET_INVALIDE',
      });
    }

    if (!payload.sub || payload.scope !== JWT_SCOPE_RESET_PIN) {
      throw new UnauthorizedException({
        message: 'Token de réinitialisation invalide',
        code: 'TOKEN_RESET_INVALIDE',
      });
    }

    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
    });
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');
    if (utilisateur.statut !== StatutCompte.ACTIF) {
      throw new ForbiddenException({
        message: 'Ce compte ne peut pas réinitialiser son PIN',
        code: 'COMPTE_INACTIF',
      });
    }

    const pinHash = await bcrypt.hash(dto.nouveauPin, 10);
    await this.prisma.$transaction([
      this.prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: {
          pinHash,
          tentativesEchouees: 0,
          bloqueLe: null,
          deviceId: null,
        },
      }),
      this.prisma.sessionUtilisateur.updateMany({
        where: { utilisateurId: utilisateur.id, actif: true },
        data: { actif: false, revoqueLe: new Date() },
      }),
    ]);

    return { succes: true, message: 'PIN réinitialisé avec succès. Veuillez vous reconnecter.' };
  }

  // ─── Rafraîchir token ─────────────────────────────────
  async rafraichirToken(utilisateurId: string, telephone: string, role: Role, sessionId: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { statut: true },
    });
    if (!utilisateur || utilisateur.statut !== StatutCompte.ACTIF) {
      throw new UnauthorizedException('Session invalide');
    }

    await this.prisma.sessionUtilisateur.update({
      where: { id: sessionId },
      data: { derniereUtilisation: new Date() },
    });

    const tokens = await this.genererTokens(utilisateurId, telephone, role, sessionId);
    return { succes: true, message: 'Token rafraîchi.', donnees: { ...tokens, sessionId } };
  }

  // ─── Déconnexion ──────────────────────────────────────
  async deconnexion(utilisateurId: string, sessionId?: string) {
    if (sessionId) {
      await this.prisma.sessionUtilisateur.updateMany({
        where: { id: sessionId, utilisateurId },
        data: { actif: false, revoqueLe: new Date() },
      });
    }

    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { deviceId: null },
    });
    return { succes: true, message: 'Déconnexion réussie.' };
  }

  // ─── Déconnexion tous appareils ───────────────────────
  async deconnexionTout(utilisateurId: string, sessionCouranteId?: string) {
    const result = await this.prisma.sessionUtilisateur.updateMany({
      where: { utilisateurId, actif: true },
      data: { actif: false, revoqueLe: new Date() },
    });
    await this.prisma.utilisateur.update({ where: { id: utilisateurId }, data: { deviceId: null } });
    return {
      succes: true,
      message: `${result.count} session(s) révoquée(s).`,
      donnees: { sessionCouranteRevoquee: !!sessionCouranteId },
    };
  }

  // ─── Sessions utilisateur ─────────────────────────────
  async mesSessions(utilisateurId: string, sessionCouranteId?: string) {
    const sessions = await this.prisma.sessionUtilisateur.findMany({
      where: { utilisateurId },
      orderBy: { derniereUtilisation: 'desc' },
      select: {
        id: true,
        deviceId: true,
        userAgent: true,
        adresseIP: true,
        actif: true,
        derniereUtilisation: true,
        expireLe: true,
        revoqueLe: true,
        creeLe: true,
      },
    });
    return {
      succes: true,
      message: `${sessions.length} session(s).`,
      donnees: sessions.map((session) => ({
        ...session,
        sessionCourante: session.id === sessionCouranteId,
      })),
    };
  }

  async revoquerSession(utilisateurId: string, sessionId: string, sessionCouranteId?: string) {
    const result = await this.prisma.sessionUtilisateur.updateMany({
      where: { id: sessionId, utilisateurId, actif: true },
      data: { actif: false, revoqueLe: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException({
        message: 'Session introuvable ou déjà révoquée',
        code: 'SESSION_INTROUVABLE',
      });
    }

    return {
      succes: true,
      message: 'Session révoquée.',
      donnees: { sessionCouranteRevoquee: sessionId === sessionCouranteId },
    };
  }

  // ─── Helpers ──────────────────────────────────────────
  private async genererTokens(id: string, telephone: string, role: Role, sessionId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: id, telephone, role, sid: sessionId },
        { expiresIn: this.config.get('JWT_EXPIRES_IN', '24h') },
      ),
      this.jwt.signAsync(
        { sub: id, telephone, role, sid: sessionId },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async creerSession(utilisateurId: string, deviceId?: string, req?: Request) {
    const expireLe = new Date(Date.now() + this.dureeRefreshMs());
    return this.prisma.sessionUtilisateur.create({
      data: {
        utilisateurId,
        deviceId,
        userAgent: req?.headers['user-agent'],
        adresseIP: this.extraireAdresseIP(req),
        expireLe,
      },
    });
  }

  private dureeRefreshMs() {
    const valeur = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const match = valeur.match(/^(\d+)([dhm])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;

    const nombre = Number(match[1]);
    const unite = match[2];
    if (unite === 'd') return nombre * 24 * 60 * 60 * 1000;
    if (unite === 'h') return nombre * 60 * 60 * 1000;
    return nombre * 60 * 1000;
  }

  private extraireAdresseIP(req?: Request) {
    const forwarded = req?.headers['x-forwarded-for'];
    if (Array.isArray(forwarded)) return forwarded[0];
    if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();
    return req?.ip;
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
