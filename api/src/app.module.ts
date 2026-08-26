import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { DownloadLink } from './downloads/download-link.entity';
import { Release } from './releases/release.entity';
import { ReleasesModule } from './releases/releases.module';

const clientDir = join(__dirname, '..', '..', 'web', 'dist');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const database = config.get<string>('databasePath')!;
        // TypeORM will not create the directory, and a missing one is a
        // confusing SQLITE_CANTOPEN rather than something actionable.
        mkdirSync(dirname(database), { recursive: true });

        return {
          type: 'better-sqlite3' as const,
          database,
          entities: [Release, DownloadLink],
          // Fine for a single-table-ish content site with one writer. A real
          // migration story would be overkill here and a liability to maintain.
          synchronize: true,
        };
      },
    }),

    // In production the API also serves the built site, so the whole thing is
    // one process behind one port — no CORS, no second deployment, no reverse
    // proxy to configure. In development Vite serves the site instead.
    ...(existsSync(clientDir)
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
