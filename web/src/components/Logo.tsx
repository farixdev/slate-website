/*
  The Slate mark.

  It is the app icon drawn as vector: a trackpad outline with a single lit
  contact point near the top right. The idea is the whole product in one glyph —
  a surface, and a touch on it that turns into a cursor. Nothing else is needed,
  and anything else added would be decoration.

  The dot sits off-centre deliberately. Centred, it reads as a button or a
  record light; offset, it reads as a finger that landed somewhere, which is
  what it is.
*/

interface MarkProps {
  size?: number;
  /** Unique per instance: two SVGs on a page must not share gradient ids. */
  idPrefix?: string;
  className?: string;
}

let markCounter = 0;

export function Logo({ size = 28, idPrefix, className }: MarkProps) {
  // A stable-enough id without pulling in useId's server/client machinery for a
  // decorative gradient. Collisions across instances are the only failure mode
  // and an incrementing counter rules them out.
  const uid = idPrefix ?? `slate-mark-${++markCounter}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-dot`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-alt)" />
        </linearGradient>
      </defs>

      {/* The surface. A 4:3 plate with the same corner radius as the icon. */}
      <rect
        x="5.5"
        y="9.5"
        width="37"
        height="29"
        rx="7.5"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="2.4"
      />

      {/* The contact point. */}
      <circle cx="31.5" cy="20.5" r="5.6" fill={`url(#${uid}-dot)`} />
    </svg>
  );
}

/** Mark plus name, for the header and the footer. */
export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <span className="wordmark">
      <Logo size={size} />
      <span className="wordmark__text">Slate</span>
    </span>
  );
}
