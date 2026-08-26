import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Markdown } from '../components/Markdown';
import { api, downloadHref, type Platform, type Release } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';

/** A download row while it is being edited. `id` is present only for rows that
 *  already exist on the server. */
interface LinkDraft {
  id?: string;
  platform: Platform;
  label: string;
  detail: string;
  url: string;
  filename: string;
  size: string;
  checksum: string;
  sortOrder: number;
}

const PLATFORMS: Platform[] = ['windows', 'android', 'ios', 'other'];

const BLANK_LINK = (sortOrder: number): LinkDraft => ({
  platform: 'windows',
  label: 'Download for Windows',
  detail: '',
  url: '',
  filename: '',
  size: '',
  checksum: '',
  sortOrder,
});

export function ReleaseEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === undefined;

  usePageTitle(isNew ? 'New release — Slate admin' : 'Edit release — Slate admin');

  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [releasedAt, setReleasedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [published, setPublished] = useState(true);
  const [latest, setLatest] = useState(false);
  const [links, setLinks] = useState<LinkDraft[]>([]);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (isNew) return;

    let alive = true;
    setLoading(true);
    api.admin
      .release(id)
      .then((release) => {
        if (!alive) return;
        applyRelease(release);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!alive) return;
        setError(cause instanceof Error ? cause.message : 'Could not load that release.');
        setLoading(false);
      });

    return () => {
      alive = false;
    };

    function applyRelease(release: Release) {
      setVersion(release.version);
      setTitle(release.title);
      setNotes(release.notes);
      setReleasedAt(release.releasedAt.slice(0, 10));
      setPublished(release.published);
      setLatest(release.latest);
      setLinks(
        [...release.downloads]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((link) => ({
            id: link.id,
            platform: link.platform,
            label: link.label,
            detail: link.detail,
            url: link.url,
            filename: link.filename,
            size: link.size,
            checksum: link.checksum,
            sortOrder: link.sortOrder,
          })),
      );
    }
  }, [id, isNew]);

  const updateLink = (index: number, patch: Partial<LinkDraft>) => {
    setLinks((current) =>
      current.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(undefined);

    // Rows with no URL are dropped rather than rejected. Adding a row and then
    // changing your mind is normal; failing the whole save over an empty one is
    // not.
    const payload = {
      version: version.trim(),
      title: title.trim(),
      notes,
      releasedAt,
      published,
      latest,
      downloads: links
        .filter((link) => link.url.trim() !== '')
        .map((link, index) => ({ ...link, url: link.url.trim(), sortOrder: index })),
    };

    try {
      const saved = isNew
        ? await api.admin.create(payload)
        : await api.admin.update(id, payload);
      navigate('/admin', { state: { savedVersion: saved.version } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save.');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="skeleton" style={{ height: 420 }} />;
  }

  return (
    <form className="editor" onSubmit={submit}>
      <header className="admin-head">
        <div>
          <Link to="/admin" className="editor__back">
            <ArrowLeft size={14} strokeWidth={2} />
            Releases
          </Link>
          <h1 className="admin-head__title">
            {isNew ? 'New release' : `Editing ${version || 'release'}`}
          </h1>
        </div>
        <div className="editor__save">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create release' : 'Save changes'}
          </Button>
        </div>
      </header>

      {error && (
        <p className="field__error field__error--block" role="alert">
          {error}
        </p>
      )}

      <div className="editor__grid">
        <section className="panel">
          <h2 className="panel__title">Release</h2>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Version</span>
              <input
                className="field__input mono"
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="1.1.0"
                required
              />
              <span className="field__hint">Semantic version, no leading v.</span>
            </label>

            <label className="field">
              <span className="field__label">Released</span>
              <input
                className="field__input mono"
                type="date"
                value={releasedAt}
                onChange={(event) => setReleasedAt(event.target.value)}
                required
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Headline</span>
            <input
              className="field__input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Faster scrolling and a fix for multi-monitor setups"
            />
            <span className="field__hint">
              One line, shown next to the version on the site.
            </span>
          </label>

          <div className="toggle-row">
            <label className="toggle">
              <input
                type="checkbox"
                checked={published}
                onChange={(event) => setPublished(event.target.checked)}
              />
              <span>
                <strong>Published</strong>
                <em>Drafts are invisible on the public site.</em>
              </span>
            </label>

            <label className="toggle">
              <input
                type="checkbox"
                checked={latest}
                onChange={(event) => setLatest(event.target.checked)}
              />
              <span>
                <strong>Latest</strong>
                <em>Every download button points here. Only one at a time.</em>
              </span>
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">Changelog</h2>
            <div className="segmented">
              <button
                type="button"
                className={!preview ? 'segmented__on' : ''}
                onClick={() => setPreview(false)}
              >
                Write
              </button>
              <button
                type="button"
                className={preview ? 'segmented__on' : ''}
                onClick={() => setPreview(true)}
              >
                Preview
              </button>
            </div>
          </div>

          {preview ? (
            <div className="editor__preview">
              {notes.trim() ? (
                <Markdown>{notes}</Markdown>
              ) : (
                <p className="state">Nothing written yet.</p>
              )}
            </div>
          ) : (
            <label className="field">
              <textarea
                className="field__input field__input--area"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={16}
                placeholder={'### Added\n\n- Something new.\n\n### Fixed\n\n- Something that was wrong.'}
              />
              <span className="field__hint">
                Markdown: <code>###</code> headings, <code>-</code> bullets,{' '}
                <code>**bold**</code>, <code>`code`</code> and links.
              </span>
            </label>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2 className="panel__title">Downloads</h2>
            <p className="panel__sub">
              Paste the GitHub release asset URL. The site never links to it
              directly — buttons go through <code>/api/downloads/:id/go</code>,
              which redirects, so a click downloads the file instead of opening
              GitHub.
            </p>
          </div>
          <Button
            variant="secondary"
            icon={<Plus size={15} strokeWidth={2.2} />}
            onClick={() => setLinks((current) => [...current, BLANK_LINK(current.length)])}
          >
            Add a download
          </Button>
        </div>

        {links.length === 0 && (
          <p className="state">
            No downloads on this release yet. Add one so the buttons have
            somewhere to point.
          </p>
        )}

        <div className="links">
          {links.map((link, index) => (
            <div className="link-row" key={link.id ?? `new-${index}`}>
              <div className="link-row__head">
                <select
                  className="field__input field__input--select"
                  value={link.platform}
                  onChange={(event) =>
                    updateLink(index, { platform: event.target.value as Platform })
                  }
                >
                  {PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>

                <input
                  className="field__input"
                  value={link.label}
                  onChange={(event) => updateLink(index, { label: event.target.value })}
                  placeholder="Download for Windows"
                  aria-label="Button label"
                />

                <div className="link-row__tools">
                  {link.id && (
                    <a
                      className="icon-button"
                      href={downloadHref({ id: link.id })}
                      target="_blank"
                      rel="noreferrer noopener"
                      title="Test this download"
                      aria-label="Test this download"
                    >
                      <ExternalLink size={15} strokeWidth={1.9} />
                    </a>
                  )}
                  <button
                    type="button"
                    className="icon-button icon-button--danger"
                    onClick={() => setLinks((current) => current.filter((_, i) => i !== index))}
                    aria-label="Remove this download"
                  >
                    <Trash2 size={15} strokeWidth={1.9} />
                  </button>
                </div>
              </div>

              <label className="field">
                <span className="field__label">Asset URL</span>
                <input
                  className="field__input mono field__input--url"
                  value={link.url}
                  onChange={(event) => updateLink(index, { url: event.target.value })}
                  placeholder="https://github.com/farixdev/slate/releases/download/v1.0.0/Slate-1.0.0-windows-x64.zip"
                  inputMode="url"
                />
              </label>

              <div className="field-row field-row--three">
                <label className="field">
                  <span className="field__label">Filename</span>
                  <input
                    className="field__input mono"
                    value={link.filename}
                    onChange={(event) => updateLink(index, { filename: event.target.value })}
                    placeholder="Slate-1.0.0-windows-x64.zip"
                  />
                </label>

                <label className="field">
                  <span className="field__label">Size</span>
                  <input
                    className="field__input mono"
                    value={link.size}
                    onChange={(event) => updateLink(index, { size: event.target.value })}
                    placeholder="29 MB"
                  />
                </label>

                <label className="field">
                  <span className="field__label">Detail line</span>
                  <input
                    className="field__input"
                    value={link.detail}
                    onChange={(event) => updateLink(index, { detail: event.target.value })}
                    placeholder="Windows 10 and 11 · 64-bit"
                  />
                </label>
              </div>

              <label className="field">
                <span className="field__label">SHA-256 (optional)</span>
                <input
                  className="field__input mono field__input--url"
                  value={link.checksum}
                  onChange={(event) => updateLink(index, { checksum: event.target.value })}
                  placeholder="Leave empty if you are not publishing a checksum"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <div className="editor__footer">
        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Create release' : 'Save changes'}
        </Button>
        <Link className="link" to="/admin">
          Cancel
        </Link>
      </div>
    </form>
  );
}
