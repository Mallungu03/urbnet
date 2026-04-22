import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { EnvService } from './config/env/env.service';
import helmet from 'helmet';
import compression from 'compression';

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

  const env = app.get(EnvService);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(env.apiPort || 3000);

  console.log(`Reporta API ON in ${env.apiUrl}`);
}
bootstrap().catch((error) => {
  console.log(error);
  process.exit(1);
});
