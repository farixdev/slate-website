import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs a promise-returning function and tracks its state.
 *
 * The `settled` ref is what keeps this honest: without it, a component that
 * unmounts while a request is in flight sets state on a dead component, and —
 * worse — a slow first request can land *after* a fast reload and overwrite
 * newer data with older. Each run captures its own id and only the newest one
 * is allowed to write.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const runId = useRef(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // The caller passes an inline arrow function, which is a new reference every
  // render; depending on it directly would loop forever. The explicit deps
  // array is the contract instead.
  const callback = useRef(fn);
  callback.current = fn;

  useEffect(() => {
    const id = ++runId.current;
    setLoading(true);
    setError(undefined);

    callback
      .current()
      .then((value) => {
        if (!alive.current || id !== runId.current) return;
        setData(value);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!alive.current || id !== runId.current) return;
        setError(cause instanceof Error ? cause.message : 'Something went wrong.');
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, error, loading, reload };
}
