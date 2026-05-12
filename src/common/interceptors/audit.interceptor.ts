import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

type RequestWithUser = {
  method?: string;
  originalUrl?: string;
  url?: string;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  user?: { id?: string; role?: string; sessionId?: string };
};

const METHODES_AUDITEES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ROUTES_IGNOREES = [
  '/auth/connexion',
  '/auth/rafraichir-token',
  '/auth/verifier-otp',
  '/auth/verifier-otp-reset-pin',
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const methode = request.method?.toUpperCase() ?? 'UNKNOWN';
    const chemin = request.originalUrl ?? request.url ?? 'UNKNOWN';
    const utilisateurId = request.user?.id;

    if (
      !utilisateurId ||
      !METHODES_AUDITEES.has(methode) ||
      this.doitIgnorer(chemin)
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        void this.prisma.journalAudit
          .create({
            data: {
              utilisateurId,
              action: `${methode} ${this.normaliserChemin(chemin)}`,
              details: this.creerDetails(request),
              adresseIP: this.extraireAdresseIP(request),
              appareil: this.extraireUserAgent(request),
            },
          })
          .catch(() => undefined);
      }),
    );
  }

  private doitIgnorer(chemin: string) {
    const normalise = this.normaliserChemin(chemin);
    return ROUTES_IGNOREES.some((route) => normalise.startsWith(route));
  }

  private normaliserChemin(chemin: string) {
    return chemin.split('?')[0] || chemin;
  }

  private creerDetails(request: RequestWithUser) {
    return JSON.stringify({
      methode: request.method,
      chemin: this.normaliserChemin(request.originalUrl ?? request.url ?? ''),
      role: request.user?.role,
      sessionId: request.user?.sessionId,
    });
  }

  private extraireAdresseIP(request: RequestWithUser) {
    const forwarded = request.headers['x-forwarded-for'];
    if (Array.isArray(forwarded)) return forwarded[0];
    if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();
    return request.ip;
  }

  private extraireUserAgent(request: RequestWithUser) {
    const userAgent = request.headers['user-agent'];
    return Array.isArray(userAgent) ? userAgent[0] : userAgent;
  }
}
