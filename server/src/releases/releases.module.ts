import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownloadLink } from '../downloads/download-link.entity';
import { DownloadsController } from '../downloads/downloads.controller';
import { DownloadsService } from '../downloads/downloads.service';
import { Release } from './release.entity';
import { AdminReleasesController, ReleasesController } from './releases.controller';
import { ReleasesService } from './releases.service';

@Module({
  imports: [TypeOrmModule.forFeature([Release, DownloadLink])],
  controllers: [ReleasesController, AdminReleasesController, DownloadsController],
  providers: [ReleasesService, DownloadsService],
  exports: [ReleasesService],
})
export class ReleasesModule {}
