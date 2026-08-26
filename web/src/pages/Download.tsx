import { useState } from 'react';
import { Apple, Check, Copy, Download as DownloadIcon, Monitor, Smartphone } from 'lucide-react';
import { GithubMark } from '../components/GithubMark';
import { ButtonAnchor } from '../components/Button';
import { downloadHref, type DownloadLink, type Platform, type Release } from '../lib/api';
import { useLatestRelease } from '../lib/useReleases';
import { usePageTitle } from '../lib/usePageTitle';
import { formatDate } from '../lib/format';
import { GITHUB_RELEASES, GITHUB_REPO } from '../content/site';
import './Download.css';

const PLATFORM_ICON = {
  windows: Monitor,
  android: Smartphone,
  ios: Apple,
  other: DownloadIcon,
} as const;

const PLATFORM_NAME: Record<Platform, string> = {
  windows: 'Windows',
  android: 'Android',
  ios: 'iOS',
  other: 'Other',
};

const INSTALL_NOTES: Partial<Record<Platform, string[]>> = {
  windows: [
    'Unzip anywhere — the folder is the app; there is no installer.',
    'Run slate_desktop.exe. Windows may show a SmartScreen warning the first time because the build is not code-signed; choose More info, then Run anyway.',
    'Allow it through the firewall on Private networks when asked. Without that your phone cannot reach it.',
  ],
  android: [
    'Open the .apk and allow installs from your browser if Android asks.',
    'This build is signed with a release key but is not distributed through Play, so Play Protect will ask you to confirm once.',
    'Give it permission to use the camera only if you want to pair by QR code.',
  ],
};

export function Download() {
  usePageTitle('Download Slate');
  const { data: release, loading, error } = useLatestRelease();

  return (
    <div className="section section--page">
      <div className="container">
        <header className="section-head download__head">
          <p className="eyebrow">Download</p>
          <h1 className="display download__title">Get Slate</h1>
          <p className="lede">
            Free, no account, nothing to sign up for. The companion runs on your
            PC and the app runs on your phone — you need both.
          </p>
        </header>

        {loading && <DownloadSkeleton />}

        {error && !loading && (
          <p className="state state--error">
            {error} — the builds are also on{' '}
            <a className="link" href={GITHUB_RELEASES} target="_blank" rel="noreferrer noopener">
              GitHub Releases
            </a>
            .
          </p>
        )}

        {!loading && !error && release && <DownloadGrid release={release} />}

        {!loading && !error && !release && (
          <p className="state">
            No build has been published yet. Check{' '}
            <a className="link" href={GITHUB_RELEASES} target="_blank" rel="noreferrer noopener">
              GitHub Releases
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}

function DownloadGrid({ release }: { release: Release }) {
  const sorted = [...release.downloads].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <div className="download__version">
        <span className="chip chip--accent mono">v{release.version}</span>
        <span className="download__released">
          Released {formatDate(release.releasedAt)}
        </span>
        <a className="link download__all" href={GITHUB_RELEASES} target="_blank" rel="noreferrer noopener">
          Older versions
        </a>
      </div>

      <div className="download__grid">
        {sorted.map((link) => (
          <PlatformCard key={link.id} link={link} />
        ))}
        <SourceCard />
      </div>

      <section className="download__notes">
        {sorted.map((link) =>
          INSTALL_NOTES[link.platform] ? (
            <div className="download__note" key={link.id}>
              <h2 className="download__note-title">
                Installing on {PLATFORM_NAME[link.platform]}
              </h2>
              <ol>
                {INSTALL_NOTES[link.platform]!.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null,
        )}
      </section>
    </>
  );
}

function PlatformCard({ link }: { link: DownloadLink }) {
  const Icon = PLATFORM_ICON[link.platform] ?? DownloadIcon;

  return (
    <article className="dl-card">
      <span className="dl-card__icon">
        <Icon size={22} strokeWidth={1.6} />
      </span>

      <h2 className="dl-card__platform">{PLATFORM_NAME[link.platform]}</h2>
      {link.detail && <p className="dl-card__detail">{link.detail}</p>}

      <dl className="dl-card__meta">
        {link.size && (
          <div>
            <dt>Size</dt>
            <dd className="mono">{link.size}</dd>
          </div>
        )}
        {link.filename && (
          <div>
            <dt>File</dt>
            <dd className="mono dl-card__filename">{link.filename}</dd>
          </div>
        )}
      </dl>

      {/*
        An `<a href>` straight at the redirect endpoint, which answers 302 with
        the GitHub asset URL. The browser follows it into a normal file
        download: no new tab, no GitHub page, no JavaScript in the way.

        `download` is set so the saved file is named after the asset rather than
        after the redirect path. It is only a hint across origins, which is
        exactly why the server also sends the real filename.
      */}
      <ButtonAnchor
        href={downloadHref(link)}
        download={link.filename || undefined}
        variant="primary"
        size="lg"
        className="dl-card__button"
        icon={<DownloadIcon size={17} strokeWidth={2.1} />}
      >
        {link.label}
      </ButtonAnchor>

      {link.checksum && <Checksum value={link.checksum} />}
    </article>
  );
}

/** SHA-256 with a copy button, for anyone who wants to verify what they got. */
function Checksum({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be refused; the value is selectable either way.
    }
  };

  return (
    <div className="dl-card__checksum">
      <span className="dl-card__checksum-label">SHA-256</span>
      <code className="mono">{value}</code>
      <button onClick={copy} aria-label="Copy checksum" title="Copy checksum">
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

/** iOS has no binary to hand out, so it says so rather than showing a dead
 *  button next to two live ones. */
function SourceCard() {
  return (
    <article className="dl-card dl-card--quiet">
      <span className="dl-card__icon dl-card__icon--quiet">
        <Apple size={22} strokeWidth={1.6} />
      </span>

      <h2 className="dl-card__platform">iOS</h2>
      <p className="dl-card__detail">
        The iPhone app is finished, but shipping a build needs an Apple Developer
        account. Clone the repository and run it on your own device today.
      </p>

      <ButtonAnchor
        href={GITHUB_REPO}
        external
        variant="secondary"
        size="lg"
        className="dl-card__button"
        icon={<GithubMark size={16} />}
      >
        Build from source
      </ButtonAnchor>
    </article>
  );
}

function DownloadSkeleton() {
  return (
    <div className="download__grid">
      {[0, 1, 2].map((index) => (
        <div className="skeleton dl-card__skeleton" key={index} />
      ))}
    </div>
  );
}
