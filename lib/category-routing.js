import { CATEGORY_KEYS } from './category-keys.js';

/**
 * Category hubs that were too thin to keep at their own URL.
 *
 * Outline and Wide each have one indexable style, so their hub was a second
 * page for the same content as the style page. They redirect permanently.
 */
export const CATEGORY_REDIRECTS = Object.freeze({
  outline: '/fonts/double-struck',
  wide: '/fonts/fullwidth',
});

/** Hubs that keep their copy and URL but are too thin to be indexed. */
export const NOINDEX_CATEGORY_KEYS = Object.freeze(['bold', 'cursive', 'gothic', 'clean']);

export const REDIRECTED_CATEGORY_KEYS = Object.freeze(Object.keys(CATEGORY_REDIRECTS));

/** Every category that still renders a page, including the noindex hubs. */
export const CATEGORY_PAGE_KEYS = Object.freeze(
  CATEGORY_KEYS.filter((key) => !CATEGORY_REDIRECTS[key]),
);

/** The only category hubs that belong in the sitemap. */
export const INDEXABLE_CATEGORY_KEYS = Object.freeze(
  CATEGORY_PAGE_KEYS.filter((key) => !NOINDEX_CATEGORY_KEYS.includes(key)),
);

const indexable = new Set(INDEXABLE_CATEGORY_KEYS);

export function isIndexableCategory(key) {
  return indexable.has(key);
}

/**
 * The URL an internal category link should use.
 *
 * A redirect target is only useful to a crawler on the old URL. Linking to it
 * spends a redirect hop on every visit, so the site's own links point at the
 * final page instead.
 */
export function categoryHref(key) {
  return CATEGORY_REDIRECTS[key] || `/fonts/category/${key}`;
}

export function categoryRedirects() {
  return Object.entries(CATEGORY_REDIRECTS).map(([key, destination]) => ({
    source: `/fonts/category/${key}`,
    destination,
    statusCode: 301,
  }));
}
