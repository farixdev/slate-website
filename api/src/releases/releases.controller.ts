import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpsertReleaseDto } from './release.dto';
import { ReleasesService } from './releases.service';

/** The public half. Anyone can read published releases. */
@Controller('api/releases')
export class ReleasesController {
  constructor(private readonly releases: ReleasesService) {}

  @Get()
  findAll() {
    return this.releases.findAll(false);
  }

  @Get('latest')
  findLatest() {
    return this.releases.findLatest();
  }
}

/** The admin half. Every route needs a token. */
@UseGuards(JwtAuthGuard)
@Controller('api/admin/releases')
export class AdminReleasesController {
  constructor(private readonly releases: ReleasesService) {}

  @Get()
  findAll() {
    // Drafts included: this is the editing view.
    return this.releases.findAll(true);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.releases.findOne(id);
  }

  @Post()
  create(@Body() dto: UpsertReleaseDto) {
    return this.releases.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpsertReleaseDto) {
    return this.releases.update(id, dto);
  }

  @Post(':id/latest')
  markLatest(@Param('id') id: string) {
    return this.releases.markLatest(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.releases.remove(id);
  }
}
