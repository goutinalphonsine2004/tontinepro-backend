import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private initialized = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    try {
      let serviceAccount: object | null = null;

      // Priorité 1 : JSON complet en env var (Railway/Render production)
      const envJson = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT');
      if (envJson) {
        serviceAccount = JSON.parse(envJson);
        this.logger.log('[Push] Firebase credentials depuis FIREBASE_SERVICE_ACCOUNT');
      }

      // Priorité 2 : variables individuelles (FIREBASE_PRIVATE_KEY + CLIENT_EMAIL + PROJECT_ID)
      if (!serviceAccount) {
        const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');
        const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
        const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
        if (privateKey && clientEmail && projectId) {
          serviceAccount = {
            type: 'service_account',
            project_id: projectId,
            private_key: privateKey.replace(/\\n/g, '\n'),
            client_email: clientEmail,
          };
          this.logger.log('[Push] Firebase credentials depuis variables individuelles');
        }
      }

      // Priorité 3 : fichier JSON local (développement uniquement)
      if (!serviceAccount) {
        const path = require('path');
        const fs = require('fs');
        const rootDir = process.cwd();
        const files = (fs.readdirSync(rootDir) as string[]).filter(
          (f) => f.includes('firebase-adminsdk') && f.endsWith('.json'),
        );
        if (files.length > 0) {
          const keyPath = path.join(rootDir, files[0]);
          serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
          this.logger.warn(`[Push] Firebase depuis fichier local (dev uniquement) : ${files[0]}`);
        }
      }

      if (!serviceAccount) {
        this.logger.warn('[Push] Firebase non configuré — push désactivé');
        return;
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
      }
      this.initialized = true;
      this.logger.log('[Push] Firebase initialisé ✓');
    } catch (e) {
      this.logger.warn(`[Push] Erreur init Firebase : ${(e as Error).message}`);
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
      this.logger.error(`[Push] Erreur: ${(err as Error).message}`);
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
      this.logger.error(`[Push Multi] Erreur: ${(err as Error).message}`);
    }
  }
}
