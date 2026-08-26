import {
  Hand,
  Keyboard,
  Monitor,
  MousePointer2,
  MoveVertical,
  Radar,
  ShieldCheck,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import AnimatedContent from '../reactbits/Animations/AnimatedContent/AnimatedContent';
import CountUp from '../reactbits/TextAnimations/CountUp/CountUp';
import SpotlightCard from '../reactbits/Components/SpotlightCard/SpotlightCard';
import { ButtonAnchor, ButtonLink } from '../components/Button';
import { downloadHref, type Release } from '../lib/api';
import { FAQ, FEATURES, PILLARS, SPECS, STEPS } from '../content/site';
import './HomeSections.css';

const ICONS: Record<string, LucideIcon> = {
  pointer: MousePointer2,
  waves: Waves,
  scroll: MoveVertical,
  gestures: Hand,
  keyboard: Keyboard,
  radar: Radar,
  zap: Zap,
  monitor: Monitor,
};

/* -------------------------------------------------------------------------- */
/* Pillars                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Four claims in a hairline grid.
 *
 * Deliberately not cards. Cards would make this the third boxed grid on the
 * page; rules between columns give the same structure at a fraction of the
 * visual weight, and they let the section sit quietly under the hero.
 */
export function Pillars() {
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="pillars">
          {PILLARS.map((pillar) => (
            <div className="pillars__item" key={pillar.id}>
              <span className="pillars__label mono">{pillar.label}</span>
              <h3 className="title pillars__title">{pillar.title}</h3>
              <p className="pillars__body">{pillar.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Features                                                                   */
/* -------------------------------------------------------------------------- */

export function Features() {
  return (
    <section className="section section--ruled" id="features">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">What is in it</p>
          <h2 className="headline">
            The details that decide whether a trackpad feels good or feels wrong.
          </h2>
          <p className="lede">
            Most of this is invisible when it works. It is also the whole
            difference between a remote-mouse toy and something you would
            actually use to get through an afternoon.
          </p>
        </header>

        <div className="features">
          {FEATURES.map((feature, index) => {
            const Icon = ICONS[feature.icon] ?? Zap;
            return (
              <AnimatedContent
                key={feature.title}
                distance={26}
                duration={0.6}
                /* Staggered by column position, not by index. A long serial
                   stagger makes the last card arrive noticeably late. */
                delay={(index % 4) * 0.05}
                threshold={0.15}
                ease="power3.out"
              >
                <SpotlightCard
                  className="feature"
                  spotlightColor="rgba(124, 108, 255, 0.14)"
                >
                  <span className="feature__icon">
                    <Icon size={19} strokeWidth={1.7} />
                  </span>
                  <h3 className="feature__title">{feature.title}</h3>
                  <p className="feature__body">{feature.body}</p>
                </SpotlightCard>
              </AnimatedContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* How it works                                                               */
/* -------------------------------------------------------------------------- */

export function HowItWorks() {
  return (
    <section className="section section--ruled">
      <div className="container">
        <div className="how">
          <header className="how__head">
            <p className="eyebrow">Setting up</p>
            <h2 className="headline">Three steps, once.</h2>
            <p className="body how__note">
              No account, no cloud service, no driver. Slate talks to your PC
              over your own network and nowhere else.
            </p>
          </header>

          <ol className="how__steps">
            {STEPS.map((step) => (
              <li className="how__step" key={step.n}>
                <span className="how__n mono">{step.n}</span>
                <div>
                  <h3 className="title">{step.title}</h3>
                  <p className="how__body">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Specs                                                                      */
/* -------------------------------------------------------------------------- */

/** Counts up if the value is a plain number, otherwise renders it as written.
 *  `5–13` is not a number and should not be animated into one. */
function SpecValue({ value }: { value: string }) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || value.trim() === '') {
    return <span>{value}</span>;
  }
  return <CountUp to={numeric} duration={1.4} separator="" />;
}

export function Specs() {
  return (
    <section className="section--tight specs-band">
      <div className="container">
        <dl className="specs">
          {SPECS.map((spec) => (
            <div className="specs__item" key={spec.label}>
              <dt className="specs__label">{spec.label}</dt>
              <dd className="specs__value mono">
                <SpecValue value={spec.value} />
                <span className="specs__unit">{spec.unit}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Security                                                                   */
/* -------------------------------------------------------------------------- */

const GUARANTEES = [
  'A device sends nothing until someone at the PC authorises it.',
  'Pairing issues a random 32-byte token, and it crosses the network once.',
  'Every later session answers a fresh HMAC-SHA256 challenge, so a captured session cannot be replayed.',
  'Five wrong codes and the code is thrown away and pairing closes.',
  'Tokens live in the Android Keystore and the iOS Keychain.',
  'Revoking a phone disconnects it immediately.',
];

export function Security() {
  return (
    <section className="section section--ruled">
      <div className="container">
        <div className="security">
          <div>
            <p className="eyebrow">Security</p>
            <h2 className="headline">
              It controls your computer. That deserves more than a shared
              password.
            </h2>
            <p className="lede security__lede">
              Anything on your network can open a socket to anything else. So the
              question is not whether a stranger can reach the port — it is what
              happens when they do. The answer is nothing.
            </p>
          </div>

          <ul className="security__list">
            {GUARANTEES.map((line) => (
              <li key={line}>
                <ShieldCheck size={16} strokeWidth={1.9} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Built on `<details>`.
 *
 * Keyboard support, screen-reader semantics and find-in-page all work for free,
 * and none of them come free with a div that toggles a class.
 */
export function Faq() {
  return (
    <section className="section section--ruled" id="faq">
      <div className="container container--narrow">
        <header className="section-head">
          <p className="eyebrow">Questions</p>
          <h2 className="headline">The things people ask first.</h2>
        </header>

        <div className="faq">
          {FAQ.map((item) => (
            <details className="faq__item" key={item.q}>
              <summary className="faq__q">
                <span>{item.q}</span>
                <span className="faq__marker" aria-hidden="true" />
              </summary>
              <div className="faq__a">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Closing call to action                                                     */
/* -------------------------------------------------------------------------- */

export function CtaBand({ latest }: { latest: Release | null | undefined }) {
  const windows = latest?.downloads.find((link) => link.platform === 'windows');

  return (
    <section className="section">
      <div className="container">
        <div className="cta">
          <div className="cta__glow" aria-hidden="true" />
          <h2 className="headline cta__title">Try it in about a minute.</h2>
          <p className="lede cta__lede">
            Unzip the companion, scan the code, and move your thumb. If it is not
            better than reaching for the mouse, delete it — there is nothing to
            cancel.
          </p>
          <div className="cta__actions">
            {windows && (
              <ButtonAnchor href={downloadHref(windows)} variant="primary" size="lg">
                Download for Windows
              </ButtonAnchor>
            )}
            <ButtonLink to="/download" variant="secondary" size="lg">
              All platforms
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
