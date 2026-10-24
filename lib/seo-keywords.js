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
    path: '/pdf-accessibility-checker',
    primary: 'pdf accessibility checker',
    secondary: ['pdf accessibility test', 'check pdf for accessibility', 'tagged pdf checker'],
    note: 'One tool, one page, same reason as the QR generator. Deliberately not "pdf to text", '
      + 'which the screenshot tool owns in its own way, and not "word counter", which /tools owns.',
  },
  {
    path: '/screenshot-to-text',
    primary: 'screenshot to text',
    secondary: ['screenshot to text converter', 'image to text online', 'extract text from screenshot'],
    note: 'The OCR tool. "Screenshot to text" is how the job is actually phrased; "image to text online" '
      + 'sits behind it as the wider ask.',
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