
import { env } from '@/config/environment.js';
import { catalog } from '@/services/catalog.js';
import { boardSlugs } from '@/lib/keyword-board.js';

// Only active, indexable pages. Composed combinations stay out of the sitemap.
export default function sitemap() {
  const landingPaths = boardSlugs().map((key) => `/styles/${key}`);

  const paths = [
    '/',
    '/fonts',
    '/symbols',
    '/emoji',
    '/kaomoji',
    '/tools',
    '/about',
    '/privacy',
    '/terms',
    '/contact',
    '/styles',
    ...landingPaths,
    ...catalog()
      .styles
      .filter((style) => style.indexable)
      .map((style) => `/fonts/${style.slug}`),
  ];

  return paths.map((path) => ({
    url: `${env.siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
  }));
}
