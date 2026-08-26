import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

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
    outDir: 'dist',
    // Source maps make a production stack trace readable, and this bundle has
    // nothing in it worth hiding.
    sourcemap: true,
  },
});
