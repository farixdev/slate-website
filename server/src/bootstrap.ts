import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Everything that must be true of the application however it is started.
 *
 * There are two entry points — `main.ts` for a local process and
 * `serverless.ts` for the Vercel function — and the one thing that must never
 * differ between them is the request handling. Configuring the validation pipe
 * in one and forgetting it in the other would mean the deployed API silently
 * accepts fields the local one rejects, which is exactly the class of
 * difference nobody notices until it is a security problem.
 */
export function applyAppSettings(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      // Anything not on the DTO is stripped rather than passed through, so a
      // client cannot set fields the form never offered — `latest`, `clicks`.
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const origins = config.get<string[]>('corsOrigins') ?? [];
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: true });
  }
  // With no origins configured — which is the case on Vercel, where the site
  // and the API share an origin — CORS is left off entirely rather than
  // enabled with an empty list. There is no cross-origin caller to admit.
}
