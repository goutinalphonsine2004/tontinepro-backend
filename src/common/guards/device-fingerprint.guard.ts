import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../../modules/notifications/sms.service';
import type { Request } from 'express';

@Injectable()
export class DeviceFingerprintGuard implements CanActivate {
  private readonly logger = new Logger(DeviceFingerprintGuard.name);

  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();
    const utilisateur = req.user;

    // Ce guard doit être utilisé après JwtAuthGuard (utilisateur injecté)
    if (!utilisateur?.id || !utilisateur?.sessionId) return true;

    const session = await this.prisma.sessionUtilisateur.findUnique({
      where: { id: utilisateur.sessionId },
      select: {
        id: true,
        adresseIP: true,
        userAgent: true,
        actif: true,
        utilisateur: { select: { telephone: true, nom: true } },
      },
    });

    if (!session || !session.actif) {
      throw new UnauthorizedException({
        message: 'Session révoquée',
        code: 'SESSION_REVOQUEE',
      });
    }

    const ipActuelle = this.extraireIP(req);
    const uaActuel = req.headers['user-agent'] ?? '';

    // Détecter changement d'IP suspect (tolérance : même /24 subnet autorisé)
    const ipSuspecte =
      session.adresseIP &&
      ipActuelle &&
      !this.memeSubnet(session.adresseIP, ipActuelle);

    // Détecter changement de User-Agent
    const uaSuspect =
      session.userAgent && uaActuel && session.userAgent !== uaActuel;

    if (ipSuspecte && uaSuspect) {
      this.logger.warn(
        `[DeviceFingerprint] Changement IP+UA suspect — session: ${session.id} | ` +
          `IP connue: ${session.adresseIP} → actuelle: ${ipActuelle} | ` +
          `UA connu: ${session.userAgent?.slice(0, 50)} → actuel: ${uaActuel.slice(0, 50)}`,
      );

      // Révoquer la session immédiatement
      await this.prisma.sessionUtilisateur.update({
        where: { id: session.id },
        data: { actif: false, revoqueLe: new Date(), refreshTokenHash: null },
      });

      // Alerter le client par SMS
      if (session.utilisateur?.telephone) {
        await this.sms
          .envoyer(
            session.utilisateur.telephone,
            `TontineBénin: 🚨 Alerte sécurité — connexion suspecte détectée depuis un nouvel appareil/réseau. ` +
              `Si ce n'est pas vous, changez votre PIN immédiatement.`,
          )
          .catch(() => {});
      }

      throw new UnauthorizedException({
        message:
          'Session révoquée pour raison de sécurité. Veuillez vous reconnecter.',
        code: 'SESSION_SUSPECTE',
      });
    }

    return true;
  }

  private extraireIP(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (Array.isArray(forwarded)) return forwarded[0] ?? null;
    if (typeof forwarded === 'string')
      return forwarded.split(',')[0]?.trim() ?? null;
    return req.ip ?? null;
  }

  /** Vérifie si deux IPs sont sur le même /24 (tolérance réseau domestique) */
  private memeSubnet(ip1: string, ip2: string): boolean {
    if (ip1 === ip2) return true;
    try {
      const s1 = ip1.split('.').slice(0, 3).join('.');
      const s2 = ip2.split('.').slice(0, 3).join('.');
      return s1 === s2;
    } catch {
      return false;
    }
  }
}
