// What each page is trying to rank for.
//
// On-page SEO only works when one page owns one query. Two pages targeting the
// same term split its signals and both underperform, so every indexable page
// type is listed here with a single primary term, its secondary terms, and the
// page that already owns anything nearby. tests/unit/seo-keywords.test.js
// enforces that no two entries claim the same primary.

// Primary terms are deliberately chosen to be winnable: specific, lower
// competition and matched to what the page actually does. The head term
// "fancy text generator" is owned by the home page and is not a realistic
// target for anything else on the site.
export const KEYWORD_MAP = [
  {
    path: '/',
    primary: 'fancy text generator',
    secondary: ['copy and paste text generator', 'unicode text generator', 'fancy text copy paste'],
    note: 'Owns the head term. No other page may claim it.',
  },
  {
    path: '/fonts',
    primary: 'fancy font styles',
    secondary: ['text style list', 'fancy font list', 'unicode style list'],
    note: 'A browsable list, not a generator. "List" wording keeps it distinct from the home page.',
  },
  {
    path: '/tools',
    primary: 'word counter',
    secondary: ['character counter', 'text case converter', 'reverse text', 'slug generator'],
    note: 'Highest-volume low-competition query the site can realistically own.',
  },
  {
    path: '/studio',
    primary: 'fancy text image generator',
    secondary: ['text to png', 'stylish text png', 'text image maker'],
  },
  {
    path: '/symbols',
    primary: 'text symbols',
    secondary: ['cool symbols for bio', 'copy paste symbols', 'symbols for username'],
  },
  {
    path: '/emoji',
    primary: 'copy emoji',
    secondary: ['emoji copy paste', 'emoji for bio', 'copy and paste emoji'],
  },
  {
    path: '/kaomoji',
    primary: 'kaomoji',
    secondary: ['kaomoji copy paste', 'text emoticons', 'japanese emoticons'],
  },
  {
    path: '/styles',
    primary: 'fancy text styles list',
    secondary: ['unicode text styles', 'text style examples'],
  },
  {
    path: '/about',
    primary: 'stylzo',
    secondary: ['how unicode text works', 'what is a fancy text generator'],
  },
];

/**
 * Queries the whole site should be able to answer, and where. These are the
 * informational searches a tool site gets for free once the question is
 * answered plainly on the page.
 */
export const QUESTION_QUERIES = [
  { query: 'why does fancy text show boxes', answeredOn: '/about', section: 'Why some apps show boxes' },
  { query: 'does fancy text work on whatsapp', answeredOn: '/fonts/[slug]', section: 'Where {style} text works' },
  { query: 'can i use fancy text commercially', answeredOn: '/terms', section: 'What you can do with the output' },
  { query: 'is fancy text free', answeredOn: '/', section: 'Common questions' },
  { query: 'how to get fancy text on phone', answeredOn: '/', section: 'Common questions' },
  { query: 'what is a text generator', answeredOn: '/about', section: 'Common questions' },
];

/** Terms nothing on the site may use as a primary, because the home page owns it. */
export const RESERVED = ['fancy text generator'];

/** Normalise for comparison: case, punctuation and word order are all noise. */
export const normaliseTerm = (t) => t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

export function findByPath(path) {
  return KEYWORD_MAP.find((e) => e.path === path) || null;
}