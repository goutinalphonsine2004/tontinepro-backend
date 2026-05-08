import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  // rawBody: true → accès au corps brut pour vérification HMAC webhook KKiaPay
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  // '0.0.0.0' → accessible depuis téléphone physique sur le même réseau
  await app.listen(port, '0.0.0.0');
  console.log(`TontineBénin API démarrée sur le port ${port} (0.0.0.0)`);
  console.log(`Téléphone physique → http://192.168.1.104:${port}`);
}
bootstrap();
