import { site } from '@/config/site.js';
import { BrandLink, SiteNav, MobileNav } from '@/components/site-header.jsx';
import { SiteFooter } from '@/components/site-footer.jsx';
import { Scripts } from '@/components/scripts.jsx';

export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: { default: `${site.name}: ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.defaultDescription,
  icons: { icon: '/favicon.svg' },
  manifest: '/manifest.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: site.themeColor,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/css/main.css" />
      </head>
      <body>
        <Scripts />
        <a className="skip" href="#main">Skip to content</a>
        <header className="site-header">
          <div className="wrap bar">
            <BrandLink />
            <SiteNav />
            <div className="bar-actions">
              <button
                type="button"
                className="icon-btn nav-toggle"
                id="nav-toggle"
                aria-label="Open menu"
                aria-expanded="false"
                aria-controls="mobile-nav"
                hidden
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path fill="currentColor" d="M4 7h16v2H4zm0 4h16v2H4zm0 4h16v2H4z" />
                </svg>
              </button>
            </div>
          </div>
          <MobileNav />
        </header>

        <main id="main" className="wrap">{children}</main>

        <SiteFooter />
        <div id="toast" className="toast" role="status" aria-live="polite"></div>
      </body>
    </html>
  );
}