import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ExternalLink, LogOut } from 'lucide-react';
import { Wordmark } from '../components/Logo';
import { Button } from '../components/Button';
import { AdminAuthProvider, useAdminAuth } from './AdminAuth';
import { AdminLogin } from './AdminLogin';
import { ReleaseList } from './ReleaseList';
import { ReleaseEditor } from './ReleaseEditor';
import './admin.css';

/**
 * The admin panel.
 *
 * It lives on the same origin and the same bundle as the public site, which is
 * the right trade at this size: one deployment, one build, and the API is the
 * only thing standing between a visitor and the data — which is the only place
 * that guard can be trusted anyway. Hiding the routes would be theatre; the
 * server rejects every unauthenticated admin call regardless.
 */
export function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminShell />
    </AdminAuthProvider>
  );
}

function AdminShell() {
  const { signedIn } = useAdminAuth();

  // Still checking a stored token. Rendering the login form here would flash it
  // at someone who is already signed in.
  if (signedIn === undefined) {
    return (
      <div className="admin-boot">
        <div className="skeleton" style={{ width: 180, height: 14 }} />
      </div>
    );
  }

  if (!signedIn) return <AdminLogin />;

  return (
    <div className="admin">
      <AdminBar />
      <main className="admin__main">
        <Routes>
          <Route index element={<ReleaseList />} />
          <Route path="new" element={<ReleaseEditor />} />
          <Route path=":id" element={<ReleaseEditor />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminBar() {
  const { signOut } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <header className="admin-bar">
      <div className="admin-bar__inner">
        <Link to="/admin" className="admin-bar__brand">
          <Wordmark size={24} />
          <span className="admin-bar__tag">Admin</span>
        </Link>

        <div className="admin-bar__actions">
          <Link className="admin-bar__link" to="/" target="_blank">
            View site
            <ExternalLink size={13} strokeWidth={2} />
          </Link>
          <Button
            variant="ghost"
            icon={<LogOut size={15} strokeWidth={2} />}
            onClick={() => {
              signOut();
              navigate('/admin');
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
