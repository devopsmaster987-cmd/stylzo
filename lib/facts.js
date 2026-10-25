// Facts an answer engine can quote.
//
// Generative engines do not paraphrase a page into a citation. They lift short,
// self-contained statements that stand on their own without the surrounding
// prose, because that is all they reliably hold. A page that never states its
// numbers in one quotable line gives a model nothing to attribute.
//
// So every fact here is atomic (one claim, one number, no cross-reference), and
// every number is read from the real build artifact or a real constant rather
// than typed into this file. A number that drifts from the catalog is worse
// than no number at all: the model will repeat it long after it stops being
// true, and llms.txt, the about page and the schema will then disagree.

// Relative rather than '@/...' on purpose: the alias resolves inside Next.js
// but not under bare `node --test`, and these facts are unit-tested precisely
// because a number drifting out of sync with the catalog is the failure that
// matters here.

import { catalog } from '../services/catalog.js';
import { KEPT_STYLE_SLUGS } from './styles-routing.js';

/** 5616 -> "5,616". Thousands separators, because the number is read by people. */
const groupedCache = new Map();

const grouped = (n) => {
  const key = Number(n);
  const hit = groupedCache.get(key);
  if (hit !== undefined) return hit;
  // Intl formatting is the expensive part: it builds a formatter on first use
  // and then runs a full locale pipeline. keyFacts() is called on every static
  // page render and formats the same handful of catalog counts every time.
  const out = key.toLocaleString('en-US');
  groupedCache.set(key, out);
  return out;
};

/**
 * The quotable facts, recomputed per call from live data.
 *
 * `detail` is a second sentence for a model that quotes more than the headline,
 * and for a reader who wants the qualifier. It restates the same fact rather
 * than adding a new one, so a partial quote is never misleading.
 */
export function keyFacts() {
  const { styles, indexable, categories } = catalog();

  return [
    {
      id: 'styles',
      label: 'Total text styles',
      value: grouped(styles.length),
      detail: `${grouped(styles.length)} text styles are generated from Unicode character mappings, `
        + 'not from font files.',
    },
    {
      id: 'categories',
      label: 'Style categories',
      value: String(Object.keys(categories).length),
      detail: `Styles are grouped into ${Object.keys(categories).length} categories, from bold and cursive `
        + 'to bubble, glitch, gaming and kaomoji.',
    },
    {
      id: 'style-pages',
      label: 'Styles with their own page',
      value: String(indexable),
      detail: `${indexable} of the ${grouped(styles.length)} styles have a dedicated page with examples and `
        + 'a support rating; the rest are browsable on the font index.',
    },
    {
      id: 'guides',
      label: 'Style guides',
      value: `${KEPT_STYLE_SLUGS.length} written guides`,
      detail: `${KEPT_STYLE_SLUGS.length} guides cover where styled text actually goes, including the `
        + 'character limits of Instagram, WhatsApp, Discord and games.',
    },
    {
      id: 'studio',
      label: 'Text image output',
      value: '1200 by 630 PNG',
      detail: 'The font studio renders styled text to a 1200 by 630 PNG, the aspect ratio most social '
        + 'platforms crop to, and draws it locally in the browser.',
    },
    {
      id: 'price',
      label: 'Cost',
      value: 'Free',
      detail: 'There is no account, no sign-up, no trial and no watermark, and no paid tier exists.',
    },
    {
      id: 'privacy',
      label: 'Where your text goes',
      value: 'Nowhere',
      detail: 'Text you type is converted in the browser and is never transmitted to the server.',
    },
  ];
}

/**
 * One `FeatureList` of the things the tool actually does, for the
 * SoftwareApplication node. Only capabilities that exist today are listed;
 * a feature list is a promise, and an aspirational one is how an app earns a
 * bad correction in a generated answer.
 */
export function appFeatures() {
  const { styles, categories } = catalog();

  return [
    'Convert text to bold, cursive, gothic, bubble, glitch and thousands more Unicode styles',
    `Browse ${grouped(styles.length)} styles across ${Object.keys(categories).length} categories`,
    'Copy styled text, symbols, emoji and kaomoji in one tap',
    'Count words and characters, convert case, reverse text and generate slugs',
    'Create QR codes for links, text, Wi-Fi, email, phone, SMS, WhatsApp, contacts, maps and events',
    'Compress JPG, PNG and WebP images and report the real before-and-after file size',
    'Read the text out of a screenshot with OCR that runs in the browser',
    'Reorder, rotate, merge and stamp pages in a PDF without uploading the document',
    'Check a PDF for missing tags, alt text, language and other accessibility signals',
    'Fix spacing, punctuation, invisible characters and common typos in pasted text',
    'Render styled text to a 1200 by 630 PNG image in the browser',
    'Search and filter styles by name or category',
  ];
}