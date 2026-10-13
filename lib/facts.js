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
import {
  BOARD_SIZE, WORDS_PER_KEYWORD, EMOJI_MIN, EMOJI_MAX,
} from './keyword-board.js';

/** 5616 -> "5,616". Thousands separators, because the number is read by people. */
const grouped = (n) => Number(n).toLocaleString('en-US');

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
      id: 'board',
      label: 'Keyword board',
      value: `${BOARD_SIZE} keywords, ${WORDS_PER_KEYWORD} words each`,
      detail: `The keyword board offers ${BOARD_SIZE} searches, and each one returns ${WORDS_PER_KEYWORD} `
        + `words in ${WORDS_PER_KEYWORD} separate styles, decorated with ${EMOJI_MIN} to ${EMOJI_MAX} colour emoji.`,
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
  return [
    'Convert text to bold, cursive, gothic, bubble, glitch and thousands more Unicode styles',
    `Browse ${grouped(catalog().styles.length)} styles across ${Object.keys(catalog().categories).length} categories`,
    'Copy styled text, symbols, emoji and kaomoji in one tap',
    'Count words and characters, convert case, reverse text and generate slugs',
    'Render styled text to a 1200 by 630 PNG image in the browser',
    'Search and filter styles by name or category',
  ];
}