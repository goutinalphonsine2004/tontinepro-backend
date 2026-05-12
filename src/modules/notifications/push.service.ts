import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private initialized = false;

  constructor(private config: ConfigService) {
    const projectId = config.get<string>('FIREBASE_PROJECT_ID');
    const privateKey = config.get<string>('FIREBASE_PRIVATE_KEY');
    const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL');

    if (projectId && privateKey && clientEmail) {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: privateKey.replace(/\\n/g, '\n'),
            clientEmail,
          }),
        });
      }
      this.initialized = true;
      this.logger.log('[Push] Firebase initialisé');
    } else {
      this.logger.warn('[Push] Firebase non configuré — push désactivé');
    }
  }

  async envoyerNotification(
    token: string,
    titre: string,
    corps: string,
    donnees?: Record<string, string>,
  ) {
    if (!this.initialized) {
      this.logger.warn(`[Push] Simulation → ${titre}: ${corps}`);
      return { success: true, simulated: true };
    }

    try {
      const result = await admin.messaging().send({
        token,
        notification: { title: titre, body: corps },
        data: donnees ?? {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
      this.logger.log(`[Push] Envoyé: ${result}`);
      return { success: true, messageId: result };
    } catch (err: any) {
      this.logger.error(`[Push] Erreur: ${err.message}`);
      return { success: false, erreur: err.message };
    }
  }

  async envoyerAMultiple(
    tokens: string[],
    titre: string,
    corps: string,
    donnees?: Record<string, string>,
  ) {
    if (!this.initialized || tokens.length === 0) return;

    const messages = tokens.map((token) => ({
      token,
      notification: { title: titre, body: corps },
      data: donnees ?? {},
    }));

    try {
      const result = await admin.messaging().sendEach(messages);
      this.logger.log(
        `[Push Multi] ${result.successCount}/${tokens.length} envoyés`,
      );
      return result;
    } catch (err: any) {
      this.logger.error(`[Push Multi] Erreur: ${err.message}`);
    }
  }
}
