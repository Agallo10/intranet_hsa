import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);

  const bodyLimit = config.get<string>('JSON_BODY_LIMIT') ?? '25mb';
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  app.setGlobalPrefix('api');

  const corsOrigins = (config.get<string>('CORS_ORIGIN') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins, credentials: true });
  }

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = Number(config.get<string>('PORT') ?? process.env.PORT ?? 3000);
  await app.listen(port);
}
await bootstrap();
