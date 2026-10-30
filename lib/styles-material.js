// The material behind /styles: the same 25 words rendered in 25 different
// styles, every word wrapped in 6 to 8 colour emoji, so a reader can compare
// styles side by side and copy one in a single tap.
//
// This used to be the engine behind a keyword board — one near-identical page
// per search phrase, 32 of them, each rendering this exact material under a
// different slug. Those pages were thin doorway pages competing with the home
// page and with the six real landing pages, so they are gone; the redirects
// that retire them live in lib/styles-routing.js. What survives here is the
// material itself, which is genuinely useful, on the single page that links to
// the six real style pages.
//
//   WORD_LIST    the same 25 words on the page
//   WORD_STYLES  25 distinct indexable catalog styles, one per word
//   EMOJI_POOL   colour emoji only, so the decorations actually render in colour
//
// The emoji a word gets is derived from the word position, so it is completely
// deterministic: the same input always produces the same page.

import { applyStyle } from '../services/unicode/engine.js';
import { getStyle } from '../services/catalog.js';
import { LANDING_PAGES } from './landing-pages.js';
import { STYLES_ANSWER, STYLES_QA } from './aeo.js';
import { adAllowedOn } from './styles-routing.js';

/** How many styled words the page shows. */
export const WORDS_PER_KEYWORD = 25;

/** How few and how many colour emoji decorate one word. */
export const EMOJI_MIN = 6;
export const EMOJI_MAX = 8;

/** The 25 words, all on the one page that uses them. */
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
 * page full of them actually looks colourful; text-presentation emoji such as a
 * bare star or heart would be drawn in the surrounding text colour instead.
 */
export const EMOJI_POOL = [
  '🔥', '🌈', '💖', '💎', '🎉', '🍭', '🌸', '🦋', '🐝', '🍓',
  '🌞', '🎨', '💫', '🎀', '🍀', '🌻', '🐚', '🎐', '🪼', '🍉',
  '🧁', '🎂', '🏆', '👑', '🚀', '🎯', '🌺', '🦄', '🐳', '🍋',
  '🌼', '🎈', '🧿', '🌊', '🫧', '💐', '🍩', '🌴', '🦩', '🐢',
];

/**
 * 6 to 8 colour emoji for one word, chosen from the pool by a stable index.
 * Count and order depend only on the word position, so the page never changes
 * between builds.
 */
export function emojiFor(wordIndex) {
  const count = EMOJI_MIN + (wordIndex % (EMOJI_MAX - EMOJI_MIN + 1));
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(EMOJI_POOL[(wordIndex * 11 + i * 5) % EMOJI_POOL.length]);
  }
  return [...new Set(picked)];
}

/**
 * The 25 rows for the page. A word is styled first, then wrapped in its emoji,
 * so the emoji sit outside the characters the engine produced and are never
 * mangled by it.
 *
 * `text` overrides the built-in word list: the page renders it in every style so
 * a visitor who types their own name sees their name, not the sample words. The
 * value the row falls back to is kept on the row as `word`, which the live
 * script uses to restore the sample when the box is emptied.
 */
export function boardRows(text = null) {
  const custom = typeof text === 'string' && text.trim() ? text.trim() : null;
  const rows = [];
  for (let i = 0; i < WORD_LIST.length; i++) {
    const style = getStyle(WORD_STYLES[i]);
    if (!style || !style.indexable) continue;
    const word = custom || WORD_LIST[i];
    const emoji = emojiFor(i);
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

/**
 * Every slug served under /styles: the approved landing pages, and nothing else.
 *
 * The route, the sitemap and the tests all read this one list, so a page can
 * never be prerendered but missing from the sitemap, or listed in the sitemap
 * while redirecting away. It is derived from LANDING_PAGES rather than typed out
 * again, because a landing page that exists but is not routable is worse than
 * one that was never written.
 */
export function styleSlugs() {
  return LANDING_PAGES.map((p) => p.key);
}

// ---- the hub's own copy ----------------------------------------------------
//
// Held as data rather than markup for one reason: the hub's ad is gated on how
// many words this text actually is. Counting a rendered string by hand would be
// a number that silently drifts the first time a paragraph is edited, and a
// drifted number is a policy failure nobody notices.

export const STYLES_LEDE = `The same ${WORDS_PER_KEYWORD} words in ${WORDS_PER_KEYWORD} different Unicode styles, so you can see what each one actually looks like before you commit to it.`;

export const STYLES_HOW_HEADING = 'How these styles are made, and what that means';

export const STYLES_HOW = [
  'Nothing here is a font. Every style on this page is a substitution table that swaps each Latin letter for a look-alike character somewhere else in the Unicode standard, so mathematical bold replaces an a with 𝐚, fraktur turns an H into ℌ, and a squared style wraps letters in brackets. That is why the result pastes wherever plain text is accepted and needs nothing installed — it really is just text, made of characters that already exist on your device, and the app it lands in decides how each character renders.',
  'It is also why a style can look different, or break, once you paste it. The characters are identical everywhere; what varies is whether the app you paste into ships a font with a glyph for each one. Where the glyph is missing you get an empty box, a substituted letter, or a stripped character instead of your text. The rows below are ordered so the everyday mathematical and Latin styles come first, because those are the ones that survive the widest range of apps. Styles built from rarer symbols, and anything stacking a lot of combining marks, are more likely to be flattened by the destination.',
  'Length is the other constraint worth knowing about. Several styles inflate a word well beyond its original character count, which is harmless in a caption and a problem in a username field, where limits of fifteen or thirty characters are common. Emoji frames add the same cost again. If you are styling something short and heavily filtered, prefer a plain letter swap such as bold, small caps or fullwidth, and keep the whole line inside the limit you have. Where a platform documents its own restrictions, they are written up on the guide page for that platform below rather than guessed at here.',
];

export const STYLES_GUIDES_HEADING = 'Go deeper: six guides';

export const STYLES_GUIDES_BODY = 'The rows above answer what each style looks like. These pages answer where the text is actually going, and they are written per destination because the limits are not the same anywhere.';

export const STYLES_FIELD_HEADING = 'Which style is safest for each field';

export const STYLES_FIELD_INTRO = 'The support label tells you how likely the characters are to render. The field tells you something different: whether it will accept those characters at all. Read both before choosing.';

export const STYLES_FIELD_ROWS = [
  {
    field: 'Bio or profile description',
    pick: 'Bold, italic or small caps, plus one short frame',
    avoid: 'A frame that spends characters before the words begin',
    why: 'A bio is read as a sentence, often at small sizes and often truncated, so legibility matters more than decoration.',
  },
  {
    field: 'Username or handle',
    pick: 'Plain bold or italic, after testing the exact field',
    avoid: 'Symbols, emoji and combining marks',
    why: 'Many handles accept only ASCII letters, numbers and a few punctuation marks, so a style can render and still be rejected.',
  },
  {
    field: 'Caption or post',
    pick: 'Cursive, gothic, bubble or a light frame',
    avoid: 'Decoration around every line of a long paragraph',
    why: 'Captions are scanned quickly. Styling a short phrase adds character; styling the whole paragraph slows the reader down.',
  },
  {
    field: 'Display name or nickname',
    pick: 'Bold, gothic or a compact frame',
    avoid: 'Rare glyphs with no plain fallback',
    why: 'A missing glyph is visible on every post and message, not only on the profile that set it.',
  },
  {
    field: 'Game tag or clan name',
    pick: 'Short bold or small caps',
    avoid: 'Deep glitch stacks and symbols the client may not ship',
    why: 'Game clients use narrower fonts than browsers and show tags at a distance, where fine decoration disappears.',
  },
];

export const STYLES_FIELD_NOTE = 'If the field accepts the string but drops the effect, the app has stripped characters it does not recognise. Move the styled version to a caption or an image, and keep the field plain.';

export const STYLES_LIMITS_HEADING = 'Character limits to check before styling a name or bio';

export const STYLES_LIMITS_INTRO = 'These are documented field limits from each service. They are reminders, not a validator: a field can be long enough and still reject Unicode, and a service can change a limit at any time.';

export const STYLES_LIMIT_CHECKED = '2026-10-26';

export const STYLES_LIMITS = [
  {
    platform: 'Instagram',
    field: 'Bio',
    limit: '150 characters',
    note: 'Every character in the bio counts, including spaces and any decoration.',
    sourceLabel: 'Instagram Help Center',
    sourceUrl: 'https://help.instagram.com/728994388226960',
  },
  {
    platform: 'TikTok',
    field: 'Nickname',
    limit: '30 characters',
    note: 'The nickname is separate from the @username, which accepts only letters, numbers, underscores and periods.',
    sourceLabel: 'TikTok Support',
    sourceUrl: 'https://support.tiktok.com/en/getting-started/setting-up-your-profile/changing-your-nickname',
  },
  {
    platform: 'TikTok',
    field: 'Bio',
    limit: '80 characters',
    note: 'Little room once a frame is added, so test a short line before committing.',
    sourceLabel: 'TikTok Support',
    sourceUrl: 'https://www.tiktok.com/support/faq_detail?id=7096681482017692162',
  },
  {
    platform: 'X',
    field: 'Bio',
    limit: '160 characters',
    note: 'A frame or extra spacing uses the same budget as the words.',
    sourceLabel: 'X Help Center',
    sourceUrl: 'https://help.x.com/en/resources/glossary',
  },
  {
    platform: 'Discord',
    field: 'Display name',
    limit: '32 characters',
    note: 'A decorated display name can reach the cap quickly; usernames follow stricter rules.',
    sourceLabel: 'Discord Support',
    sourceUrl: 'https://support.discord.com/hc/en-us/articles/12620128861463-New-Usernames-Display-Names',
  },
  {
    platform: 'Discord',
    field: 'Username',
    limit: '2–32 characters',
    note: 'Usernames are case-insensitive and forced to lowercase; styled characters are not a valid substitute.',
    sourceLabel: 'Discord Support',
    sourceUrl: 'https://support.discord.com/hc/en-us/articles/12620128861463-New-Usernames-Display-Names',
  },
  {
    platform: 'Telegram',
    field: 'Username',
    limit: '5–32 characters',
    note: 'Letters, numbers and underscores only, so a styled handle is not valid.',
    sourceLabel: 'Telegram API docs',
    sourceUrl: 'https://core.telegram.org/method/account.updateUsername',
  },
  {
    platform: 'WhatsApp',
    field: 'Profile name',
    limit: '25 characters',
    note: 'A short field: decoration can leave too little room for the name itself.',
    sourceLabel: 'WhatsApp Help Center',
    sourceUrl: 'https://faq.whatsapp.com/859240711908360',
  },
];

export const STYLES_LIMITS_NOTE = 'Counters are not always consistent: some count code points, some count UTF-16 units, and some count what looks like a single visible character as several. Paste the finished string into the destination and read its own counter before saving.';

export const STYLES_ACCESS_HEADING = 'Accessibility: keep a plain copy';

export const STYLES_ACCESS = [
  'Styled text replaces the underlying characters, so screen readers may announce mathematical letters by name, spell out unusual symbols or skip combining marks. A name that looks decorative to one reader can sound like a list of characters to another.',
  'Keep names, handles, prices, dates, instructions and contact details in plain text, and put a plain version beside any styled name that has to be found or typed. If the look matters more than the text being selectable, the studio can render it as an image, but describe the same information in the surrounding text.',
];

/**
 * Words of unique, helpful text on the hub.
 *
 * Deliberately excludes the 25 rows: they are generated samples, not prose, and
 * counting them would let a page earn an ad purely by repeating one word in 25
 * different fonts. This counts the writing a reader could only get here, which is
 * the thing the policy is actually about.
 */
export function stylesHubWordCount() {
  return [
    STYLES_LEDE,
    STYLES_ANSWER.q,
    STYLES_ANSWER.a,
    STYLES_HOW_HEADING,
    ...STYLES_HOW,
    STYLES_GUIDES_HEADING,
    STYLES_GUIDES_BODY,
    STYLES_FIELD_HEADING,
    STYLES_FIELD_INTRO,
    ...STYLES_FIELD_ROWS.flatMap((r) => [r.field, r.pick, r.avoid, r.why]),
    STYLES_FIELD_NOTE,
    STYLES_LIMITS_HEADING,
    STYLES_LIMITS_INTRO,
    ...STYLES_LIMITS.flatMap((r) => [
      r.platform, r.field, r.limit, r.note, r.sourceLabel,
    ]),
    STYLES_LIMITS_NOTE,
    STYLES_ACCESS_HEADING,
    ...STYLES_ACCESS,
    ...STYLES_QA.flatMap((f) => [f.q, f.a]),
  ]
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Whether the hub may show an ad.
 *
 * Exported because the decision is a policy, not a layout detail: it is made in
 * one place so the page and the test suite cannot answer the question
 * differently. It depends on the hub's own prose and on nothing else — a
 * personalised ?text= render carries exactly the same writing as the clean page,
 * so it is not a different case.
 */
export function stylesHubAdPlan() {
  const words = stylesHubWordCount();
  return {
    words,
    allowed: adAllowedOn('/styles', { stylesHubWords: words }),
  };
}
