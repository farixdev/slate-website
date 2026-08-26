# Slate — marketing site

The public site for [Slate](https://github.com/farixdev/slate), plus the admin
panel used to publish releases, write changelogs, and point the download buttons
at the right files.

One repository, three parts:

| | |
|---|---|
| `web/` | React + Vite. The public pages and the admin panel, one bundle. Builds to `web/dist`. |
| `server/` | NestJS + TypeORM. The JSON API and the download redirects. Builds to `server/dist`. |
| `api/index.ts` | The Vercel entry point. Twenty lines that hand a request to the compiled NestJS app. |

Deployed, it is **one Vercel project**: the static site comes off Vercel's CDN,
and everything under `/api` goes to a single serverless function.

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

> **The `slate` repository must be public for this to work.** GitHub requires a
> login to download release assets from a private repository, which turns a
> download button into a sign-in wall. It is currently private — one setting:
>
> ```bash
> gh repo edit farixdev/slate --visibility public --accept-visibility-change-consequences
> ```
>
> If it has to stay private, host the binaries somewhere else and paste those
> URLs into the admin panel instead. Nothing else changes.

---

# Deploying to Vercel

## What you need to give me (or set yourself)

**A Neon Postgres database.** This is required — it is not optional and there is
no way around it. A Vercel function has no durable filesystem: anything written
to disk disappears when the instance does, and two instances never see each
other's writes. The SQLite file this project uses locally cannot work there.

From the Neon dashboard, **Connect** gives you two connection strings. You need
both:

| | Looks like | Used for |
|---|---|---|
| **Pooled** | `…@ep-xxx**-pooler**.region.aws.neon.tech/…` | the running site |
| **Direct** | `…@ep-xxx.region.aws.neon.tech/…` | creating the schema, once |

The pooled one goes through PgBouncer, which is what keeps a fleet of serverless
instances under the connection limit. It hands the server connection back at
every commit, though, so it keeps no session state — and session-level advisory
locks are exactly what schema tooling uses to stop two migrations running at
once. Hence the direct one for that job, once.

Add `?sslmode=verify-full` to the end of the pooled string. Neon's certificate
chains to a public CA, so full verification just works, and specifying it on the
URL is the one place the setting is guaranteed not to be overridden.

## 1. Import the project

Vercel → **Add New** → **Project** → import `farixdev/slate-website`.

Leave the build settings alone. `vercel.json` in the repository already sets
them:

```json
"framework": null,
"installCommand": "npm install",
"buildCommand": "npm run build",
"outputDirectory": "web/dist"
```

`npm install` at the root installs both workspaces; `npm run build` compiles the
server and then the site.

## 2. Set the environment variables

Project → **Settings** → **Environment Variables**. Apply each to **Production**
and **Preview**.

| Name | Required | Value |
|---|---|---|
| `DATABASE_URL` | **yes** | the **pooled** Neon string, with `?sslmode=verify-full` |
| `DATABASE_URL_UNPOOLED` | for schema changes | the **direct** Neon string |
| `JWT_SECRET` | **yes** | 32+ random characters — see below |
| `ADMIN_USERNAME` | no | defaults to `admin` |
| `ADMIN_PASSWORD_HASH` | **yes** | a bcrypt hash — see below |

Generate the session secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Generate the password hash:

```bash
npm run hash-password -- "the-password-you-want"
```

Two of these are required for a reason worth understanding.

**`JWT_SECRET`** — locally, if it is unset, a random one is generated per run,
which just means signing in again after a restart. On Vercel that is a bug, not
a convenience: every cold start is a separate process, so each instance would
sign tokens with a different key, and an admin would be signed out at random
with nothing in the logs to explain it. The app therefore refuses to start in
production without it, loudly, rather than failing that way quietly.

**`ADMIN_PASSWORD_HASH`** rather than `ADMIN_PASSWORD` — a plaintext password is
hashed at startup, which costs a few hundred milliseconds. On serverless that is
paid on every cold start. It also means the plaintext is sitting in your
environment for no benefit.

## 3. Create the schema

Once, from your machine, using the **direct** connection:

```bash
DATABASE_URL_UNPOOLED="postgresql://…direct…" npm run db:push
```

This creates the two tables. It is idempotent — run it again after any change to
an entity and it applies only the difference.

The application itself never issues DDL. `synchronize` is off everywhere, and
that is deliberate: left on, every cold start would run schema synchronisation,
and two concurrent cold starts take exclusive locks on the same tables in
whatever order their metadata happens to be in. That is a lock wait, or a
duplicate-object error, served to whoever was loading the page.

## 4. Seed the first release

```bash
DATABASE_URL="postgresql://…pooled…" npm run db:seed
```

Writes release 1.0.0 with its changelog and its two download links, so the site
has something to show the moment it is live. It does nothing at all if the
database already holds a release, so it can never overwrite something you have
edited.

(This creates fresh ids for the download links. That is correct for a first
deploy — nothing is in circulation yet. The click counts from local testing do
not come across, which is no loss.)

## 5. Deploy

Push to `main`, or hit **Deploy**. Then check, in order:

```bash
curl -sS https://your-site.vercel.app/api/releases/latest        # the API is alive
curl -sSI https://your-site.vercel.app/api/downloads/<id>/go     # 302 + Location
curl -sS  https://your-site.vercel.app/changelog                 # deep link serves the app
```

The second one is the one that matters. It must be `302` with a `Location`
header pointing at GitHub.

---

## How the routing works

Worth knowing before you edit `vercel.json`, because one detail here is easy to
get wrong and fails in a way that looks like something else.

`api/index.ts` becomes exactly **one** route: `/api`. Not `/api/anything`. Vercel
checks the filesystem before it applies rewrites, so `/api/releases/latest`
matches no file, falls through to the SPA catch-all, and returns `index.html`
with a `200` — an API that answers every call with the HTML of the home page.
The rewrite is what funnels the subtree to the function:

```json
"rewrites": [
  { "source": "/api/(.*)",     "destination": "/api" },
  { "source": "/((?!api/).*)", "destination": "/index.html" }
]
```

Two things hold it together:

- **Order.** Rewrites are evaluated top to bottom and the first match wins, so
  the catch-all must be last. Reversed, every download button on the site
  returns HTML instead of a redirect — while the pages themselves keep working,
  which is what makes it confusing.
- **The negative lookahead** on the fallback, `/((?!api/).*)`, is belt and
  braces. If someone reorders the array later, `/api/*` is still protected.

The function receives the **original** path, not `/api`, which is what lets Nest
route normally.

The second rewrite is also what makes deep links work. Locally the NestJS server
serves `web/dist` and falls back to `index.html`; on Vercel it does not — the
static files never reach the function. Without that line, `/changelog` and
`/admin` would 404 on a hard refresh while working perfectly in `npm run dev`.

---

# Running it locally

Node 20 or newer.

```bash
npm install
```

Then set up the server's environment:

```bash
cd server
cp .env.example .env
npm run hash-password -- "a-local-password"    # prints ADMIN_PASSWORD_HASH=…
```

You do **not** need a database for local development. With `DATABASE_URL` unset
the app uses a SQLite file, so a fresh clone runs with no credentials and no
network. Create it once:

```bash
npm run db:push
npm run db:seed
```

Then, from the repository root:

```bash
npm run dev
```

That runs both halves — the API on `http://localhost:3000` and the site on
`http://localhost:5173`. Vite proxies `/api` to Nest, so the front end talks to
same-origin relative URLs locally exactly as it does in production. There is no
base URL in the client to configure, and therefore none to get wrong in one
environment and right in the other. If Nest is on another port,
`API_PORT=3111 npm run dev:web`.

To run against the real database instead, put the pooled `DATABASE_URL` in
`server/.env`.

## Commands

| From the root | |
|---|---|
| `npm run dev` | both halves, watching |
| `npm run build` | what Vercel runs |
| `npm run db:push` | create or update the schema |
| `npm run db:seed` | write release 1.0.0 into an empty database |
| `npm run hash-password -- "…"` | generate `ADMIN_PASSWORD_HASH` |
| `npm run typecheck` | type-check both workspaces |

---

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

A wrong username and a wrong password take the same time to fail and produce the
same message, so neither can be discovered by guessing at the other.

---

## Notes on the code

- **Design tokens** live in `web/src/styles/tokens.css` and match the app
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
- **The click counter is awaited before the redirect is sent.** It used to be
  fire-and-forget, which is right for a long-lived server and wrong here: a
  serverless platform freezes the instance the moment the response is flushed,
  so the pending write would simply be abandoned and the count would sit near
  zero looking like nobody was downloading.

## Troubleshooting

**Every `/api/*` call returns the home page's HTML.** The rewrites in
`vercel.json` are in the wrong order, or the `/api/(.*)` one is missing.

**`/changelog` works from a link but 404s on refresh.** The SPA fallback rewrite
is missing. Locally this is invisible, because Vite has its own history
fallback.

**The deployment fails at startup with a message about `JWT_SECRET`.** It is not
set, or it is shorter than 32 characters. That message is the app refusing to
run in a configuration that would sign people out at random.

**Signed out of the admin panel constantly.** Also `JWT_SECRET` — if it differs
between instances, whichever one verifies your next request rejects the token
that another one issued.

**`db:push` hangs or errors about locks.** It is pointed at the pooled endpoint.
Use the direct one, via `DATABASE_URL_UNPOOLED`.

**The first request after a quiet period is slow.** Neon suspends an idle
compute and waking it takes a few hundred milliseconds; a Vercel cold start is
on top of that. The connection timeout is set to 15 seconds to accommodate it.
