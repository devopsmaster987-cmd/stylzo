// Home page content for the generator at "/".
//
// Follows the same rules as lib/landing-pages.js: copy is hand-written per section,
// nothing repeats across sections, and no section claims a feature the catalog
// lacks. Keywords come from data/keywords.txt via data/keyword-map.json, so this
// module only adds the prose around them.
//
// Two hard constraints from the brief:
//   - No brand names in any heading, title, route or page text. Platform landing
//     pages are linked with descriptive labels instead ("Bio and caption styles",
//     not the platform name), and no third-party brand is ever named.
//   - No fake features. Nothing on this page may claim a capability the catalog
//     or the app does not have.

import { HOME_ANSWER, HOME_QA } from './aeo.js';

/** Unique title and description for `/`. `home: true` in services/seo.js gives the
 *  `Stylzo: ...` form, so the site name appears once and never doubles. */
export const HOME_META = {
  title: 'Free Fancy Text Generator — Copy and Paste',
  description:
    'Free fancy text generator with over 5,500 Unicode styles for bold, cursive, gothic, bubble and glitch text. Copy and paste in one tap. No sign-up, no install.',
  h1: 'Fancy text generator',
};

/** Visible beside the tool, not only in the footer. */
export const HOME_ASSURANCE = {
  text: 'No account and no stored text. Styling runs in this browser.',
  links: [
    { href: '/privacy', label: 'Privacy policy' },
    { href: '/about', label: 'About the owner' },
  ],
};

/**
 * Style collections. Each `slug` must resolve through getStyle() and be indexable,
 * so the page can never advertise a style the engine cannot produce. The keyword
 * map routes `formatting` and `style` categories here.
 */
export const HOME_COLLECTIONS = [
  {
    h2: 'Bold and plain lettering styles',
    body: 'Bold, italic, cursive, small caps and serif swaps keep the character count close to your original, which makes them the best starting point for strict username and display name fields.',
    slugs: ['bold', 'sans-bold', 'italic', 'script', 'small-caps', 'sans'],
  },
  {
    h2: 'Gothic, outline and boxed styles',
    body: 'Old English, double-struck, circled and fullwidth text. These read well in bios and captions where there is room, and add the most visual weight per character.',
    slugs: ['fraktur', 'bold-fraktur', 'double-struck', 'circled', 'fullwidth', 'monospace'],
  },
  {
    h2: 'Flipped, reversed and glitched text',
    body: 'Upside down, backwards, mirrored and glitch styles for chats and posts. Combining marks stack differently on every device, so preview in the app before you commit.',
    slugs: ['upside-down', 'backwards', 'flipped-letters', 'zalgo-light', 'glitch-alternate', 'strike'],
  },
  {
    h2: 'Heart, cute and aesthetic styles',
    body: 'Heart frames, cute bubble lettering and wide aesthetic styles. These are the ones that work most reliably in a bio field because they wrap Latin text only.',
    slugs: ['circled', 'symbol-heart', 'fullwidth', 'handle-wrap', 'small-caps', 'stars-frame'],
  },
];

/**
 * Text size and number styling. The keyword map routes `numbers` here, including
 * the "tiny", "small", "big" and "large" searches.
 */
export const HOME_SIZES = {
  h2: 'Small, tiny and large text, plus number styles',
  body: 'Superscript and subscript keep digits legible where a full decorated font would not, and small caps is the most reliable way to shorten the look of a long name. Every style in this group is real text you can copy.',
  slugs: ['small-caps', 'superscript', 'subscript', 'bold', 'circled'],
};

/** Libraries that are separate, fully working pages. */
export const HOME_LIBRARIES = {
  h2: 'Symbols, emoji and kaomoji libraries',
  body: 'Decoration is separate from styling. Symbols cover arrows, stars and hearts, emoji covers every pictograph by category, and kaomoji are text emoticons for every mood. All three are one tap to copy.',
  links: [
    { href: '/symbols', label: 'Symbols library', body: 'Arrows, stars, hearts, music notes and currency.' },
    { href: '/emoji', label: 'Emoji library', body: 'Every pictograph, grouped by category with meanings.' },
    { href: '/kaomoji', label: 'Kaomoji library', body: 'Shrugs, hugs, animals and moods as plain text.' },
  ],
};

/**
 * Where the output gets pasted. Labels are deliberately descriptive rather than
 * platform names, per the no-brand-names rule.
 */
export const HOME_DESTINATIONS = {
  h2: 'Where people paste the result',
  body: 'Each of these has its own page because every field filters characters differently. A bio accepts far more than a username, and a game client less than either.',
  links: [
    { href: '/styles/instagram', label: 'Bio and caption styles', body: 'Bio fonts, usernames and captions, with the field limits that actually bite.' },
    { href: '/styles/whatsapp', label: 'Status and display name styles', body: 'Short names, the About field and message lettering.' },
    { href: '/styles/discord', label: 'Nickname and server name styles', body: 'Nicknames, server and channel names, and status lines.' },
    { href: '/styles/gaming', label: 'Gamer tag and clan name styles', body: 'Player tags and clan names, including the mobile titles.' },
    { href: '/styles/languages', label: 'Script compatibility', body: 'What happens to Hindi, Urdu, Arabic and other non-Latin input.' },
    { href: '/styles/colours', label: 'How colour actually works', body: 'Why plain text has no font colour, and what to use instead.' },
  ],
};

/** Informational keywords (`how to make fancy text`, `what is unicode text`). */
export const HOME_HOW = {
  h2: 'How to make fancy text',
  steps: [
    {
      h3: 'Type or paste your text above',
      body: 'Every style re-renders as you type. Up to 5,000 characters work; longer text is still styled live in your browser, and the server-rendered preview stays short so the page loads fast.',
    },
    {
      h3: 'Pick a style and read the support label',
      body: 'Each row says whether it works almost everywhere, works in most apps, or needs checking in your app first. Those labels come from how many of the characters survive a round trip through a typical app.',
    },
    {
      h3: 'Copy the result and paste it in',
      body: 'The styling happens in your browser from a character substitution table, so the generator never uploads or stores your text. Our style search and AI suggestion helpers do process a short snippet of typed text to produce their results.',
    },
  ],
  note: 'Every style is a substitution table that swaps Latin letters for look-alike Unicode characters. That is the whole trick: there is no font to install and no image involved, which is why the output is text you can paste anywhere.',
};

/** Field-first guidance. No platform names, per the page-wide brand rule. */
export const HOME_CHOOSE = {
  h2: 'How to choose a style for a bio, username or caption',
  intro: 'Start with the field, not the effect. A bio can hold a sentence and a little decoration, a username is usually checked against a fixed character set, and a caption sits between the two. Choose the narrowest option that still looks deliberate.',
  columns: ['Where it will go', 'Best first choice', 'Avoid', 'Why'],
  rows: [
    {
      field: 'Bio or profile description',
      best: 'Bold, italic, small caps or one short frame',
      avoid: 'Several frames, long glitch stacks and decorative lines',
      why: 'A bio has room for words as well as decoration, and plain letter swaps stay readable at small sizes.',
    },
    {
      field: 'Username or handle',
      best: 'A plain letter swap you have tested in the field',
      avoid: 'Symbols, emoji frames and combining marks',
      why: 'Many handles accept only letters, numbers and a few punctuation marks, so a style can render but still be rejected.',
    },
    {
      field: 'Caption or post',
      best: 'Cursive, gothic, bubble or a light frame',
      avoid: 'Decoration on every sentence of a long paragraph',
      why: 'Captions are read as content rather than identity, but heavy styling slows reading and can hide the message.',
    },
    {
      field: 'Display name or nickname',
      best: 'Bold, gothic or one short frame',
      avoid: 'Rare glyphs that have no plain fallback',
      why: 'Display names are less strict than handles, yet a missing glyph is still visible to everyone who sees the profile.',
    },
    {
      field: 'Game tag or clan name',
      best: 'Short bold, small caps or a simple frame',
      avoid: 'Deep stacks and symbols the game client may not ship',
      why: 'Tags are short and shown at a distance, so legibility matters more than the amount of decoration.',
    },
  ],
  note: 'Treat the support label as a starting point. It describes how likely the characters are to render, not whether a particular form will accept them. Paste the finished string into the real field before you save it.',
};

/** The three support labels, expanded for the home page. */
export const HOME_SAFETY = {
  h2: 'Which styles are safest where',
  intro: 'Every style carries one of three labels. They describe glyph coverage across common apps and devices, not a guarantee from any one service.',
  columns: ['Label', 'Typical styles', 'Good for', 'What can still go wrong'],
  rows: [
    {
      label: 'Works almost everywhere',
      styles: 'Bold, italic, sans, small caps, underline',
      use: 'Bios, display names, captions and game tags',
      caveat: 'A strict username field may still reject the characters, and text search will compare the styled spelling.',
    },
    {
      label: 'Works in most apps',
      styles: 'Cursive, gothic, bubble, fullwidth, framed lines',
      use: 'Captions, bios and short display names',
      caveat: 'Older devices and in-game clients may substitute a box or drop a rare glyph.',
    },
    {
      label: 'Check your app first',
      styles: 'Extreme glitch, filled bubble, subscript, arrow underline',
      use: 'Image text, throwaway posts and places where a fallback is acceptable',
      caveat: 'These depend on characters or stacks that are the most likely to be stripped.',
    },
  ],
  note: 'The catalogue repeats the same label on every style page, so you do not have to guess from the preview.',
  link: { href: '/fonts', label: 'Browse styles by support label' },
};

/** The accessibility and search cost of substitution, in plain language. */
export const HOME_UNICODE = {
  h2: 'What Unicode styling means for search and screen readers',
  intro: 'A styled letter is not the same character as the letter it resembles. The generator replaces the underlying code point, so the result looks different but no longer matches the plain spelling. That has consequences beyond appearance.',
  points: [
    {
      h3: 'Search, mentions and filters',
      body: 'A name written in gothic will not match someone typing the ordinary spelling. Mentions, hashtags, search boxes and moderation filters may also miss it, and a form that expects a standard letter can reject it outright.',
    },
    {
      h3: 'Screen readers and readability',
      body: 'Screen readers may announce mathematical letters by name, spell out unfamiliar symbols or skip combining marks. Stacks of marks can make a short name sound like nonsense, and decorative frames add noise before the actual word.',
    },
    {
      h3: 'Forms, passwords and contact details',
      body: 'Email addresses, URLs, passwords, usernames and support forms expect plain characters. Keep a plain copy of anything you need to type again, and never make styled text the only place important information exists.',
    },
  ],
  note: 'Use styling as decoration, not as the only copy. Keep names, prices, dates, instructions and contact details plain, and put a plain version beside any styled name that matters.',
};

/** Related pages nav. Descriptive labels only, matching the no-brand-names rule. */
export const HOME_LINKS = [
  { href: '/styles', label: 'Style guides — 25 styled words with emoji' },
    { href: '/fonts', label: 'Browse every font style' },
    { href: '/tools', label: 'Text tools' },
  { href: '/qr-code-generator', label: 'QR code generator' },
  { href: '/image-compression', label: 'Image compressor' },
  { href: '/symbols', label: 'Symbols library' },
  { href: '/emoji', label: 'Emoji library' },
  { href: '/kaomoji', label: 'Kaomoji library' },
  { href: '/about', label: 'How the styles work' },
  { href: '/studio', label: 'Studio composer' },
  { href: '/embed', label: 'Embed the generator on your site' },
];

/** Prose below the tool, excluding samples and metadata. */
export function homeWordCount() {
  const wordCount = (values) => values
    .filter(Boolean)
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return wordCount([
    HOME_ASSURANCE.text,
    HOME_ANSWER.q,
    HOME_ANSWER.a,
    HOME_HOW.h2,
    ...HOME_HOW.steps.flatMap((s) => [s.h3, s.body]),
    HOME_HOW.note,
    HOME_CHOOSE.h2,
    HOME_CHOOSE.intro,
    ...HOME_CHOOSE.columns,
    ...HOME_CHOOSE.rows.flatMap((r) => [r.field, r.best, r.avoid, r.why]),
    HOME_CHOOSE.note,
    HOME_SAFETY.h2,
    HOME_SAFETY.intro,
    ...HOME_SAFETY.columns,
    ...HOME_SAFETY.rows.flatMap((r) => [r.label, r.styles, r.use, r.caveat]),
    HOME_SAFETY.note,
    HOME_SAFETY.link.label,
    ...HOME_COLLECTIONS.flatMap((c) => [c.h2, c.body]),
    HOME_SIZES.h2,
    HOME_SIZES.body,
    HOME_LIBRARIES.h2,
    HOME_LIBRARIES.body,
    ...HOME_LIBRARIES.links.flatMap((l) => [l.label, l.body]),
    HOME_DESTINATIONS.h2,
    HOME_DESTINATIONS.body,
    ...HOME_DESTINATIONS.links.flatMap((l) => [l.label, l.body]),
    HOME_UNICODE.h2,
    HOME_UNICODE.intro,
    ...HOME_UNICODE.points.flatMap((p) => [p.h3, p.body]),
    HOME_UNICODE.note,
    ...HOME_LINKS.map((l) => l.label),
    ...HOME_QA.flatMap((f) => [f.q, f.a]),
  ]);
}