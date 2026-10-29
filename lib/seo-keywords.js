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
    path: '/image-compression',
    primary: 'image compressor',
    secondary: ['compress image online', 'jpg compressor', 'png compressor', 'reduce image file size'],
    note: 'Deliberately not "image generator", which /studio already owns, and not '
      + '"fancy text generator", which the home page owns.',
  },
  {
    path: '/qr-code-generator',
    primary: 'qr code generator',
    secondary: [
      'create qr code', 'qr code maker', 'text to qr code', 'website qr code generator',
      'wifi qr code generator', 'whatsapp qr code generator', 'contact qr code generator',
      'customizable qr code', 'downloadable qr code', 'free qr code maker',
    ],
    note: 'A whole tool in its own page rather than a tab on /tools, because /tools targets '
      + '"word counter" and two pages competing for one term split its signals. Deliberately not '
      + '"image generator", which /studio owns, and not "fancy text generator", which the home page owns.',
  },
  {
    path: '/qr-code-reader',
    primary: 'qr code reader',
    secondary: ['read qr code', 'qr code scanner online', 'extract qr code data', 'qr code extractor'],
    note: 'The inverse of the generator: one page reads a code, one page makes one. Deliberately not '
      + '"qr code generator", which /qr-code-generator owns.',
  },
  {
    path: '/pdf-editor',
    primary: 'pdf editor',
    secondary: ['edit pdf online', 'pdf page editor', 'merge pdf pages', 'rotate pdf pages', 'add text to pdf'],
    note: 'The page-arranging tool. Deliberately not "pdf accessibility checker", which is a separate '
      + 'page with a different job, and not "image compressor", which owns image files.',
  },
  {
    path: '/pdf-accessibility-checker',
    primary: 'pdf accessibility checker',
    secondary: ['pdf accessibility test', 'check pdf for accessibility', 'tagged pdf checker'],
    note: 'One tool, one page, same reason as the QR generator. Deliberately not "pdf to text", '
      + 'which the screenshot tool owns in its own way, and not "word counter", which /tools owns.',
  },
  {
    path: '/screenshot-to-text',
    primary: 'screenshot to text',
    secondary: ['screenshot to text converter', 'image to text online', 'extract text from screenshot',
      'edit text in screenshot'],
    note: 'The OCR tool. "Screenshot to text" is how the job is actually phrased; "image to text online" '
      + 'sits behind it as the wider ask, and "edit text in screenshot" covers the in-image replacement.',
  },
  {
    path: '/universal-text-fixer',
    primary: 'text fixer',
    secondary: ['fix text online', 'clean up text online', 'fix messy text'],
    note: 'The repair tool. Not "text cleaner", which is a tab on /tools, and not "word counter", which /tools owns.',
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
    path: '/tiktok-font-generator',
    primary: 'tiktok font generator',
    secondary: ['tiktok bio font', 'tiktok nickname font', 'tiktok username font'],
    note: 'Owns TikTok field queries. The username query still resolves to a plain-text rule, not a claim that the handle accepts styled letters.',
  },
  {
    path: '/facebook-font-generator',
    primary: 'facebook font generator',
    secondary: ['facebook bio font', 'facebook post font', 'facebook profile name font'],
    note: 'Separate from the Facebook name policy: this page styles posts and Intro text, while the name fields are explicitly ruled out.',
  },
  {
    path: '/x-font-generator',
    primary: 'x font generator',
    secondary: ['twitter font generator', 'x bio font', 'x display name font'],
    note: 'Targets X and its former Twitter name on one page rather than splitting the same intent across two routes.',
  },
  {
    path: '/youtube-font-generator',
    primary: 'youtube font generator',
    secondary: ['youtube title font', 'youtube channel name font', 'youtube description font'],
    note: 'Targets video titles, descriptions and channel names; the handle is documented as a restricted field.',
  },
  {
    path: '/telegram-font-generator',
    primary: 'telegram font generator',
    secondary: ['telegram bio font', 'telegram name font', 'telegram username font'],
    note: 'Uses the Telegram API limits for names and bio and keeps the username field plain.',
  },
  {
    path: '/about',
    primary: 'stylzo',
    secondary: ['how unicode text works', 'what is a fancy text generator'],
  },
];

// The 25 style queries Phase 3 has to resolve. Fourteen are style intents; the
// other eleven are the Instagram, WhatsApp and Discord variants. Several queries
// can share one page, but no query may have two owners: that is the difference
// between a page that answers an intent and two pages that split it.
//
// `terms` are the words the owner's title, heading or opening copy must contain.
// The integration suite fetches each owner and checks them.
export const QUERY_OWNERS = [
  { query: 'bold text', path: '/fonts/bold', terms: ['bold'] },
  { query: 'italic text', path: '/fonts/italic', terms: ['italic'] },
  { query: 'cursive text', path: '/fonts/script', terms: ['cursive'] },
  { query: 'gothic or old english text', path: '/fonts/fraktur', terms: ['gothic', 'old english'] },
  { query: 'bubble text', path: '/fonts/circled', terms: ['bubble'] },
  { query: 'strikethrough text', path: '/fonts/strike', terms: ['strikethrough'] },
  { query: 'underline text', path: '/fonts/underline', terms: ['underline'] },
  { query: 'upside down text', path: '/fonts/upside-down', terms: ['upside down'] },
  { query: 'small caps and tiny text', path: '/fonts/category/small', terms: ['small caps', 'tiny'] },
  { query: 'wide or vaporwave text', path: '/fonts/fullwidth', terms: ['wide', 'vaporwave'] },
  { query: 'zalgo or glitch text', path: '/fonts/category/glitch', terms: ['zalgo', 'glitch'] },
  { query: 'aesthetic text', path: '/fonts/fullwidth', terms: ['aesthetic'] },
  { query: 'cute text', path: '/fonts/circled', terms: ['cute'] },
  { query: 'text decorator', path: '/fonts/category/decorated', terms: ['decorator'] },
  { query: 'instagram fancy text', path: '/styles/instagram', terms: ['instagram'] },
  { query: 'instagram bio fonts', path: '/styles/instagram', terms: ['instagram', 'bio'] },
  { query: 'instagram username fonts', path: '/styles/instagram', terms: ['instagram', 'username'] },
  { query: 'instagram caption fonts', path: '/styles/instagram', terms: ['instagram', 'caption'] },
  { query: 'whatsapp fancy text', path: '/styles/whatsapp', terms: ['whatsapp'] },
  { query: 'whatsapp status font', path: '/styles/whatsapp', terms: ['whatsapp', 'status'] },
  { query: 'whatsapp display name font', path: '/styles/whatsapp', terms: ['whatsapp', 'display name'] },
  { query: 'discord fancy text', path: '/styles/discord', terms: ['discord'] },
  { query: 'discord nickname font', path: '/styles/discord', terms: ['discord', 'nickname'] },
  { query: 'discord server name font', path: '/styles/discord', terms: ['discord', 'server'] },
  { query: 'discord status font', path: '/styles/discord', terms: ['discord', 'status'] },
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