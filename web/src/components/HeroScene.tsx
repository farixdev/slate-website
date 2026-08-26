import './HeroScene.css';

/*
  The product, drawn.

  Every trackpad site puts a photo of a phone next to a laptop. That shows the
  two objects but not the thing that matters, which is the *link* between them:
  a finger moves here, the cursor moves there, at the same instant.

  So the finger and the cursor share one animation. Their keyframes are the same
  eight waypoints mapped onto two different rectangles — the phone's pad and the
  monitor's screen — which is precisely what the software does. Watch it for
  three seconds and you understand the product without reading a word.

  It is one SVG with a viewBox rather than positioned HTML, because inside a
  viewBox the animation's translate values are in user units: the whole scene
  scales to any width with no media queries and no pixel maths.
*/
export function HeroScene() {
  return (
    <div className="scene" aria-hidden="true">
      <svg viewBox="0 0 660 470" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="scene-accent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c6cff" />
            <stop offset="100%" stopColor="#3ed6c5" />
          </linearGradient>

          <linearGradient id="scene-screen" x1="0.2" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#141726" />
            <stop offset="100%" stopColor="#0b0d17" />
          </linearGradient>

          <linearGradient id="scene-pad" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#161a2c" />
            <stop offset="100%" stopColor="#101322" />
          </linearGradient>

          <radialGradient id="scene-touch-glow">
            <stop offset="0%" stopColor="#7c6cff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#7c6cff" stopOpacity="0" />
          </radialGradient>

          {/* Clips the cursor to the screen so it can never wander onto the
              bezel during the loop. */}
          <clipPath id="scene-screen-clip">
            <rect x="210" y="40" width="400" height="250" rx="8" />
          </clipPath>
        </defs>

        {/* ---------------------------------------------------------------- */}
        {/* Monitor                                                          */}
        {/* ---------------------------------------------------------------- */}
        <g className="scene__monitor">
          <rect x="390" y="300" width="40" height="28" fill="#171a2b" />
          <rect x="348" y="326" width="124" height="9" rx="4.5" fill="#1e2233" />

          <rect
            x="200"
            y="30"
            width="420"
            height="270"
            rx="15"
            fill="#0d0f1a"
            stroke="#2c3149"
            strokeWidth="1.5"
          />
          <rect x="210" y="40" width="400" height="250" rx="8" fill="url(#scene-screen)" />

          {/* --- the companion window, simplified to its skeleton --- */}
          <g className="scene__ui">
            {/* title bar */}
            <line x1="210" y1="68" x2="610" y2="68" stroke="#1e2233" strokeWidth="1" />
            <circle cx="228" cy="54" r="3.5" fill="#2c3149" />
            <circle cx="240" cy="54" r="3.5" fill="#2c3149" />
            <circle cx="252" cy="54" r="3.5" fill="#2c3149" />
            <rect x="272" y="50" width="46" height="8" rx="4" fill="#2b3252" />

            {/* sidebar */}
            <line x1="288" y1="68" x2="288" y2="290" stroke="#1e2233" strokeWidth="1" />
            <rect x="222" y="86" width="52" height="7" rx="3.5" fill="#333a58" />
            <rect x="222" y="106" width="40" height="7" rx="3.5" fill="#2b3252" />
            <rect x="222" y="126" width="46" height="7" rx="3.5" fill="#2b3252" />
            <rect x="222" y="146" width="34" height="7" rx="3.5" fill="#2b3252" />

            {/* connected card */}
            <rect
              x="306"
              y="86"
              width="286"
              height="62"
              rx="10"
              fill="#12162a"
              stroke="#232840"
              strokeWidth="1"
            />
            <circle cx="326" cy="108" r="4" fill="#3dd68c" className="scene__pulse-dot" />
            <rect x="338" y="104" width="72" height="8" rx="4" fill="#59628c" />
            <rect x="322" y="124" width="128" height="6" rx="3" fill="#333b5c" />
            <rect x="530" y="102" width="44" height="12" rx="6" fill="#1a2c3a" />
            <rect x="537" y="106" width="30" height="4" rx="2" fill="#3ed6c5" opacity="0.8" />

            {/* latency trace */}
            <rect
              x="306"
              y="162"
              width="286"
              height="110"
              rx="10"
              fill="#12162a"
              stroke="#232840"
              strokeWidth="1"
            />
            <rect x="322" y="178" width="56" height="6" rx="3" fill="#454e78" />
            <polyline
              className="scene__trace"
              points="322,246 344,238 366,250 388,230 410,240 432,222 454,236 476,214 498,232 520,220 542,238 564,226 576,232"
              fill="none"
              stroke="url(#scene-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* --- the cursor, clipped to the screen --- */}
          <g clipPath="url(#scene-screen-clip)">
            <g className="scene__cursor">
              <path
                d="M0 0 L0 16.5 L4.4 12.6 L7.4 19.3 L10.6 17.9 L7.6 11.3 L13.3 11 Z"
                fill="#ffffff"
                stroke="#0a0b12"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </g>
          </g>
        </g>

        {/* ---------------------------------------------------------------- */}
        {/* The link between them                                            */}
        {/* ---------------------------------------------------------------- */}
        <path
          className="scene__link"
          d="M212 232 C 268 214, 292 176, 300 150"
          stroke="url(#scene-accent)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="4 9"
          opacity="0.5"
        />

        {/* ---------------------------------------------------------------- */}
        {/* Phone                                                            */}
        {/* ---------------------------------------------------------------- */}
        <g className="scene__phone">
          <rect
            x="40"
            y="120"
            width="190"
            height="320"
            rx="28"
            fill="#0b0d17"
            stroke="#2c3149"
            strokeWidth="1.5"
          />
          <rect x="48" y="128" width="174" height="304" rx="21" fill="#0e1120" />

          {/* status row */}
          <rect x="62" y="144" width="26" height="5" rx="2.5" fill="#2c3352" />
          <rect x="188" y="144" width="20" height="5" rx="2.5" fill="#2c3352" />

          {/* header: name + live latency chip */}
          <rect x="62" y="166" width="54" height="9" rx="4.5" fill="#59628c" />
          <rect x="62" y="182" width="78" height="6" rx="3" fill="#333b5c" />
          <rect x="160" y="166" width="48" height="18" rx="9" fill="#151a2e" stroke="#232840" />
          <circle cx="171" cy="175" r="3" fill="#3dd68c" className="scene__pulse-dot" />
          <rect x="179" y="172" width="20" height="5" rx="2.5" fill="#59628c" />

          {/* the pad */}
          <rect
            x="58"
            y="200"
            width="154"
            height="200"
            rx="16"
            fill="url(#scene-pad)"
            stroke="#232840"
            strokeWidth="1"
          />

          {/* the finger, on the same clock as the cursor */}
          <g className="scene__touch">
            <circle r="30" fill="url(#scene-touch-glow)" />
            <circle className="scene__ripple" r="13" fill="none" stroke="#7c6cff" strokeWidth="1.5" />
            <circle r="9" fill="url(#scene-accent)" />
          </g>

          {/* the two click zones along the bottom edge */}
          <line x1="135" y1="368" x2="135" y2="398" stroke="#1e2233" strokeWidth="1" />

          {/* home indicator */}
          <rect x="105" y="416" width="60" height="4" rx="2" fill="#232840" />
        </g>
      </svg>
    </div>
  );
}
