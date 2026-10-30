import { site } from '@/config/site.js';
import { env, adsenseConfigured } from '@/config/environment.js';
import { catalog } from '@/services/catalog.js';
import { ConsentControl } from '@/components/consent-control.jsx';
import { LANDING_PAGES } from '@/lib/landing-pages.js';
import { PRIVACY_SHORT } from '@/lib/facts.js';
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
            {site.name} turns plain text into Unicode styles, symbols and kaomoji. {PRIVACY_SHORT}
          </p>

          <nav className="foot-social" aria-label="Social media">
            <h2>Social media</h2>
            <ul>
              {site.social.map((profile) => (
                <li key={profile.href}>
                  <a
                    href={profile.href}
                    target="_blank"
                    rel="me noopener noreferrer"
                  >
                    {profile.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <nav aria-label="Create">
          <h2>Create</h2>
          <ul>
            <li><a href="/">Text generator</a></li>
            <li><a href="/fonts">Font styles</a></li>
            <li><a href="/guides">Guides</a></li>
            <li><a href="/studio">Font studio</a></li>
            <li><a href="/tools">Text tools</a></li>
            <li><a href="/image-compression">Image compressor</a></li>
            <li><a href="/embed">Embed the generator</a></li>
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
        <p className="muted">
          {totalStyles} styles · styling runs on your own device
          {/* "no tracking cookies" is only true while ads are off. Advertising
              cookies are real once AdSense is configured, so the claim has to
              change with the configuration rather than quietly become false. */}
          {adsenseConfigured ? (
            <>
              {' · '}
              <a href="/privacy">cookie policy</a>
              {env.certifiedCmp ? null : <ConsentControl client={env.adsense.client} />}
            </>
          ) : null}
        </p>
      </div>
    </footer>
  );
}