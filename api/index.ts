/*
  The Vercel entry point.

  Everything the browser asks for under /api arrives here. The site itself does
  not — Vercel serves the built site straight from its CDN and those requests
  never reach this function.

  Three things about this file are deliberate and easy to get wrong:

  1. `reflect-metadata` is imported first, before anything that might pull in a
     decorated class. Nest's dependency injection reads type metadata that
     TypeScript emits into that registry, and if the polyfill is not installed
     first the failure is an "Nest can't resolve dependencies" error that points
     nowhere near the real cause. `main.ts` gets this transitively from
     @nestjs/core; a hand-written entry cannot rely on that.

  2. It imports the *compiled* application from server/dist, not the TypeScript
     source. The application is built by `nest build` (real tsc) during the
     build step, so the decorator metadata Nest and TypeORM depend on is already
     baked into the JavaScript. The import is static so Vercel's dependency
     tracer follows it and pulls server/dist and its dependencies into the
     function bundle; a dynamic `require(someVariable)` would not be traced and
     the deploy would fail at runtime with a missing module.

  3. It is one file at api/index.ts, which Vercel turns into exactly ONE route:
     `/api`. Sub-paths like /api/releases/latest do not match it on their own —
     vercel.json rewrites them here, and the function still sees the original
     path, which is what lets Nest route them normally.
*/
import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'http';
import { getRequestHandler } from '../server/dist/serverless';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const app = await getRequestHandler();
    app(req, res);
  } catch (error) {
    /*
      Reaching here means the application could not start at all — almost
      always a missing or wrong environment variable, and most often
      JWT_SECRET or DATABASE_URL. Nest would otherwise reject the invocation
      with a stack trace the visitor sees as an opaque platform error page, so
      say plainly what happened and put the detail in the log where it belongs.
    */
    const detail = error instanceof Error ? error.message : String(error);
    console.error('Failed to start the Slate API:', error);

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(
      JSON.stringify({
        statusCode: 500,
        error: 'Server misconfigured',
        message: detail,
      }),
    );
  }
}
