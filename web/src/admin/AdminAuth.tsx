import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, tokenStore } from '../lib/api';

interface AdminAuth {
  /** `undefined` while the stored token is still being checked. */
  signedIn: boolean | undefined;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
}

const Context = createContext<AdminAuth | null>(null);

/**
 * Holds the admin session.
 *
 * The three-state `signedIn` is the part worth keeping. A stored token might be
 * expired, and the only way to know is to ask the server — so on mount the app
 * is neither signed in nor signed out, it is *checking*. Collapsing that into a
 * boolean makes the login screen flash on every reload for someone who is
 * already signed in, which looks broken even though nothing is wrong.
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean | undefined>(
    tokenStore.get() ? undefined : false,
  );

  useEffect(() => {
    if (!tokenStore.get()) return;

    let alive = true;
    api
      .verifyToken()
      .then(() => alive && setSignedIn(true))
      .catch(() => {
        // Expired, revoked, or the server restarted with a new random secret.
        if (!alive) return;
        tokenStore.clear();
        setSignedIn(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const { token } = await api.login(username, password);
    tokenStore.set(token);
    setSignedIn(true);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setSignedIn(false);
  }, []);

  const value = useMemo(() => ({ signedIn, signIn, signOut }), [signedIn, signIn, signOut]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAdminAuth(): AdminAuth {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  }
  return context;
}
