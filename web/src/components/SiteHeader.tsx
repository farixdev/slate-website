import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { GithubMark } from './GithubMark';
import { Wordmark } from './Logo';
import { ButtonLink } from './Button';
import { GITHUB_REPO } from '../content/site';
import './SiteHeader.css';

const LINKS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/download', label: 'Download' },
  { to: '/changelog', label: 'Changelog' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The bar is transparent over the hero and gains a background once the page
  // moves. A bar that is always opaque cuts the hero off at the top.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A fixed-position menu over a scrolling page lets the page scroll behind it,
  // which looks broken on a phone.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
      <div className="site-header__inner">
        <Link to="/" className="site-header__brand" onClick={() => setMenuOpen(false)}>
          <Wordmark />
        </Link>

        <nav className="site-header__nav" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `site-header__link${isActive ? ' site-header__link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions">
          <a
            className="site-header__icon"
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Slate on GitHub"
          >
            <GithubMark size={17} />
          </a>
          <ButtonLink to="/download" variant="primary">
            Get Slate
          </ButtonLink>
        </div>

        <button
          className="site-header__burger"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="site-header__sheet">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `site-header__sheet-link${isActive ? ' site-header__sheet-link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <a
            className="site-header__sheet-link"
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => setMenuOpen(false)}
          >
            GitHub
          </a>
        </div>
      )}
    </header>
  );
}
