import type { ReactNode } from 'react';
import './Markdown.css';

/*
  A deliberately small Markdown renderer for changelog bodies.

  Two reasons it is hand-written rather than a dependency:

  * Safety. It builds React elements — there is no `dangerouslySetInnerHTML`
    anywhere below, so a changelog is text no matter what an admin types into
    it. A general-purpose renderer plus a sanitiser would be two dependencies
    and a configuration mistake waiting to happen, for a body that only ever
    contains headings, bullets and links.
  * Control. Changelogs here are Keep a Changelog shaped: `###` sections, `-`
    bullets, the odd bit of `code`. Supporting exactly that means the output can
    be styled precisely instead of defensively.

  What it understands: `##`/`###` headings, `-`/`*` bullets, paragraphs,
  `**bold**`, `` `code` ``, and `[text](https://url)`. Anything else renders as
  the literal text it is, which is the right failure mode for a changelog.
*/

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={['md', className].filter(Boolean).join(' ')}>
      {renderBlocks(children)}
    </div>
  );
}

function renderBlocks(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const out: ReactNode[] = [];

  let paragraph: string[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    out.push(<p key={key++}>{renderInline(paragraph.join(' '))}</p>);
    paragraph = [];
  };

  const flushBullets = () => {
    if (bullets.length === 0) return;
    out.push(
      <ul key={key++}>
        {bullets.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  // A blank line, a heading or a change of block type ends whatever is open.
  const flushAll = () => {
    flushParagraph();
    flushBullets();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.trim() === '') {
      flushAll();
      continue;
    }

    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const text = renderInline(heading[2]);
      out.push(
        level === 2 ? (
          <h3 key={key++}>{text}</h3>
        ) : level === 3 ? (
          <h4 key={key++}>{text}</h4>
        ) : (
          <h5 key={key++}>{text}</h5>
        ),
      );
      continue;
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      bullets.push(bullet[1]);
      continue;
    }

    // A continuation line inside a bullet — Keep a Changelog wraps at 80 columns
    // and the wrapped half belongs to the bullet above it, not to a new one.
    if (bullets.length > 0 && /^\s{2,}\S/.test(raw)) {
      bullets[bullets.length - 1] += ` ${line.trim()}`;
      continue;
    }

    flushBullets();
    paragraph.push(line.trim());
  }

  flushAll();
  return out;
}

/** Inline spans: bold, code and links, applied in that order of precedence. */
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // One pass, one regex, three alternatives — so a `**bold**` inside a link and
  // a `[link]` inside code cannot fight over the same characters.
  const pattern = /(\*\*(.+?)\*\*)|(`([^`]+?)`)|(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;

  let cursor = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    if (match[2] !== undefined) {
      nodes.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(<code key={key++}>{match[4]}</code>);
    } else if (match[6] !== undefined && match[7] !== undefined) {
      // Only http(s) reaches here — the pattern requires it — so no
      // `javascript:` href can be constructed from a changelog body.
      nodes.push(
        <a key={key++} className="link" href={match[7]} target="_blank" rel="noreferrer noopener">
          {match[6]}
        </a>,
      );
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}
