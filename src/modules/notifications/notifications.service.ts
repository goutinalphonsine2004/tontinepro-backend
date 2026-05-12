import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Canal, TypeNotification } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { WhatsappService } from './whatsapp.service';
import { FiltrerNotificationsDto } from './dto/filtrer-notifications.dto';
import { ModifierPreferencesNotificationDto } from './dto/modifier-preferences-notification.dto';

export type TypeNotif = 'SMS' | 'PUSH' | 'WHATSAPP' | 'TOUS';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => SmsService))
    private sms: SmsService,
    private push: PushService,
    private whatsapp: WhatsappService,
  ) {}

  async envoyerAUtilisateur(
    utilisateurId: string,
    titre: string,
    message: string,
    types: TypeNotif = 'TOUS',
    typeNotification: TypeNotification = TypeNotification.PAIEMENT_RECU,
  ) {
    const rows = await this.prisma.$queryRaw<
      { telephone: string; tokenPush: string | null; nom: string }[]
    >`
      SELECT telephone, "tokenPush", nom FROM "Utilisateur" WHERE id = ${utilisateurId} LIMIT 1`;
    const user = rows[0] ?? null;
    if (!user) return;

    const preferences = await this.getPreferencesBrutes(utilisateurId);
    const resultats: Record<string, any> = {};

    if (
      (types === 'TOUS' || types === 'SMS') &&
      preferences.smsActif &&
      user.telephone
    ) {
      resultats.sms = await this.sms.envoyer(user.telephone, message);
      await this.creerNotification(
        utilisateurId,
        typeNotification,
        titre,
        message,
        Canal.SMS,
      );
    }

    if (
      (types === 'TOUS' || types === 'PUSH') &&
      preferences.pushActif &&
      user.tokenPush
    ) {
      resultats.push = await this.push.envoyerNotification(
        user.tokenPush,
        titre,
        message,
      );
      await this.creerNotification(
        utilisateurId,
        typeNotification,
        titre,
        message,
        Canal.PUSH,
      );
    }

    return resultats;
  }

  async envoyerSmsGroupe(telephones: string[], message: string) {
    const resultats = await Promise.allSettled(
      telephones.map((tel) => this.sms.envoyer(tel, message)),
    );
    const succes = resultats.filter((r) => r.status === 'fulfilled').length;
    this.logger.log(
      `[Notif groupe] ${succes}/${telephones.length} SMS envoyés`,
    );
    return { succes, total: telephones.length };
  }

  async enregistrerTokenPush(utilisateurId: string, token: string) {
    await this.prisma
      .$executeRaw`UPDATE "Utilisateur" SET "tokenPush" = ${token} WHERE id = ${utilisateurId}`;
    return { succes: true, message: 'Token push enregistré' };
  }

  async lister(utilisateurId: string, dto: FiltrerNotificationsDto) {
    const page = dto.page ?? 1;
    const limite = dto.limite ?? 20;
    const skip = (page - 1) * limite;
    const where = {
      utilisateurId,
      ...(dto.lu !== undefined && { lu: dto.lu }),
    };

    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limite,
        orderBy: { creeLe: 'desc' },
      }),
    ]);

    return {
      succes: true,
      message: `${total} notification(s).`,
      donnees: {
        notifications,
        total,
        page,
        limite,
        pages: Math.ceil(total / limite),
      },
    };
  }

  async compterNonLues(utilisateurId: string) {
    const total = await this.prisma.notification.count({
      where: { utilisateurId, lu: false },
    });
    return {
      succes: true,
      message: `${total} notification(s) non lue(s).`,
      donnees: { total },
    };
  }

  async marquerLu(utilisateurId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundException('Notification introuvable');
    if (notification.utilisateurId !== utilisateurId) {
      throw new ForbiddenException('Accès interdit à cette notification');
    }

    const maj = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { lu: true },
    });
    return {
      succes: true,
      message: 'Notification marquée comme lue.',
      donnees: maj,
    };
  }

  async toutMarquerLu(utilisateurId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { utilisateurId, lu: false },
      data: { lu: true },
    });
    return {
      succes: true,
      message: `${result.count} notification(s) marquée(s) comme lue(s).`,
    };
  }

  async getPreferences(utilisateurId: string) {
    const preferences = await this.getPreferencesBrutes(utilisateurId);
    return {
      succes: true,
      message: 'Préférences notifications récupérées.',
      donnees: preferences,
    };
  }

  async modifierPreferences(
    utilisateurId: string,
    dto: ModifierPreferencesNotificationDto,
  ) {
    const preferences = await this.prisma.preferenceNotification.upsert({
      where: { utilisateurId },
      create: {
        utilisateurId,
        smsActif: dto.smsActif ?? true,
        pushActif: dto.pushActif ?? true,
      },
      update: {
        ...(dto.smsActif !== undefined && { smsActif: dto.smsActif }),
        ...(dto.pushActif !== undefined && { pushActif: dto.pushActif }),
      },
    });

    return {
      succes: true,
      message: 'Préférences notifications mises à jour.',
      donnees: preferences,
    };
  }

  async envoyerAEquipe(agentId: string, titre: string, message: string) {
    // 1. Notifier l'agent
    await this.envoyerAUtilisateur(agentId, titre, message, 'PUSH');

    // 2. Trouver et notifier le superviseur
    const agent = await this.prisma.utilisateur.findUnique({
      where: { id: agentId },
      select: { superviseurId: true },
    });

    if (agent?.superviseurId) {
      await this.envoyerAUtilisateur(
        agent.superviseurId,
        `[Équipe] ${titre}`,
        message,
        'PUSH',
      );
    }
  }

  private async getPreferencesBrutes(utilisateurId: string) {
    return this.prisma.preferenceNotification.upsert({
      where: { utilisateurId },
      create: { utilisateurId },
      update: {},
    });
  }

  private async creerNotification(
    utilisateurId: string,
    type: TypeNotification,
    titre: string,
    message: string,
    canal: Canal,
  ) {
    return this.prisma.notification.create({
      data: { utilisateurId, type, titre, message, canal },
    });
  }
}
