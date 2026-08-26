import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MousePointerClick, Plus, Star, Trash2 } from 'lucide-react';
import { Button, ButtonLink } from '../components/Button';
import { api, type Release } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { usePageTitle } from '../lib/usePageTitle';
import { formatDateShort, formatNumber } from '../lib/format';

export function ReleaseList() {
  usePageTitle('Releases — Slate admin');

  const releases = useAsync<Release[]>(() => api.admin.releases(), []);
  const stats = useAsync(() => api.admin.stats(), []);
  const [busyId, setBusyId] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const act = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setError(undefined);
    try {
      await action();
      releases.reload();
      stats.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not work.');
    } finally {
      setBusyId(undefined);
    }
  };

  const remove = (release: Release) => {
    // A release carries its changelog and its download links with it, so this
    // is a bigger deletion than the row suggests. Say so before doing it.
    const ok = window.confirm(
      `Delete ${release.version}? Its changelog and ${release.downloads.length} ` +
        `download link${release.downloads.length === 1 ? '' : 's'} go with it. ` +
        'This cannot be undone.',
    );
    if (ok) void act(release.id, () => api.admin.remove(release.id));
  };

  return (
    <>
      <header className="admin-head">
        <div>
          <h1 className="admin-head__title">Releases</h1>
          <p className="admin-head__sub">
            The release marked <strong>Latest</strong> is what every download
            button on the site points at.
          </p>
        </div>
        <ButtonLink to="/admin/new" variant="primary" icon={<Plus size={16} strokeWidth={2.2} />}>
          New release
        </ButtonLink>
      </header>

      {stats.data && (
        <div className="stat-row">
          <div className="stat">
            <span className="stat__label">Total downloads</span>
            <span className="stat__value mono">{formatNumber(stats.data.total)}</span>
          </div>
          {Object.entries(stats.data.byPlatform).map(([platform, count]) => (
            <div className="stat" key={platform}>
              <span className="stat__label">{platform}</span>
              <span className="stat__value mono">{formatNumber(count)}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}

      {releases.loading && <div className="skeleton" style={{ height: 220 }} />}
      {releases.error && <p className="state state--error">{releases.error}</p>}

      {releases.data?.length === 0 && (
        <div className="empty">
          <h2>No releases yet</h2>
          <p>Create one and the site will have something to offer.</p>
          <ButtonLink to="/admin/new" variant="primary">
            Create the first release
          </ButtonLink>
        </div>
      )}

      {releases.data && releases.data.length > 0 && (
        <div className="table">
          <div className="table__head">
            <span>Version</span>
            <span>Released</span>
            <span>Status</span>
            <span>Downloads</span>
            <span>Clicks</span>
            <span />
          </div>

          {releases.data.map((release) => {
            const clicks = release.downloads.reduce((sum, link) => sum + link.clicks, 0);
            const busy = busyId === release.id;

            return (
              <div className={`table__row${busy ? ' table__row--busy' : ''}`} key={release.id}>
                <Link to={`/admin/${release.id}`} className="table__version mono">
                  {release.version}
                </Link>

                <span className="table__muted" data-label="Released">
                  {formatDateShort(release.releasedAt)}
                </span>

                <span className="table__badges" data-label="Status">
                  <span className={`badge badge--${release.published ? 'live' : 'draft'}`}>
                    {release.published ? 'Published' : 'Draft'}
                  </span>
                  {release.latest && <span className="badge badge--latest">Latest</span>}
                </span>

                <span className="table__muted" data-label="Downloads">
                  {release.downloads.length === 0
                    ? '—'
                    : release.downloads.map((link) => link.platform).join(', ')}
                </span>

                <span className="table__clicks mono" data-label="Clicks">
                  <MousePointerClick size={13} strokeWidth={1.9} />
                  {formatNumber(clicks)}
                </span>

                <span className="table__actions">
                  {!release.latest && release.published && (
                    <Button
                      variant="ghost"
                      disabled={busy}
                      icon={<Star size={14} strokeWidth={2} />}
                      onClick={() => void act(release.id, () => api.admin.markLatest(release.id))}
                    >
                      Make latest
                    </Button>
                  )}
                  <button
                    className="icon-button icon-button--danger"
                    aria-label={`Delete ${release.version}`}
                    disabled={busy}
                    onClick={() => remove(release)}
                  >
                    <Trash2 size={15} strokeWidth={1.9} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
