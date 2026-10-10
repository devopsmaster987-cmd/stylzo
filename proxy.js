import { NextResponse } from 'next/server';
import { env, firebaseConfigured } from './config/environment.js';

// A fresh nonce per request. Next.js reads the CSP header while rendering a
// dynamically rendered page and copies the nonce onto its own <script> tags,
// so no 'unsafe-inline' is needed anywhere.
export function proxy(request) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isProd = env.isProd;

  // Firebase only widens connect-src when it is actually configured.
  const firebaseConnect = firebaseConfigured
    ? ['https://*.googleapis.com', 'https://*.gstatic.com', 'https://securetoken.googleapis.com']
    : [];

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'${isProd ? '' : " 'unsafe-eval'"}`,
    `style-src 'self' 'nonce-${nonce}'${isProd ? '' : " 'unsafe-inline'"}`,
    `img-src 'self' data:`,
    `connect-src 'self' ${firebaseConnect.join(' ')}`.trim(),
    `font-src 'self'`,
    `worker-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
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
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|svg|png|webmanifest|woff2?)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};