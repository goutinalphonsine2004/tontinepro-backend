import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { WhatsappService } from './whatsapp.service';

export type TypeNotif = 'SMS' | 'PUSH' | 'WHATSAPP' | 'TOUS';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
    private push: PushService,
    private whatsapp: WhatsappService,
  ) {}

  async envoyerAUtilisateur(
    utilisateurId: string,
    titre: string,
    message: string,
    types: TypeNotif = 'TOUS',
  ) {
    const rows = await this.prisma.$queryRaw<{ telephone: string; tokenPush: string | null; nom: string }[]>`
      SELECT telephone, "tokenPush", nom FROM "Utilisateur" WHERE id = ${utilisateurId} LIMIT 1`;
    const user = rows[0] ?? null;
    if (!user) return;

    const resultats: Record<string, any> = {};

    if ((types === 'TOUS' || types === 'SMS') && user.telephone) {
      resultats.sms = await this.sms.envoyer(user.telephone, message);
    }

    if ((types === 'TOUS' || types === 'PUSH') && user.tokenPush) {
      resultats.push = await this.push.envoyerNotification(user.tokenPush, titre, message);
    }

    if (types === 'WHATSAPP' && user.telephone) {
      resultats.whatsapp = await this.whatsapp.envoyerMessage(user.telephone, message);
    }

    return resultats;
  }

  async envoyerSmsGroupe(telephones: string[], message: string) {
    const resultats = await Promise.allSettled(
      telephones.map((tel) => this.sms.envoyer(tel, message)),
    );
    const succes = resultats.filter((r) => r.status === 'fulfilled').length;
    this.logger.log(`[Notif groupe] ${succes}/${telephones.length} SMS envoyés`);
    return { succes, total: telephones.length };
  }

  async enregistrerTokenPush(utilisateurId: string, token: string) {
    await this.prisma.$executeRaw`UPDATE "Utilisateur" SET "tokenPush" = ${token} WHERE id = ${utilisateurId}`;
    return { succes: true, message: 'Token push enregistré' };
  }
}
