import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  telephone: string;
  role: string;
  sid?: string;
}

function secretRefreshJwt(config: ConfigService) {
  const secret = config.get<string>('JWT_REFRESH_SECRET');
  if (!secret && config.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_REFRESH_SECRET est obligatoire en production');
  }
  return secret ?? 'dev-refresh-secret-change-me';
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: secretRefreshJwt(config),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub) throw new UnauthorizedException('Refresh token invalide');
    if (!payload.sid) throw new UnauthorizedException('Session invalide');

    const session = await this.prisma.sessionUtilisateur.findFirst({
      where: {
        id: payload.sid,
        utilisateurId: payload.sub,
        actif: true,
        expireLe: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!session) throw new UnauthorizedException('Session expirée ou révoquée');

    return { id: payload.sub, telephone: payload.telephone, role: payload.role, sessionId: payload.sid };
  }
}
