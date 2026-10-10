import { site } from '@/config/site.js';
import { catalog } from '@/services/catalog.js';
import { LANDING_PAGES } from '@/lib/landing-pages.js';
import { wordmark } from './site-header.jsx';

export function SiteFooter() {
  const totalStyles = catalog().styles.length;
  return (
    <footer className="site-footer">
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <p className="foot-wordmark" aria-hidden="true">
            {wordmark()}<span className="brand-dot">.</span>
          </p>
          <p className="muted">
            {site.name} turns plain text into Unicode styles, symbols and kaomoji. Everything runs in
            your browser — nothing you type is sent to our server.
          </p>
        </div>

        <nav aria-label="Create">
          <h2>Create</h2>
          <ul>
            <li><a href="/">Text generator</a></li>
            <li><a href="/fonts">Font styles</a></li>
            <li><a href="/studio">Font studio</a></li>
            <li><a href="/tools">Text tools</a></li>
          </ul>
        </nav>

        <nav aria-label="By platform">
          <h2>Platforms</h2>
          <ul>
            {LANDING_PAGES.map((p) => (
              <li key={p.key}><a href={`/styles/${p.key}`}>{p.subject}</a></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Libraries">
          <h2>Libraries</h2>
          <ul>
            <li><a href="/symbols">Symbols</a></li>
            <li><a href="/emoji">Emoji</a></li>
            <li><a href="/kaomoji">Kaomoji</a></li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2>Company</h2>
          <ul>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/privacy">Privacy</a></li>
            <li><a href="/terms">Terms</a></li>
          </ul>
        </nav>
      </div>

      <div className="wrap foot-base">
        <p>© {new Date().getFullYear()} {site.name}. Made for copy and paste.</p>
        <p className="muted">{totalStyles} styles · no tracking cookies</p>
      </div>
    </footer>
  );
}