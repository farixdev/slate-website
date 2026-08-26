import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { useAdminAuth } from './AdminAuth';
import { usePageTitle } from '../lib/usePageTitle';
import './admin.css';

export function AdminLogin() {
  usePageTitle('Sign in — Slate admin');

  const { signIn } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(undefined);
    try {
      await signIn(username, password);
    } catch (cause) {
      // The server answers with one message for a wrong username and a wrong
      // password alike, so there is nothing here to reveal which was wrong.
      setError(cause instanceof Error ? cause.message : 'Could not sign in.');
      setBusy(false);
    }
  };

  return (
    <div className="signin">
      <div className="signin__glow" aria-hidden="true" />

      <form className="signin__card" onSubmit={submit}>
        <span className="signin__mark">
          <Logo size={30} />
        </span>

        <h1 className="signin__title">Slate admin</h1>
        <p className="signin__sub">
          Publish releases, write changelogs, and point the download buttons at
          the right files.
        </p>

        <label className="field">
          <span className="field__label">Username</span>
          <input
            className="field__input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Password</span>
          <input
            className="field__input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={busy}
          className="signin__button"
          icon={<Lock size={16} strokeWidth={2} />}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
