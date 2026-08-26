import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyAppSettings } from './bootstrap';

/**
 * The local entry point: one long-lived process listening on a port.
 *
 * Production on Vercel does not come through here — it uses `serverless.ts`,
 * which mounts the same application as a request handler instead. Anything that
 * must be true of both belongs in `bootstrap.ts`, not in this file.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  applyAppSettings(app);

  const config = app.get(ConfigService);
  const port = config.get<number>('port')!;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Slate API listening on http://localhost:${port}`);
  logger.log(
    config.get<string>('database.url')
      ? 'Database: Postgres'
      : `Database: SQLite at ${config.get<string>('database.sqlitePath')}`,
  );
}

void bootstrap();
