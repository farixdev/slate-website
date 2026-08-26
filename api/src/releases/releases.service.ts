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

  /**
   * Saves an edited release, reconciling its download links rather than
   * replacing them.
   *
   * The obvious implementation — delete every link, insert the submitted set —
   * is wrong in two ways that are both invisible until they bite:
   *
   *   * every link gets a new id, so `/api/downloads/<old-id>/go` starts
   *     answering 404. That endpoint exists precisely to be a stable public URL
   *     that outlives the asset behind it, and an id that changes whenever
   *     someone fixes a typo in a label is not stable;
   *   * `clicks` is a column on the row, so deleting the row throws the
   *     download count away. An admin correcting a filename would silently
   *     reset the statistics the admin panel reports.
   *
   * So: a link that arrives carrying an id it already owns is updated in place,
   * one without an id is inserted, and one that is no longer in the submitted
   * set is deleted. All of it in a transaction, because a failure halfway
   * through would leave the release describing links that no longer exist.
   */
  async update(id: string, dto: UpsertReleaseDto) {
    const release = await this.findOne(id);

    release.version = dto.version;
    release.title = dto.title ?? '';
    release.notes = dto.notes ?? '';
    release.releasedAt = dto.releasedAt;
    release.published = dto.published ?? false;

    const submitted = dto.downloads ?? [];
    const existing = await this.links.find({ where: { releaseId: id } });

    // Keyed by id so a submitted link can only ever match one that already
    // belongs to *this* release — an id borrowed from another release must not
    // let an edit reach across and take it over.
    const owned = new Map(existing.map((link) => [link.id, link]));
    const kept = new Set<string>();

    const rows = submitted.map((link, index) => {
      // Optional fields are written explicitly rather than merged, so clearing
      // one in the form actually clears it instead of leaving the old value.
      const fields = {
        platform: link.platform,
        label: link.label,
        detail: link.detail ?? '',
        url: link.url,
        filename: link.filename ?? '',
        size: link.size ?? '',
        checksum: link.checksum ?? '',
        sortOrder: link.sortOrder ?? index,
      };

      const current = link.id ? owned.get(link.id) : undefined;
      if (current) {
        kept.add(current.id);
        // `clicks` is deliberately absent from `fields`, so it survives.
        return Object.assign(current, fields);
      }
      return this.links.create({ ...fields, releaseId: id });
    });

    const orphaned = existing
      .filter((link) => !kept.has(link.id))
      .map((link) => link.id);

    await this.dataSource.transaction(async (manager) => {
      if (orphaned.length > 0) {
        await manager.delete(DownloadLink, orphaned);
      }
      release.downloads = rows;
      await manager.save(Release, release);
    });

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
