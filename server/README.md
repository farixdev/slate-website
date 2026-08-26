# server

The Slate site's API: releases, changelogs, and the download redirects.

NestJS + TypeORM. Postgres in production, SQLite locally when `DATABASE_URL` is
unset. Setup, environment variables and deployment are all in the
[repository README](../README.md) — this file only covers what lives here.

## Layout

```
src/
  main.ts            local entry: one process, listening on a port
  serverless.ts      Vercel entry: the same app as a request handler
  bootstrap.ts       what must be true of both — validation, CORS
  app.module.ts      wiring
  config/            environment, and what is required where
  database/          TypeORM options for either driver
  auth/              the single admin account
  releases/          releases, changelogs, seed content
  downloads/         download links and the redirect endpoint
  scripts/           db:push and db:seed
```

Two entry points, one application. Anything that must hold for both belongs in
`bootstrap.ts`: configuring the validation pipe in one and forgetting it in the
other would mean the deployed API quietly accepts fields the local one rejects,
which is exactly the sort of difference nobody notices until it matters.

## Commands

```bash
npm run start:dev              # watch mode on PORT (default 3000)
npm run build                  # compile to dist/
npm run db:push                # create or update the schema
npm run db:seed                # write release 1.0.0 into an empty database
npm run hash-password -- "…"   # generate ADMIN_PASSWORD_HASH
npm run typecheck
```

`db:push` is the only thing that issues DDL. The running application never
does — `synchronize` is off everywhere, because on serverless every cold start
would run schema synchronisation and concurrent cold starts would race each
other for locks on the same tables.
