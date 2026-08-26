import { Link } from 'react-router-dom';
import { Wordmark } from './Logo';
import { FOOTER_LINKS } from '../content/site';
import './SiteFooter.css';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Wordmark />
          <p className="site-footer__blurb">
            A precision trackpad and keyboard for Windows, running on the phone
            already in your pocket.
          </p>
        </div>

        <div className="site-footer__columns">
          {FOOTER_LINKS.map((group) => (
            <div className="site-footer__column" key={group.title}>
              <h3 className="site-footer__column-title">{group.title}</h3>
              <ul>
                {group.links.map((link) =>
                  'to' in link ? (
                    <li key={link.label}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <a href={link.href} target="_blank" rel="noreferrer noopener">
                        {link.label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="site-footer__base">
        <span>&copy; {year} Slate</span>
        <span className="site-footer__meta">
          Runs entirely on your own network. No account, no telemetry.
        </span>
      </div>
    </footer>
  );
}
