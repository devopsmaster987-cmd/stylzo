import { NextResponse } from 'next/server';
import { env, firebaseConfigured, adsenseConfigured } from './config/environment.js';
import { CATEGORY_KEYS } from './lib/category-keys.js';
import { categoryHref } from './lib/category-routing.js';

// /fonts/Bold and /styles/Instagram are how third-party links and hand-typed
// URLs actually arrive. Both routes match lowercase slugs only, so today they
// 404 where a 301 is what preserves the link equity. Next's path-to-regexp
// cannot lowercase a captured param (it would redirect /fonts/Bold to itself), so
// the rewrite is done here on the real pathname.
//
// Case normalisation is matched case-insensitively in the next.config redirects,
// so an uppercase kept style slug reaches this handler rather than being
// swallowed by the /styles catch-all. Both layers agreeing on that is what stops
// the two rules from fighting each other.

// One canonical origin for the whole site: https and, when configured, www.
// Without this, `http://` and the bare domain serve the same page under a
// different host, which splits signals and produces duplicate canonical URLs.
// Preview and local hosts are left alone; only the configured production host
// and its bare alias are redirected.
function canonicalOriginRedirect(request) {
  if (!env.isProd) return null;

  const canonical = new URL(env.siteUrl);
  const canonicalHost = canonical.hostname.toLowerCase();
  if (canonicalHost === 'localhost' || canonicalHost === '127.0.0.1') return null;

  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const host = forwardedHost.split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
  if (!host) return null;

  const forwardedProto = request.headers.get('x-forwarded-proto')
    || request.nextUrl.protocol.replace(':', '');
  const proto = forwardedProto.split(',')[0].trim().toLowerCase();
  const canonicalProto = canonical.protocol.replace(':', '');

  const bareHost = canonicalHost.replace(/^www\./, '');
  const wrongHost = host === bareHost;
  const wrongProto = host === canonicalHost && proto !== canonicalProto;
  if (!wrongHost && !wrongProto) return null;

  const url = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, env.siteUrl);
  return NextResponse.redirect(url, 308);
}

// Category filters used to be `/?category=<key>` URLs canonicalising to `/`.
// They were noindex, so every internal category link went to a page that could
// not rank. The category hubs are real pages now; this sends the old query URL
// to the matching hub and drops the redundant `category` parameter while
// keeping any `text` value the visitor typed.
function categoryQueryRedirect(request) {
  if (request.nextUrl.pathname !== '/') return null;
  const key = request.nextUrl.searchParams.get('category');
  if (!key || !CATEGORY_KEYS.includes(key)) return null;

  const url = request.nextUrl.clone();
  // Redirect straight to the final destination. Sending ?category=outline to
  // the retiring hub would chain two 301s, which wastes crawl budget and hides
  // the real target from the crawler.
  url.pathname = categoryHref(key);
  url.searchParams.delete('category');
  return NextResponse.redirect(url, 301);
}

function caseNormalizedRedirect(request) {
  const { pathname } = request.nextUrl;
  for (const segment of ['fonts', 'styles']) {
    const prefix = `/${segment}/`;
    if (!pathname.startsWith(prefix)) continue;
    const rest = pathname.slice(prefix.length);
    if (!rest || rest.includes('/')) continue;
    const lower = rest.toLowerCase();
    if (lower !== rest) {
      const url = request.nextUrl.clone();
      url.pathname = prefix + lower;
      return NextResponse.redirect(url, 308);
    }
  }
  return null;
}

// The policy itself is identical on every request but the nonce, and everything
// it branches on (production flag, AdSense, Firebase) is fixed for the life of
// the process. So it is assembled once and the nonce is substituted per request,
// rather than rebuilding six arrays and joining them on every hit.
const NONCE_SLOT = '__STYLZO_NONCE__';
const isProd = env.isProd;

let cachedTemplate = null;

function cspTemplate() {
  if (cachedTemplate) return cachedTemplate;

  // Firebase only widens connect-src when it is actually configured.
  const firebaseConnect = firebaseConfigured
    ? ['https://*.googleapis.com', 'https://*.gstatic.com', 'https://securetoken.googleapis.com']
    : [];

  // AdSense loads its tag from googlesyndication, opens ads in an iframe on
  // doubleclick, and beacons back to Google. Without these the ad script is
  // silently blocked by CSP in production while appearing to work in dev.
  const adsEnabled = adsenseConfigured;
  const adsConnect = adsEnabled
    ? [
      'https://pagead2.googlesyndication.com',
      'https://googleads.g.doubleclick.net',
      'https://tpc.googlesyndication.com',
      'https://csi.gstatic.com',
      'https://googleadservices.com',
      // Ad traffic quality (SODAR) beacons and its frames. Without these the
      // tag works but logs CSP violations for every pageview.
      'https://ep1.adtrafficquality.google',
      'https://ep2.adtrafficquality.google',
    ]
    : [];

  const scriptSrc = [
    "'self'",
    `'nonce-${NONCE_SLOT}'`,
    ...(adsEnabled ? ['https://pagead2.googlesyndication.com'] : []),
    ...(isProd ? [] : ["'unsafe-eval'"]),
  ].join(' ');

  // Ad creatives ship inline <style> inside their own iframe, so style-src has
  // to allow 'unsafe-inline' once ads are on. It is deliberately NOT allowed
  // otherwise, and style-src-attr below is the one always permitted because
  // several components size an element with a style="" attribute.
  const styleSrc = [
    "'self'",
    `'nonce-${NONCE_SLOT}'`,
    ...(adsEnabled ? ["'unsafe-inline'", 'https://fonts.googleapis.com'] : (isProd ? [] : ["'unsafe-inline'"])),
  ].join(' ');

  cachedTemplate = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    // style-src does not govern style="" attributes. Without this directive an
    // inline width or offset renders as nothing in production, while the same
    // markup passes in dev.
    `style-src-attr 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' ${[...firebaseConnect, ...adsConnect].join(' ')}`.trim(),
    `font-src 'self'${adsEnabled ? ' https://fonts.gstatic.com' : ''}`,
    `worker-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(adsEnabled
      ? [
        // Ads render in iframes on doubleclick / googlesyndication, the
        // traffic-quality check opens frames on adtrafficquality, and its
        // verification step frames www.google.com.
        `frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://www.google.com`,
        // Google-certified consent platforms (Funding Choices) load their own frames.
        `child-src https://fundingchoicesmessages.google.com`,
      ]
      : []),
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ');

  return cachedTemplate;
}

// A fresh nonce per request. Next.js reads the CSP header while rendering a
// dynamically rendered page and copies the nonce onto its own <script> tags,
// so no 'unsafe-inline' is needed anywhere.
export function proxy(request) {
  const originRedirect = canonicalOriginRedirect(request);
  if (originRedirect) return originRedirect;

  const categoryRedirect = categoryQueryRedirect(request);
  if (categoryRedirect) return categoryRedirect;

  const redirect = caseNormalizedRedirect(request);
  if (redirect) return redirect;

  // Edge runtime: `crypto` here is WebCrypto, so the random bytes come from
  // randomUUID and are base64'd rather than read from node:crypto.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = cspTemplate().replaceAll(NONCE_SLOT, nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  if (isProd) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export const config = {
  // NOTE: prefetch requests must NOT be excluded here. They used to be, via
  // `missing: [next-router-prefetch, purpose=prefetch]`, which meant those
  // responses carried no x-nonce, so Next emitted its flight <script> tags
  // without a nonce and the browser refused them under script-src 'nonce-…'.
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|svg|png|webmanifest|woff2?)$).*)',
    },
  ],
};