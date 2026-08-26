import { Fragment } from 'react';
import './WordReveal.css';

/*
  A headline that rises word by word.

  This exists because the React Bits SplitText it replaces left the hero
  invisible. SplitText drives its tween from a GSAP ScrollTrigger, and a
  trigger whose start is already behind the viewport at first paint does not
  always fire — so the words stayed at `opacity: 0` and the most important
  sentence on the site never appeared. Verified in a real browser, not guessed:
  the split spans were in the DOM with a computed opacity of exactly 0.

  The rule this encodes: text above the fold must never need JavaScript to
  become visible. Here the reveal is a plain CSS animation with a staggered
  delay — no observer, no trigger, no library, nothing that can decline to run.

  Words stay real text nodes with real spaces between them, so selecting and
  copying the headline gives you the sentence rather than "Yourphoneisthe".
*/

interface WordRevealProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'p';
  /** Seconds before the first word moves. */
  delay?: number;
  /** Seconds between words. */
  stagger?: number;
}

export function WordReveal({
  text,
  className,
  as: Tag = 'h1',
  delay = 0.06,
  stagger = 0.055,
}: WordRevealProps) {
  const words = text.split(' ');

  return (
    <Tag className={['reveal', className].filter(Boolean).join(' ')}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="reveal__word">
            <span
              className="reveal__inner"
              style={{ animationDelay: `${delay + index * stagger}s` }}
            >
              {word}
            </span>
          </span>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}
