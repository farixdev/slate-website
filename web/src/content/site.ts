/*
  Every word on the public site lives here.

  Two reasons. It keeps the components about layout instead of copy, and it puts
  all the claims in one file where they can be checked against what the product
  actually does. Nothing below is aspirational: each number is one that appears
  in the source or the test suite.
*/

export const GITHUB_REPO = 'https://github.com/farixdev/slate';
export const GITHUB_RELEASES = `${GITHUB_REPO}/releases`;
export const GITHUB_ISSUES = `${GITHUB_REPO}/issues`;

export const TAGLINE = 'Your phone is the trackpad.';

export const SUBTITLE =
  'Slate turns an Android or iPhone into a precision trackpad and keyboard for ' +
  'your PC. It moves the real Windows cursor — not a pointer drawn inside an ' +
  'app — so every program on the machine simply sees a mouse.';

/*
  The four claims worth leading with, in the order someone decides whether to
  care: is it real input, does it feel right, can I type, is it safe.
*/
export const PILLARS = [
  {
    id: 'real',
    label: 'Real input',
    title: 'The actual Windows cursor',
    body:
      'Slate injects through SendInput, the same path a physical mouse takes. ' +
      'Games, remote desktops, drawing apps, UAC prompts — everything sees ' +
      'ordinary mouse input, because that is what it is.',
  },
  {
    id: 'feel',
    label: 'Feel',
    title: 'Tuned like hardware, not a demo',
    body:
      'A precision zone below 55 px/s keeps slow movement exactly 1:1, then ' +
      'gain ramps on a smoothstep curve to 3.8×. Scroll coasts and decays. ' +
      'Sub-pixel motion is carried, never rounded away.',
  },
  {
    id: 'type',
    label: 'Keyboard',
    title: 'Type with the keyboard you already know',
    body:
      'Your phone keyboard, your language, your swipe input, your emoji — ' +
      'delivered as Unicode, so a phone set to German types correctly on a PC ' +
      'set to US. Autocorrect works on the far end.',
  },
  {
    id: 'safe',
    label: 'Security',
    title: 'Nothing connects without your say-so',
    body:
      'Pairing is a deliberate act at the PC. After that, every session proves ' +
      'possession of a 32-byte token with HMAC-SHA256 over a fresh challenge. ' +
      'The token crosses the network exactly once.',
  },
] as const;

export const FEATURES = [
  {
    icon: 'pointer',
    title: 'Pointer acceleration that respects you',
    body:
      'Two curves in one: 1:1 for fine positioning, a smoothstep ramp for fast ' +
      'flicks across a 4K display. Four sensitivity presets, or turn the curve ' +
      'off entirely for flat tracking.',
  },
  {
    icon: 'waves',
    title: 'One Euro jitter filter',
    body:
      'Capacitive sensors shiver when a finger holds still. Slate smooths hard ' +
      'at rest and opens the filter as speed rises, so a held finger is steady ' +
      'and a fast one has no lag.',
  },
  {
    icon: 'scroll',
    title: 'Momentum scrolling',
    body:
      'Two fingers scroll both axes. Flick and it coasts, decaying at 0.94 per ' +
      'frame until it rests — the same way a physical trackpad behaves, because ' +
      'anything else feels wrong immediately.',
  },
  {
    icon: 'gestures',
    title: 'Gestures that map to Windows',
    body:
      'Two-finger tap right-clicks. Three and four fingers drive Task View, ' +
      'show desktop, switch virtual desktop, back and forward, and volume. ' +
      'The gesture engine is a state machine, not a pile of widget callbacks.',
  },
  {
    icon: 'keyboard',
    title: 'A key bar for what phones lack',
    body:
      'Sticky Ctrl, Shift, Alt and Win. Arrows, Esc, Tab, Delete, Home, End, ' +
      'Page Up and Down, F1–F12. One tap for Copy, Paste, Cut, Undo, Select ' +
      'All and Save.',
  },
  {
    icon: 'radar',
    title: 'It finds your PC on its own',
    body:
      'UDP discovery over broadcast and multicast; the computer answers probes ' +
      'and announces itself. Scan a QR code and you are connected. Manual IP ' +
      'entry is there for networks that filter broadcast.',
  },
  {
    icon: 'zap',
    title: 'Binary on the hot path',
    body:
      'Cursor, scroll, button and key events are hand-packed frames of five to ' +
      'thirteen bytes over a persistent WebSocket with TCP_NODELAY. JSON is ' +
      'reserved for pairing and settings, where size does not matter.',
  },
  {
    icon: 'monitor',
    title: 'A companion, not a background process',
    body:
      'The Windows app has a real dashboard: connected devices, live latency, ' +
      'a diagnostics log, and a tray presence. Start it with Windows and forget ' +
      'about it.',
  },
] as const;

export const STEPS = [
  {
    n: '01',
    title: 'Install on Windows',
    body:
      'Unzip and run. No driver, no installer service, no account. The ' +
      'companion opens on the pairing screen.',
  },
  {
    n: '02',
    title: 'Scan the code',
    body:
      'Open Slate on your phone and point it at the QR code — it carries the ' +
      'address, the port and a single-use token. No camera? Type the six digits.',
  },
  {
    n: '03',
    title: 'Use it',
    body:
      'Move, tap, scroll, type. It reconnects on its own when you come back ' +
      'onto the network, so pairing is something you do once.',
  },
] as const;

/*
  Numbers, stated plainly. These are the ones people actually want before they
  download something that controls their computer.
*/
export const SPECS = [
  { label: 'Wire frame size', value: '5–13', unit: 'bytes' },
  { label: 'Precision zone', value: '55', unit: 'px/s' },
  { label: 'Peak pointer gain', value: '3.8', unit: '×' },
  { label: 'Automated tests', value: '279', unit: 'passing' },
] as const;

export const FAQ = [
  {
    q: 'Does this actually move the Windows cursor, or just a pointer in an app?',
    a:
      'The real cursor. Slate calls SendInput through Win32, which is the same ' +
      'interface a physical mouse driver uses. There is no overlay and no ' +
      'simulated pointer, so applications cannot tell the difference — including ' +
      'ones that capture the mouse, like games.',
  },
  {
    q: 'Do I need the internet?',
    a:
      'No. Slate speaks to your PC over your local network and nothing else. ' +
      'There is no server in the middle, no account, and no telemetry. Turn off ' +
      'your internet connection and it keeps working.',
  },
  {
    q: 'Can someone else on my Wi-Fi take over my computer?',
    a:
      'No. A device cannot send a single input event until someone at the PC ' +
      'has authorised it, either by showing the QR code or by reading out the ' +
      'six-digit code. After pairing, each connection has to prove it holds a ' +
      'random 32-byte token by answering an HMAC-SHA256 challenge, so watching ' +
      'the traffic does not let you replay it. Five wrong codes and the code is ' +
      'thrown away.',
  },
  {
    q: 'Which Windows versions work?',
    a:
      'Windows 10 and 11 on 64-bit. The companion is a normal desktop program — ' +
      'unzip it and run it. It does not install a driver or a service, and it ' +
      'does not need administrator rights unless you want it to control ' +
      'elevated windows.',
  },
  {
    q: 'Is there an iPhone build?',
    a:
      'The iOS app is complete and its icons are in the repository, but ' +
      'distributing it needs an Apple Developer account, so there is no ' +
      'download here yet. You can build and side-load it from source today.',
  },
  {
    q: 'Why does scrolling feel different from a mouse wheel?',
    a:
      'Because it is modelled on a trackpad rather than a wheel. A wheel sends ' +
      'discrete notches; Slate sends continuous deltas with momentum, so a ' +
      'flick coasts and a slow drag moves pixel by pixel.',
  },
  {
    q: 'What does it cost?',
    a:
      'Nothing. Slate is free and the source is on GitHub. There is no paid ' +
      'tier, no trial, and nothing to sign up for.',
  },
  {
    q: 'Will Bluetooth be supported?',
    a:
      'The transport layer sits behind an interface precisely so it can be. ' +
      'Wi-Fi ships first because it is faster and needs no pairing at the OS ' +
      'level. Bluetooth is a later addition, not a rewrite.',
  },
] as const;

export const FOOTER_LINKS = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', to: '/' },
      { label: 'Download', to: '/download' },
      { label: 'Changelog', to: '/changelog' },
    ],
  },
  {
    title: 'Source',
    links: [
      { label: 'GitHub', href: GITHUB_REPO },
      { label: 'Releases', href: GITHUB_RELEASES },
      { label: 'Report an issue', href: GITHUB_ISSUES },
    ],
  },
] as const;
