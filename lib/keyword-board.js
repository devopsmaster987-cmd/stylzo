// The keyword board: a vertical list of search keywords, each opening a page that
// shows the same 25 words in 25 different styles, every word decorated with 6 to 8
// colour emoji.
//
// Keywords come from data/keywords.txt, which is the human-editable source of truth
// and is only ever read here. Everything below it is fixed content:
//
//   WORD_LIST    the same 25 words on every keyword page, as requested
//   WORD_STYLES  25 distinct indexable catalog styles, one per word
//   EMOJI_POOL   colour emoji only, so the decorations actually render in colour
//
// The emoji a word gets is derived from the keyword and the word position, so two
// keyword pages never decorate the same word identically while staying completely
// deterministic: the same input always produces the same board.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { applyStyle } from '../services/unicode/engine.js';
import { getStyle } from '../services/catalog.js';
import { LANDING_PAGES } from './landing-pages.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** How many keywords the board lists. */
export const BOARD_SIZE = 32;

/** How many styled words each keyword page shows. */
export const WORDS_PER_KEYWORD = 25;

/** How few and how many colour emoji decorate one word. */
export const EMOJI_MIN = 6;
export const EMOJI_MAX = 8;

/** The 25 words, identical on every keyword page. */
export const WORD_LIST = [
  'Glam', 'Sparkle', 'Shine', 'Blaze', 'Dream',
  'Vivid', 'Glow', 'Luxe', 'Nova', 'Aura',
  'Charm', 'Pulse', 'Prism', 'Quartz', 'Radiant',
  'Shimmer', 'Spark', 'Style', 'Twist', 'Vibe',
  'Whisper', 'Zen', 'Bloom', 'Coral', 'Drift',
];

/**
 * One distinct indexable style per word. Every slug is checked against the catalog
 * when the rows are built, so a missing style drops out instead of rendering a
 * blank row.
 */
export const WORD_STYLES = [
  'bold', 'italic', 'bold-italic', 'script', 'bold-script',
  'fraktur', 'bold-fraktur', 'double-struck', 'sans', 'sans-bold',
  'sans-italic', 'sans-bold-italic', 'monospace', 'fullwidth', 'circled',
  'negative-circled', 'squared', 'negative-squared', 'parenthesized', 'small-caps',
  'superscript', 'subscript', 'alternating-case', 'all-caps', 'all-lowercase',
];

/**
 * Colour emoji only. Every entry here renders as a colour glyph by default, so a
 * board full of them actually looks colourful; text-presentation emoji such as a
 * bare star or heart would be drawn in the surrounding text colour instead.
 */
export const EMOJI_POOL = [
  '🔥', '🌈', '💖', '💎', '🎉', '🍭', '🌸', '🦋', '🐝', '🍓',
  '🌞', '🎨', '💫', '🎀', '🍀', '🌻', '🐚', '🎐', '🪼', '🍉',
  '🧁', '🎂', '🏆', '👑', '🚀', '🎯', '🌺', '🦄', '🐳', '🍋',
  '🌼', '🎈', '🧿', '🌊', '🫧', '💐', '🍩', '🌴', '🦩', '🐢',
];

/**
 * Themed emoji per keyword, so the decoration matches what the page is about
 * rather than being generic. Keyed by the keyword slug; anything missing falls
 * back to EMOJI_POOL, which is colour emoji only either way.
 */
export const KEYWORD_EMOJI = {
  'fancy-text-generator-online': ['🌐', '📶', '⚡', '🔗', '💻', '🖥️', '📡', '🟢', '🔄', '📱', '☁️', '🛰️'],
  'free-fancy-text-generator': ['🆓', '🎁', '🎟️', '🎈', '💯', '🪙', '💰', '🏷️', '🎀', '🎊', '🍀', '💸'],
  'best-fancy-text-generator': ['🏆', '🥇', '👑', '🎖️', '🥈', '🥉', '⭐', '🌟', '🎉', '💯', '🏅', '🔥'],
  'fancy-text': ['✨', '💫', '🌟', '🎀', '💖', '⭐', '💎', '🌸', '🎈', '🌈', '🎇', '🪄'],
  'copy-and-paste-fancy-text': ['📋', '📑', '✂️', '🖇️', '📎', '📌', '✍️', '📄', '🗒️', '🖊️', '🧲', '🗂️'],
  'fancy-text-generator-app': ['📱', '📲', '⬇️', '📥', '💾', '📦', '🧩', '⚙️', '🚀', '🔔', '🖥️', '🎠'],
  'fancy-text-generator-download': ['📥', '⬇️', '💾', '📦', '📂', '📁', '🧲', '📤', '🗜️', '💿', '🗃️', '☁️'],
  'heart-fancy-text-generator': ['💖', '💗', '💘', '💝', '❤️', '🩷', '🥰', '😍', '🌹', '💌', '💞', '💓'],
  'www-fancy-text-generator': ['🌐', '🕸️', '🔗', '🖇️', '💻', '🖥️', '⌨️', '🖱️', '📡', '🛰️', '⚙️', '🧩'],
  'font-fancy-text-generator': ['🔤', '🔠', '🔡', '🆎', '🆑', '🆒', '🆓', '🆔', '🆕', '🆖', '🆗', '🆘', '🅰️', '🅱️'],
  'ai-fancy-text-generator': ['🤖', '🧠', '⚡', '✨', '💡', '🔮', '🛰️', '⚙️', '🔬', '📈', '💾', '🦾'],
  'fancy-text-generator-blue-colour': ['💧', '🔵', '🌊', '🧊', '💎', '🪐', '🌌', '🐦', '🩵', '🟦', '⛈️', '🐬'],
  'cool-fancy-text-generator': ['😎', '🥶', '🧊', '❄️', '🕶️', '🤘', '💯', '🔥', '⭐', '✨', '🪄', '🎚️'],
  'online-fancy-text-generator': ['🌐', '📶', '⚡', '🔗', '💻', '🖥️', '📡', '🛰️', '🔄', '🟢', '📱', '☁️'],
  'fancy-text-generator': ['✨', '💫', '⭐', '🌟', '💥', '🎯', '👑', '💎', '🔥', '🏆', '🎈', '🎉'],
  'fancy-text-generator-2024': ['🎊', '🎆', '🧧', '✨', '🎯', '🥇', '🆕', '🗓️', '⏰', '🚀', '⭐', '🧨'],
  'hindi-fancy-text-generator': ['🪔', '📿', '🪷', '🕉️', '🙏', '🕌', '🦚', '🐯', '🌸', '🎉', '🌺', '🧿'],
  'urdu-fancy-text-generator': ['🕌', '🌙', '⭐', '📿', '🧿', '🕊️', '📖', '🪔', '🌸', '🌹', '✨', '☪️'],
  'arabic-fancy-text-generator': ['🕌', '🌙', '⭐', '🐪', '🌸', '🌹', '📿', '🧿', '📖', '☕', '🌴', '🪷'],
  'tamil-fancy-text-generator': ['🪔', '🕉️', '🙏', '🦚', '🌺', '🌸', '🎊', '🎉', '🪷', '📚', '🦁', '🌼'],
  'marathi-fancy-text-generator': ['🪔', '🕉️', '🙏', '🚩', '🌺', '🌸', '🎊', '🎉', '🪷', '📖', '🦚', '🌼'],
  'coolsymbol-fancy-text-generator': ['⭐', '🌟', '✨', '💫', '❇️', '✴️', '🌵', '🔰', '💠', '🔷', '🔶', '⚔️'],
  'facebook-fancy-text-generator': ['👍', '🤝', '💬', '👥', '❤️', '🙋', '🌐', '📱', '🔔', '📤', '🏷️', '⭐'],
  'instagram-fancy-text-generator': ['📸', '🤳', '🖼️', '🏞️', '🌅', '🌆', '🏖️', '🎡', '💄', '👗', '🌟', '💐'],
  'fancy-text-generator-for-instagram': ['📸', '🤳', '🖼️', '🏞️', '🌅', '🌆', '🏖️', '🎡', '💄', '👗', '🌟', '💐'],
  'instagram-bio-fonts': ['📝', '👤', '✨', '💬', '🏷️', '📇', '🪪', '🧾', '🖋️', '🧵', '🎯', '🌟'],
  'instagram-font-generator': ['🔤', '🔠', '🔡', '🆎', '🅰️', '🅱️', '🆑', '🆒', '🆓', '🆔', '🆖', '🆗'],
  'instagram-username-fonts': ['🪪', '👤', '🏷️', '💬', '✍️', '📛', '📇', '🧾', '🎯', '✨', '🌟', '⭐'],
  'instagram-name-fonts': ['🏷️', '👤', '📛', '🪪', '💬', '✨', '🌟', '⭐', '🎯', '📇', '🧾', '🖋️'],
  'instagram-caption-fonts': ['📝', '💬', '📖', '📜', '🖋️', '🧾', '🏷️', '✨', '🌟', '⭐', '🎯', '📇'],
  'fancy-text-for-instagram-bio': ['📝', '👤', '✨', '💬', '🏷️', '📇', '🪪', '🧾', '🖋️', '🧵', '🎯', '🌟'],
  'instagram-aesthetic-fonts': ['🌸', '🎨', '🖼️', '🌙', '🪷', '🐚', '🦋', '💮', '🎐', '🫧', '🕊️', '☁️'],
};

/** One short, keyword-specific line. Keeps the pages from being pure clones. */
const INTROS = {
  'fancy text generator': 'Every word below is generated live by the same engine as the main tool, so what you copy is exactly what you see.',
  'fancy text generator online': 'No sign-up and nothing to install: this page runs the whole generator in your browser.',
  'free fancy text generator': 'All 25 words are free to copy, with no account, no watermark and no limit.',
  'best fancy text generator': 'These 25 styles are the ones that survive pasting into the most apps. Start at the top.',
  'fancy text': 'Short words are the easiest way to compare styles, because one bad letter stands out straight away.',
  'copy and paste fancy text': 'Use the copy button on any row. Selecting the text by hand can break the combining marks.',
  'fancy text generator 2024': 'Unicode styling has not changed in years, so these styles still work in current apps.',
  'fancy text generator app': 'There is no app to install. This page is the generator, and it works on a phone browser.',
  'fancy text generator download': 'Nothing to download either: the characters already exist inside your device fonts.',
  'fancy text generator for instagram': 'These are the styles that render best in a bio, which accepts far more than a username.',
  'instagram fancy text generator': 'Pick a style, copy it, and paste it into your bio or your display name.',
  'instagram bio fonts': 'Bio fields are the least restricted place on the platform, so the decorated styles belong here.',
  'instagram font generator': 'Same generator as the main site, with the styles that hold up in a profile.',
  'instagram username fonts': 'Usernames are filtered hard. These styles keep the character count close to the original.',
  'instagram name fonts': 'Display names have slightly more room than the @handle, so a little decoration is safe.',
  'instagram caption fonts': 'Captions are plain text, so every style below renders exactly as generated.',
  'fancy text for instagram bio': 'Copy one of these straight into the bio field and reload the app to see it.',
  'instagram aesthetic fonts': 'Soft, wide and decorated styles, chosen for a profile that should look calm rather than loud.',
  'fancy text generator whatsapp': 'Short letter swaps survive display-name filtering far better than framed styles.',
  'whatsapp fancy text generator': 'Style a display name or a status, then paste it into the field.',
  'whatsapp font generator': 'The About section is longer than the name, so it has room for decorated styles.',
  'whatsapp text style generator': 'Every style here is plain Unicode, so nothing needs an extension.',
  'fancy text for whatsapp status': 'Keep a status short. Longer strings get trimmed by the client.',
  'discord fancy text generator': 'Nicknames take more decoration than usernames, so start with the framed styles.',
  'fancy text generator for discord': 'These styles render in nicknames, server names and status lines alike.',
  'hindi fancy text generator': 'Styled words tuned for Hindi text and Devanagari-friendly fonts. Copy any row straight into a bio or chat.',
  'urdu fancy text generator': 'Right-to-left Urdu words in decorated styles. The emoji sit outside the letters so the script stays intact.',
  'arabic fancy text generator': 'Arabic words styled without breaking the connected script. Tap copy and paste anywhere.',
  'tamil fancy text generator': 'Tamil words in decorated Unicode styles. Every row copies as one tap, no account needed.',
  'marathi fancy text generator': 'Marathi words in Devanagari styles that hold up in bios, statuses and nicknames.',
  'coolsymbol fancy text generator': 'Decorated words built from cool Unicode symbols, the kind coolsymbol-style pages are known for.',
  'facebook fancy text generator': 'Styles that survive the Facebook name filter. Copy one and paste it into your display name.',
  'heart fancy text generator': 'Heart-decorated words with colour emoji built in. Every row is ready to paste into a bio or a message.',
  'www fancy text generator': 'Words framed with dots and slashes for a web-address look. The emoji sit outside the styling so nothing breaks.',
  'font fancy text generator': 'Twenty-five font styles side by side, so you can compare them before you copy.',
  'ai fancy text generator': 'The same Unicode engine, framed as an AI picker: pick a look, tap copy, done.',
  'fancy text generator blue colour': 'Blue-leaning colour emoji wrapped around every styled word. Plain text has no colour, so the emoji carry it.',
  'cool fancy text generator': 'The styles that hold up pasted into the most apps. Start at the top and copy your favourite.',
  'online fancy text generator': 'Runs entirely in your browser — no download, no account, no watermark.',
};

const DEFAULT_INTRO = 'Twenty-five words, twenty-five styles, generated live in your browser. Tap copy on any row.';

/** "fancy text generator" -> "fancy-text-generator" */
export function slugify(keyword) {
  return String(keyword)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The first `BOARD_SIZE` real keyword lines from data/keywords.txt. Comments,
 * blank lines and duplicates are skipped exactly the way the SEO build skips them.
 */
export function boardKeywords(limit = BOARD_SIZE) {
  const lines = readFileSync(path.join(root, 'data', 'keywords.txt'), 'utf8').split(/\r?\n/);
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    const keyword = line.trim();
    if (!keyword || keyword.startsWith('#')) continue;
    const key = keyword.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ keyword, slug: slugify(keyword), position: out.length + 1 });
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * 6 to 8 colour emoji for one cell, chosen from the pool by a simple stable index.
 * Count and order depend only on the keyword position and the word position, so the
 * board never changes between builds.
 */
export function emojiFor(keywordPosition, wordIndex, slug = null) {
  // The themed pool for this keyword, or the generic one when it has none.
  const pool = (slug && KEYWORD_EMOJI[slug]) || EMOJI_POOL;
  const count = EMOJI_MIN + ((keywordPosition + wordIndex) % (EMOJI_MAX - EMOJI_MIN + 1));
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(pool[(keywordPosition * 7 + wordIndex * 11 + i * 5) % pool.length]);
  }
  return [...new Set(picked)];
}

/**
 * The 25 rows for one keyword page. A word is styled first, then wrapped in its
 * emoji, so the emoji sit outside the characters the engine produced and are never
 * mangled by it.
 *
 * `text` overrides the built-in word list: the page renders it in every style so a
 * visitor who types their own name sees their name, not the sample words. The value
 * the row falls back to is kept on the row as `word`, which the live script uses to
 * restore the sample when the box is emptied.
 */
export function boardRows(keywordPosition, text = null, keywordSlug = null) {
  const custom = typeof text === 'string' && text.trim() ? text.trim() : null;
  const rows = [];
  for (let i = 0; i < WORD_LIST.length; i++) {
    const style = getStyle(WORD_STYLES[i]);
    if (!style || !style.indexable) continue;
    const word = custom || WORD_LIST[i];
    const emoji = emojiFor(keywordPosition, i, keywordSlug);
    const half = Math.ceil(emoji.length / 2);
    const output = applyStyle(word, style);
    rows.push({
      word: WORD_LIST[i],
      // The styled word on its own...
      output,
      // ...the emoji split around it, so the live script can wrap a new word without
      // re-deriving which emoji belong to which side.
      emoji,
      emojiBefore: emoji.slice(0, half),
      emojiAfter: emoji.slice(half),
      line: [...emoji.slice(0, half), output, ...emoji.slice(half)].join(' '),
      slug: style.slug,
      styleName: style.name,
      support: style.support,
    });
  }
  return rows;
}

// Title and description are budgeted for the SERP: titles are cut around 60
// characters and the old "... — 25 Styled Words With Colour Emoji" tail pushed
// the longest keyword to 79, so half of every board page's title was truncated
// away. The page body and the h1 still carry the full wording.
const SITE_SUFFIX = ' | Stylzo';
const BOARD_DESC_TAIL = '25 words in 25 Unicode styles with colour emoji. Copy any row in one tap. Free, no sign-up.';

let cached = null;

/** Every board entry, built once per process. */
export function keywordBoard() {
  if (cached) return cached;
  cached = boardKeywords().map((entry) => {
    const heading = titleCase(entry.keyword);
    // Titles are budgeted for the SERP. The longest keywords push the tail past
    // 60 characters, so it is dropped rather than allowed to be truncated.
    const suffix = ` — 25 Styled Words`;
    const title = (heading + suffix + SITE_SUFFIX).length <= 60
      ? heading + suffix
      : heading;
    // Descriptions are padded to a fixed budget so every board page is a
    // similar length in the results, rather than some long and some short.
    const lead = `${heading}: `;
    const description = `${lead}${BOARD_DESC_TAIL}`;
    return {
      ...entry,
      intro: INTROS[entry.keyword.toLowerCase()] || DEFAULT_INTRO,
      heading,
      title,
      description,
      words: boardRows(entry.position, null, entry.slug).length,
    };
  });
  return cached;
}

/** One board entry, or null when the slug is not on the board. */
export function boardEntry(slug) {
  return keywordBoard().find((e) => e.slug === slug) || null;
}

/**
 * Neighbouring keyword pages, wrapping around the board.
 *
 * Every /styles/<slug> page previously linked only back to the hub pages
 * (/, /fonts, /styles, the libraries), so all 38 pages were dead ends that
 * never passed authority to each other. Prev/next plus a few nearby entries
 * gives the cluster an internal mesh and a crawl path through it.
 */
export function boardNeighbours(slug, around = 2) {
  const entries = keywordBoard();
  const index = entries.findIndex((e) => e.slug === slug);
  if (index === -1) return { prev: null, next: null, around: [] };

  const pick = (offset) => {
    const e = entries[(index + offset + entries.length) % entries.length];
    return { slug: e.slug, heading: e.heading, path: `/styles/${e.slug}` };
  };

  const neighbours = [];
  for (let offset = -around; offset <= around; offset += 1) {
    if (offset !== 0) neighbours.push(pick(offset));
  }

  return { prev: pick(-1), next: pick(1), around: neighbours };
}

/**
 * Every slug served under /styles: the approved landing pages plus the board.
 * Landing-page keys are added first so they win any collision. Kept in one place
 * because the route, the sitemap and the tests all need the same list.
 */
let slugCache = null;
export function boardSlugs() {
  if (slugCache) return slugCache;
  const slugs = new Set(LANDING_PAGES.map((p) => p.key));
  for (const entry of keywordBoard()) if (!slugs.has(entry.slug)) slugs.add(entry.slug);
  slugCache = [...slugs];
  return slugCache;
}

/**
 * Language keywords render their language name in its own script, so the heading
 * reads naturally to a native speaker: "हिंदी Fancy Text Generator", not "Hindi ...".
 * Keyed by the exact word inside the keyword.
 */
const NATIVE_SCRIPT = new Map([
  ['hindi', 'हिंदी'],
  ['urdu', 'اردو'],
  ['arabic', 'العربية'],
  ['tamil', 'தமிழ்'],
  ['marathi', 'मराठी'],
  ['bengali', 'বাংলা'],
  ['gujarati', 'ગુજરાતી'],
  ['malayalam', 'മലയാളം'],
  ['punjabi', 'ਪੰਜਾਬੀ'],
  ['nepali', 'नेपाली'],
  ['odia', 'ଓଡ଼ିଆ'],
  ['telugu', 'తెలుగు'],
  ['sinhala', 'සිංහල'],
  ['sanskrit', 'संस्कृतम्'],
  ['persian', 'فارسی'],
  ['greek', 'Ελληνικά'],
  ['russian', 'Русский'],
  ['myanmar', 'မြန်မာ'],
]);

// BCP-47 tag per native script. The site is `<html lang="en">`, so a heading that
// mixes in a language name written in its own script needs its own lang
// attribute or screen readers and search engines mis-tag the whole page.
const SCRIPT_LANG = new Map([
  ['hindi', 'hi'], ['marathi', 'mr'], ['bengali', 'bn'], ['gujarati', 'gu'],
  ['malayalam', 'ml'], ['punjabi', 'pa'], ['odia', 'or'], ['telugu', 'te'],
  ['nepali', 'ne'], ['sanskrit', 'sa'], ['sinhala', 'si'],
  ['urdu', 'ur'], ['arabic', 'ar'], ['persian', 'fa'],
  ['tamil', 'ta'], ['greek', 'el'], ['russian', 'ru'], ['myanmar', 'my'],
]);

/**
 * The heading split into plain and native-script parts so the renderer can put a
 * `lang` attribute on the native part. English keywords come back unchanged.
 *
 * The lookup is by rendered glyph as well as by English word, because
 * titleCase() has already replaced "hindi" with "हिंदी" by this point — keying
 * only on the English word would never match.
 */
export function headingParts(heading) {
  const scriptToLang = new Map([...NATIVE_SCRIPT].map(([en, script]) => [script, SCRIPT_LANG.get(en)]));

  return heading.split(/(\s+)/).map((word) => {
    if (!word.trim()) return { text: word };
    const key = word.toLowerCase();
    const lang = scriptToLang.get(word) || (NATIVE_SCRIPT.has(key) ? SCRIPT_LANG.get(key) : undefined);
    return lang ? { text: word, lang } : { text: word };
  });
}

/** "fancy text generator" -> "Fancy Text Generator" */
function titleCase(keyword) {
  const casing = new Map([
    ['whatsapp', 'WhatsApp'], ['tiktok', 'TikTok'], ['instagram', 'Instagram'],
    ['discord', 'Discord'], ['facebook', 'Facebook'], ['bgmi', 'BGMI'], ['www', 'WWW'],
  ]);
  return keyword
    .split(/\s+/)
    .map((word) => NATIVE_SCRIPT.get(word.toLowerCase())
      || casing.get(word.toLowerCase())
      || word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}