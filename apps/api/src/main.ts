import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { assertEuResidency } from './common/eu-residency';

async function bootstrap() {
  // RG-10 : fail-fast avant d'écouter si DATA_RESIDENCY / régions hors UE.
  assertEuResidency();

  // rawBody: true → req.rawBody Buffer for Stripe-Signature verification on /billing/webhook
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(cookieParser());
  app.enableCors({
    origin: process.env.API_CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[annex21-api] listening on :${port} (data residency: EU)`);
}

bootstrap();
