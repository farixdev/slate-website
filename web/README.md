# web

The public site and the admin panel. React 19 + Vite + TypeScript.

Setup and deployment are in the [repository README](../README.md).

## Layout

```
src/
  content/site.ts    every word on the public pages, in one file
  styles/            design tokens and the shared type scale
  components/        the design system and the hero scene
  sections/          the home page, section by section
  pages/             home, download, changelog, 404
  admin/             sign in, release list, release editor
  lib/               API client, hooks, formatting
  reactbits/         vendored components — see NOTICE.md
```

Copy lives in `content/site.ts` rather than in the components. That keeps the
components about layout, and it puts every claim the site makes in one file
where it can be checked against what the product actually does.

## Commands

```bash
npm run dev        # Vite on 5173, proxying /api to the server
npm run build      # type-check, then build to dist/
npm run lint
```

`API_PORT=3111 npm run dev` if the server is not on 3000.

## Notes

The site talks to same-origin relative URLs in both development and production —
Vite proxies `/api` locally, and Vercel routes it to the function in production.
There is no base URL in the client, and so none to get wrong in one environment
and right in the other.

Downloads are never fetched. Every button is a real `<a href>` pointing at
`/api/downloads/:id/go`, which answers 302 with the asset URL; fetching it would
pull the binary into memory and never save it.
