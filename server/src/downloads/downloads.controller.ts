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
   * exists is the thing the product owner asked for explicitly: clicking
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

    /*
      The click is counted *before* the redirect is sent, and that ordering is
      load-bearing once this runs on serverless.

      It used to be fire-and-forget — `void recordClick(id)` — which is right
      for a long-lived server: the promise settles microseconds later on a
      process that is still running, and the visitor never waits on a counter.
      A serverless platform freezes the execution context the instant the
      response is flushed, so that pending write is simply abandoned. The count
      would not be slightly low, it would be near zero, and it would look like
      nobody was downloading rather than like a bug.

      So it is awaited. It costs one indexed UPDATE against a database this
      request is already talking to, and `recordClick` swallows its own errors,
      so a counter that fails can never stop a download from starting.

      (Vercel's `waitUntil` would instead keep the instance alive for a
      background promise. Awaiting is a few milliseconds slower and works
      everywhere, including the local server — the better trade for one small
      write.)
    */
    await this.downloads.recordClick(id);

    /*
      302 is on the list of status codes Vercel's CDN is allowed to cache. The
      platform default (`max-age=0, must-revalidate`) already prevents it, but
      leaving this to a default would be unwise: a cached redirect would pin
      visitors to an old asset and — because the request would then never reach
      this function again — stop counting clicks at the same time.
    */
    res.setHeader('Cache-Control', 'no-store');

    return res.redirect(302, link.url);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  stats() {
    return this.downloads.stats();
  }
}
