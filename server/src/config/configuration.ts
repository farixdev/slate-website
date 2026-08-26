import { randomBytes } from 'crypto';

/**
 * Runtime configuration, read once at boot.
 *
 * Everything sensitive comes from the environment. The thing to understand
 * before changing anything here is that this application runs in two very
 * different shapes:
 *
 *   * as one long-lived Node process locally, where "per boot" means once; and
 *   * as a Vercel serverless function, where a cold start is a *fresh process*,
 *     several can run at once, and any one of them may be discarded between
 *     requests.
 *
 * Several things that are merely untidy in the first shape are broken in the
 * second. They are called out individually below.
 */
export interface AppConfig {
  port: number;

  /** True when running on Vercel. Serverless changes what is safe to do. */
  serverless: boolean;
  production: boolean;

  jwtSecret: string;
  jwtExpiresIn: string;

  admin: {
    username: string;
    /** Pre-hashed with bcrypt. Falls back to hashing `ADMIN_PASSWORD` at boot. */
    passwordHash?: string;
    password?: string;
  };

  database: {
    /** A Postgres connection string. When set, Postgres is used. */
    url?: string;
    /** Where the local SQLite file lives when no `url` is given. */
    sqlitePath: string;
    /** Emit SQL to the log. Off unless asked for. */
    logging: boolean;
  };

  /** Origins allowed to call the API cross-origin. Empty on Vercel: same origin. */
  corsOrigins: string[];
}

/**
 * A signing secret that must be identical everywhere.
 *
 * Locally, a random secret per boot is a good default: it fails visibly — you
 * are signed out on restart — rather than quietly running on a well-known
 * string committed to this repository.
 *
 * On serverless it is not a default, it is a bug. Every cold start would mint a
 * different secret, so a token issued by one instance is rejected by the next
 * and an admin is thrown out of the panel at random with nothing in the logs to
 * explain it. In production the secret is therefore required, and its absence
 * is loud rather than silently papered over.
 */
function resolveJwtSecret(serverless: boolean, production: boolean): string {
  const configured = process.env.JWT_SECRET;
  if (configured && configured.length >= 32) return configured;

  if (configured) {
    throw new Error(
      'JWT_SECRET is too short — use at least 32 characters. Generate one with:\n' +
        '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
    );
  }

  if (serverless || production) {
    throw new Error(
      'JWT_SECRET is not set.\n\n' +
        'It is required in production. Each serverless instance is a separate ' +
        'process, so without a shared secret every cold start would sign tokens ' +
        'with a different key and admins would be signed out at random.\n\n' +
        'Generate one and set it as an environment variable:\n' +
        '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
    );
  }

  return randomBytes(48).toString('hex');
}

/** Vercel sets VERCEL=1 in every build and runtime environment it controls. */
export function isServerless(): boolean {
  return process.env.VERCEL === '1';
}

/**
 * Just the database settings.
 *
 * Exported separately so the one-off scripts — creating the schema, seeding —
 * can read what they need without going through the full configuration, which
 * insists on a session secret. Demanding JWT_SECRET from a script that only
 * writes two rows would be a confusing failure for no reason.
 */
export function readDatabaseConfig(): AppConfig['database'] {
  return {
    // Neon, or any other Postgres. Absent locally, where SQLite is used so a
    // fresh clone runs with no credentials and no network.
    url: process.env.DATABASE_URL,
    sqlitePath: process.env.DATABASE_PATH ?? 'data/slate.sqlite',
    logging: process.env.DATABASE_LOGGING === 'true',
  };
}

export default (): AppConfig => {
  const serverless = isServerless();
  const production = process.env.NODE_ENV === 'production';

  return {
    port: parseInt(process.env.PORT ?? '3000', 10),
    serverless,
    production,

    jwtSecret: resolveJwtSecret(serverless, production),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',

    admin: {
      username: process.env.ADMIN_USERNAME ?? 'admin',
      passwordHash: process.env.ADMIN_PASSWORD_HASH,
      password: process.env.ADMIN_PASSWORD,
    },

    database: readDatabaseConfig(),

    // On Vercel the site and the API share an origin, so there is no
    // cross-origin call to permit and the safest list is an empty one.
    corsOrigins: serverless
      ? []
      : (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
  };
};
