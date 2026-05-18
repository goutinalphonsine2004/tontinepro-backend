import 'dotenv/config'; // charger .env AVANT tout module NestJS
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';

function validerVariablesEnv(logger: Logger) {
  const requises: Record<string, string> = {
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    JWT_SECRET: process.env.JWT_SECRET ?? '',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? '',
  };
  const manquantes = Object.entries(requises)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (manquantes.length > 0) {
    logger.fatal(`Variables d'environnement manquantes : ${manquantes.join(', ')}`);
    process.exit(1);
  }
  const jwtExp = process.env.JWT_EXPIRES_IN ?? '';
  if (jwtExp && !/^\d+[smhd]$/.test(jwtExp)) {
    logger.fatal(`JWT_EXPIRES_IN invalide : "${jwtExp}" (format attendu : 24h, 3600s…)`);
    process.exit(1);
  }
  logger.log('Variables d\'environnement validées ✓');
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  validerVariablesEnv(logger);
  // rawBody: true → accès au corps brut pour vérification HMAC webhook KKiaPay
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // CORS brut — avant tout middleware, incontournable
  app.use((req: any, res: any, next: any) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Augmenter la limite pour les photos base64 (KYC terrain)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(helmet({ crossOriginResourcePolicy: false }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`TontineBénin API démarrée sur le port ${port}`);
}
void bootstrap();
