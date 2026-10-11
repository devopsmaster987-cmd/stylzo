import { NextResponse } from 'next/server';
import { env, firebaseConfigured, adsenseConfigured } from './config/environment.js';

// /fonts/Bold and /styles/Instagram are how third-party links and hand-typed
// URLs actually arrive. Both routes match lowercase slugs only, so today they
// 404 where a 301 is what preserves the link equity. Next's path-to-regexp
// cannot lowercase a captured param (it would redirect /fonts/Bold to itself),
// so the rewrite is done here on the real pathname.
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

// A fresh nonce per request. Next.js reads the CSP header while rendering a
// dynamically rendered page and copies the nonce onto its own <script> tags,
// so no 'unsafe-inline' is needed anywhere.
export function proxy(request) {
  const redirect = caseNormalizedRedirect(request);
  if (redirect) return redirect;

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isProd = env.isProd;

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
    ]
    : [];

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    ...(adsEnabled ? ['https://pagead2.googlesyndication.com'] : []),
    ...(isProd ? [] : ["'unsafe-eval'"]),
  ].join(' ');

  // Ad creatives ship inline <style> inside their own iframe, so style-src has
  // to allow 'unsafe-inline' once ads are on. It is deliberately NOT allowed
  // otherwise, and style-src-attr below is the one always permitted because the
  // keyword board's progress bar is sized inline.
  const styleSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    ...(adsEnabled ? ["'unsafe-inline'", 'https://fonts.googleapis.com'] : (isProd ? [] : ["'unsafe-inline'"])),
  ].join(' ');

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    // style-src does not govern style="" attributes. The keyword board's
    // progress bar is sized inline, so without this directive it renders at
    // zero width in production even though the same markup passes in dev.
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
        // Ads render in iframes on doubleclick / googlesyndication.
        `frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com`,
        // Google-certified consent platforms (Funding Choices) load their own frames.
        `child-src https://fundingchoicesmessages.google.com`,
      ]
      : []),
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ');

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