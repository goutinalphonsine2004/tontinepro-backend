import 'dotenv/config'; // charger .env AVANT tout module NestJS
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  // rawBody: true → accès au corps brut pour vérification HMAC webhook KKiaPay
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Augmenter la limite pour les photos base64 (KYC terrain)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Ignorer les champs inconnus (ex: cipPhotoUrl, politique)
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const corsOriginsEnv = process.env.CORS_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean) ?? [];

  app.enableCors({
    origin: (origin, callback) => {
      // Pas d'origin (curl, mobile, Postman) → toujours autorisé
      if (!origin) return callback(null, true);
      // Origins explicitement autorisées
      if (corsOriginsEnv.includes(origin)) return callback(null, true);
      // Tous les sous-domaines Vercel autorisés (previews inclus)
      if (/^https:\/\/[a-z0-9-]+-[a-z0-9]+-sodjinoucarrache457\.vercel\.app$/.test(origin)) return callback(null, true);
      if (/^https:\/\/tontinepro-admin(-[a-z0-9]+)*\.vercel\.app$/.test(origin)) return callback(null, true);
      // En dev, tout autoriser
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      callback(new Error(`CORS bloqué : ${origin}`));
    },
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`TontineBénin API démarrée sur le port ${port}`);
}
void bootstrap();
