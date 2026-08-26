import { ArrowRight, Download } from 'lucide-react';
import { WordReveal } from '../components/WordReveal';
import { ButtonAnchor, ButtonLink } from '../components/Button';
import { HeroScene } from '../components/HeroScene';
import { downloadHref, type Release } from '../lib/api';
import { SUBTITLE, TAGLINE } from '../content/site';
import './Hero.css';

interface HeroProps {
  latest: Release | null | undefined;
  loading: boolean;
}

export function Hero({ latest, loading }: HeroProps) {
  // The Windows build is the one the hero offers. Everything else lives on the
  // download page — a hero with four buttons is a hero that has decided nothing.
  const windows = latest?.downloads.find((link) => link.platform === 'windows');

  return (
    <section className="hero">
      <div className="hero__glow" aria-hidden="true" />

      <div className="container hero__inner">
        <div className="hero__copy">
          {loading ? (
            <div className="skeleton hero__chip-skeleton" />
          ) : latest ? (
            <span className="chip chip--accent hero__chip">
              <span className="mono">v{latest.version}</span>
              <span className="hero__chip-divider" />
              {latest.title || 'Out now'}
            </span>
          ) : (
            <span className="chip hero__chip">Windows · Android</span>
          )}

          {/*
            Word by word, not letter by letter. Per-character staggering on a
            headline this size is the most over-used effect on the web and it
            makes the text unreadable while it plays; per-word is quick and has
            settled before anyone finishes reading it.
          */}
          <WordReveal text={TAGLINE} as="h1" className="display hero__title" />

          <p className="lede hero__lede">{SUBTITLE}</p>

          <div className="hero__actions">
            {windows ? (
              /*
                A real anchor to the redirect endpoint. Clicking it downloads the
                file — it does not open GitHub, and it does not open anything
                else. That is the entire point of routing through /go.
              */
              <ButtonAnchor
                href={downloadHref(windows)}
                variant="primary"
                size="lg"
                icon={<Download size={17} strokeWidth={2.1} />}
              >
                Download for Windows
              </ButtonAnchor>
            ) : (
              <ButtonLink
                to="/download"
                variant="primary"
                size="lg"
                icon={<Download size={17} strokeWidth={2.1} />}
              >
                Get Slate
              </ButtonLink>
            )}

            <ButtonLink
              to="/download"
              variant="secondary"
              size="lg"
              trailingIcon={<ArrowRight size={16} strokeWidth={2.1} />}
            >
              All downloads
            </ButtonLink>
          </div>

          <p className="hero__foot">
            Free and open source.{' '}
            {windows?.size ? (
              <>
                <span className="mono">{windows.size}</span> · Windows 10 and 11,
                64-bit.
              </>
            ) : (
              <>Windows 10 and 11, 64-bit.</>
            )}
          </p>
        </div>

        <div className="hero__scene">
          <HeroScene />
        </div>
      </div>
    </section>
  );
}
