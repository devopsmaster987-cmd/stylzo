import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalog } from '../../services/catalog.js';
import { styleContent, styleKind } from '../../lib/style-content.js';
import { fontPageContent, renderCustomFontExamples } from '../../lib/font-page-content.js';
import { CATEGORY_CONTENT } from '../../lib/category-content.js';
import { LANDING_PAGES } from '../../lib/landing-pages.js';
import { applyStyle } from '../../services/unicode/engine.js';

const words = (value) => String(value || '').trim().split(/\s+/).filter(Boolean);
const normalise = (value) => words(value).join(' ').toLowerCase();
const sentenceSet = (value) => new Set(
  (String(value).toLowerCase().match(/[^.!?]+[.!?]+/g) || [])
    .map(normalise)
    .filter(Boolean),
);
const wordSet = (value) => new Set(
  String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean),
);
const jaccard = (a, b) => {
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  return shared / (a.size + b.size - shared);
};

const pageShape = (slug, text) => ({
  slug,
  words: words(text).length,
  sentences: sentenceSet(text),
  tokens: wordSet(text),
});

function assertTemplateGates(template, pages, { minWords = 0 } = {}) {
  for (const page of pages) {
    assert.ok(page.words >= minWords, `${template} ${page.slug} has only ${page.words} words`);
  }
  for (let i = 0; i < pages.length; i += 1) {
    for (let j = i + 1; j < pages.length; j += 1) {
      const a = pages[i];
      const b = pages[j];
      let shared = 0;
      for (const sentence of a.sentences) if (b.sentences.has(sentence)) shared += 1;
      const sentenceRatio = shared / Math.min(a.sentences.size, b.sentences.size);
      assert.ok(
        sentenceRatio <= 0.30,
        `${template} ${a.slug} and ${b.slug} share ${(sentenceRatio * 100).toFixed(0)}% of their sentences`,
      );
      const similarity = jaccard(a.tokens, b.tokens);
      assert.ok(
        similarity <= 0.40,
        `${template} ${a.slug} and ${b.slug} are ${(similarity * 100).toFixed(0)}% similar`,
      );
    }
  }
}

const indexable = catalog().styles.filter((style) => style.indexable);
const protectedPaths = new Set(
  readFileSync(new URL('../../indexed-urls.txt', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((url) => new URL(url).pathname),
);

const customText = (entry) => [
  entry.lede,
  entry.quick,
  entry.intro,
  entry.where,
  ...entry.faqs.flatMap((faq) => [faq.q, faq.a]),
].join(' ');

const generatedText = (style) => {
  const content = styleContent(style);
  return [
    content.how,
    content.fact,
    content.distinct,
    content.supportAdvice,
    ...content.uses,
    ...content.appNotes.map((note) => note.join(' ')),
  ].join(' ');
};

describe('programmatic template quality gates', () => {
  test('completed style pages meet the sentence and main-text limits', () => {
    const pages = Object.entries(fontPageContent).map(([slug, entry]) => pageShape(slug, customText(entry)));
    assertTemplateGates('style page', pages, { minWords: 250 });
  });

  test('category hubs meet the sentence and main-text limits', () => {
    const pages = Object.entries(CATEGORY_CONTENT).map(([slug, entry]) => pageShape(
      slug,
      [
        ...entry.paragraphs,
        ...entry.useCases,
        ...entry.faq.flatMap((faq) => [faq.q, faq.a]),
      ].join(' '),
    ));
    assertTemplateGates('category hub', pages);
  });

  test('platform pages meet the sentence and main-text limits', () => {
    const pages = LANDING_PAGES.map((page) => pageShape(
      page.key,
      [
        ...page.intro,
        ...page.sections.map((section) => section.body),
        ...page.faq.flatMap((faq) => [faq.q, faq.a]),
      ].join(' '),
    ));
    assertTemplateGates('platform page', pages, { minWords: 250 });
  });

  test('every style page example is a direct converter run', () => {
    const baseStyle = { slug: 'bold', name: 'Bold', pipeline: [{ type: 'map', name: 'bold' }] };
    const direct = (style, input) => {
      const kind = styleKind(style).kind;
      const base = kind === 'combine' ? applyStyle(input, baseStyle, { maxLength: 300 }) : input;
      return applyStyle(base, style, { maxLength: 300 });
    };
    for (const style of indexable) {
      const custom = fontPageContent[style.slug];
      const examples = custom
        ? renderCustomFontExamples(style, custom.examples)
        : styleContent(style).examples;
      assert.equal(examples.length, 3, `${style.slug} does not have three examples`);
      for (const example of examples) {
        assert.equal(
          example.output,
          direct(style, example.plain),
          `${style.slug} example "${example.plain}" does not match the converter`,
        );
      }
    }
  });

  test('the thin-page inventory is still exactly the legacy and pending set', () => {
    // Phase 5 found 70 style pages below the 250-word floor: the 30 protected
    // old-template pages from list A, and the list-B pages whose content batches
    // are not written yet. This keeps the number from growing silently.
    const thin = indexable.filter((style) => {
      const custom = fontPageContent[style.slug];
      return words(custom ? customText(custom) : generatedText(style)).length < 250;
    });
    const protectedCount = thin.filter((style) => protectedPaths.has(`/fonts/${style.slug}`)).length;
    assert.equal(thin.length, 70, `thin style pages changed: ${thin.map((s) => s.slug).join(', ')}`);
    assert.equal(protectedCount, 30, 'the protected old-template count changed');
  });
});
