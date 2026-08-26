/*
  The one place the site talks to the server.

  Two rules hold everywhere below:

  1. A download is never a `fetch`. It is a real navigation to
     `/api/downloads/:id/go`, which 302s to the GitHub asset. Fetching it would
     pull the binary into memory and never save it; navigating hands it to the
     browser's download manager, which is what a Download button should do.
  2. Errors carry the server's message. Nest returns `{ message }` — sometimes a
     string, sometimes an array of validation strings — and the forms in the
     admin panel are far more useful when they can show it verbatim.
*/

export type Platform = 'windows' | 'android' | 'ios' | 'other';

export interface DownloadLink {
  id: string;
  platform: Platform;
  label: string;
  detail: string;
  url: string;
  filename: string;
  size: string;
  checksum: string;
  clicks: number;
  sortOrder: number;
}

export interface Release {
  id: string;
  version: string;
  title: string;
  notes: string;
  releasedAt: string;
  published: boolean;
  latest: boolean;
  downloads: DownloadLink[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DownloadStats {
  total: number;
  byPlatform: Record<string, number>;
}

/** Everything a release editor may send. Ids on links mean "update", not "insert". */
export interface UpsertRelease {
  version: string;
  title?: string;
  notes?: string;
  releasedAt: string;
  published?: boolean;
  latest?: boolean;
  downloads?: Array<Partial<DownloadLink> & { platform: Platform; label: string; url: string }>;
}

export class ApiError extends Error {
  /** Zero when the request never reached the server. */
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/*
  In development the site runs on Vite's port and the API on its own, so calls
  are proxied (see vite.config.ts). In production Nest serves the built site
  itself, so same-origin relative URLs are correct in both cases and there is no
  base URL to configure or get wrong.
*/
const BASE = '';

const TOKEN_KEY = 'slate.admin.token';

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      // Private mode, or storage disabled. The admin can still work, they just
      // sign in again on reload.
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth, ...rest } = init;
  const headers = new Headers(rest.headers);

  if (rest.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(BASE + path, { ...rest, headers });
  } catch {
    // A network failure is not a server error and should not read like one.
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }

  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Pulls the most useful sentence out of a Nest error body. */
async function readError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message: unknown }).message;
      // Validation errors arrive as an array, one string per failed rule.
      if (Array.isArray(message)) return message.join('\n');
      if (typeof message === 'string') return message;
    }
  } catch {
    /* fall through to the generic message */
  }
  if (response.status === 401) return 'Your session has expired. Sign in again.';
  if (response.status === 404) return 'That is no longer there.';
  return `Something went wrong (${response.status}).`;
}

export const api = {
  releases: () => request<Release[]>('/api/releases'),
  latest: () => request<Release | null>('/api/releases/latest'),

  login: (username: string, password: string) =>
    request<{ token: string; expiresIn: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  verifyToken: () => request<{ ok: true }>('/api/auth/me', { auth: true }),

  admin: {
    releases: () => request<Release[]>('/api/admin/releases', { auth: true }),
    release: (id: string) => request<Release>(`/api/admin/releases/${id}`, { auth: true }),
    create: (body: UpsertRelease) =>
      request<Release>('/api/admin/releases', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(body),
      }),
    update: (id: string, body: UpsertRelease) =>
      request<Release>(`/api/admin/releases/${id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(body),
      }),
    markLatest: (id: string) =>
      request<Release>(`/api/admin/releases/${id}/latest`, { method: 'POST', auth: true }),
    remove: (id: string) =>
      request<void>(`/api/admin/releases/${id}`, { method: 'DELETE', auth: true }),
    stats: () => request<DownloadStats>('/api/downloads/stats', { auth: true }),
  },
};

/**
 * The public URL of a download button.
 *
 * Used as an `href`, never fetched — see rule 1 at the top of this file.
 */
export function downloadHref(link: Pick<DownloadLink, 'id'>): string {
  return `/api/downloads/${link.id}/go`;
}
