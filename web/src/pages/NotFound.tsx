import { ButtonLink } from '../components/Button';
import { usePageTitle } from '../lib/usePageTitle';

export function NotFound() {
  usePageTitle('Not found — Slate');

  return (
    <div className="section section--page">
      <div className="container container--narrow" style={{ textAlign: 'center' }}>
        <p className="eyebrow" style={{ justifyContent: 'center' }}>
          404
        </p>
        <h1 className="display">This page moved, or never existed.</h1>
        <p className="lede" style={{ margin: 'var(--space-6) auto 0' }}>
          Nothing here. The download and the changelog are both one click away.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            justifyContent: 'center',
            marginTop: 'var(--space-10)',
            flexWrap: 'wrap',
          }}
        >
          <ButtonLink to="/" variant="primary" size="lg">
            Back to the start
          </ButtonLink>
          <ButtonLink to="/download" variant="secondary" size="lg">
            Download
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
