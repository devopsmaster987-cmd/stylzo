// Semantic keywords: the terms around a page's primary query, not more variants
// of it.
//
// The primary term says what a page is for. Semantic keywords say which other
// ideas that page also covers, which is how a search engine decides the page is
// about a *topic* rather than about one string. They matter more than they used
// to, because retrieval now runs over embeddings: matching meaning is what
// selects the page at all.
//
// Two rules decide what is allowed in here.
//
// 1. Nothing is invented. A term is either a real synonym an editor wrote, or
//    it is read out of the catalog — a category name, a style that exists, a
//    platform the site genuinely supports. The site has 5,616 styles, so there
//    is never a reason to make one up.
//
// 2. Nothing is stuffed. These are not meta keywords and not hidden text; they
//    are the wording of a visible "related searches" block, and each one either
//    links somewhere real or is not claimed as a target at all. Repeating a
//    keyword in a hidden div is what the original brief ruled out and what this
//    file continues to rule out.
//
// Relative imports so this loads under plain node for scripts and node:test.

import { catalog } from '../services/catalog.js';
import { KEYWORD_MAP, normaliseTerm } from './seo-keywords.js';
import { styleSlugs } from './styles-material.js';

/**
 * How a term relates to the page. The relation is kept because "synonym" is
 * evidence the page answers that search, while "entity" is only evidence it is
 * on the subject — and the two should never be counted the same way.
 */
export const RELATION = {
  SYNONYM: 'synonym',   // another way people ask for this exact thing
  ENTITY: 'entity',     // a concept the page is about but is not a query for
  CATEGORY: 'category', // a real catalog group, linked to the catalog
  PLATFORM: 'platform', // a destination the output is meant for
};

/**
 * Editorial synonyms and entities, per page path.
 *
 * Hand-written rather than generated: a synonym is a claim about how people
 * actually phrase a search, and no amount of string manipulation can know that
 * "thick" and "heavy" are the same request while "dark" is a different one.
 * Each entry names a real, distinct thing the page genuinely does.
 */
const CURATED = {
  '/': {
    synonyms: [
      'fancy text copy paste', 'unicode text generator', 'text style generator',
      'cool text generator', 'fancy letters generator', 'unicode font generator',
    ],
    entities: [
      'unicode characters', 'look-alike letters', 'text styling', 'character substitution',
      'unicode blocks', 'letterforms',
    ],
  },
  '/fonts': {
    synonyms: ['fancy font list', 'text style list', 'unicode style list', 'letter style list'],
    entities: ['font styles', 'type scale', 'alphabet categories', 'letterforms'],
  },
  '/styles': {
    synonyms: ['fancy text ideas', 'styled word list', 'emoji text styles'],
    entities: ['style guides', 'style suggestions', 'decorated words'],
  },
  '/tools': {
    synonyms: ['word counter online', 'character counter online', 'text case converter'],
    entities: ['word count', 'reading time', 'slug generator', 'text utilities'],
  },
  '/studio': {
    synonyms: ['text to png', 'text image maker', 'stylish text png', 'text photo generator'],
    entities: ['canvas rendering', 'image export', 'shareable image', '1200x630 image'],
  },
  '/image-compression': {
    synonyms: [
      'compress jpg online', 'compress png online', 'reduce image file size',
      'batch image compressor', 'image resizer and compressor',
    ],
    entities: [
      'lossy compression', 'lossless compression', 'webp conversion', 'file size reduction',
      'image quality setting', 'resize to web dimensions',
    ],
  },
  '/qr-code-generator': {
    synonyms: [
      'qr code generator online', 'create qr code', 'qr code maker', 'text to qr code',
      'wifi qr code generator', 'whatsapp qr code generator', 'email qr code generator',
      'contact qr code generator', 'free qr code maker', 'downloadable qr code',
    ],
    entities: [
      'qr code types', 'error correction level', 'quiet zone', 'scanable qr code',
      'qr code generator online', 'png svg jpg download',
    ],
  },
  '/qr-code-reader': {
    synonyms: [
      'read qr code', 'qr code scanner online', 'extract qr code data', 'qr code extractor',
      'decode qr code', 'qr code decoder',
    ],
    entities: [
      'qr code contents', 'phone number from qr code', 'email from qr code', 'wifi qr code',
      'vcard qr code', 'qr payload', 'contact card from qr code',
    ],
  },
  '/pdf-editor': {
    synonyms: [
      'edit pdf online', 'pdf page editor', 'merge pdf pages', 'rotate pdf pages',
      'add page numbers to pdf', 'reorder pdf pages',
    ],
    entities: [
      'pdf pages', 'page rotation', 'page order', 'text stamp', 'page numbers',
      'pdf merge', 'browser pdf editing',
    ],
  },
  '/pdf-accessibility-checker': {
    synonyms: [
      'pdf accessibility checker online', 'pdf accessibility audit', 'check if pdf is tagged',
      'pdf screen reader test',
    ],
    entities: [
      'tagged pdf', 'document language', 'alt text in pdf', 'pdf structure tree',
      'pdf document title', 'accessible form fields',
    ],
  },
  '/screenshot-to-text': {
    synonyms: [
      'screenshot to text converter', 'convert image to text', 'read text from image',
      'image text extractor',
    ],
    entities: [
      'optical character recognition', 'ocr in browser', 'extract text from screenshot',
      'editable text from image', 'png to text', 'jpg to text',
    ],
  },
  '/universal-text-fixer': {
    synonyms: [
      'clean up text online', 'fix text online', 'text normalizer', 'remove extra spaces from text',
    ],
    entities: [
      'remove zero width characters', 'fix repeated words', 'curly quotes to straight quotes',
      'sentence case converter', 'common misspellings',
    ],
  },
  '/symbols': {
    synonyms: ['cool symbols for bio', 'copy paste symbols', 'text symbols for username'],
    entities: ['symbol blocks', 'decorative glyphs', 'dingbats', 'arrow characters'],
  },
  '/emoji': {
    synonyms: ['copy emoji', 'emoji copy paste', 'emoji for bio'],
    entities: ['emoji set', 'unicode emoji', 'emoticons'],
  },
  '/kaomoji': {
    synonyms: ['kaomoji copy paste', 'text emoticons', 'japanese emoticons'],
    entities: ['ascii faces', 'text faces', 'keyboard emoticons'],
  },
  '/about': {
    synonyms: ['how unicode text works', 'what is a fancy text generator'],
    entities: ['unicode standard', 'character encoding', 'text styling explained'],
  },
};

/**
 * Primary terms owned by other pages, which a semantic list must never restate.
 *
 * Categories are read from the catalog, and one of them is called "kaomoji" —
 * which is also /kaomoji's primary query. Listing it as a keyword on the home
 * page would have two pages targeting one term, which is the exact split the
 * one-primary-per-page rule exists to prevent. A derived term that collides is
 * dropped rather than rendered.
 */
function foreignPrimaries(path) {
  return new Set(
    KEYWORD_MAP.filter((e) => e.path !== path).map((e) => normaliseTerm(e.primary)),
  );
}

/**
 * Destinations the output is actually for.
 *
 * Deliberately intersected with the slugs the site really serves rather than
 * listed as literals. A hardcoded platform that has no page becomes a link to a
 * 404, which is worse for relevance than naming no platform at all: 'tiktok'
 * was in the first draft of this list and there is no tiktok page.
 */
const PLATFORMS = ['instagram', 'whatsapp', 'discord', 'tiktok', 'facebook'];

function platformTerms() {
  const slugs = new Set(styleSlugs());
  return PLATFORMS
    .filter((p) => slugs.has(p))
    .map((p) => ({ term: `${p} fancy text`, relation: RELATION.PLATFORM, href: `/styles/${p}` }));
}

/**
 * Real category names from the built catalog.
 *
 * Read at call time rather than hardcoded, so a category that is renamed or
 * dropped cannot leave the site claiming a group that no longer exists.
 */
function categoryTerms() {
  return Object.entries(catalog().categories).map(([key, c]) => ({
    term: c.name,
    relation: RELATION.CATEGORY,
    href: `/fonts/category/${key}`,
  }));
}

/**
 * Every semantic term for a path, deduplicated case-insensitively.
 *
 * Deterministic and ordered: curated first (highest intent), then categories in
 * catalog order. The same inputs always produce the same array, which is what
 * lets the build and the test compare it byte for byte.
 */
export function semanticKeywordsFor(path) {
  const entry = CURATED[path] || { synonyms: [], entities: [] };
  const map = KEYWORD_MAP.find((e) => e.path === path);
  const taken = foreignPrimaries(path);
  const out = [];

  const push = (term, relation, href) => {
    const clean = String(term || '').trim().toLowerCase();
    if (!clean) return;
    // Dropped rather than rendered: see foreignPrimaries().
    if (taken.has(normaliseTerm(clean))) return;
    if (out.some((t) => normaliseTerm(t.term) === normaliseTerm(clean))) return;
    out.push({ term: clean, relation, ...(href ? { href } : {}) });
  };

  // Secondary terms from the targeting map come first: they were chosen as
  // genuine alternative queries, which is exactly what a synonym is.
  for (const t of map?.secondary || []) push(t, RELATION.SYNONYM);

  for (const t of entry.synonyms) push(t, RELATION.SYNONYM);
  for (const t of entry.entities) push(t, RELATION.ENTITY);

  if (path === '/' || path === '/styles') {
    for (const p of platformTerms()) push(p.term, p.relation, p.href);
  }

  if (path === '/') {
    for (const c of categoryTerms()) push(c.term, c.relation, c.href);
  }

  return out;
}

/** Terms grouped by relation, for rendering. */
export function semanticGroups(path) {
  const all = semanticKeywordsFor(path);
  return Object.values(RELATION)
    .map((relation) => ({
      relation,
      label: {
        [RELATION.SYNONYM]: 'Other ways people ask for this',
        [RELATION.ENTITY]: 'Related ideas',
        [RELATION.CATEGORY]: 'Browse by style',
        [RELATION.PLATFORM]: 'Made for',
      }[relation],
      terms: all.filter((t) => t.relation === relation),
    }))
    .filter((g) => g.terms.length);
}

/**
 * A single comma-joined string, for the one place a bare list is genuinely
 * wanted. Exposed deliberately rather than used inline, so that any call site
 * has to choose between this and the grouped, linked version.
 */
export function semanticKeywordString(path) {
  return semanticKeywordsFor(path).map((t) => t.term).join(', ');
}