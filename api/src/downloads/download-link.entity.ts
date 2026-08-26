import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Release } from '../releases/release.entity';

export type Platform = 'windows' | 'android' | 'ios' | 'other';

/**
 * Somewhere a user can get a build.
 *
 * The URL normally points at a GitHub release asset. The site never links to it
 * directly: every button goes through `/api/downloads/:id/go`, which redirects.
 * That is what makes a click download the file instead of opening GitHub, and
 * it is also the only place a download can be counted.
 */
@Entity('download_links')
export class DownloadLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  platform!: Platform;

  /** What the button says, e.g. "Download for Windows". */
  @Column()
  label!: string;

  /** Secondary line, e.g. "Windows 10 and 11 · 64-bit". */
  @Column({ default: '' })
  detail!: string;

  /** The real asset URL. Usually a GitHub release download link. */
  @Column({ type: 'text' })
  url!: string;

  /** Filename suggested to the browser, so the saved file is not named after
   *  a redirect path. */
  @Column({ default: '' })
  filename!: string;

  /** Human-readable size, e.g. "63.2 MB". Shown next to the button so nobody
   *  is surprised by what they just started. */
  @Column({ default: '' })
  size!: string;

  /** Optional SHA-256, published so a cautious user can verify the download. */
  @Column({ default: '' })
  checksum!: string;

  @Column({ default: 0 })
  clicks!: number;

  @Column({ default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Release, (release) => release.downloads, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'releaseId' })
  release!: Release;

  @Column()
  releaseId!: string;
}
