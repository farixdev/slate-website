# React Bits components

The components under this directory are from **React Bits** by David Haz.

- Source: https://reactbits.dev — https://github.com/DavidHDev/react-bits
- Licence: MIT + Commons Clause v1.0

The Commons Clause permits using these as part of an application, which is what
they are doing here, and forbids selling the components themselves. They are
kept in their own directory, unmodified, so the boundary between third-party
code and ours stays obvious and so they can be updated from upstream without
untangling them from our own components.

Used here:

| Component | Where |
|---|---|
| `Backgrounds/Aurora` | Hero background |
| `TextAnimations/SplitText` | Hero headline |
| `TextAnimations/ShinyText` | Section eyebrows |
| `TextAnimations/CountUp` | Stat figures |
| `Animations/AnimatedContent` | Section scroll reveals |
| `Components/SpotlightCard` | Feature cards |

## Removed

`TextAnimations/SplitText` was vendored and then removed. It drives its reveal
from a GSAP ScrollTrigger, and a trigger whose start is already behind the
viewport on first paint does not reliably fire — the hero headline stayed at
`opacity: 0` in a real browser. Above-the-fold text must not need JavaScript to
become visible, so the headline uses `components/WordReveal.tsx`, a CSS-only
stagger, instead. The components still in use here all fail visible.
