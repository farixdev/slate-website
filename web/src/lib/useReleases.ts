import { api, type Release } from './api';
import { useAsync } from './useAsync';

/** Published releases, newest first. */
export function useReleases() {
  return useAsync<Release[]>(() => api.releases(), []);
}

/** The version the download buttons point at. */
export function useLatestRelease() {
  return useAsync<Release | null>(() => api.latest(), []);
}
