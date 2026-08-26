import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { isServerless, readDatabaseConfig } from '../config/configuration';
import { buildDataSourceOptions } from '../database/data-source';
import { Release } from '../releases/release.entity';
import { FIRST_RELEASE } from '../releases/seed-data';

/**
 * Writes the 1.0.0 release into an empty database.
 *
 *     npm run db:seed
 *
 * Safe to run repeatedly: it does nothing at all if the database already holds
 * any release, so it cannot overwrite something an admin has since edited.
 *
 * A plain DataSource rather than a Nest application context. Seeding needs a
 * connection and two inserts; booting the application would additionally
 * require every environment variable the *running site* needs — a session
 * secret in particular — which is an absurd thing to demand of a script that
 * only writes rows.
 */
async function main() {
  loadEnv({ quiet: true });

  const config = { serverless: isServerless(), database: readDatabaseConfig() };
  const dataSource = new DataSource(buildDataSourceOptions(config));
  await dataSource.initialize();

  try {
    const releases = dataSource.getRepository(Release);
    const existing = await releases.count();

    if (existing > 0) {
      console.log(
        `Database already holds ${existing} release(s); leaving it alone.`,
      );
      return;
    }

    // `save` cascades into the download links, which the Release entity owns.
    await releases.save(releases.create(FIRST_RELEASE));
    console.log('Seeded release 1.0.0 with its download links.');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('\nSeeding failed.\n');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
