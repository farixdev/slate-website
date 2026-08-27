import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Fills in `%VITE_SITE_URL%` in index.html.
 *
 * Vite's own placeholder substitution reads .env files, and .env is gitignored
 * here — so on a deploy there would be no file, the placeholder would survive
 * into the built HTML verbatim, and every link preview would point at a URL
 * containing a literal percent sign. Reading the environment directly works the
 * same way locally (unset, so empty) and on the host (set, so absolute).
 *
 * Empty is a fine default: the tag falls back to a relative `/og.png`, which
 * most scrapers resolve against the page. Set VITE_SITE_URL to the deployed
 * origin for the ones that do not.
 */
function siteUrl(): Plugin {
  const value = (process.env.VITE_SITE_URL ?? '').replace(/\/$/, '');
  return {
    name: 'slate-site-url',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replaceAll('%VITE_SITE_URL%', value),
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), siteUrl()],

  server: {
    port: 5173,
    /*
      In development the site and the API are two processes on two ports, so
      every /api call is proxied to Nest. This keeps the front end talking to
      same-origin relative URLs in development exactly as it does in production,
      where Nest serves the built site itself — there is no base URL anywhere in
      the client, and therefore no way for it to be wrong in one environment and
      right in the other.

      Override the target with API_PORT when Nest is not on 3000.
    */
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT ?? 3000}`,
        changeOrigin: true,
      },
    },
  },

  build: {
    /*
      The site is built to `dist/` at the REPOSITORY root, not inside web/.

      That is the one place Vercel looks for static output when nothing tells
      it otherwise. Emitting to web/dist meant the correct path lived only in
      vercel.json, and the moment that file was not applied the deploy failed
      with "No Output Directory named dist" after a build that had actually
      succeeded. Putting the output where the default already points means the
      configuration and the fallback agree, so there is nothing left to
      disagree about.
    */
    outDir: '../dist',
    emptyOutDir: true,
    // Source maps make a production stack trace readable, and this bundle has
    // nothing in it worth hiding.
    sourcemap: true,
  },
});
