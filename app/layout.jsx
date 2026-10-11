
import { site } from '@/config/site.js';
import { env, adsenseConfigured } from '@/config/environment.js';
import { OG_IMAGE, organizationLd, safeJson } from '@/services/seo.js';
import { BrandLink, SiteNav, MobileNav } from '@/components/site-header.jsx';
import { SiteFooter } from '@/components/site-footer.jsx';
import { ConsentGate } from '@/components/consent-gate.jsx';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

export const metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: site.name + ': ' + site.tagline,
    template: '%s | ' + site.name,
  },
  description: site.defaultDescription,
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: 'R0XZwqgEgMlRpykRHBE1zAix1XjwbCou8tKneZoUK3U',
  },
  // Fallbacks so any page without its own openGraph/twitter block (the 404, for
  // one) still renders a complete social card rather than a bare text link.
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'en_US',
    url: env.siteUrl,
    title: site.name + ': ' + site.tagline,
    description: site.defaultDescription,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.name + ': ' + site.tagline,
    description: site.defaultDescription,
    images: [OG_IMAGE.url],
  },
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
        {adsenseConfigured ? (
          <>
            <meta name="google-adsense-account" content={env.adsense.client} />
            <script
              async
              data-adsense="1"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${env.adsense.client}`}
              crossOrigin="anonymous"
            />
          </>
        ) : null}
      </head>
      <body>
        <Scripts />
        <a className="skip" href="#main">Skip to content</a>

        {/* One Organization node for the whole site: it ties the "Stylzo" brand
            to the production host and gives the page-level entities
            (WebSite, SoftwareApplication) a `publisher` to reference. Rendered
            through JsonLd, not as a raw <head> script, because production CSP
            requires the per-request nonce. */}
        <JsonLd items={[safeJson(organizationLd())]} />

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
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M4 7h16v2H4zm0 4h16v2H4zm0 4h16v2H4z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <MobileNav />
        </header>

        <main id="main" className="wrap">
          {children}
        </main>

        <SiteFooter />

        <div
          id="toast"
          className="toast"
          role="status"
          aria-live="polite"
        ></div>

        {/* Renders nothing unless ADSENSE_CLIENT is set, and loads the ad tag
            only after the visitor accepts. */}
        <ConsentGate client={adsenseConfigured ? env.adsense.client : ''} />
      </body>
    </html>
  );
}