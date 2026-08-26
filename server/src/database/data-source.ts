import { mkdirSync } from 'fs';
import { dirname } from 'path';
import type { DataSourceOptions } from 'typeorm';
import { DownloadLink } from '../downloads/download-link.entity';
import { Release } from '../releases/release.entity';
import type { AppConfig } from '../config/configuration';

/**
 * Builds the TypeORM options for whichever database is configured.
 *
 * Two drivers, chosen by whether `DATABASE_URL` is present:
 *
 *   * **Postgres** (Neon) in production, because a serverless function has no
 *     durable filesystem — anything written to disk vanishes with the instance,
 *     and two instances do not see each other's writes at all.
 *   * **SQLite** locally, so a fresh clone runs with no credentials, no network
 *     and no containers. Set `DATABASE_URL` locally too if you would rather
 *     develop against the real thing.
 *
 * Both are described by the same entities, so the only difference the
 * application sees is speed.
 */
export interface DatabaseEnvironment {
  /** Serverless changes how the connection pool should be sized. */
  serverless: boolean;
  database: AppConfig['database'];
}

export function buildDataSourceOptions(
  config: DatabaseEnvironment,
  options: { forSchemaChanges?: boolean } = {},
): DataSourceOptions {
  const entities = [Release, DownloadLink];
  const forSchemaChanges = options.forSchemaChanges ?? false;

  // Never on. Schema changes go through `npm run db:push`, run deliberately by
  // a person. Left on in serverless, every cold start would issue DDL, and
  // concurrent cold starts take ACCESS EXCLUSIVE locks on the same tables in
  // whatever order their metadata happens to be in — which is a lock wait or a
  // duplicate-object error served to whoever was loading the page.
  const synchronize = false;

  if (config.database.url) {
    return {
      type: 'postgres',
      url: config.database.url,
      entities,
      synchronize,
      logging: config.database.logging,

      /*
        TLS, with verification.

        Neon's certificate chains to a public CA that Node already trusts, so
        this simply works. `rejectUnauthorized: false` — which a great deal of
        copied-around configuration uses — gives up precisely the protection
        TLS exists to provide.

        A caveat worth knowing: this option only applies when the connection
        string carries no SSL parameters of its own. TypeORM hands both the
        connection string and this option to node-postgres, and node-postgres
        re-parses the string over the top, so any `sslmode=` in the URL wins.
        That is why the setup notes ask for `?sslmode=verify-full` on the URL —
        then the strongest setting is the one that survives either path.
      */
      ssl: resolveSsl(),

      /*
        TypeORM will otherwise try `CREATE EXTENSION` when it connects, to
        provide `uuid_generate_v4()` for the uuid primary keys. That is DDL, and
        DDL does not belong on a request path — on serverless it would run on
        every cold start. The one place it is wanted is the schema script, which
        is a deliberate one-off and does have the rights to do it.
      */
      installExtensions: forSchemaChanges,

      extra: {
        /*
          Pool sizing for a platform that runs many short-lived instances.

          The obvious `max: 1` is wrong here, and it is a common mistake: it does
          not reduce the total number of connections — that is a function of how
          many instances are live — it just serialises the queries within each
          one. A small pool with a *minimum* of one keeps a connection warm for
          the next request an instance serves, which matters because Neon
          suspends an idle compute and waking it costs a few hundred
          milliseconds.

          The short idle timeout is what stops a fleet of instances sitting on
          connections they are not using.
        */
        max: config.serverless ? 5 : 10,
        min: config.serverless ? 1 : 0,
        idleTimeoutMillis: config.serverless ? 5_000 : 10_000,

        // Neon scales to zero. A compute that has been idle needs time to wake,
        // and the driver's default of five seconds is not always enough.
        connectionTimeoutMillis: 15_000,
      },
    };
  }

  // TypeORM will not create the directory, and a missing one surfaces as a
  // confusing SQLITE_CANTOPEN rather than as anything actionable. This is also
  // the only filesystem write in the application, and it is deliberately inside
  // the SQLite branch: on Vercel the filesystem is read-only, so reaching this
  // line there would abort startup with EROFS before a single request is served.
  mkdirSync(dirname(config.database.sqlitePath), { recursive: true });

  return {
    type: 'better-sqlite3',
    database: config.database.sqlitePath,
    entities,
    synchronize,
    logging: config.database.logging,
  };
}

/**
 * Which connection string to use for schema changes.
 *
 * Neon offers two: a pooled one whose host contains `-pooler`, and a direct
 * one. The pooled endpoint is PgBouncer in transaction mode, which hands the
 * server connection back at every COMMIT and so keeps no session state — and
 * session-level advisory locks are exactly what schema tooling relies on to
 * stop two migrations running at once.
 *
 * So: the application runs through the pooler, and anything that changes the
 * schema goes direct. `DATABASE_URL_UNPOOLED` is the name Neon's own Vercel
 * integration gives the direct string, so it usually needs no setting up.
 */
export function schemaChangeUrl(config: DatabaseEnvironment): string | undefined {
  return (
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.DIRECT_DATABASE_URL ??
    config.database.url
  );
}

/** TLS for the Postgres connection. See the note on `ssl` above. */
function resolveSsl(): boolean | { rejectUnauthorized: boolean } {
  if (process.env.DATABASE_SSL_NO_VERIFY === 'true') {
    // A last resort for a provider with a private CA. Not a fix.
    return { rejectUnauthorized: false };
  }
  if (process.env.DATABASE_SSL === 'false') return false;
  return { rejectUnauthorized: true };
}
