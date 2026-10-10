import { env } from '@/config/environment.js';
import { catalog } from '@/services/catalog.js';
import { boardSlugs } from '@/lib/keyword-board.js';

// Only active, indexable pages. Composed combinations stay out of the sitemap by design.
export default function sitemap() {
  const landingPaths = boardSlugs().map((key) => `/styles/${key}`);
  const paths = [
    '/', '/fonts', '/symbols', '/emoji', '/kaomoji', '/tools', '/about', '/privacy', '/terms', '/contact',
    '/styles',
    ...landingPaths,
    ...catalog().styles.filter((s) => s.indexable).map((s) => `/fonts/${s.slug}`),
  ];
  return paths.map((p) => ({ url: `${env.siteUrl}${p}`, changeFrequency: 'weekly' }));
}
