// Per-style page content.
//
// A font page needs to answer three things a reader actually cares about:
// how the style works, what the result looks like in real text, and whether it
// will survive being pasted into the app they want to use it in. Everything
// here is derived from the catalog, the support level and the pipeline type, so
// the text differs between styles for real reasons rather than being swapped
// nouns in one template.

import { applyStyle } from '../services/unicode/engine.js';

export function nameWithText(name) {
  const value = String(name || '');
  return / Text$/.test(value) ? value : `${value} text`;
}

/**
 * Support copy per level. Deliberately defined here rather than imported from
 * lib/pages.js: that module pulls in config/environment.js through the "@/"
 * alias, which only resolves inside Next, and this module has to stay loadable
 * from plain Node so the content can be checked in a unit test. The strings
 * match SUPPORT_LABEL in lib/pages.js, which still owns the short label shown
 * beside a style in the lists.
 */
const SUPPORT = {
  safe: {
    label: 'Works almost everywhere',
    advice: 'This is among the safest styles here. It is built from characters that virtually '
      + 'every modern app already renders, so it is a good default choice.',
  },
  good: {
    label: 'Works in most apps',
    advice: 'Expect this to work almost everywhere. The characters used here are common, so only '
      + 'very old devices or stripped-down apps will have trouble.',
  },
  limited: {
    label: 'Check your app first',
    advice: 'Some apps replace these characters with boxes or substitute a different emoji. If '
      + 'you need a guaranteed result, test it in the app you have in mind before relying on it.',
  },
};

/** What the pipeline actually does, which is the single most useful fact. */
export function styleKind(style) {
  const types = new Set((style.pipeline || []).map((p) => p.type));
  if (types.has('zalgo')) {
    return { kind: 'zalgo', label: 'combining marks' };
  }
  if (types.has('combine') && types.size === 1) {
    return { kind: 'combine', label: 'a line or mark' };
  }
  if (types.has('frame')) {
    return { kind: 'frame', label: 'decorative characters' };
  }
  if (types.has('map') && !types.has('combine')) {
    return { kind: 'map', label: 'look-alike letters' };
  }
  return { kind: 'transform', label: 'a transformation' };
}

const KIND_COPY = {
  map: {
    how: 'Each letter is swapped for a different Unicode character that has the same shape. '
      + 'You type ordinary text and the style is applied for you.',
    fact: 'Because the output uses standard Unicode characters rather than a font, it can be '
      + 'pasted wherever plain text is accepted. Nothing needs to be installed on either side, '
      + 'and how it renders depends on the fonts the receiving app has.',
  },
  combine: {
    how: 'This adds a line or mark around each character instead of changing the letters. '
      + 'On its own it sits on ordinary text; combined with a letter style it sits on that style.',
    fact: 'This is a modifier rather than a complete style. Pairing it with a letter style gives a '
      + 'much clearer result, because the line draws attention on its own.',
  },
  frame: {
    how: 'Your text is kept intact and wrapped in decorative characters on both sides.',
    fact: 'Framed styles look best on short phrases. The decoration adds characters at each end, '
      + 'so a long sentence runs past the edge of most apps.',
  },
  zalgo: {
    how: 'Small combining marks are stacked above and below each letter, leaving the underlying '
      + 'text readable.',
    fact: 'Combining marks are the least widely supported characters this site uses. They render '
      + 'correctly in most modern apps but can disappear entirely in older ones.',
  },
  transform: {
    how: 'The order of your characters is changed rather than their shapes.',
    fact: 'The text is deliberately unreadable to anyone but you. That is the point of this style, '
      + 'and it is why it works best as a playful addition rather than real content.',
  },
};

/**
 * Apps people actually paste styled text into, with real per-app caveats.
 * Large enough that rotating by the slug gives every style a different pair.
 */
const APP_NOTES = [
  ['WhatsApp', 'sends styled text correctly and renders it on both sides', true],
  ['Instagram', 'keeps the characters in bios and captions, but not inside a username field', true],
  ['TikTok', 'accepts styled text in captions; the video description behaves the same way', true],
  ['Discord', 'one of the most reliable places to use styled text, including in channel names', true],
  ['X (Twitter)', 'styled text works in a post but is usually stripped from the display name', false],
  ['Facebook', 'accepts styled text in posts and comments; the name field flattens it', false],
  ['Reddit', 'keeps styled text in posts and comments, though some themes render it small', true],
  ['Telegram', 'renders styled text reliably, including in channel titles', true],
  ['Snapchat', 'accepts styled text in the bio, which is where most people use it', true],
  ['Pinterest', 'keeps styled text in pin descriptions and board names', true],
  ['Steam', 'accepts styled text in profile fields, though the game list flattens it', false],
  ['Roblox', 'accepts styled text in the display name and bio', true],
  ['Minecraft', 'keeps styled text in chat and server messages, but not in item names', true],
  ['YouTube', 'keeps styled text in a channel description, not in a video title', false],
];

/**
 * Use cases for the individual line marks. There are 26 of these styles and they
 * all share a category, so a single category pool left them reading identically.
 * Each mark genuinely suits different things, which is worth saying.
 */
const MARK_USE = {
  underline: ['marking a name in a bio', 'a signature line under a caption', 'drawing attention without changing the text'],
  'double-underline': ['a title that should look emphasised twice over', 'a section heading in a plain-text layout', 'marking a price that is fixed'],
  overline: ['a heading above a list', 'marking a chapter or part number', 'a label that should read as a header'],
  strike: ['showing an old price before a sale', 'a joke about something cancelled', 'marking a word as removed in a chat'],
  'wavy-underline': ['a spelling mistake in a quote', 'text that should read as a warning', 'marking a spelling error without deleting it'],
  dotted: ['a placeholder for text you have not written yet', 'a fill-in-the-blank line', 'a quiet divider between bio lines'],
  slash: ['a crossed-out correction in a caption', 'marking a route or path in a username', 'a strike that still leaves the text readable'],
  'tilde-underline': ['a footnote marker', 'marking a nickname as approximate', 'a soft divider that is not as heavy as a strikethrough'],
  'tilde-strike': ['an edit that is not a full deletion', 'marking a word as roughly crossed out', 'a joking strike in a group chat'],
  'bar-underline': ['a firm underline with more weight than a plain one', 'marking a rule or a divider', 'a heading in a text-only layout'],
  'wiggle-underline': ['a playful emphasis in a fun bio', 'marking a name as a joke', 'a decorative underline in a nickname'],
  'dashed-underline': ['a provisional underline for something unconfirmed', 'a separator that should look unfinished', 'marking a draft section'],
  'arrow-underline': ['pointing at a handle or a link in a bio', 'marking where to look next in a list', 'a direction cue in a caption'],
  'hook-underline': ['a decorative underline for a username', 'marking a signature', 'an ornamental flourish in a bio'],
  'triple-underline': ['an emphatic heading in a plain-text profile', 'marking something as very important', 'a stack of lines for a title card'],
  'strike-underline': ['a name you have changed but kept visible', 'showing both an old and new value', 'a correction that keeps both versions readable'],
  'overline-underline': ['a heading that should be boxed in text', 'a section label above and below', 'a name framed top and bottom in a bio'],
  'overline-strike': ['marking a cancelled item still visible', 'a crossed-out label with a header above it', 'a cancelled section title'],
  'wavy-underline-double': ['a loud spelling mistake', 'text that should look obviously wrong', 'a comic emphasis in a nickname'],
  'dotted-underline': ['a quiet marker for something secondary', 'a placeholder link in plain text', 'a light footnote rule'],
  'slash-underline': ['marking a path or address in a bio', 'a correction that keeps both marks', 'a route shown with a line under it'],
  'bar-underline-double': ['a very firm emphasis in a heading', 'marking something important in a list', 'a title with a heavy rule'],
  'wavy-strike': ['a joking cancellation', 'marking a word as roughly crossed out', 'a comic no in a chat'],
  'dotted-strike': ['a light cancellation that keeps the text', 'marking a removed item in a list', 'a soft delete'],
  crossed: ['marking text as removed', 'a name you have changed but kept', 'a cancelled item in a list'],
  'dot-above': ['a short heading above a section', 'a marker over a single word', 'an accent above a name'],
};

/** Where each category earns its place. Pools are long and sampled, not fixed. */
const CATEGORY_USE = {
  bold: ['making a name or nickname stand out', 'headings and short labels', 'emphasising one word inside a longer sentence', 'a display name that must stay readable', 'marking the important line in a post'],
  italic: ['quoting someone', 'adding a lighter tone to a nickname', 'marking a username in a credits list', 'a book or product title', 'a caption that should read as a thought rather than a statement'],
  cursive: ['signing off a message', 'a personal name in a caption', 'anything that should read as handwritten', 'a wedding or invitation detail', 'a signature-style username'],
  gothic: ['a dramatic or dark quote', 'a username or clan tag', 'a headline that needs to look weighty', 'a band or album reference', 'a gaming identity that should look serious'],
  outline: ['a name that must stay readable but look outlined', 'a caption over a busy image', 'a nickname where bold would be too heavy', 'a poster title with a light look', 'text that needs to sit on a dark background'],
  clean: ['a long name that has to stay readable', 'a filename or handle', 'anywhere decoration would cost legibility', 'a technical label in a bio', 'a signature that must not look styled'],
  wide: ['filling a narrow column evenly', 'matching text to a square layout', 'a display line in a banner', 'a menu or table header', 'spreading a short word across a wide space'],
  bubble: ['a playful nickname', 'a birthday or party message', 'a child-friendly username', 'a group chat inside joke', 'a cheerful announcement'],
  small: ['marking footnotes or asides', 'spelling out an acronym', 'a label that should look quieter than the main text', 'a citation beside a quote', 'a secondary line under a title'],
  lines: ['underlining a name in a bio', 'crossing out a price', 'a quote where the attribution should be marked', 'a correction you want visible', 'an aside that should still be read'],
  flip: ['a joke or a puzzle', 'a decorative header', 'a name written to be guessed at', 'a reveal in a video', 'a deliberately unreadable signature'],
  glitch: ['a hacking or cyberpunk theme', 'a gaming display name', 'a dramatic title for a video', 'a streamer overlay', 'a username that should look corrupted'],
  decorated: ['a birthday greeting', 'a celebratory announcement', 'a nickname that needs a little sparkle', 'a festive group chat message', 'a highlight caption'],
  symbols: ['a symbol-based username', 'a separator in a list', 'a short decorative label', 'a divider between sections of a bio', 'a minimal mark beside a name'],
  emoji: ['a celebratory caption', 'a username built from emoji', 'a mood marker in a chat', 'a reaction to a post', 'a short sticker-like label'],
  kaomoji: ['a reaction in a chat', 'a username with a face', 'a playful sign-off', 'a status line in a bio', 'a mood marker between messages'],
  gaming: ['a clan or guild tag', 'a stream overlay title', 'a competitive display name', 'a team name for a tournament', 'a rank label beside a score'],
  social: ['a bio that needs decorating', 'a highlight cover caption', 'a short promotional line', 'a call to action under a post', 'a category label in a profile'],
};

/** Ready-made phrases, chosen per style so no two pages show the same set. */
const PHRASES = [
  'Alex Rivera', 'night owl', 'good vibes only', 'made it', 'no signal',
  'coastal breeze', 'main character', 'offline', 'deep focus', 'slow mornings',
  'Berlin 2026', 'keep going', 'first coffee', 'on the move', 'quiet thunder',
];
const CAPTIONS = [
  'just shipped it', 'see you soon', 'new drop', 'that escalated fast',
  'still thinking about it', 'worth the wait', 'day one', 'no notes',
];

/** Deterministic pick so a style always gets the same content, not random per request. */
function pick(list, seed, offset) {
  return list[(seed + offset) % list.length];
}

function seedFor(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

// A modifier (underline, strikethrough) needs something to sit on. Applying the
// modifier alone gives underlined plain text, which shows none of the effect,
// so the base letter style is rendered first and the modifier is layered on
// top. This matches what the generator does when a composed style such as
// "Bold Fraktur" is picked.
const EXAMPLE_BASE = { slug: 'bold', name: 'Bold', pipeline: [{ type: 'map', name: 'bold' }] };

/** Render one example exactly the way the page's own converter renders it. */
export function renderStyleExample(style, input) {
  const kind = styleKind(style).kind;
  const base = kind === 'combine' ? applyStyle(input, EXAMPLE_BASE, { maxLength: 300 }) : input;
  return applyStyle(base, style, { maxLength: 300 });
}

/** Real rendered examples: this is what the style actually produces. */
export function styleExamples(style, userText) {
  const seed = seedFor(style.slug);
  const render = (input) => renderStyleExample(style, input);

  const preferred = userText?.trim()
    ? [userText.trim()]
    : [];
  // A case-only style is a no-op on text that is already in that case, so an
  // example built from lowercase phrases would show "All Caps" as plain text
  // and prove nothing. Feed it input in the opposite case so the change shows.
  const caseMode = (style.pipeline || []).find((p) => p.type === 'case')?.mode;
  const base = [...PHRASES, ...CAPTIONS];
  const pool = caseMode === 'upper'
    ? [...base.map((p) => p.toUpperCase()), ...base]
    : caseMode === 'lower'
      ? [...base.map((p) => p.toUpperCase()), ...base]
      : base;
  const labels = userText?.trim()
    ? ['Your text', 'A short caption', 'A name or handle']
    : ['A name', 'A short caption', 'A longer phrase'];

  // Some pipelines are probabilistic (sparkle styles scatter symbols by a
  // density roll), so a given phrase can come out identical to its input. An
  // example that shows no styling is worse than no example, so fall through to
  // the next phrase until something actually changed.
  const inputs = [];
  const start = seed % pool.length;
  const preferredFirst = preferred.length ? preferred[0] : null;
  // Scan the whole pool once, starting from a per-style offset so different
  // styles lead with different phrases.
  const candidates = preferredFirst
    ? [preferredFirst, ...Array.from({ length: pool.length }, (_, i) => pool[(start + i) % pool.length])]
    : Array.from({ length: pool.length }, (_, i) => pool[(start + i) % pool.length]);

  for (const candidate of candidates) {
    if (inputs.length >= 3) break;
    if (render(candidate) !== candidate) inputs.push(candidate);
  }
  // Pathological style that never transforms: still show the phrases rather
  // than an empty examples section.
  while (inputs.length < 3) inputs.push(candidates[inputs.length % candidates.length]);

  return inputs.map((input, i) => ({
    label: labels[i] || 'Example',
    plain: input,
    output: render(input),
  }));
}

/**
 * A sentence describing what makes THIS style different from its neighbours.
 * Two styles can share a category and a support level and still need different
 * copy, so this leans on the pipeline, the tags and the composed parent rather
 * than on the category alone.
 */
function distinguishingSentence(style, kind, seed) {
  const name = style.name;
  const parts = [];

  if (style.parent) {
    parts.push(
      `${name} is a combination rather than a single effect: it layers the ${style.parentName || 'base'} `
      + `style with an additional step, which is why it reads more clearly than either part alone.`,
    );
  }

  if (kind === 'map') {
    const tags = (style.tags || []).filter((t) => t !== 'math' && t !== 'strong');
    if (tags.length) {
      parts.push(`It is usually described as ${tags.slice(0, 2).join(' or ')}, which is how people searching for it tend to look.`);
    }
  }

  if (kind === 'frame') {
    const bits = (style.tags || []).filter((t) => !['symbols', 'emoji'].includes(t));
    if (bits.length) {
      parts.push(`The decoration is drawn from the ${bits.slice(0, 2).join(' and ')} ranges rather than from letters.`);
    } else {
      parts.push('The decoration is added around the text rather than replacing the letters.');
    }
  }

  if (kind === 'zalgo') {
    const marks = style.name.toLowerCase().includes('extreme') ? 'many' : 'a few';
    parts.push(`It stacks ${marks} marks per letter, which is why the text stays readable underneath.`);
  }

  if (kind === 'combine') {
    const mark = (style.tags || []).find((t) => t !== 'lines') || 'decorative';
    const article = /^overline(?:-|$)/.test(mark) ? 'an' : 'a';
    parts.push(`Specifically it applies ${article} ${mark} mark to each character.`);
  }

  if (kind === 'transform') {
    const op = (style.tags || []).find((t) => t !== 'flip');
    parts.push(`It works by changing character order${op ? `, using the ${op} operation` : ''}, so the original word is not spelled the way it appears.`);
  }

  // Last resort so two styles with identical shape and tags still differ.
  if (!parts.length) {
    parts.push(`${name} sits in the ${style.category} group and is one of the ${style.isPopular ? 'more commonly used' : 'less commonly used'} options there.`);
  }

  return parts.join(' ');
}

/** Everything a font page needs to say beyond the description. */
export function styleContent(style, userText) {
  const { kind, label } = styleKind(style);
  const copy = KIND_COPY[kind] || KIND_COPY.map;
  const seed = seedFor(style.slug);
  const support = SUPPORT[style.support] || SUPPORT.good;

  // A specific mark pool wins over the category pool, then the category.
  const mark = kind === 'combine' ? (style.tags || []).find((t) => MARK_USE[t]) : null;
  const pool = (mark && MARK_USE[mark])
    || CATEGORY_USE[style.category]
    || ['a nickname or display name', 'a short personal message', 'a caption', 'a bio line'];

  // Three consecutive entries from a per-style offset, so the picks are always
  // distinct. Stepping by three instead would collapse to a single entry
  // whenever the pool holds exactly three, which is what the mark pools do.
  const offset = seed % pool.length;
  const uses = [0, 1, 2].map((i) => pool[(offset + i) % pool.length]);

  // Four apps per page, drawn from a larger pool, so the pair differs across
  // the catalog instead of repeating every eighth style.
  const notes = [0, 2, 5].map((o) => APP_NOTES[(seed + o * 7) % APP_NOTES.length])
    .filter((v, i, a) => a.findIndex((x) => x[0] === v[0]) === i);

  const betterIn = [];
  if (kind === 'combine') {
    betterIn.push({ name: 'Bold', slug: 'bold' }, { name: 'Cursive Script', slug: 'script' }, { name: 'Old English', slug: 'fraktur' });
  } else if (style.parent) {
    betterIn.push({ name: style.parentName || 'the base style', slug: style.parent });
  } else {
    betterIn.push({ name: 'Bold', slug: 'bold' }, { name: 'Old English', slug: 'fraktur' }, { name: 'Cursive Script', slug: 'script' });
  }

  return {
    kind,
    label,
    how: copy.how,
    fact: copy.fact,
    distinct: distinguishingSentence(style, kind, seed),
    support: support.label,
    supportAdvice: support.advice,
    appNotes: notes,
    uses,
    examples: styleExamples(style, userText),
    betterIn,
    seed,
  };
}