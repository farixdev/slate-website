import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownloadLink } from './download-link.entity';

@Injectable()
export class DownloadsService {
  constructor(
    @InjectRepository(DownloadLink)
    private readonly links: Repository<DownloadLink>,
  ) {}

  async findOne(id: string) {
    const link = await this.links.findOne({ where: { id } });
    if (!link) throw new NotFoundException('That download does not exist.');
    return link;
  }

  /**
   * Counts a click without making the visitor wait for it.
   *
   * The redirect is the thing the user is waiting on, so the counter is
   * incremented and the promise is deliberately not awaited by the caller. A
   * lost count is invisible; a download that took an extra database round trip
   * to start is not.
   */
  recordClick(id: string) {
    return this.links.increment({ id }, 'clicks', 1).catch(() => undefined);
  }

  /** Totals for the admin dashboard. */
  async stats() {
    const rows = await this.links.find({ order: { clicks: 'DESC' } });
    return {
      total: rows.reduce((sum, row) => sum + row.clicks, 0),
      byPlatform: rows.reduce<Record<string, number>>((acc, row) => {
        acc[row.platform] = (acc[row.platform] ?? 0) + row.clicks;
        return acc;
      }, {}),
      links: rows.map((row) => ({
        id: row.id,
        label: row.label,
        platform: row.platform,
        clicks: row.clicks,
      })),
    };
  }
}
