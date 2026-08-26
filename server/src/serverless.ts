import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';
import { applyAppSettings } from './bootstrap';

/**
 * The application as a request handler, for platforms that do not let you
 * listen on a port.
 *
 * A serverless function is handed one request at a time and is expected to hand
 * back one response; there is no `listen`. So Nest is mounted onto a bare
 * Express instance and that instance *is* the handler.
 *
 * The promise is cached at module scope, which is the whole performance story
 * here. Module scope survives between invocations that land on the same warm
 * instance, so booting Nest — reading config, building the injector, opening a
 * database connection — happens on the first request an instance serves and on
 * none of the ones after it. Caching the promise rather than the resolved value
 * matters too: two requests arriving together during a cold start both await
 * the same boot instead of starting two of them.
 *
 * A rejected boot is deliberately not cached. If the first request fails
 * because, say, the database was briefly unreachable, the next one should get a
 * fresh attempt rather than the same stale error for the life of the instance.
 */
let booting: Promise<express.Express> | null = null;

export function getRequestHandler(): Promise<express.Express> {
  booting ??= createHandler().catch((error: unknown) => {
    booting = null;
    throw error;
  });
  return booting;
}

async function createHandler(): Promise<express.Express> {
  const server = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    // The platform captures stdout per invocation, so `log` and `debug` would
    // put a copy of Nest's whole startup banner in front of every cold start's
    // logs. Warnings and errors are the parts anyone reads.
    logger: ['warn', 'error'],
  });

  applyAppSettings(app);

  // `init()` rather than `listen()`: wire everything up, bind no socket.
  await app.init();

  return server;
}
