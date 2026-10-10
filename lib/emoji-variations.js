// Emoji-wrapped keyword variations.
//
// Each variation is a genuinely distinct search phrase wrapped in a leading and
// trailing emoji. Phrases come from a fixed, hand-written rule list per section -
// never from emoji permutations or combinatorial expansion - so the generator can
// only emit phrases a person would actually type.
//
// Output is split in two:
//   allVariations      every validated phrase, kept in data/keyword-report.json
//   displayVariations  the readable subset rendered on the landing page
//
// A section that cannot legitimately reach VARIATION_MIN records the shortfall
// instead of padding itself with meaningless variations.

import { VARIATION_MIN, VARIATION_DISPLAY, VARIATION_MAX } from './keywords.js';

const EMOJI = [
  '✨', '💖', '🔥', '🌟', '🎨', '🦋', '💎', '🌈', '💫', '💗',
  '🖋️', '🌸', '🦄', '💕', '🌺', '👑', '🪞', '🎀', '🌷', '💝',
  '🪷', '🫧', '🧚', '🎯', '🎉', '🍀', '⚡', '🌙', '☄️', '🔮',
  '🪄', '🧿', '🍭', '🧁', '🌻', '🐚', '🎐', '🪞', '🕊️', '🌊',
];

const stripEmoji = (value) =>
  Array.from(value)
    .filter((ch) => !/\p{Extended_Pictographic}|\p{Emoji_Presentation}|️|‍/u.test(ch))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const wrap = (phrase, index) => {
  const emoji = EMOJI[index % EMOJI.length];
  return { emoji, phrase, text: `${emoji} ${phrase} ${emoji}` };
};

/**
 * Phrase rules per section. Each entry yields one or more distinct phrases; the
 * subject is the page topic, never a reused generic string.
 */
const PHRASE_RULES = {
  instagram: (s) => [
    `${s} fancy text`, `${s} bio fonts`, `${s} stylish letters`, `${s} username fonts`,
    `${s} text styles`, `${s} profile text`, `${s} decorative letters`, `${s} aesthetic fonts`,
    `${s} fancy lettering`, `${s} unicode text`, `${s} cute bio text`, `${s} cursive bio fonts`,
    `${s} elegant lettering`, `${s} pretty username text`, `${s} creative profile text`,
    `${s} love bio fonts`, `${s} soft aesthetic lettering`, `${s} decorative bio text`,
    `${s} fantasy lettering`, `${s} royal name fonts`, `${s} bubble letters`,
    `${s} stylish name text`, `${s} heart text styles`, `${s} cute username fonts`,
    `${s} copyable fancy letters`, `${s} profile name styles`, `${s} decorative username text`,
    `${s} caption text styles`, `${s} unique name lettering`, `${s} creative bio lettering`,
    `${s} bio name generator`, `${s} highlight name text`, `${s} short bio lettering`,
    `${s} story caption fonts`,
  ],
  whatsapp: (s) => [
    `${s} fancy text`, `${s} bold text style`, `${s} status fonts`, `${s} chat letter styles`,
    `${s} name text styles`, `${s} display name fonts`, `${s} stylish text for status`,
    `${s} underline text`, `${s} strikethrough text`, `${s} italic text style`,
    `${s} fancy letters for status`, `${s} contact name lettering`, `${s} group name fonts`,
    `${s} profile name text`, `${s} announcement lettering`, `${s} text decoration styles`,
    `${s} mono text style`, `${s} small caps text`, `${s} wide spaced text`,
    `${s} symbol wrapped text`, `${s} heart wrapped letters`, `${s} star wrapped text`,
    `${s} double underline text`, `${s} wavy underline text`,
    `${s} dotted underline text`, `${s} crossed out text`, `${s} overline text`,
    `${s} superscript text`, `${s} subscript text`, `${s} bold italic text`,
    `${s} sans serif lettering`, `${s} gothic status text`, `${s} handwritten style text`,
    `${s} fancy text copy paste`,
  ],
  discord: (s) => [
    `${s} fancy text`, `${s} nickname fonts`, `${s} server name fonts`, `${s} clan tag styles`,
    `${s} bio fonts`, `${s} display name lettering`, `${s} channel name text`,
    `${s} role name fonts`, `${s} status text styles`, `${s} avatar caption text`,
    `${s} gg message fonts`, `${s} respawn text style`, `${s} boss mode lettering`,
    `${s} health bar text`, `${s} console tag fonts`, `${s} frag line text`,
    `${s} shout caps text`, `${s} framed nickname text`, `${s} kaomoji framed status`,
    `${s} emoji framed name`, `${s} sparkle nickname text`, `${s} star framed letters`,
    `${s} heart framed username`, `${s} small caps server name`, `${s} bold guild name text`,
    `${s} italic role title`, `${s} gothic team name`, `${s} wide spaced nickname`,
    `${s} fancy text for discord bio`, `${s} copyable discord fonts`,
  ],
  gaming: (s) => [
    `${s} fancy text`, `${s} clan tag fonts`, `${s} player name lettering`,
    `${s} guild name text`, `${s} lobby title styles`, `${s} squad name fonts`,
    `${s} game username text`, `${s} status line lettering`, `${s} respawn text style`,
    `${s} frag line fonts`, `${s} boss mode text`, `${s} gg message text`,
    `${s} console tag style`, `${s} shout caps name`, `${s} health bar text`,
    `${s} esports team name`, `${s} speedrun name text`, `${s} battle tag lettering`,
    `${s} rank badge text`, `${s} loadout name fonts`, `${s} character name text`,
    `${s} server tag styles`, `${s} tournament name lettering`, `${s} arena name text`,
    `${s} raid team fonts`, `${s} survival name text`, `${s} sandbox title lettering`,
    `${s} mobile game name text`, `${s} shooter clan lettering`, `${s} survival clan name`,
    `${s} hardcore mode text`,
  ],
  languages: (s) => [
    `${s} fancy text`, `${s} letter mapping`, `${s} script support`,
    `${s} character compatibility`, `${s} glyph coverage`, `${s} font rendering`,
    `${s} text shaping`, `${s} right to left display`, `${s} combining marks`,
    `${s} codepoint support`, `${s} emoji coverage`, `${s} device rendering`,
    `${s} app compatibility`, `${s} letter substitution`, `${s} style limitations`,
    `${s} plain text fallback`, `${s} clipboard copy`,
    `${s} browser rendering`, `${s} mobile keyboard support`, `${s} platform differences`,
    `${s} character coverage`, `${s} encoding support`, `${s} diacritics`,
    'non latin text', `${s} translation styling`, 'transliteration limits',
    `${s} typography rules`, `${s} display width`, 'bidirectional text',
    'missing glyphs', 'font fallback rules',
  ],
  colours: () => [
    'fancy text', 'coloured text', 'font colour', 'text colour', 'display colours',
    'colour rendering', 'blue text', 'red text', 'gold text', 'dark text',
    'white text', 'rainbow text', 'coloured unicode', 'colour emoji', 'emoji colours',
    'coloured letters', 'text appearance', 'styling limits', 'app colour support',
    'monochrome text', 'colour and unicode', 'plain text colours', 'styling vs colour',
    'colour explained', 'rendering environment', 'platform colour', 'colour fonts',
    'coloured bios', 'coloured usernames', 'colour mistakes', 'colour truth', 'colour limits',
  ],
};

/**
 * Build the variation set for one section.
 *
 * @param {string} key      section key, e.g. 'instagram'
 * @param {string} subject  the phrase substituted into the rules, e.g. 'Instagram'
 * @param {object} [opts]
 * @param {number} [opts.min]       minimum legitimate variations to aim for
 * @param {number} [opts.display]   how many are rendered on the page
 * @param {string} [opts.source]    the keyword or rule behind the section
 */
export function buildVariations(key, subject, { min = VARIATION_MIN, display = VARIATION_DISPLAY, source = null } = {}) {
  const rule = PHRASE_RULES[key];
  if (!rule) {
    return { key, subject, allVariations: [], displayVariations: [], min, target: min, met: false, shortfall: min, source };
  }

  const seen = new Set();
  const allVariations = [];

  for (const phrase of rule(subject)) {
    if (allVariations.length >= VARIATION_MAX) break;
    const normalized = stripEmoji(phrase);
    // Reject empty, emoji-only and duplicate phrases before they reach the report.
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    allVariations.push({ ...wrap(phrase, allVariations.length), phrase: normalized });
  }

  const displayVariations = allVariations.slice(0, Math.min(display, allVariations.length));
  const met = allVariations.length >= min;

  return {
    key,
    subject,
    min,
    target: min,
    met,
    shortfall: met ? 0 : min - allVariations.length,
    generated: allVariations.length,
    displayed: displayVariations.length,
    source: source || `${key}:variation-rule`,
    allVariations,
    displayVariations,
  };
}

/**
 * True when a variation opens and closes with the same emoji.
 *
 * Emoji are compared as sequences rather than single code points, because many of
 * them end in U+FE0F (a variation selector) or join several code points with U+200D.
 */
export function isWrapped(text) {
  // Trim variation selectors and joiners off the ends first: "🖋️" ends in U+FE0F,
  // so a naive last-character test would reject a correctly wrapped variation.
  const value = String(text).trim().replace(/^[️‍\s]+/, '').replace(/[️‍\s]+$/, '');
  const chars = Array.from(value);
  if (chars.length < 3) return false;
  const pictographic = /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u;
  return pictographic.test(chars[0]) && pictographic.test(chars[chars.length - 1]);
}
