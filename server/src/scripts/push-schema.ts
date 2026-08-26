import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { isServerless, readDatabaseConfig } from '../config/configuration';
import { buildDataSourceOptions, schemaChangeUrl } from '../database/data-source';

/**
 * Creates or updates the database schema. Run deliberately, by a person.
 *
 * The application itself never issues DDL — `synchronize` is off everywhere.
 * That is not fussiness: on serverless, every cold start would run schema
 * synchronisation, and two cold starts racing to create the same table means
 * one of them returns an error to whoever was loading the page.
 *
 *     npm run db:push
 *
 * It is idempotent. TypeORM compares the entities against what is really there
 * and issues only the difference, so running it twice is a no-op.
 *
 * The one thing to be careful about: `synchronize` makes the database match the
 * entities, which means removing a property from an entity will drop its column
 * and everything in it. That is fine for a schema this size, changed this
 * rarely, by one person who is reading this sentence — and it is why this is a
 * command you type rather than something that happens on its own.
 */
async function main() {
  // This script does not go through Nest's ConfigModule, so nothing else has
  // read .env into the environment yet.
  loadEnv({ quiet: true });

  // Only the database settings: this script has no use for a session secret,
  // and the full configuration insists on one in production.
  const config = { serverless: isServerless(), database: readDatabaseConfig() };

  /*
    Schema changes go over the DIRECT connection, not the pooled one.

    Neon's pooled endpoint is PgBouncer in transaction mode: it returns the
    server connection to the pool at every COMMIT, so nothing session-scoped
    survives — including the session-level advisory locks schema tooling uses to
    stop two of these running at once. Set DATABASE_URL_UNPOOLED (Neon's Vercel
    integration adds it for you) and this picks it up.
  */
  const url = schemaChangeUrl(config);
  const effective = { ...config, database: { ...config.database, url } };
  const options = buildDataSourceOptions(effective, { forSchemaChanges: true });

  if (url && config.database.url && url !== config.database.url) {
    console.log('Using the direct (unpooled) connection for schema changes.');
  } else if (url && /-pooler\./.test(url)) {
    console.warn(
      'Warning: this looks like a POOLED Neon connection string. Schema ' +
        'changes should use the direct one — set DATABASE_URL_UNPOOLED. ' +
        'Continuing anyway.',
    );
  }

  const target = url
    ? `Postgres (${describeHost(url)})`
    : `SQLite at ${config.database.sqlitePath}`;
  console.log(`Pushing schema to ${target} …`);

  const dataSource = new DataSource(options);
  await dataSource.initialize();
  try {
    await dataSource.synchronize();
    console.log('Schema is up to date.');
  } finally {
    await dataSource.destroy();
  }
}

/** The host, without the credentials that are also in the connection string. */
function describeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'invalid DATABASE_URL';
  }
}

main().catch((error: unknown) => {
  console.error('\nCould not push the schema.\n');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
