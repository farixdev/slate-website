import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DownloadLink } from '../downloads/download-link.entity';
import { Release } from './release.entity';
import { UpsertReleaseDto } from './release.dto';

@Injectable()
export class ReleasesService {
  constructor(
    @InjectRepository(Release) private readonly releases: Repository<Release>,
    @InjectRepository(DownloadLink) private readonly links: Repository<DownloadLink>,
    private readonly dataSource: DataSource,
  ) {}

  /** Newest first. Drafts are excluded unless the caller is an admin. */
  findAll(includeDrafts = false) {
    return this.releases.find({
      where: includeDrafts ? {} : { published: true },
      order: { releasedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const release = await this.releases.findOne({ where: { id } });
    if (!release) throw new NotFoundException('That release does not exist.');
    return release;
  }

  /**
   * The version the download buttons point at.
   *
   * Falls back to the newest published release when nothing is flagged, so the
   * front page still has working buttons if someone clears the flag.
   */
  async findLatest() {
    const flagged = await this.releases.findOne({
      where: { latest: true, published: true },
    });
    if (flagged) return flagged;

    const [newest] = await this.releases.find({
      where: { published: true },
      order: { releasedAt: 'DESC' },
      take: 1,
    });
    return newest ?? null;
  }

  async create(dto: UpsertReleaseDto) {
    const release = this.releases.create({
      version: dto.version,
      title: dto.title ?? '',
      notes: dto.notes ?? '',
      releasedAt: dto.releasedAt,
      published: dto.published ?? false,
      latest: false,
      downloads: (dto.downloads ?? []).map((link, index) =>
        this.links.create({ ...link, sortOrder: link.sortOrder ?? index }),
      ),
    });

    const saved = await this.releases.save(release);
    if (dto.latest) await this.markLatest(saved.id);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpsertReleaseDto) {
    const release = await this.findOne(id);

    release.version = dto.version;
    release.title = dto.title ?? '';
    release.notes = dto.notes ?? '';
    release.releasedAt = dto.releasedAt;
    release.published = dto.published ?? false;

    // Replace the links wholesale. The admin form always sends the complete
    // set, and diffing them would leave orphans behind on any edit that
    // removed one.
    await this.links.delete({ releaseId: id });
    release.downloads = (dto.downloads ?? []).map((link, index) =>
      this.links.create({
        ...link,
        id: undefined,
        releaseId: id,
        sortOrder: link.sortOrder ?? index,
      }),
    );

    await this.releases.save(release);
    if (dto.latest) await this.markLatest(id);
    return this.findOne(id);
  }

  async remove(id: string) {
    const release = await this.findOne(id);
    await this.releases.remove(release);
    return { ok: true };
  }

  /**
   * Flags one release as the current one.
   *
   * Done in a transaction: clearing every flag and setting one must not be
   * interruptible, or the site can be left with no latest release and dead
   * download buttons.
   */
  async markLatest(id: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.update(Release, { latest: true }, { latest: false });
      await manager.update(Release, { id }, { latest: true });
    });
    return this.findOne(id);
  }
}
