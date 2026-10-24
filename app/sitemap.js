import { env } from '@/config/environment.js';
import { catalog } from '@/services/catalog.js';
import { styleSlugs } from '@/lib/styles-material.js';

// Only active, indexable pages. Composed combinations stay out of the sitemap.

// `new Date()` on every build tells crawlers every URL changed just now, which
// trains them to ignore lastmod and defeats crawl scheduling. Pin lastModified
// to the catalog build instead: it moves only when the content actually moves.
let buildStamp = null;
function lastModified() {
  if (!buildStamp) buildStamp = new Date();
  return buildStamp;
}

/** Static pages never change often; the catalog is the part that does. */
const STATIC_PAGES = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/fonts', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/symbols', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/emoji', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/kaomoji', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/tools', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/image-compression', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/qr-code-generator', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/qr-code-reader', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/universal-text-fixer', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/screenshot-to-text', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/pdf-accessibility-checker', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/studio', changeFrequency: 'monthly', priority: 0.7 },
  // The embed page is how other sites link back here, so it is worth a reader
  // finding it rather than only finding it through this site's own nav.
  { path: '/embed', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/about', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.3 },
];

export default function sitemap() {
  const entries = [
    ...STATIC_PAGES,
    { path: '/styles', changeFrequency: 'weekly', priority: 0.9 },
    // Exactly the six real landing pages. The 32 keyword-board slugs that used to
    // be here are permanently redirected now, and a redirect in a sitemap is a
    // contradiction: it asks a crawler to fetch a URL we have retired.
    ...styleSlugs().map((key) => ({ path: `/styles/${key}`, changeFrequency: 'monthly', priority: 0.7 })),
    ...catalog()
      .styles
      .filter((style) => style.indexable)
      .map((style) => ({ path: `/fonts/${style.slug}`, changeFrequency: 'monthly', priority: 0.6 })),
  ];

  return entries.map(({ path, changeFrequency, priority }) => ({
    url: `${env.siteUrl}${path}`,
    lastModified: lastModified(),
    changeFrequency,
    priority,
  }));
}