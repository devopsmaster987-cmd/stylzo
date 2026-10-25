
 // Data access layer for style catalogs.
// Reads the build artifact produced by scripts/build-catalog.js.
// Falls back to data/fonts.json when the cache is unavailable.

import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildCache } from './catalog-index.js';

// Resolve data files from the project root.
const dataDir = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(dataDir, '.catalog-cache.json');

const TTL_MS = 5 * 60 * 1000;
let cache = null;

const readJson = (filename) =>
  JSON.parse(readFileSync(path.join(dataDir, filename), 'utf8'));

/**
 * Re-link persisted indexes to actual records and derive
 * search data and the default API payload.
 */
function link(raw) {
  const { styles } = raw;
  const bySlug = new Map();

  for (const slug in raw.bySlug) {
    bySlug.set(slug, styles[raw.bySlug[slug]]);
  }

  const byCategory = new Map();

  for (const key in raw.byCategory) {
    byCategory.set(
      key,
      raw.byCategory[key].map((index) => styles[index])
    );
  }

  const haystack = styles.map((style) =>
    [
      style.name,
      style.slug,
      ...(style.tags || []),
    ]
      .join(' ')
      .toLowerCase()
  );

  // The indexable styles as records, resolved once. Every caller that wanted
  // "the indexable ones" rebuilt this array from the position list per request.
  const indexableStyles = raw.indexable.map((index) => styles[index]);

  // The category hubs list only the indexable styles, so their links must count
  // the same set. Using the full catalog count sent visitors to a "482 styles"
  // page that only had two rows.
  const indexableCounts = {};
  for (const style of indexableStyles) {
    indexableCounts[style.category] = (indexableCounts[style.category] || 0) + 1;
  }

  const apiPayload = JSON.stringify({
    styles: styles.map((style) => ({
      id: style.id,
      pipeline: style.pipeline,
    })),
  });

  return {
    ...raw,
    bySlug,
    byCategory,
    haystack,
    indexableStyles,
    indexableCounts,
    apiPayload,
    loadedAt: Date.now(),
  };
}

/**
 * Load the generated catalog cache.
 * If unavailable, build the catalog from source JSON files.
 */
function load() {
  let raw;

  try {
    raw = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    raw = buildCache(
      readJson('fonts.json'),
      readJson('categories.json'),
      readJson('pages.json')
    );
  }

  return link(raw);
}

/**
 * Async initial load.
 */
async function loadAsync() {
  try {
    const content = await readFile(CACHE_FILE, 'utf8');
    return link(JSON.parse(content));
  } catch {
    return load();
  }
}

// Initialize the catalog before serving requests.
cache = await loadAsync();

const CHECKS_TTL = process.env.NODE_ENV !== 'production';

export function catalog() {
  if (CHECKS_TTL && Date.now() - cache.loadedAt > TTL_MS) {
    cache = load();
  }

  return cache;
}

export const getStyle = (slug) =>
  catalog().bySlug.get(slug) || null;

export const getCategory = (key) => {
  const category = catalog().categories[key];

  return category ? { key, ...category } : null;
};

export function listStyles({ category } = {}) {
  const current = catalog();

  if (!category) {
    return current.styles;
  }

  return current.byCategory.get(category) || [];
}

/**
 * Return one page of styles for infinite scrolling.
 */
export function pageStyles({
  category,
  offset = 0,
  limit = 48,
} = {}) {
  const items = listStyles({ category });
  const start = Math.max(0, offset);

  return {
    total: items.length,
    items: items.slice(start, start + limit),
    offset: start,
  };
}

/**
 * Search styles by name, slug, or tags.
 */
export function searchStyles(query, n = 24) {
  const q = String(query || '').trim().toLowerCase();

  if (!q) {
    return [];
  }

  const current = catalog();
  const starts = [];
  const has = [];

  for (let i = 0; i < current.styles.length; i++) {
    const style = current.styles[i];

    if (!current.haystack[i].includes(q)) {
      continue;
    }

    if (
      style.name.toLowerCase().startsWith(q) ||
      style.slug.startsWith(q)
    ) {
      starts.push(style);
    } else {
      has.push(style);
    }

    if (starts.length >= n) {
      break;
    }
  }

  return [...starts, ...has].slice(0, n);
}

/**
 * Return related styles from the same category and parent.
 */
export function relatedStyles(style, n = 6) {
  const root = style.parent || style.slug;

  const pool = catalog().indexableStyles.filter(
    (item) =>
      item.slug !== style.slug &&
      (item.category === style.category || item.slug === root)
  );

  pool.sort((a, b) => (b.slug === root) - (a.slug === root));

  return pool.slice(0, n);
}

export function pageContent(key) {
  return catalog().pages[key] || null;
}

/**
 * Return the pre-serialized default styles API response.
 */
export const apiStylesPayload = () => catalog().apiPayload;

// ---- M3 libraries: symbols, emoji, kaomoji -------------------------------

const libCache = new Map();

export function library(name) {
  if (!libCache.has(name)) {
    libCache.set(name, readJson(`${name}.json`));
  }

  return libCache.get(name);
}
