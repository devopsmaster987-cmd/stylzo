// Deterministic SEO keyword engine.
//
// Every function here is pure and side-effect free so scripts/build-keyword-map.js,
// the runtime dashboard and the test suite all produce byte-identical results from
// the same inputs. Nothing here reads or writes the filesystem; the build script owns I/O.
//
// Pipeline: raw line -> normalize -> deduplicate -> classify -> map to a route or a
// non-mapped status. Every rejection carries a machine-readable reason so the audit
// report can explain itself without re-deriving anything.

// Relative imports (not the `@/` alias) so this module also loads under plain
// node for scripts/build-keyword-map.js and the node:test suite.
import { catalog } from '../services/catalog.js';
import { LANDING_PAGES } from './landing-pages.js';
import { PLATFORM_PAGES } from './platform-pages.js';

// ---- configuration --------------------------------------------------------

/** Minimum legitimate emoji-wrapped variations a section should aim to produce. */
export const VARIATION_MIN = 30;

/** How many of those are shown on a landing page. The rest stay in the report. */
export const VARIATION_DISPLAY = 12;

/** Hard ceiling so a rule can never produce an unbounded list. */
export const VARIATION_MAX = 60;

/** Generic head terms that carry no search intent of their own. */
const GENERIC_TERMS = [
  'fancy', 'text', 'generator', 'gen', 'copy', 'paste', 'online', 'free', 'app',
  'download', 'best', 'make', 'maker', '2024', '2025', '2026', 'no', 'sign', 'up',
  'without', 'install', 'offline',
];

/** Phrases that describe an unsupported product feature. */
const UNSUPPORTED_PHRASES = [
  'gif', 'ascii art', 'image text', 'video text', 'animated text',
];

/** Third-party brands. Never given a landing page of their own. */
const COMPETITORS = [
  'lingojam', 'coolsymbol', 'fontvilla', 'messletters', 'texttrick', 'nickfinder',
];

const PLATFORMS = {
  instagram: { label: 'Instagram', key: 'instagram' },
  whatsapp: { label: 'WhatsApp', key: 'whatsapp' },
  discord: { label: 'Discord', key: 'discord' },
  facebook: { label: 'Facebook', key: 'facebook' },
  tiktok: { label: 'TikTok', key: 'tiktok' },
  twitter: { label: 'X', key: 'twitter' },
  youtube: { label: 'YouTube', key: 'youtube' },
  snapchat: { label: 'Snapchat', key: 'snapchat' },
  telegram: { label: 'Telegram', key: 'telegram' },
  reddit: { label: 'Reddit', key: 'reddit' },
  steam: { label: 'Steam', key: 'steam' },
};

const GAMES = [
  'free fire', 'pubg', 'bgmi', 'roblox', 'minecraft', 'codm', 'agar.io', 'vrchat',
  'rise of kingdoms', 'whiteout survival',
];

const LANGUAGES = [
  'hindi', 'urdu', 'arabic', 'tamil', 'marathi', 'bengali', 'gujarati', 'malayalam',
  'punjabi', 'nepali', 'odia', 'telugu', 'sinhala', 'sanskrit', 'persian', 'greek',
  'russian', 'myanmar',
];

const COLOURS = ['blue', 'red', 'gold', 'dark', 'white', 'rainbow', 'coloured', 'colored'];

/**
 * Style modifiers mapped to the real catalog slugs that satisfy them. A modifier is
 * only considered satisfiable when `getStyle()` actually resolves it at build time,
 * so the map can never drift from the catalog.
 */
const STYLE_SLUGS = {
  bold: 'bold',
  italic: 'italic',
  cursive: 'script',
  gothic: 'fraktur',
  'old english': 'fraktur',
  outline: 'double-struck',
  bubble: 'circled',
  monospace: 'monospace',
  wide: 'fullwidth',
  serif: 'sans',
  'small caps': 'small-caps',
  superscript: 'superscript',
  subscript: 'subscript',
  underline: 'underline',
  strikethrough: 'strike',
  star: 'symbol-star',
  heart: 'symbol-heart',
  arrow: 'symbol-arrow',
  emoji: 'emoji-sparkle',
  kaomoji: 'kaomoji-shrug',
  upside: 'upside-down',
  'upside down': 'upside-down',
  backwards: 'backwards',
  flip: 'flipped-letters',
  mirrored: 'flipped-letters',
  zalgo: 'zalgo-light',
  glitch: 'glitch-alternate',
  corrupted: 'glitch-alternate',
  aesthetic: 'fullwidth',
  cute: 'circled',
  sparkle: 'sparkle-sparkle',
  symbol: 'symbol-star',
};

// ---- dashboard categories -------------------------------------------------

/**
 * Sidebar groups. `id: 'all'` is always first. Empty categories are filtered out at
 * render time, so a category with no keywords never reaches the sidebar.
 */
export const KEYWORD_CATEGORIES = [
  { id: 'all', icon: '✨', label: 'All Keywords' },
  { id: 'main', icon: '🎯', label: 'Main Generator Keywords' },
  { id: 'platform', icon: '📸', label: 'Instagram & Social Media' },
  { id: 'messaging', icon: '💬', label: 'WhatsApp & Messaging' },
  { id: 'gaming', icon: '🎮', label: 'Gaming & Game Names' },
  { id: 'style', icon: '✍️', label: 'Text Styles & Fancy Fonts' },
  { id: 'cute', icon: '💖', label: 'Cute, Heart & Aesthetic Text' },
  { id: 'formatting', icon: '🔠', label: 'Bold, Cursive & Small Caps' },
  { id: 'symbols', icon: '🔣', label: 'Symbols & Unicode' },
  { id: 'languages', icon: '🌍', label: 'Languages & Script Compatibility' },
  { id: 'colours', icon: '🎨', label: 'Colours & Display Limitations' },
  { id: 'usernames', icon: '👤', label: 'Usernames, Nicknames & Bios' },
  { id: 'numbers', icon: '🔢', label: 'Numbers & Size Variations' },
  { id: 'tools', icon: '🧰', label: 'Tools & Supported Features' },
  { id: 'informational', icon: '📖', label: 'General & Informational Keywords' },
  { id: 'competitor', icon: '🏷️', label: 'Competitor Keywords — Skipped' },
  { id: 'unsupported', icon: '🚧', label: 'Unsupported & Planned Features' },
  { id: 'unmapped', icon: '⚠️', label: 'Unmapped Keywords' },
];

/** Mapping statuses exposed as dashboard filters. */
export const KEYWORD_STATUSES = ['all', 'mapped', 'skipped', 'planned', 'unmapped', 'needs-review'];

// ---- text helpers ---------------------------------------------------------

const EMOJI_ONLY_RE = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|️|‍|\s)+$/u;
const URL_RE = /^(?:https?:\/\/|www\.)\S+$/i;

/** True when a line contains at least one non-emoji, non-punctuation character. */
function hasRealContent(value) {
  return Array.from(value).some((ch) => !EMOJI_ONLY_RE.test(ch) && !/[\s.,!?;:'"()[\]{}\-_/\\|]/.test(ch));
}

/**
 * Turn one raw source line into a cleaned keyword record.
 * Returns `{ valid: false, reason }` for anything dropped, so the caller can record it.
 */
export function cleanKeyword(raw) {
  const original = String(raw ?? '');
  const trimmed = original.trim();

  if (!trimmed) return { original, valid: false, reason: 'empty_line' };
  if (trimmed.startsWith('#')) return { original, valid: false, reason: 'comment_line' };
  if (URL_RE.test(trimmed)) return { original, valid: false, reason: 'url' };
  if (!hasRealContent(trimmed)) return { original, valid: false, reason: 'emoji_or_punctuation_only' };

  const normalized = trimmed
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return { original, valid: false, reason: 'empty_after_normalization' };

  return { original, valid: true, normalized, coreModifier: coreModifier(normalized) };
}

/**
 * Returned by coreModifier() when a keyword is nothing but generic head terms,
 * e.g. "fancy text generator". Those carry no secondary intent and belong to the
 * main generator page rather than to a style page.
 */
export const GENERIC_FALLBACK = 'fancy text generator';

/**
 * The intent-bearing part of a keyword, with generic head terms removed.
 * Never a replacement for the SEO keyword itself - it only drives classification.
 */
export function coreModifier(normalized) {
  const kept = normalized.split(' ').filter((t) => !GENERIC_TERMS.includes(t));
  return kept.length ? kept.join(' ') : GENERIC_FALLBACK;
}


// ---- classification -------------------------------------------------------

const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const termCache = new Map();

/**
 * Word-boundary match with an optional plural suffix, so "symbol" matches "symbols".
 * Substring matching would classify "mirrored" as the colour "red" and "roblox" as
 * "lox", so every term test goes through here instead.
 */
function has(haystack, term) {
  let re = termCache.get(term);
  if (!re) {
    re = new RegExp(`(^|[^a-z0-9])${escapeRe(term)}s?([^a-z0-9]|$)`, 'i');
    termCache.set(term, re);
  }
  return re.test(haystack);
}

/**
 * Assign one keyword to a dashboard category. Order matters: the first matching
 * rule wins, so competitor and unsupported checks run before the generic style
 * checks that would otherwise swallow them.
 */
export function classifyKeyword(normalized) {
  const n = normalized;

  if (COMPETITORS.some((c) => has(n, c))) return 'competitor';
  if (UNSUPPORTED_PHRASES.some((u) => has(n, u))) return 'unsupported';

  if (has(n, 'whatsapp') || has(n, 'telegram')) return 'messaging';

  const platformHit = Object.keys(PLATFORMS).find((p) => has(n, p) || (p === 'twitter' && has(n, 'x')));
  if (platformHit) {
    const p = PLATFORMS[platformHit];
    return ['instagram', 'facebook', 'tiktok', 'twitter', 'youtube', 'snapchat', 'reddit', 'steam'].includes(p.key)
      ? 'platform'
      : 'messaging';
  }

  if (GAMES.some((g) => has(n, g)) || has(n, 'clan tag') || has(n, 'gaming')) return 'gaming';

  if (LANGUAGES.some((l) => has(n, l))) return 'languages';
  if (COLOURS.some((c) => has(n, c))) return 'colours';

  if (has(n, 'username') || has(n, 'nickname') || has(n, 'bio')) return 'usernames';
  if (has(n, 'number')) return 'numbers';
  if (has(n, 'tiny') || has(n, 'small text') || has(n, 'big text') || has(n, 'large text')) return 'numbers';

  if (has(n, 'heart') || has(n, 'cute') || has(n, 'aesthetic')) return 'cute';
  if (has(n, 'zalgo') || has(n, 'glitch') || has(n, 'corrupted')) return 'style';
  if (has(n, 'kaomoji')) return 'symbols';
  if (has(n, 'emoji')) return 'symbols';
  if (has(n, 'symbol') || has(n, 'arrow') || has(n, 'star')) return 'symbols';

  // A keyword made entirely of generic head terms ("fancy text generator",
  // "free fancy text generator", "fancy text generator app") has no secondary
  // intent. It is the main generator query however it is phrased, so it is
  // checked before the broad "text"/"style" catch-all below.
  if (coreModifier(n) === GENERIC_FALLBACK) return 'main';

  if (has(n, 'bold') || has(n, 'cursive') || has(n, 'small caps') || has(n, 'italic')) return 'formatting';
  if (has(n, 'upside') || has(n, 'backwards') || has(n, 'flip') || has(n, 'mirrored')) return 'style';

  // Explanatory queries have no generator behind them; the About page is the
  // honest target because it already documents how the styles work.
  if (has(n, 'what is') || has(n, 'meaning') || has(n, 'how to')) return 'informational';

  if (has(n, 'font') || has(n, 'style') || has(n, 'letters') || has(n, 'text')) return 'style';

  return 'main';
}

// ---- route mapping --------------------------------------------------------

/**
 * Every route the application actually serves, used to validate mapped targets.
 * Built from the catalog plus the approved landing pages, so a mapped keyword can
 * never point at a route that does not exist.
 */
export function realRoutes() {
  const c = catalog();
  const routes = new Set([
    '/', '/fancy-text-generator', '/fonts', '/tools', '/image-compression', '/studio',
    '/qr-code-generator', '/symbols', '/emoji', '/kaomoji', '/about', '/privacy', '/terms',
    '/contact',
  ]);
  for (const s of c.styles) if (s.indexable) routes.add(`/fonts/${s.slug}`);
  for (const p of LANDING_PAGES) routes.add(`/styles/${p.key}`);
  for (const p of PLATFORM_PAGES) routes.add(p.path);
  return routes;
}

const slugFor = (token) => {
  const style = catalog().bySlug.get(STYLE_SLUGS[token]);
  return style && style.indexable ? style.slug : null;
};

/** Longer, more specific modifiers win over shorter overlapping ones. */
function styleModifierKeys(modifier) {
  return Object.keys(STYLE_SLUGS)
    .filter((k) => has(modifier, k))
    .sort((a, b) => b.length - a.length);
}

/**
 * Resolve one cleaned keyword to a target route plus a status.
 *
 * status: 'mapped' | 'skipped' | 'planned' | 'unmapped' | 'needs-review'
 */
export function mapKeyword(normalized) {
  const category = classifyKeyword(normalized);

  if (category === 'competitor') {
    const brand = COMPETITORS.find((c) => normalized.includes(c));
    return {
      category,
      status: 'skipped',
      route: null,
      reason: `Competitor brand "${brand}" - no landing page is created for third-party brands.`,
    };
  }

  if (category === 'unsupported') {
    const feature = UNSUPPORTED_PHRASES.find((f) => normalized.includes(f));
    return {
      category,
      status: 'planned',
      route: null,
      reason: `"${feature}" generation is not implemented; recorded as planned rather than faked.`,
    };
  }

  if (category === 'languages') {
    const lang = LANGUAGES.find((l) => normalized.includes(l));
    return {
      category,
      status: 'mapped',
      route: '/styles/languages',
      reason: `${lang} keywords resolve to the script-compatibility page; no misleading alphabet generator is offered.`,
    };
  }

  if (category === 'colours') {
    const colour = COLOURS.find((c) => normalized.includes(c));
    return {
      category,
      status: 'mapped',
      route: '/styles/colours',
      reason: `"${colour}" text maps to the colour-display page, which explains that plain Unicode cannot force font colour.`,
    };
  }

  if (category === 'gaming') {
    const game = GAMES.find((g) => normalized.includes(g));
    return {
      category,
      status: 'mapped',
      route: game ? '/fonts/clan-tag' : '/styles/gaming',
      reason: game
        ? `"${game}" keywords map to the Clan Tag style page rather than a thin per-game doorway.`
        : 'Gaming keywords map to the shared gaming landing page.',
    };
  }

  if (category === 'messaging') {
    if (normalized.includes('whatsapp')) {
      return {
        category,
        status: 'mapped',
        route: '/styles/whatsapp',
        reason: 'WhatsApp keywords map to the WhatsApp display name and status landing page.',
      };
    }
    if (normalized.includes('telegram')) {
      return {
        category,
        status: 'mapped',
        route: '/telegram-font-generator',
        reason: 'Telegram keywords map to the Telegram field guide, which states the source-checked name and bio limits.',
      };
    }
    return {
      category,
      status: 'mapped',
      route: '/fonts/bold',
      reason: 'Messaging keywords without a dedicated landing page map to a real style page rather than a thin per-app page.',
    };
  }

  if (category === 'platform') {
    const key = Object.keys(PLATFORMS).find((p) => normalized.includes(p) || (p === 'twitter' && has(normalized, 'x')));
    const platformRoutes = {
      instagram: { route: '/styles/instagram', page: 'Instagram bio and username landing page' },
      tiktok: { route: '/tiktok-font-generator', page: 'TikTok field guide' },
      facebook: { route: '/facebook-font-generator', page: 'Facebook field guide' },
      twitter: { route: '/x-font-generator', page: 'X field guide' },
      youtube: { route: '/youtube-font-generator', page: 'YouTube field guide' },
    };
    if (platformRoutes[key]) {
      const target = platformRoutes[key];
      return {
        category,
        status: 'mapped',
        route: target.route,
        reason: `${PLATFORMS[key].label} keywords map to the ${target.page}.`,
      };
    }
    return {
      category,
      status: 'mapped',
      route: '/fonts/symbol-heart',
      reason: `${PLATFORMS[key].label} keywords map to the shared Heart Wrap style page instead of a per-platform doorway.`,
    };
  }

  if (category === 'cute') {
    return {
      category,
      status: 'mapped',
      route: normalized.includes('aesthetic') ? '/fonts/fullwidth' : '/fonts/circled',
      reason: 'Heart, cute and aesthetic keywords map to a real style page in the social category.',
    };
  }

  if (category === 'symbols') {
    if (has(normalized, 'kaomoji')) return { category, status: 'mapped', route: '/kaomoji', reason: 'Kaomoji keywords map to the existing kaomoji library.' };
    if (has(normalized, 'emoji')) return { category, status: 'mapped', route: '/emoji', reason: 'Emoji keywords map to the existing emoji library.' };
    return { category, status: 'mapped', route: '/symbols', reason: 'Symbol keywords map to the existing symbols library.' };
  }

  if (category === 'numbers') {
    return { category, status: 'mapped', route: '/fonts/small-caps', reason: 'Size-variation keywords map to the small caps style family.' };
  }

  if (category === 'usernames') {
    return { category, status: 'mapped', route: '/fonts/handle-wrap', reason: 'Username and bio keywords map to the Handle Wrap style page.' };
  }

  if (category === 'informational') {
    return {
      category,
      status: 'mapped',
      route: '/about',
      reason: 'Explanatory queries map to the About page, which documents how the Unicode styles work.',
    };
  }

  if (category === 'formatting' || category === 'style') {
    const modifier = coreModifier(normalized);
    for (const token of styleModifierKeys(modifier)) {
      const slug = slugFor(token);
      if (slug) {
        return {
          category,
          status: 'mapped',
          route: `/fonts/${slug}`,
          reason: `"${token}" resolves to the existing ${slug} style page.`,
        };
      }
    }
    // The keyword mentions styling but names no style the catalog actually has.
    // The main generator is the honest answer rather than a fabricated landing page.
    return {
      category,
      status: 'mapped',
      route: '/',
      reason: 'No single style matches this modifier, so it maps to the main generator rather than a fabricated page.',
    };
  }

  if (category === 'main') {
    return {
      category,
      status: 'mapped',
      route: '/',
      reason: 'General generator keywords map to the main generator page.',
    };
  }

  // Nothing matched a real intent: kept in the audit rather than force-fitted.
  return {
    category: 'unmapped',
    status: 'needs-review',
    route: null,
    reason: 'No matching search intent in the current catalog; kept for manual review.',
  };
}

/** Longer, more specific modifiers win over shorter overlapping ones. */

// ---- pipeline -------------------------------------------------------------

/**
 * Run the full pipeline over raw source lines.
 * Duplicates are collapsed but every original line is retained in `removals`
 * and in `duplicates` so nothing is silently lost.
 */
export function buildKeywordMap(rawLines) {
  const rows = [];
  const removals = [];
  const duplicates = [];
  const seen = new Map();

  rawLines.forEach((line, index) => {
    const cleaned = cleanKeyword(line);
    if (!cleaned.valid) {
      removals.push({ line: index + 1, original: cleaned.original, reason: cleaned.reason });
      return;
    }

    if (seen.has(cleaned.normalized)) {
      duplicates.push({ line: index + 1, original: cleaned.original, normalized: cleaned.normalized, firstSeenLine: seen.get(cleaned.normalized) });
      return;
    }
    seen.set(cleaned.normalized, index + 1);

    const mapping = mapKeyword(cleaned.normalized);
    rows.push({
      original: cleaned.original,
      normalized: cleaned.normalized,
      coreModifier: cleaned.coreModifier,
      category: mapping.category,
      status: mapping.status,
      route: mapping.route,
      reason: mapping.reason,
      variations: 0,
      displayedVariations: 0,
    });
  });

  return { rows, removals, duplicates, sourceCount: rawLines.length };
}

/**
 * Headline numbers for the dashboard. Every value is computed from `rows` plus the
 * per-section variation report, so nothing is asserted that the data does not show.
 */
export function summarize(rows, removals = [], duplicates = [], sections = []) {
  const count = (fn) => rows.filter(fn).length;

  return {
    sourceEntries: rows.length + removals.length + duplicates.length,
    uniqueKeywords: rows.length,
    mapped: count((r) => r.status === 'mapped'),
    skipped: count((r) => r.status === 'skipped'),
    planned: count((r) => r.status === 'planned'),
    unmapped: count((r) => r.status === 'unmapped'),
    needsReview: count((r) => r.status === 'needs-review'),
    removed: removals.length,
    duplicates: duplicates.length,
    indexablePages: new Set(rows.filter((r) => r.status === 'mapped' && r.route).map((r) => r.route)).size,
    // Variation totals are section-level. Summing per keyword would count the same
    // section once for every keyword mapped to that page.
    totalVariations: sections.reduce((n, s) => n + s.generated, 0),
    displayedVariations: sections.reduce((n, s) => n + s.displayed, 0),
    variationSections: sections.length,
    sectionsMeetingTarget: sections.filter((s) => s.met).length,
    sectionsShort: sections.filter((s) => !s.met).length,
  };
}

/** Sidebar groups with non-empty membership only. */
export function groupKeywords(rows) {
  return KEYWORD_CATEGORIES
    .map((c) => {
      const keywords = c.id === 'all' ? rows : rows.filter((r) => r.category === c.id);
      return { ...c, count: keywords.length, keywords };
    })
    .filter((g) => g.count > 0);
}
