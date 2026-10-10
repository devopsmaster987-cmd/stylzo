// Data access layer for style catalogs. Reads the build artifact produced by
// scripts/build-catalog.js; falls back to data/fonts.json when that is absent, so a
// fresh clone still boots.
//
// Everything derived (slug map, per-category lists, counts, the default /api/styles
// payload) is computed once at module load, never on a request. catalog() stays
// synchronous, so callers are unchanged.
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildCache } from './catalog-index.js';

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');
const CACHE_FILE = path.join(dataDir, '.catalog-cache.json');

const TTL_MS = 5 * 60 * 1000;
let cache = null;

const readJson = (f) => JSON.parse(readFileSync(path.join(dataDir, f), 'utf8'));

/**
 * Re-link the persisted position indexes into Maps of real records, and derive the
 * few values that are cheaper to build than to store.
 */
function link(raw) {
  const { styles } = raw;

  const bySlug = new Map();
  for (const slug in raw.bySlug) bySlug.set(slug, styles[raw.bySlug[slug]]);

  // Filtering by category is a Map hit instead of a 5.6k-element scan.
  const byCategory = new Map();
  for (const key in raw.byCategory) byCategory.set(key, raw.byCategory[key].map((i) => styles[i]));

  // Search compares against one pre-lowered string per style, built once per process
  // rather than per query.
  const haystack = styles.map((s) => `${s.name} ${s.slug} ${(s.tags || []).join(' ')}`.toLowerCase());

  // The default GET /api/styles body is the whole catalog and never varies by request,
  // so it is serialized here instead of mapping and re-stringifying 0.8 MB every hit.
  const apiPayload = JSON.stringify({ styles: styles.map((s) => ({ id: s.id, pipeline: s.pipeline })) });

  return {
    ...raw,
    bySlug,
    byCategory,
    haystack,
    apiPayload,
    loadedAt: Date.now(),
  };
}

function load() {
  let raw;
  try {
    raw = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    raw = buildCache(readJson('fonts.json'), readJson('categories.json'), readJson('pages.json'));
  }
  return link(raw);
}

/** Async variant used once at boot, so no request ever waits on disk. */
async function loadAsync() {
  try {
    return link(JSON.parse(await readFile(CACHE_FILE, 'utf8')));
  } catch {
    return load();
  }
}

// Built once while the module evaluates, before the first request can arrive.
cache = await loadAsync();

// process.env is a getter, so this is read once rather than on every catalog() call.
const CHECKS_TTL = process.env.NODE_ENV !== 'production';

export function catalog() {
  // In production the artifact is fixed for the lifetime of the process, so there is
  // nothing to re-read. Dev keeps a TTL so editing data and re-running the build script
  // shows up without a restart.
  if (CHECKS_TTL && Date.now() - cache.loadedAt > TTL_MS) {
    cache = load();
  }
  return cache;
}

export const getStyle = (slug) => catalog().bySlug.get(slug) || null;
export const getCategory = (key) => {
  const c = catalog().categories[key];
  return c ? { key, ...c } : null;
};

export function listStyles({ category } = {}) {
  const c = catalog();
  if (!category) return c.styles;
  return c.byCategory.get(category) || [];
}

/** One page of styles for infinite scroll / load-more. Slices the prebuilt category list. */
export function pageStyles({ category, offset = 0, limit = 48 } = {}) {
  const items = listStyles({ category });
  const start = Math.max(0, offset);
  return { total: items.length, items: items.slice(start, start + limit), offset: start };
}

/** Ranked name/slug/tag search across the whole catalog. */
export function searchStyles(query, n = 24) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const c = catalog();
  const starts = [];
  const has = [];
  for (let i = 0; i < c.styles.length; i++) {
    const s = c.styles[i];
    if (!c.haystack[i].includes(q)) continue;
    if (s.name.toLowerCase().startsWith(q) || s.slug.startsWith(q)) starts.push(s);
    else has.push(s);
    if (starts.length >= n) break;
  }
  return [...starts, ...has].slice(0, n);
}

/** Popular curated styles first, then the rest of the indexable ones. */
export function featuredStyles(n = 24) {
  const c = catalog();
  const popular = new Set(c.popularIndexable);
  const rest = c.indexable.filter((i) => !popular.has(i));
  return [...c.popularIndexable, ...rest].map((i) => c.styles[i]).slice(0, n);
}

/** Same-category siblings plus the parent style, from the ~100 indexable styles. */
export function relatedStyles(style, n = 6) {
  const c = catalog();
  const root = style.parent || style.slug;
  const pool = c.indexable
    .map((i) => c.styles[i])
    .filter((s) => s.slug !== style.slug && (s.category === style.category || s.slug === root));
  pool.sort((a, b) => (b.slug === root) - (a.slug === root));
  return pool.slice(0, n);
}

export function pageContent(key) {
  return catalog().pages[key] || null;
}

/** The pre-serialized body for the default GET /api/styles response. */
export const apiStylesPayload = () => catalog().apiPayload;

// ---- M3 libraries (symbols, emoji, kaomoji) ---------------------------------
const libCache = new Map();
export function library(name) {
  if (!libCache.has(name)) libCache.set(name, readJson(`${name}.json`));
  return libCache.get(name);
}