import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DownloadsService } from './downloads.service';

@Controller('api/downloads')
export class DownloadsController {
  constructor(private readonly downloads: DownloadsService) {}

  /**
   * Starts a download.
   *
   * This is the endpoint every button on the site points at, and the reason it
   * exists is the one thing the product owner asked for explicitly: clicking
   * Download must download, not open GitHub.
   *
   * A plain `<a href="https://github.com/...">` to a release asset works, but it
   * is fragile — the URL changes with every version, it leaks the exact asset
   * path into the markup, and nothing can be counted. Redirecting from here
   * keeps one stable public URL per platform, lets the target change without
   * touching the site, and gives the admin panel a click count.
   *
   * 302 rather than 301: a permanent redirect would be cached by the browser
   * and keep pointing at 1.0.0 long after 1.1.0 shipped.
   */
  @Get(':id/go')
  async go(@Param('id') id: string, @Res() res: Response) {
    const link = await this.downloads.findOne(id);

    // Not awaited: the visitor should not wait on a counter to start a download.
    void this.downloads.recordClick(id);

    return res.redirect(302, link.url);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  stats() {
    return this.downloads.stats();
  }
}
