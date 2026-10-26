import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import { env } from '@/config/environment.js';
import { catalog } from '@/services/catalog.js';
import { styleSlugs } from '@/lib/styles-material.js';
import { INDEXABLE_CATEGORY_KEYS } from '@/lib/category-routing.js';
import { PLATFORM_PAGES } from '@/lib/platform-pages.js';

// Only active, indexable pages. Composed combinations stay out of the sitemap.

// `new Date()` on every build tells crawlers every URL changed just now, which
// trains them to ignore lastmod and defeats crawl scheduling. Pin each group to
// the last commit that touched the files that actually produce it, falling back
// to the file's mtime when git is unavailable (a tarball deploy, for example).
const stampCache = new Map();

function fileStamp(file) {
  if (stampCache.has(file)) return stampCache.get(file);

  let stamp = null;
  try {
    const out = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', file],
      { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    if (out) stamp = new Date(out);
  } catch {
    // No git, or a shallow deploy without history. The fallback below is still
    // stable for the life of the build.
  }

  if (!stamp || Number.isNaN(stamp.getTime())) {
    try {
      stamp = statSync(path.join(/* turbopackIgnore: true */ process.cwd(), file)).mtime;
    } catch {
      stamp = new Date('2025-01-01T00:00:00.000Z');
    }
  }

  stampCache.set(file, stamp);
  return stamp;
}

function lastModifiedFor(files) {
  return files.reduce((latest, file) => {
    const stamp = fileStamp(file);
    return stamp > latest ? stamp : latest;
  }, new Date(0));
}

const HOME_SOURCES = ['app/page.jsx', 'lib/home-content.js', 'lib/aeo.js', 'services/seo.js'];
const STATIC_SOURCES = ['data/pages.json', 'components/static-page.jsx', 'lib/pages.js'];
const FONT_SOURCES = ['data/fonts.json', 'lib/style-content.js', 'data/font-page-content.js', 'app/fonts/[slug]/page.jsx'];
const STYLE_SOURCES = ['lib/landing-pages.js', 'lib/aeo.js', 'components/landing-page.jsx'];
const PLATFORM_SOURCES = ['lib/platform-pages.js', 'components/platform-guide.jsx'];
const CATEGORY_SOURCES = ['data/categories.json', 'lib/category-content.js', 'lib/category-routing.js', 'components/category-page.jsx'];
const TOOL_SOURCES = ['lib/aeo.js', 'lib/pages.js', 'services/seo.js'];

/** Static pages never change often; the catalog is the part that does. */
const STATIC_PAGES = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0, sources: HOME_SOURCES },
  { path: '/fonts', changeFrequency: 'weekly', priority: 0.9, sources: ['app/fonts/page.jsx', 'lib/aeo.js'] },
  { path: '/symbols', changeFrequency: 'monthly', priority: 0.7, sources: ['data/symbols.json', 'components/library-page.jsx'] },
  { path: '/emoji', changeFrequency: 'monthly', priority: 0.7, sources: ['data/emoji.json', 'components/library-page.jsx'] },
  { path: '/kaomoji', changeFrequency: 'monthly', priority: 0.7, sources: ['data/kaomoji.json', 'components/library-page.jsx'] },
  { path: '/tools', changeFrequency: 'monthly', priority: 0.8, sources: ['app/tools/page.jsx', ...TOOL_SOURCES] },
  { path: '/image-compression', changeFrequency: 'monthly', priority: 0.8, sources: ['app/image-compression/page.jsx', ...TOOL_SOURCES] },
  { path: '/qr-code-generator', changeFrequency: 'monthly', priority: 0.8, sources: ['app/qr-code-generator/page.jsx', ...TOOL_SOURCES] },
  { path: '/qr-code-reader', changeFrequency: 'monthly', priority: 0.8, sources: ['app/qr-code-reader/page.jsx', ...TOOL_SOURCES] },
  { path: '/universal-text-fixer', changeFrequency: 'monthly', priority: 0.8, sources: ['app/universal-text-fixer/page.jsx', ...TOOL_SOURCES] },
  { path: '/screenshot-to-text', changeFrequency: 'monthly', priority: 0.8, sources: ['app/screenshot-to-text/page.jsx', ...TOOL_SOURCES] },
  { path: '/pdf-editor', changeFrequency: 'monthly', priority: 0.8, sources: ['app/pdf-editor/page.jsx', ...TOOL_SOURCES] },
  { path: '/pdf-accessibility-checker', changeFrequency: 'monthly', priority: 0.8, sources: ['app/pdf-accessibility-checker/page.jsx', ...TOOL_SOURCES] },
  { path: '/studio', changeFrequency: 'monthly', priority: 0.7, sources: ['app/studio/page.jsx', 'lib/aeo.js'] },
  // The embed page is how other sites link back here, so it is worth a reader
  // finding it rather than only finding it through this site's own nav.
  { path: '/embed', changeFrequency: 'monthly', priority: 0.6, sources: ['app/embed/page.jsx'] },
  { path: '/about', changeFrequency: 'yearly', priority: 0.3, sources: STATIC_SOURCES },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2, sources: STATIC_SOURCES },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2, sources: STATIC_SOURCES },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.3, sources: STATIC_SOURCES },
];

export default function sitemap() {
  const entries = [
    ...STATIC_PAGES,
    { path: '/styles', changeFrequency: 'weekly', priority: 0.9, sources: STYLE_SOURCES },
    // Exactly the six real landing pages. The 32 keyword-board slugs that used to
    // be here are permanently redirected now, and a redirect in a sitemap is a
    // contradiction: it asks a crawler to fetch a URL we have retired.
    ...styleSlugs().map((key) => ({
      path: `/styles/${key}`,
      changeFrequency: 'monthly',
      priority: 0.7,
      sources: STYLE_SOURCES,
    })),
    ...PLATFORM_PAGES.map((page) => ({
      path: page.path,
      changeFrequency: 'monthly',
      priority: 0.75,
      sources: PLATFORM_SOURCES,
    })),
    // Only the category hubs that are meant to rank. The four thin hubs keep
    // their copy and self-canonical URLs but are noindex; Outline and Wide now
    // redirect to their single style page. A sitemap must contain neither.
    ...INDEXABLE_CATEGORY_KEYS.map((key) => ({
      path: `/fonts/category/${key}`,
      changeFrequency: 'monthly',
      priority: 0.75,
      sources: CATEGORY_SOURCES,
    })),
    ...catalog()
      .styles
      .filter((style) => style.indexable)
      .map((style) => ({
        path: `/fonts/${style.slug}`,
        changeFrequency: 'monthly',
        priority: 0.6,
        sources: FONT_SOURCES,
      })),
  ];

  return entries.map(({ path: sitePath, changeFrequency, priority, sources }) => ({
    // Match the canonical form exactly. Next normalises the home canonical to
    // the origin without a trailing slash, so the sitemap must not invent one.
    url: sitePath === '/' ? env.siteUrl : `${env.siteUrl}${sitePath}`,
    lastModified: lastModifiedFor(sources),
    changeFrequency,
    priority,
  }));
}
