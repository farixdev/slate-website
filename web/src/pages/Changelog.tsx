import { Download as DownloadIcon } from 'lucide-react';
import { Markdown } from '../components/Markdown';
import { ButtonAnchor } from '../components/Button';
import { downloadHref, type Release } from '../lib/api';
import { useReleases } from '../lib/useReleases';
import { usePageTitle } from '../lib/usePageTitle';
import { formatDate } from '../lib/format';
import { GITHUB_RELEASES } from '../content/site';
import './Changelog.css';

export function Changelog() {
  usePageTitle('Changelog — Slate');
  const { data: releases, loading, error } = useReleases();

  return (
    <div className="section section--page">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">Changelog</p>
          <h1 className="display">What has changed</h1>
          <p className="lede">
            Every release, what went into it, and where to get it. Slate follows
            semantic versioning, and the wire protocol carries its own version
            because a phone and a PC can be on different app versions and still
            have to understand each other.
          </p>
        </header>

        {loading && <ChangelogSkeleton />}

        {error && !loading && <p className="state state--error">{error}</p>}

        {!loading && !error && releases?.length === 0 && (
          <p className="state">
            Nothing published yet. Builds appear on{' '}
            <a className="link" href={GITHUB_RELEASES} target="_blank" rel="noreferrer noopener">
              GitHub
            </a>{' '}
            first.
          </p>
        )}

        {!loading && !error && releases && releases.length > 0 && (
          <div className="log">
            {releases.map((release) => (
              <ReleaseEntry key={release.id} release={release} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReleaseEntry({ release }: { release: Release }) {
  const windows = release.downloads.find((link) => link.platform === 'windows');

  return (
    <article className="log__entry">
      {/*
        The version rail is sticky on wide screens: scroll into a long changelog
        and you can still see which release you are reading. On narrow screens it
        becomes an ordinary header, because a sticky element in a single column
        just eats the viewport.
      */}
      <div className="log__rail">
        <h2 className="log__version mono">
          {release.version}
          {release.latest && <span className="log__latest">Latest</span>}
        </h2>
        <time className="log__date" dateTime={release.releasedAt}>
          {formatDate(release.releasedAt)}
        </time>

        {windows && (
          <ButtonAnchor
            href={downloadHref(windows)}
            download={windows.filename || undefined}
            variant="secondary"
            className="log__download"
            icon={<DownloadIcon size={15} strokeWidth={2} />}
          >
            Download
          </ButtonAnchor>
        )}
      </div>

      <div className="log__body">
        {release.title && <h3 className="log__title">{release.title}</h3>}
        {release.notes ? (
          <Markdown>{release.notes}</Markdown>
        ) : (
          <p className="body">No notes were published for this release.</p>
        )}
      </div>
    </article>
  );
}

function ChangelogSkeleton() {
  return (
    <div className="log">
      {[0, 1].map((index) => (
        <div className="log__entry" key={index}>
          <div className="log__rail">
            <div className="skeleton" style={{ width: 84, height: 26 }} />
            <div className="skeleton" style={{ width: 120, height: 14, marginTop: 12 }} />
          </div>
          <div className="log__body">
            <div className="skeleton" style={{ width: '40%', height: 22 }} />
            <div className="skeleton" style={{ width: '100%', height: 14, marginTop: 20 }} />
            <div className="skeleton" style={{ width: '92%', height: 14, marginTop: 10 }} />
            <div className="skeleton" style={{ width: '78%', height: 14, marginTop: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
