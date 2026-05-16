import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role, StatutCompte } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
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
  private readonly logger = new Logger(AuthService.name);
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

    const roleAutorise: Role[] = [Role.CLIENT, Role.INDEPENDANT, Role.AGENT];
    const role =
      dto.role && roleAutorise.includes(dto.role) ? dto.role : Role.CLIENT;

    if (existant) {
      const reprise = await this.tenterRepriseInscription(
        existant,
        dto.telephone,
        dto.nom?.trim(),
        role,
      );
      if (reprise) return reprise;

      throw new ConflictException({
        message: existant.pinHash
          ? 'Ce numéro est déjà actif. Connectez-vous avec votre PIN.'
          : 'Ce numéro de téléphone est déjà inscrit',
        code: 'TELEPHONE_EXISTANT',
      });
    }

    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        telephone: dto.telephone,
        nom: dto.nom,
        role,
        statut: StatutCompte.EN_ATTENTE,
      },
    });

    return this.envoyerOtpInscription(
      utilisateur.id,
      dto.telephone,
      false,
      dto.nom,
      role,
    );
  }

  /** Renvoie l'OTP si l'inscription n'est pas terminée (pas de PIN). */
  async renvoyerOtpInscription(telephone: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { telephone },
    });
    if (!utilisateur) {
      throw new NotFoundException({
        message: 'Aucun compte trouvé pour ce numéro. Faites une inscription.',
        code: 'COMPTE_INTROUVABLE',
      });
    }

    const reprise = await this.tenterRepriseInscription(utilisateur, telephone);
    if (reprise) return reprise;

    throw new ConflictException({
      message:
        'Ce numéro a déjà un PIN. Utilisez la connexion ou « PIN oublié ».',
      code: 'COMPTE_DEJA_ACTIF',
    });
  }

  /** Reprend l'inscription si pas de PIN (OTP ou création PIN non terminés). */
  private async tenterRepriseInscription(
    utilisateur: {
      id: string;
      nom: string;
      role: Role;
      statut: StatutCompte;
      pinHash: string | null;
    },
    telephone: string,
    nom?: string,
    role?: Role,
  ) {
    if (
      utilisateur.statut === StatutCompte.SUSPENDU ||
      utilisateur.statut === StatutCompte.BANNI
    ) {
      throw new ForbiddenException({
        message: 'Ce compte est suspendu ou banni. Contactez le support.',
        code: 'COMPTE_SUSPENDU',
      });
    }

    if (utilisateur.pinHash) {
      return null;
    }

    const roleFinal = role ?? utilisateur.role;
    if (nom) {
      await this.prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: { nom, role: roleFinal },
      });
    }

    return this.envoyerOtpInscription(
      utilisateur.id,
      telephone,
      true,
      nom || utilisateur.nom,
      roleFinal,
    );
  }

  /** Envoie (ou renvoie) l'OTP d'inscription — utilisé à la création et à la reprise. */
  private async envoyerOtpInscription(
    utilisateurId: string,
    telephone: string,
    reprise: boolean,
    nom?: string,
    role?: Role,
  ) {
    const { id: otpId, code } = await this.creerOTP(
      utilisateurId,
      telephone,
      OTP_TYPE_INSCRIPTION,
    );
    await this.sms.envoyer(
      telephone,
      `TontineBénin: Votre code de vérification est ${code}. Valable ${this.config.get('DUREE_OTP_MINUTES', 10)} min.`,
    );

    const donnees: Record<string, unknown> = {
      otpId,
      telephone,
      reprise,
      nom,
      role,
    };
    if (this.config.get('NODE_ENV') === 'development') {
      donnees.otpTest = code;
      donnees.messageTest =
        '⚠️ Mode test - En production ce code ne sera pas visible';
    }

    return {
      succes: true,
      message: reprise
        ? 'Nouveau code OTP envoyé. Terminez la création de votre PIN.'
        : 'Code OTP envoyé par SMS',
      donnees,
    };
  }

  // ─── Vérification OTP ────────────────────────────────────
  async verifierOtp(dto: VerifierOtpDto) {
    const MAX_TENTATIVES_OTP = 3;

    const otp = await this.prisma.codeOTP.findFirst({
      where: {
        telephone: dto.telephone,
        type: OTP_TYPE_INSCRIPTION,
        utilise: false,
        expireLe: { gt: new Date() },
      },
      include: { utilisateur: true },
      orderBy: { creeLe: 'desc' },
    });

    // OTP introuvable ou déjà épuisé en tentatives
    if (!otp) {
      throw new BadRequestException({
        message: 'Code OTP invalide ou expiré',
        code: 'OTP_INVALIDE',
      });
    }

    // Vérifier si déjà bloqué par trop de tentatives
    if (otp.tentatives >= MAX_TENTATIVES_OTP) {
      await this.prisma.codeOTP.update({
        where: { id: otp.id },
        data: { utilise: true },
      });
      throw new BadRequestException({
        message:
          'Code OTP invalide après 3 tentatives. Demandez un nouveau code.',
        code: 'OTP_TROP_DE_TENTATIVES',
      });
    }

    // Code incorrect
    if (!(await this.verifierCodeOTP(dto.code, otp.code))) {
      const tentatives = otp.tentatives + 1;
      const restantes = MAX_TENTATIVES_OTP - tentatives;

      if (restantes <= 0) {
        // Invalider l'OTP définitivement
        await this.prisma.codeOTP.update({
          where: { id: otp.id },
          data: { utilise: true, tentatives },
        });
        throw new BadRequestException({
          message:
            'Code OTP invalide. Code bloqué après 3 tentatives. Demandez un nouveau code.',
          code: 'OTP_TROP_DE_TENTATIVES',
        });
      }

      await this.prisma.codeOTP.update({
        where: { id: otp.id },
        data: { tentatives },
      });
      throw new BadRequestException({
        message: `Code OTP incorrect. ${restantes} tentative(s) restante(s).`,
        code: 'OTP_INVALIDE',
        donnees: { restantes },
      } as any);
    }

    // Code correct → invalider l'OTP
    await this.prisma.codeOTP.update({
      where: { id: otp.id },
      data: { utilise: true },
    });

    // Token temporaire (1h) pour la création du PIN
    const tokenTemporaire = this.jwt.sign(
      {
        sub: otp.utilisateurId,
        telephone: dto.telephone,
        role: otp.utilisateur.role,
        scope: 'ONBOARDING',
      },
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
    const tokens = await this.genererTokens(
      utilisateurId,
      utilisateur.telephone,
      utilisateur.role,
      session.id,
    );
    return {
      succes: true,
      message: 'PIN créé avec succès. Compte activé.',
      donnees: { ...tokens, sessionId: session.id },
    };
  }

  // ─── Connexion ────────────────────────────────────────
  async connexion(dto: ConnexionDto, req?: Request) {
    try {
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
          message:
            'Compte non activé. Veuillez vérifier votre OTP et créer votre PIN.',
          code: 'COMPTE_INACTIF',
        });
      }

      // Vérifier si bloqué après trop de tentatives
      const maxTentatives = parseInt(
        this.config.get('MAX_TENTATIVES_PIN', '3'),
      );
      if (utilisateur.bloqueLe && utilisateur.bloqueLe > new Date()) {
        const minutesRestantes = Math.ceil(
          (utilisateur.bloqueLe.getTime() - Date.now()) / 60000,
        );
        throw new ForbiddenException({
          message: `Compte temporairement bloqué. Réessayez dans ${minutesRestantes} minute(s).`,
          code: 'COMPTE_BLOQUE',
        });
      }

      if (!utilisateur.pinHash) {
        throw new BadRequestException({
          message: 'PIN non défini',
          code: 'PIN_NON_DEFINI',
        });
      }

      const pinValide = await bcrypt.compare(dto.pin, utilisateur.pinHash);
      if (!pinValide) {
        const tentatives = utilisateur.tentativesEchouees + 1;
        const data: Record<string, unknown> = {
          tentativesEchouees: tentatives,
        };
        if (tentatives >= maxTentatives) {
          data.bloqueLe = new Date(Date.now() + 30 * 60 * 1000); // bloqué 30 min
        }
        await this.prisma.utilisateur.update({
          where: { id: utilisateur.id },
          data,
        });

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
        data: {
          tentativesEchouees: 0,
          bloqueLe: null,
          deviceId: dto.deviceId ?? utilisateur.deviceId,
        },
      });

      this.logger.log(
        `[AUTH] Connexion utilisateur ${utilisateur.nom} (+${utilisateur.telephone})`,
      );
      const session = await this.creerSession(
        utilisateur.id,
        dto.deviceId,
        req,
      );
      const tokens = await this.genererTokens(
        utilisateur.id,
        utilisateur.telephone,
        utilisateur.role,
        session.id,
      );

      return {
        succes: true,
        message: 'Connexion réussie.',
        donnees: {
          ...tokens,
          sessionId: session.id,
          role: utilisateur.role,
          nom: utilisateur.nom,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur connexion: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
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

    const { id: otpId, code } = await this.creerOTP(
      utilisateur.id,
      dto.telephone,
      OTP_TYPE_RESET_PIN,
    );
    await this.sms.envoyer(
      dto.telephone,
      `TontineBénin: Code de réinitialisation PIN ${code}. Valable ${this.config.get('DUREE_OTP_MINUTES', 10)} min.`,
    );

    const donnees: Record<string, unknown> = {
      otpId,
      telephone: dto.telephone,
    };
    if (this.config.get('NODE_ENV') === 'development') {
      donnees.otpTest = code;
      donnees.messageTest =
        'Mode test - En production ce code ne sera pas visible';
    }

    return {
      succes: true,
      message: 'Code de réinitialisation envoyé par SMS.',
      donnees,
    };
  }

  // ─── Vérifier OTP reset PIN ───────────────────────
  async verifierOtpResetPin(dto: VerifierOtpResetPinDto) {
    const MAX_TENTATIVES_OTP = 3;

    const otp = await this.prisma.codeOTP.findFirst({
      where: {
        telephone: dto.telephone,
        type: OTP_TYPE_RESET_PIN,
        utilise: false,
        expireLe: { gt: new Date() },
      },
      include: { utilisateur: true },
      orderBy: { creeLe: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException({
        message: 'Code OTP invalide ou expiré',
        code: 'OTP_RESET_INVALIDE',
      });
    }

    // Vérifier si déjà bloqué
    if (otp.tentatives >= MAX_TENTATIVES_OTP) {
      await this.prisma.codeOTP.update({
        where: { id: otp.id },
        data: { utilise: true },
      });
      throw new BadRequestException({
        message:
          'Code OTP invalide après 3 tentatives. Demandez un nouveau code de réinitialisation.',
        code: 'OTP_TROP_DE_TENTATIVES',
      });
    }

    // Code incorrect
    if (!(await this.verifierCodeOTP(dto.code, otp.code))) {
      const tentatives = otp.tentatives + 1;
      const restantes = MAX_TENTATIVES_OTP - tentatives;

      if (restantes <= 0) {
        await this.prisma.codeOTP.update({
          where: { id: otp.id },
          data: { utilise: true, tentatives },
        });
        throw new BadRequestException({
          message:
            'Code OTP bloqué après 3 tentatives. Demandez un nouveau code de réinitialisation.',
          code: 'OTP_TROP_DE_TENTATIVES',
        });
      }

      await this.prisma.codeOTP.update({
        where: { id: otp.id },
        data: { tentatives },
      });
      throw new BadRequestException({
        message: `Code OTP incorrect. ${restantes} tentative(s) restante(s).`,
        code: 'OTP_RESET_INVALIDE',
        donnees: { restantes },
      } as any);
    }

    if (otp.utilisateur.statut !== StatutCompte.ACTIF) {
      throw new ForbiddenException({
        message: 'Ce compte ne peut pas réinitialiser son PIN',
        code: 'COMPTE_INACTIF',
      });
    }

    await this.prisma.codeOTP.update({
      where: { id: otp.id },
      data: { utilise: true },
    });

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

    return {
      succes: true,
      message: 'PIN réinitialisé avec succès. Veuillez vous reconnecter.',
    };
  }

  // ─── Rafraîchir token ─────────────────────────────────
  async rafraichirToken(
    utilisateurId: string,
    telephone: string,
    role: Role,
    sessionId: string,
    refreshTokenRecu?: string,
  ) {
    const [utilisateur, session] = await Promise.all([
      this.prisma.utilisateur.findUnique({
        where: { id: utilisateurId },
        select: { statut: true },
      }),
      this.prisma.sessionUtilisateur.findUnique({ where: { id: sessionId } }),
    ]);

    if (!utilisateur || utilisateur.statut !== StatutCompte.ACTIF) {
      throw new UnauthorizedException('Session invalide');
    }
    if (!session || !session.actif) {
      throw new UnauthorizedException('Session expirée ou révoquée');
    }

    // ✅ Blacklist : vérifier que le refresh token correspond au hash stocké en BD
    if (session.refreshTokenHash && refreshTokenRecu) {
      const tokenValide = await bcrypt.compare(
        refreshTokenRecu,
        session.refreshTokenHash,
      );
      if (!tokenValide) {
        // Probable rejeu de token volé → révoquer toutes les sessions
        await this.prisma.sessionUtilisateur.updateMany({
          where: { utilisateurId, actif: true },
          data: { actif: false, revoqueLe: new Date(), refreshTokenHash: null },
        });
        throw new UnauthorizedException({
          message:
            'Token de rafraîchissement invalide. Toutes vos sessions ont été révoquées.',
          code: 'TOKEN_REJEU_DETECTE',
        });
      }
    }

    await this.prisma.sessionUtilisateur.update({
      where: { id: sessionId },
      data: { derniereUtilisation: new Date() },
    });

    const tokens = await this.genererTokens(
      utilisateurId,
      telephone,
      role,
      sessionId,
    );
    return {
      succes: true,
      message: 'Token rafraîchi.',
      donnees: { ...tokens, sessionId },
    };
  }

  // ─── Déconnexion ──────────────────────────────────────
  async deconnexion(utilisateurId: string, sessionId?: string) {
    if (sessionId) {
      // ✅ Blacklist : effacer le refreshTokenHash pour invalider définitivement le token
      await this.prisma.sessionUtilisateur.updateMany({
        where: { id: sessionId, utilisateurId },
        data: { actif: false, revoqueLe: new Date(), refreshTokenHash: null },
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
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { deviceId: null },
    });
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

  async revoquerSession(
    utilisateurId: string,
    sessionId: string,
    sessionCouranteId?: string,
  ) {
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
  private async genererTokens(
    id: string,
    telephone: string,
    role: Role,
    sessionId: string,
  ) {
    const refreshSecret = this.secretRefreshJwt();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: id, telephone, role, sid: sessionId },
        { expiresIn: this.config.get('JWT_EXPIRES_IN', '24h') },
      ),
      this.jwt.signAsync(
        { sub: id, telephone, role, sid: sessionId },
        {
          secret: refreshSecret,
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      ),
    ]);

    // ✅ Blacklist : stocker le hash du refresh token en BD
    const refreshTokenHash = await bcrypt.hash(refreshToken, 8);
    await this.prisma.sessionUtilisateur.update({
      where: { id: sessionId },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }

  private secretRefreshJwt() {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET');
    if (!secret && this.config.get<string>('NODE_ENV') === 'production') {
      throw new Error('JWT_REFRESH_SECRET est obligatoire en production');
    }
    return secret ?? 'dev-refresh-secret-change-me';
  }

  private async creerSession(
    utilisateurId: string,
    deviceId?: string,
    req?: Request,
  ) {
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

  private async creerOTP(
    utilisateurId: string,
    telephone: string,
    type: string,
  ) {
    // Invalider les OTP précédents du même type
    await this.prisma.codeOTP.updateMany({
      where: { utilisateurId, type, utilise: false },
      data: { utilise: true },
    });

    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expireLe = new Date(
      Date.now() +
        parseInt(this.config.get('DUREE_OTP_MINUTES', '10')) * 60 * 1000,
    );

    const otp = await this.prisma.codeOTP.create({
      data: { utilisateurId, telephone, code: codeHash, type, expireLe },
    });
    return { ...otp, code };
  }

  private async verifierCodeOTP(codeRecu: string, codeStocke: string) {
    if (codeStocke.startsWith('$2')) {
      return bcrypt.compare(codeRecu, codeStocke);
    }
    return codeRecu === codeStocke;
  }

  // ─── POST /auth/biometrique/enregistrer ───────────
  async enregistrerAppareilBiometrique(
    utilisateurId: string,
    dto: {
      deviceId: string;
      empreinteToken: string;
      nomAppareil?: string;
      modeleAppareil?: string;
      systemeExploitation?: string;
    },
  ) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { id: true, nom: true, statut: true },
    });
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');
    if (utilisateur.statut !== StatutCompte.ACTIF) {
      throw new ForbiddenException({
        message: 'Compte non actif',
        code: 'COMPTE_INACTIF',
      });
    }

    const empreinteHash = await bcrypt.hash(dto.empreinteToken, 10);

    const appareil = await this.prisma.appareilBiometrique.upsert({
      where: {
        utilisateurId_deviceId: { utilisateurId, deviceId: dto.deviceId },
      },
      create: {
        utilisateurId,
        deviceId: dto.deviceId,
        empreinteHash,
        nomAppareil: dto.nomAppareil,
        modeleAppareil: dto.modeleAppareil,
        systemeExploitation: dto.systemeExploitation,
        actif: true,
      },
      update: {
        empreinteHash,
        nomAppareil: dto.nomAppareil,
        modeleAppareil: dto.modeleAppareil,
        actif: true,
      },
    });

    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { empreinteActive: true },
    });

    return {
      succes: true,
      message:
        'Appareil biométrique enregistré. Connexion par empreinte activée.',
      donnees: {
        appareilId: appareil.id,
        deviceId: appareil.deviceId,
        nomAppareil: appareil.nomAppareil,
      },
    };
  }

  // ─── POST /auth/biometrique/connexion ─────────────
  async connexionBiometrique(
    dto: { telephone: string; deviceId: string; empreinteToken: string },
    req: Request,
  ) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.telephone },
      select: {
        id: true,
        telephone: true,
        nom: true,
        role: true,
        statut: true,
        empreinteActive: true,
      },
    });
    if (!utilisateur)
      throw new UnauthorizedException({
        message: 'Identifiants invalides',
        code: 'UTILISATEUR_INTROUVABLE',
      });
    if (utilisateur.statut === StatutCompte.BANNI)
      throw new ForbiddenException({
        message: 'Compte banni',
        code: 'COMPTE_BANNI',
      });
    if (!utilisateur.empreinteActive)
      throw new ForbiddenException({
        message: 'Biométrie non activée',
        code: 'BIOMETRIE_INACTIVE',
      });

    const appareil = await this.prisma.appareilBiometrique.findUnique({
      where: {
        utilisateurId_deviceId: {
          utilisateurId: utilisateur.id,
          deviceId: dto.deviceId,
        },
      },
    });
    if (!appareil || !appareil.actif)
      throw new UnauthorizedException({
        message: 'Appareil non reconnu',
        code: 'APPAREIL_INCONNU',
      });

    const valide = await bcrypt.compare(
      dto.empreinteToken,
      appareil.empreinteHash,
    );
    if (!valide)
      throw new UnauthorizedException({
        message: 'Empreinte invalide',
        code: 'EMPREINTE_INVALIDE',
      });

    await this.prisma.appareilBiometrique.update({
      where: { id: appareil.id },
      data: { derniereAuthentification: new Date() },
    });

    const expireLe = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await this.prisma.sessionUtilisateur.create({
      data: {
        utilisateurId: utilisateur.id,
        deviceId: dto.deviceId,
        adresseIP: (req as Request & { ip?: string }).ip,
        expireLe,
        actif: true,
      },
    });

    const payload = {
      sub: utilisateur.id,
      telephone: utilisateur.telephone,
      role: utilisateur.role,
      sessionId: session.id,
    };
    const accessToken = this.jwt.sign(payload, { expiresIn: '24h' });

    return {
      succes: true,
      message: `Connexion biométrique réussie. Bienvenue ${utilisateur.nom}.`,
      donnees: {
        accessToken,
        utilisateur: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          role: utilisateur.role,
        },
      },
    };
  }

  // ─── GET /auth/biometrique/appareils ──────────────
  async mesAppareils(utilisateurId: string) {
    const appareils = await this.prisma.appareilBiometrique.findMany({
      where: { utilisateurId, actif: true },
      select: {
        id: true,
        deviceId: true,
        nomAppareil: true,
        modeleAppareil: true,
        systemeExploitation: true,
        derniereAuthentification: true,
        creeLe: true,
      },
    });
    return {
      succes: true,
      message: `${appareils.length} appareil(s).`,
      donnees: appareils,
    };
  }

  // ─── DELETE /auth/biometrique/appareils/:id ───────
  async revoquerAppareil(utilisateurId: string, appareilId: string) {
    const appareil = await this.prisma.appareilBiometrique.findUnique({
      where: { id: appareilId },
    });
    if (!appareil || appareil.utilisateurId !== utilisateurId)
      throw new NotFoundException('Appareil introuvable');
    await this.prisma.appareilBiometrique.update({
      where: { id: appareilId },
      data: { actif: false },
    });

    const restants = await this.prisma.appareilBiometrique.count({
      where: { utilisateurId, actif: true },
    });
    if (restants === 0)
      await this.prisma.utilisateur.update({
        where: { id: utilisateurId },
        data: { empreinteActive: false },
      });

    return { succes: true, message: 'Appareil révoqué.' };
  }

  // ─── GET /auth/connexions-suspectes (Admin) ────────
  async connexionsSuspectes(page = 1, limite = 50) {
    const skip = (page - 1) * limite;

    // Sessions créées depuis des IPs différentes des sessions habituelles du même user
    // On détecte : même utilisateur, plusieurs IPs distinctes dans les 24h
    const dernierJour = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const derniereMois = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Sessions récentes groupées par utilisateur avec plusieurs IPs distinctes
    const sessionsRecentes = await this.prisma.sessionUtilisateur.findMany({
      where: { creeLe: { gte: derniereMois } },
      select: {
        id: true,
        utilisateurId: true,
        adresseIP: true,
        deviceId: true,
        creeLe: true,
        actif: true,
        utilisateur: {
          select: { id: true, nom: true, telephone: true, role: true },
        },
      },
      orderBy: { creeLe: 'desc' },
    });

    // Regrouper par utilisateurId pour trouver les multi-IP suspectes
    const parUtilisateur = new Map<string, typeof sessionsRecentes>();
    for (const s of sessionsRecentes) {
      const existantes = parUtilisateur.get(s.utilisateurId) ?? [];
      existantes.push(s);
      parUtilisateur.set(s.utilisateurId, existantes);
    }

    const alertes: {
      utilisateur: { id: string; nom: string; telephone: string; role: string };
      nbrIPs: number;
      ips: string[];
      derniereSession: Date;
      derniereIP: string;
      suspicion: string;
    }[] = [];

    for (const [, sessions] of parUtilisateur.entries()) {
      const ips = [
        ...new Set(sessions.map((s) => s.adresseIP).filter(Boolean)),
      ] as string[];
      const sessionsRecentes24h = sessions.filter(
        (s) => s.creeLe >= dernierJour,
      );
      const ipsRecentes = [
        ...new Set(sessionsRecentes24h.map((s) => s.adresseIP).filter(Boolean)),
      ];

      // Suspect si : 3+ IPs distinctes en 24h OU 5+ IPs distinctes en 30j
      if (ipsRecentes.length >= 3 || ips.length >= 5) {
        const derniereSession = sessions[0];
        alertes.push({
          utilisateur: derniereSession.utilisateur,
          nbrIPs: ips.length,
          ips: ips.slice(0, 5),
          derniereSession: derniereSession.creeLe,
          derniereIP: derniereSession.adresseIP ?? 'inconnue',
          suspicion:
            ipsRecentes.length >= 3
              ? `${ipsRecentes.length} IPs différentes en 24h`
              : `${ips.length} IPs différentes en 30 jours`,
        });
      }
    }

    const total = alertes.length;
    const paginees = alertes.slice(skip, skip + limite);

    return {
      succes: true,
      message: `${total} compte(s) avec activité suspecte.`,
      donnees: {
        alertes: paginees,
        total,
        page,
        pages: Math.ceil(total / limite),
      },
    };
  }
}
