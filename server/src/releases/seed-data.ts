import type { DeepPartial } from 'typeorm';
import type { DownloadLink } from '../downloads/download-link.entity';
import type { Release } from './release.entity';

const GITHUB = 'https://github.com/farixdev/slate/releases/download/v1.0.0';

/**
 * The 1.0.0 release, as data.
 *
 * Kept apart from anything that inserts it so that the one-off seeding script
 * can stay a small standalone program: it opens a database connection and
 * writes two rows, and needs nothing else. Booting the whole application for
 * that would drag in the auth module and, with it, a requirement for a session
 * secret that seeding has no use for.
 */
export const FIRST_RELEASE: DeepPartial<Release> = {
  version: '1.0.0',
  title: 'First public release',
  releasedAt: '2026-08-26',
  published: true,
  latest: true,
  notes: `Slate 1.0 is here. Your phone becomes a trackpad and a keyboard for your PC, over your own Wi-Fi.

### Trackpad

- One finger moves the real Windows cursor. Not a simulation — every app on your machine sees ordinary mouse input.
- Tap to click, double tap to double click, tap-then-hold to drag.
- Two fingers scroll, with momentum that coasts and settles like a real trackpad.
- Two-finger tap right clicks. Three and four finger swipes switch desktops, show the desktop, go back and forward, and change volume.
- Pointer acceleration with a genuine precision zone: slow movement is exactly 1:1 so you can land on small targets, while a quick flick crosses a 4K desktop.
- A One Euro filter kills the shiver a phone screen produces when your finger is still, without adding any lag to fast movement.

### Keyboard

- Type on your PC with your phone's own keyboard — your language, your autocorrect, your emoji.
- Layout-independent: a phone set to German types the right characters on a PC set to US.
- A key bar adds what phones do not have — sticky Ctrl, Shift, Alt and Win, arrows, function keys, and one-tap Copy, Paste, Undo and Save.

### Getting connected

- Your PC is found automatically on your network. Scan a QR code, or type six digits.
- Reconnects on its own when Wi-Fi drops.

### Private by design

- Everything stays on your local network. There is no account, no cloud, and nothing to sign up for.
- A phone cannot send a single click until you have approved it on the PC.`,
  downloads: [
    {
      platform: 'windows',
      label: 'Download for Windows',
      detail: 'Windows 10 and 11 · 64-bit',
      url: `${GITHUB}/Slate-1.0.0-windows-x64.zip`,
      filename: 'Slate-1.0.0-windows-x64.zip',
      size: '11.9 MB',
      checksum:
        'ffbf4b1f0cb5aab3646e0afed92a07e8bf7c848333784b62862f072d738d636d',
      sortOrder: 0,
    },
    {
      platform: 'android',
      label: 'Download for Android',
      detail: 'Android 8.0 and later · APK',
      url: `${GITHUB}/Slate-1.0.0-android.apk`,
      filename: 'Slate-1.0.0-android.apk',
      size: '63.2 MB',
      checksum:
        '518e2ac8f7be2d2f9eb9bdd5774c7e72c0ed5526c4d36d98df430d55cef75705',
      sortOrder: 1,
    },
  ] as DeepPartial<DownloadLink>[],
};
