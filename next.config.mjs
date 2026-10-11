/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/*": ["./data/**/*"],
  },

  async redirects() {
    return [
      // Legacy duplicate of the home page. It canonicalises to "/" but carries
      // no inbound internal link, so it is a crawlable orphan competing with the
      // real page. A 301 passes any accumulated equity instead. Query strings
      // are carried across by Next, so ?text=/?category= keep working.
      { source: '/fancy-text-generator', destination: '/', permanent: true },

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

  // /public assets are served with Next's default `max-age=0`, so the 45 KB
  // stylesheet and every /js module are revalidated and re-downloaded on each
  // full-page navigation. These filenames are content-stable, so cache hard.
  async headers() {
    const immutable = 'public, max-age=31536000, immutable';
    return [
      {
        source: '/css/:file*',
        headers: [{ key: 'Cache-Control', value: immutable }],
      },
      {
        source: '/js/:file*',
        headers: [{ key: 'Cache-Control', value: immutable }],
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