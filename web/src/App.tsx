import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { Home } from './pages/Home';
import { Download } from './pages/Download';
import { Changelog } from './pages/Changelog';
import { NotFound } from './pages/NotFound';
import { AdminApp } from './admin/AdminApp';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* The admin panel has its own chrome — no marketing header or footer. */}
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </BrowserRouter>
  );
}

function PublicSite() {
  return (
    <>
      <SiteHeader />
      <main>
        <Routes>
          <Route index element={<Home />} />
          <Route path="download" element={<Download />} />
          <Route path="changelog" element={<Changelog />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * Puts a new page at the top.
 *
 * A router swaps the content without touching scroll position, so following a
 * link from the middle of the changelog drops you into the middle of the
 * download page. Hash links are left alone — those are meant to jump.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    // `instant` rather than the CSS `smooth` set globally: a navigation should
    // arrive, not scroll the whole page past you on the way.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}
