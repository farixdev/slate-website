# Slate — marketing site

The public site for [Slate](https://github.com/farixdev/slate), plus the admin
panel used to publish releases, write changelogs, and point the download buttons
at the right files.

One repository, two halves:

| | |
|---|---|
| `api/` | NestJS + SQLite. Serves the JSON API, the download redirects, and — in production — the built site. |
| `web/` | React + Vite. The public pages and the admin panel, in one bundle. |

---

## The one behaviour that matters

**A download button downloads. It does not open GitHub.**

Every button on the site points at `/api/downloads/:id/go`, which answers `302`
with the real asset URL:

```
GET  /api/downloads/1a2d…/go
302  Location: https://github.com/farixdev/slate/releases/download/v1.0.0/Slate-1.0.0-windows-x64.zip
```

The browser follows the redirect straight into its download manager. Three
things fall out of routing through that endpoint rather than linking to GitHub
directly:

- The public URL is stable. The asset behind it can change with every release
  without touching a line of markup.
- Downloads can be counted, which is where the admin panel's click figures come
  from.
- The asset path is not baked into the page.

It is a `302`, not a `301`. A permanent redirect would be cached by the browser
and keep pointing at 1.0.0 long after 1.1.0 shipped.

> Because the redirect target is a GitHub release asset, **the `slate` repository
> must be public** — GitHub requires a login to download assets from a private
> repository, which would turn a download button into a sign-in wall. If it ever
> needs to be private, host the binaries somewhere else and paste those URLs
> instead; nothing else changes.

---

## Running it

Requires Node 20 or newer.

```bash
cd api && npm install
cd ../web && npm install
```

Create `api/.env` from the example and set a password:

```bash
cd api
cp .env.example .env
npm run hash-password -- "a-real-password"    # prints ADMIN_PASSWORD_HASH=...
```

`JWT_SECRET` is worth setting too. Without it the API generates a random secret
at every boot, which is safe but signs everyone out on restart.

Then, in two terminals:

```bash
cd api && npm run start:dev      # http://localhost:3000
```

```bash
cd web && npm run dev            # http://localhost:5173
```

Vite proxies `/api` to Nest, so the front end talks to same-origin relative URLs
in development exactly as it does in production. There is no base URL in the
client to configure, and therefore none to get wrong in one environment and
right in the other. If Nest is on another port, `API_PORT=3111 npm run dev`.

## Building

```bash
cd web && npm run build          # emits web/dist
cd ../api && npm run build && npm run start:prod
```

Nest detects `web/dist` at boot and serves it, falling back to `index.html` for
everything that is not `/api` so the client router owns `/changelog`, `/admin`
and the rest. The whole thing is one process behind one port — no CORS, no
second deployment, no reverse proxy to configure.

## The admin panel

`/admin`, signed in with `ADMIN_USERNAME` and the password behind
`ADMIN_PASSWORD_HASH`. From there you can:

- write a release with a Markdown changelog, and preview it as it will appear;
- attach download links per platform, with size, filename and an optional
  SHA-256;
- keep a release as a **draft** while a build is still uploading — drafts are
  invisible to the public site;
- mark exactly one release **latest**, which is what every download button on
  the site points at;
- see how many times each platform has been downloaded.

There is one account and it comes from the environment. That is deliberate: a
user table, invitations and password resets would be a great deal of security
surface for a site with a single author.

## Seeding

On an empty database the API writes the 1.0.0 release with its changelog and its
two download links, so a fresh clone has a working site rather than an empty
one. It only ever runs when there are no releases at all — it will not overwrite
or resurrect anything you have edited or deleted.

---

## Notes on the front end

- **Design tokens** live in `web/src/styles/tokens.css`, and match the app
  itself: a cool graphite ground lit by a single iris-to-aqua accent. The site
  and the product should look like one thing, because they are.
- **Components from [React Bits](https://reactbits.dev)** are vendored under
  `web/src/reactbits/` with attribution in `NOTICE.md`. `SplitText` was removed
  after it left the hero headline at `opacity: 0` in a real browser — it drives
  its reveal from a scroll trigger, and a trigger already behind the viewport on
  first paint does not reliably fire. Text above the fold must not need
  JavaScript to become visible, so the headline uses a CSS-only stagger
  (`components/WordReveal.tsx`) instead.
- **Markdown** is rendered by a small hand-written renderer that builds React
  elements. There is no `dangerouslySetInnerHTML` anywhere, so a changelog is
  text no matter what is typed into it.
