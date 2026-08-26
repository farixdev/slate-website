import { randomBytes } from 'crypto';

/**
 * Runtime configuration, read once at boot.
 *
 * Everything sensitive comes from the environment. Nothing here has a usable
 * secret as a default: the JWT secret is random per boot when unset, which
 * means a deployment that forgot to set it logs everyone out on restart rather
 * than quietly running on a secret that is published in this repository.
 */
export interface AppConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  admin: {
    username: string;
    /** Pre-hashed with bcrypt. Falls back to hashing `ADMIN_PASSWORD` at boot. */
    passwordHash?: string;
    password?: string;
  };
  databasePath: string;
  /** Where release binaries live when they are not hosted on GitHub. */
  uploadDir: string;
  /** Origin the browser talks to, used to build absolute download URLs. */
  publicUrl: string;
  corsOrigins: string[];
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),

  // A random secret is deliberately worse than a configured one, and that is
  // the point: it fails visibly (sessions drop on restart) instead of silently
  // accepting tokens signed with a well-known string.
  jwtSecret: process.env.JWT_SECRET ?? randomBytes(48).toString('hex'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',

  admin: {
    username: process.env.ADMIN_USERNAME ?? 'admin',
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
    password: process.env.ADMIN_PASSWORD,
  },

  databasePath: process.env.DATABASE_PATH ?? 'data/slate.sqlite',
  uploadDir: process.env.UPLOAD_DIR ?? 'data/uploads',
  publicUrl: process.env.PUBLIC_URL ?? 'http://localhost:3000',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
});
