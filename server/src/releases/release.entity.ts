import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DownloadLink } from '../downloads/download-link.entity';

/**
 * One shipped version of Slate.
 *
 * A release owns both its changelog and its download links, because in practice
 * they are the same announcement: "1.0.0 is out, here is what changed, here is
 * where to get it." Splitting them would let the site show a version with no
 * way to download it, or a download with no idea what is in it.
 */
@Entity('releases')
export class Release {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Semantic version without a leading v, e.g. `1.0.0`. */
  @Column({ unique: true })
  version!: string;

  /** Short headline, e.g. "First public release". */
  @Column({ default: '' })
  title!: string;

  /** Markdown body shown on the changelog page. */
  @Column({ type: 'text', default: '' })
  notes!: string;

  /** ISO date the version shipped. Separate from createdAt, which is when the
   *  row was written — backfilling an old release should not date it today. */
  @Column({ type: 'date' })
  releasedAt!: string;

  /**
   * Drafts are invisible to the public site.
   *
   * Lets an admin write the changelog while a build is still uploading, rather
   * than having to compose it in one sitting against a live page.
   */
  @Column({ default: false })
  published!: boolean;

  /** Marks the version the download buttons point at. Exactly one at a time. */
  @Column({ default: false })
  latest!: boolean;

  @OneToMany(() => DownloadLink, (link) => link.release, {
    cascade: true,
    eager: true,
  })
  downloads!: DownloadLink[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
