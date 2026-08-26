import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownloadLink } from '../downloads/download-link.entity';
import { Release } from './release.entity';

const GITHUB = 'https://github.com/farixdev/slate/releases/download/v1.0.0';

/**
 * Puts v1.0.0 in the database on an empty install.
 *
 * A marketing site with an empty changelog and dead download buttons is worse
 * than no site, and the first thing anyone does after deploying is look at it.
 * Seeding only runs when the table is empty, so it can never overwrite what an
 * admin has since edited.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Release) private readonly releases: Repository<Release>,
    @InjectRepository(DownloadLink) private readonly links: Repository<DownloadLink>,
  ) {}

  async onApplicationBootstrap() {
    if ((await this.releases.count()) > 0) return;

    const release = this.releases.create({
      version: '1.0.0',
      title: 'First public release',
      releasedAt: '2026-08-26',
      published: true,
      latest: true,
      notes: FIRST_RELEASE_NOTES,
      downloads: [
        this.links.create({
          platform: 'windows',
          label: 'Download for Windows',
          detail: 'Windows 10 and 11 · 64-bit',
          url: `${GITHUB}/Slate-1.0.0-windows-x64.zip`,
          filename: 'Slate-1.0.0-windows-x64.zip',
          size: '9.0 MB',
          checksum:
            '34472b9e0d8b5bec7c08ff2d2fbf89224f37fdfefe3e726e139426d7381c52e5',
          sortOrder: 0,
        }),
        this.links.create({
          platform: 'android',
          label: 'Download for Android',
          detail: 'Android 8.0 and later · APK',
          url: `${GITHUB}/Slate-1.0.0-android.apk`,
          filename: 'Slate-1.0.0-android.apk',
          size: '63.2 MB',
          checksum:
            '518e2ac8f7be2d2f9eb9bdd5774c7e72c0ed5526c4d36d98df430d55cef75705',
          sortOrder: 1,
        }),
      ],
    });

    await this.releases.save(release);
    this.logger.log('Seeded release 1.0.0 with its download links.');
  }
}

const FIRST_RELEASE_NOTES = `Slate 1.0 is here. Your phone becomes a trackpad and a keyboard for your PC, over your own Wi-Fi.

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
- A phone cannot send a single click until you have approved it on the PC.`;
