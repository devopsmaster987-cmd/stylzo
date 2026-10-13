// Which /styles pages exist, where the rest of them go, and which pages may
// carry an ad.
//
// The site used to publish a keyword board: one near-identical page per search
// phrase (/styles/fancy-text-generator-2024, /styles/hindi-fancy-text-generator,
// /styles/copy-and-paste-fancy-text and so on). Each rendered the same 25 words
// in the same 25 styles, each carried an ad, and none of them earned it. They
// are thin doorway pages: they competed with the home page and with the six
// real landing pages, and they passed link equity nowhere useful.
//
// They are gone. What survives under /styles is the index and six hand-written
// landing pages, and everything else is a permanent redirect to the closest real
// destination rather than a 404 or, worse, a live page.
//
// This file is the one place that decides any of it. next.config.mjs, the route,
// the sitemap and the tests all read from here, so a page cannot be prerendered
// but unredirected, redirected but still in the sitemap, or in the sitemap but
// not allowed to show an ad.
//
// Plain ESM with no imports on purpose: next.config.mjs loads this at build
// time, outside the bundler and outside the '@/...' alias, so it must resolve
// with nothing but the file system.

/**
 * The six /styles/<slug> pages that really exist. Each is hand-written content
 * in lib/landing-pages.js with its own FAQs, field limits and style picks, which
 * is the bar a page has to clear to stay live.
 */
export const KEPT_STYLE_SLUGS = [
  'instagram',
  'whatsapp',
  'discord',
  'gaming',
  'languages',
  'colours',
];

/** Escape a string for literal use inside a RegExp. */
const literal = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A literal keyword as a regex that matches it in any case, with no inline flags.
 *
 * Vercel rejects `(?i:...)` in a next.config redirect `source`: it is a path-to-regexp
 * construct the platform does not accept, so the deploy fails on config validation
 * before a request is ever served. The obvious workarounds both lose something.
 * Dropping the case handling entirely regresses real traffic, because next.config
 * redirects are applied *before* proxy.js, so an uppercase slug is swallowed by the
 * catch-all and sent to `/` instead of to the page it names. Emitting separate
 * lower/upper patterns only covers two of the cases and still loses `Instagram-Fancy-
 * Text-Generator`.
 *
 * So the case handling moves into the pattern itself. Spelling a keyword as a
 * character class per letter — `[iI][nN][sS]…` — matches exactly what `(?i:…)`
 * matched, using nothing but plain regex that every consumer accepts.
 *
 * Length is the trade. A 30-character keyword becomes ~60, and the catch-all carries
 * all six kept slugs, so the generated sources run to a few hundred characters.
 * That is well inside what path-to-regexp and Vercel handle, and it is generated
 * rather than hand-written, so it cannot drift from KEPT_STYLE_SLUGS.
 */
const ci = (value) => [...value]
  .map((ch) => (/[A-Za-z]/.test(ch) ? `[${ch.toLowerCase()}${ch.toUpperCase()}]` : literal(ch)))
  .join('');

/**
 * Ordered redirect rules for a removed /styles/<slug>.
 *
 * First match wins, both here and in the Next.js redirect list, so the broad
 * rules come last and can never shadow a specific one.
 *
 * Every rule is deliberately narrow. A rule that "helpfully" guessed would be
 * worse than the catch-all: sending a reader to a page about something other
 * than what they asked for is a worse experience than sending them to the home
 * page, where they can pick again.
 */
export const STYLE_REDIRECT_RULES = [
  {
    // "Anything about Instagram" lands on the Instagram page. This is the one
    // platform with enough real search volume, and enough distinct guidance
    // about bio/username/caption limits, to be worth a dedicated page.
    //
    // The negative lookahead is not decoration: plain /styles/instagram matches
    // "contains instagram" too, and a rule that redirected it to itself would
    // loop.
    id: 'instagram',
    pattern: /^((?!instagram$).*instagram.*)$/i,
    to: '/styles/instagram',
  },
  {
    // Language keywords are not generator pages. Styling Latin letters with
    // Latin look-alikes does nothing to Devanagari, Nastaliq or Tamil, so these
    // pages used to promise styled Hindi text and deliver the sample word
    // untouched. The script-compatibility page is the honest destination and
    // already explains exactly that.
    id: 'languages',
    pattern: /^(hindi|urdu|arabic|tamil|marathi)-fancy-text-generator$/i,
    to: '/styles/languages',
  },
  {
    // Plain Unicode cannot carry a font colour. The colour-display page exists
    // to explain why, rather than shipping a generator that renders nothing
    // anyone can copy.
    id: 'colours',
    pattern: /^fancy-text-generator-blue-colour$/i,
    to: '/styles/colours',
  },
];

/**
 * Where a removed slug goes, or null when the slug is a real page.
 *
 * Kept slugs return null so a caller can tell "redirect this" from "this is a
 * page" without re-deriving the list.
 */
export function styleRedirectFor(slug) {
  const value = String(slug || '');
  if (!value) return null;
  if (isKeptStyleSlug(value)) return null;
  for (const rule of STYLE_REDIRECT_RULES) {
    if (rule.pattern.test(value)) return rule.to;
  }
  return '/';
}

/** True for the six real pages, case-insensitively (URLs are case-sensitive, users are not). */
export function isKeptStyleSlug(slug) {
  return KEPT_STYLE_SLUGS.includes(String(slug || '').toLowerCase());
}

/**
 * The catch-all, as a path-to-regexp source.
 *
 * Everything under /styles/<slug> that is not one of the six real pages is
 * permanently redirected, so a slug invented tomorrow never becomes a live thin
 * page: it goes to the home page on the first request instead.
 *
 * The negative lookahead is what keeps the six real pages out of it, and it has to
 * match those slugs in any case. next.config redirects run before proxy.js, so if
 * this only excluded the lowercase spellings then `/styles/Instagram` would be
 * caught here and sent to `/`, and the 308 case-normalisation in proxy.js would
 * never get a chance to see it. `ci()` is what makes the exclusion case-proof.
 */
export function styleCatchAllSource() {
  const kept = KEPT_STYLE_SLUGS.map(ci).join('|');
  return `/styles/:slug((?!(?:${kept})$)[^/]+)`;
}

/**
 * The redirect list, in match order, ready to drop into next.config.
 *
 * Generated here rather than written in next.config.mjs so that the list the
 * server actually runs and the rules the rest of the app reasons about are the
 * same object. The narrow rules come first; Next takes the first match, so
 * ordering is what stops the catch-all from shadowing them.
 *
 * `statusCode: 301` rather than `permanent: true`: Next's `permanent` flag
 * emits a 308, and a 308 says "this resource moved, probably temporarily". These
 * URLs are retired for good, and a 301 is what tells a crawler to drop the old
 * one from its index rather than keep checking back.
 *
 * These are path-to-regexp sources, not the plain RegExp objects above. The two
 * differ in one way that matters: path-to-regexp anchors the whole path itself,
 * so `^` and `$` inside a parameter pattern would be looking for the start and
 * end of the entire request path rather than of the slug, and would never
 * match. Every pattern below is therefore written to be bounded by the `/`
 * around it instead, using an explicit `[^/]` instead of `.`.
 *
 * They also differ in how they match case. The plain RegExps above carry the `/i`
 * flag; a next.config `source` cannot, and `(?i:...)` is rejected by Vercel, so
 * each keyword is spelled out with `ci()` instead. Both forms match the same
 * slugs, which is what stops `styleRedirectFor()` — the app-side answer — and the
 * redirect the server actually serves from disagreeing.
 */
export function styleRedirects() {
  const instagram = ci('instagram');
  // The shared `-fancy-text-generator` tail is written once rather than repeated
  // inside every branch: the alternation is grouped, so it applies to whichever
  // language matched. Identical matching, a third of the pattern.
  const languages = ['hindi', 'urdu', 'arabic', 'tamil', 'marathi'].map(ci).join('|');

  return [
    {
      source: `/styles/:slug((?!${instagram}$)[^/]*${instagram}[^/]*)`,
      destination: '/styles/instagram',
      statusCode: 301,
    },
    {
      source: `/styles/:slug((?:${languages})${ci('-fancy-text-generator')})`,
      destination: '/styles/languages',
      statusCode: 301,
    },
    {
      source: `/styles/:slug(${ci('fancy-text-generator-blue-colour')})`,
      destination: '/styles/colours',
      statusCode: 301,
    },
    {
      source: styleCatchAllSource(),
      destination: '/',
      statusCode: 301,
    },
  ];
}

/**
 * Pages allowed to render an ad.
 *
 * AdSense expects an ad to sit in real content a reader scrolls past. A unit on
 * a page that is only a list of links, or that exists because a keyword matched,
 * is a policy problem rather than a layout detail.
 *
 * /styles is in this list conditionally: it is a hub for real pages rather than
 * a keyword farm, but it still has to earn its unit, so adAllowedOn() applies the
 * word-count floor to it specifically.
 */
export const AD_ALLOWED_PATHS = [
  '/',
  ...KEPT_STYLE_SLUGS.map((slug) => `/styles/${slug}`),
];

/** A /fonts/<slug> style page is real content and may carry one unit. */
const isFontPage = (path) => /^\/fonts\/[^/]+$/.test(path);

/** The hub, which only earns an ad once it has this many words of its own text. */
export const STYLES_HUB_AD_MIN_WORDS = 300;

/**
 * Whether a path may render an ad, ignoring the /styles word-count condition.
 *
 * Kept separate from adAllowedOn() so the tests can assert the allowlist itself
 * without re-deriving how much prose the hub happens to carry this week.
 */
export function isAdAllowedPath(path) {
  const value = String(path || '').split('?')[0].replace(/\/$/, '') || '/';
  return value === '/' || value === '/styles' || isFontPage(value) || AD_ALLOWED_PATHS.includes(value);
}

/**
 * Whether this particular render may show an ad.
 *
 * `stylesHubWords` is the hub's own word count. It is passed in rather than
 * measured here so the same number decides the page and the test.
 */
export function adAllowedOn(path, { stylesHubWords = 0 } = {}) {
  const value = String(path || '').split('?')[0].replace(/\/$/, '') || '/';
  if (value === '/styles') return stylesHubWords >= STYLES_HUB_AD_MIN_WORDS;
  return isAdAllowedPath(value);
}
