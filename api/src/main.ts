import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  app.enableCors({
    origin: config.get<string[]>('corsOrigins'),
    credentials: true,
  });

  const port = config.get<number>('port')!;
  await app.listen(port);

  new Logger('Bootstrap').log(`Slate API listening on http://localhost:${port}`);
}

void bootstrap();
