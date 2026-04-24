import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { EnvService } from './config/env/env.service';
import helmet from 'helmet';
import compression from 'compression';
import express from 'express';
import { join } from 'node:path';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [`'self'`, 'data:', 'cdn.apollographql.com'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          manifestSrc: [
            `'self'`,
            'cdn.apollographql.com',
            'sandbox.embed.apollographql.com',
          ],
          connectSrc: [
            `'self'`,
            'cdn.apollographql.com',
            'sandbox.embed.apollographql.com',
          ],
          frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
        },
      },
    }),
  );

  app.use(compression());
  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'storage', 'uploads')),
  );

  const env = app.get(EnvService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(env.apiPort || 3000);

  console.log(`Reporta API ON in ${env.apiUrl}`);
}
bootstrap().catch((error) => {
  console.log(error);
  process.exit(1);
});
