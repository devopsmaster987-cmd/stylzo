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

/** Unique title and description for `/`. `home: true` in services/seo.js gives the
 *  `Stylzo: ...` form, so the site name appears once and never doubles. */
export const HOME_META = {
  title: 'Free Fancy Text Generator — Copy and Paste',
  description:
    'Free fancy text generator with 5,600+ Unicode styles for bold, cursive, gothic, bubble and glitch text. Copy and paste in one tap. No sign-up, no install.',
  h1: 'Fancy text generator',
};

/**
 * Style collections. Each `slug` must resolve through getStyle() and be indexable,
 * so the page can never advertise a style the engine cannot produce. The keyword
 * map routes `formatting` and `style` categories here.
 */
export const HOME_COLLECTIONS = [
  {
    h2: 'Bold and plain lettering styles',
    body: 'Bold, italic, cursive, small caps and serif swaps keep the character count close to your original, so they survive the strictest username and display name filters.',
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
    slugs: ['cute-bubble', 'bio-hearts', 'aesthetic-wide', 'handle-wrap', 'soft-bio', 'stars-frame'],
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
      body: 'Nothing is uploaded. The styling happens in your browser from a character substitution table, so your text never reaches our server and nothing is stored.',
    },
  ],
  note: 'Every style is a substitution table that swaps Latin letters for look-alike Unicode characters. That is the whole trick: there is no font to install and no image involved, which is why the output is text you can paste anywhere.',
};

/** Related pages nav. Descriptive labels only, matching the no-brand-names rule. */
export const HOME_LINKS = [
{ href: '/styles', label: 'Fancy Keyword board — 25 styled words with emoji' },
    { href: '/fonts', label: 'Browse every font style' },
    { href: '/tools', label: 'Text tools' },
  { href: '/symbols', label: 'Symbols library' },
  { href: '/emoji', label: 'Emoji library' },
  { href: '/kaomoji', label: 'Kaomoji library' },
  { href: '/about', label: 'How the styles work' },
  { href: '/studio', label: 'Studio composer' },
];