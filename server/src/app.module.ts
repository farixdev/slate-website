import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { existsSync } from 'fs';
import { join } from 'path';
import configuration, { type AppConfig } from './config/configuration';
import { buildDataSourceOptions } from './database/data-source';
import { AuthModule } from './auth/auth.module';
import { ReleasesModule } from './releases/releases.module';

const clientDir = join(__dirname, '..', '..', 'web', 'dist');

/**
 * Whether this process should also serve the built site.
 *
 * Locally, yes: one `npm start` gives you the whole thing on one port, which is
 * as close as a single process gets to what production looks like.
 *
 * On Vercel, no. The static files are served by the platform straight from the
 * build output — they never reach the function, and they are not inside its
 * bundle to serve. Leaving ServeStatic enabled there would only add a
 * filesystem probe on every cold start, looking for a directory that cannot be
 * found.
 */
function shouldServeClient(): boolean {
  return process.env.VERCEL !== '1' && existsSync(clientDir);
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildDataSourceOptions({
          serverless: config.get<boolean>('serverless')!,
          database: config.get<AppConfig['database']>('database')!,
        }),
    }),

    ...(shouldServeClient()
      ? [
          ServeStaticModule.forRoot({
            rootPath: clientDir,
            // Everything that is not /api falls through to index.html, so the
            // client router owns /changelog, /admin and the rest.
            exclude: ['/api/{*path}'],
          }),
        ]
      : []),

    AuthModule,
    ReleasesModule,
  ],
})
export class AppModule {}
