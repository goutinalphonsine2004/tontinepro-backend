import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  telephone: string;
  role: string;
  scope?: string;
  sid?: string;
}

function secretJwt(config: ConfigService) {
  const secret = config.get<string>('JWT_SECRET');
  if (!secret && config.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET est obligatoire en production');
  }
  return secret ?? 'dev-secret-change-me';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretJwt(config),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.scope) {
      return {
        id: payload.sub,
        telephone: payload.telephone,
        role: payload.role,
        scope: payload.scope,
      };
    }

    if (!payload.sid) throw new UnauthorizedException('Session invalide');
    const session = await this.prisma.sessionUtilisateur.findFirst({
      where: {
        id: payload.sid,
        utilisateurId: payload.sub,
        actif: true,
        revoqueLe: null,
        expireLe: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!session)
      throw new UnauthorizedException('Session expirée ou révoquée');

    return {
      id: payload.sub,
      telephone: payload.telephone,
      role: payload.role,
      sessionId: payload.sid,
    };
  }
}
