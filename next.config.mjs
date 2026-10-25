import { styleRedirects } from './lib/styles-routing.js';

// See the comment on `headers()` below for why nothing under /public may be
// marked immutable.
const REVALIDATE = 'public, max-age=0, must-revalidate';

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // One URL shape for every page. Next's default already redirects a trailing
  // slash, but making it explicit stops a future config change from producing
  // `/about` and `/about/` as two crawlable addresses.
  trailingSlash: false,
  outputFileTracingIncludes: {
    "/*": ["./data/**/*"],
  },

  async redirects() {
    return [
      // Legacy duplicate of the home page. It canonicalises to "/" but carries
      // no inbound internal link, so it is a crawlable orphan competing with the
      // real page. A 301 passes any accumulated equity instead. Query strings
      // are carried across by Next, so ?text=/?category= keep working.
      { source: '/fancy-text-generator', destination: '/', statusCode: 301 },

      // Thin doorway pages under /styles/*.
      //
      // The site published one near-identical page per search phrase (32 of
      // them: /styles/fancy-text-generator-2024, /styles/hindi-fancy-text-generator,
      // /styles/copy-and-paste-fancy-text and so on). Each rendered the same 25
      // words in the same 25 styles and each carried an ad. They are gone, and
      // a redirect is what converts the traffic and link equity they already
      // hold into something that helps instead of compounding the problem.
      //
      // 301 rather than 404 because these URLs are indexed and linked from
      // outside. 301 rather than 308 because the point is to retire them for
      // good, not to keep serving the same thing at a new address.
      //
      // Rules run in order, so the two narrow ones come before the catch-all and
      // can never be shadowed by it. The catch-all excludes the six real landing
      // pages, which is what makes a slug invented tomorrow a redirect instead of
      // a new thin page. The list is generated in lib/styles-routing.js so the
      // redirects the server runs, the route, the sitemap and the tests cannot
      // disagree about which slugs are real.
      ...styleRedirects(),

      // NOTE: case normalisation for /fonts/[slug] and /styles/[key] lives in
      // proxy.js, not here: a path-to-regexp param captures the matched text
      // verbatim, so `/fonts/Bold` would redirect to `/fonts/Bold` and loop.
      //
      // There is deliberately no `/:path*.html -> /:path` rule here. It looks
      // like good hygiene for an old static export, but it also swallows real
      // files in /public (it turned /offline.html into a 404 on /offline) and
      // Next has no "skip if the file exists" condition to guard it.
    ];
  },

  // Files in /public are edited in place under a filename that never changes:
  // main.css is not main.<hash>.css. They must therefore be revalidated, because
  // `immutable` tells the browser not to re-check even on a normal reload, and a
  // long max-age without it pins the file just as firmly for a year.
  //
  // This was originally `public, max-age=31536000, immutable` on the reasoning
  // that the filenames are content-stable. They are not, and the cost was not
  // theoretical: a stylesheet change shipped and every returning visitor kept
  // the old one, including on localhost during development.
  //
  // max-age=0 + must-revalidate still avoids re-downloading. The server answers
  // a conditional request with a 304 and no body, so an unchanged asset costs
  // one round trip rather than the full file. Only genuinely hashed assets —
  // everything under /_next/static — are worth marking immutable, and those are
  // served by the framework, not from here.
  async headers() {
    return [
      {
        source: '/css/:file*',
        headers: [{ key: 'Cache-Control', value: REVALIDATE }],
      },
      {
        source: '/js/:file*',
        headers: [{ key: 'Cache-Control', value: REVALIDATE }],
      },
      {
        source: '/:icon(favicon\\.svg|icon-\\d+\\.png|apple-touch-icon\\.png|og-default\\.png)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      // The worker must never be cached, or a stale copy pins old asset URLs.
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
      // The llms.txt convention asks for text/markdown. Served from /public it
      // would otherwise be labelled text/plain by extension.
      {
        source: '/llms.txt',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
};

export default nextConfig;