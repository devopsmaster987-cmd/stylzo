import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalog, getStyle } from '../../services/catalog.js';
import { site } from '../../config/site.js';
import { fontPageContent } from '../../data/font-page-content.js';
import { FONT_DESCRIPTION_OVERRIDES } from '../../lib/font-meta.js';
import { renderCustomFontExamples } from '../../lib/font-page-content.js';
import { styleKind } from '../../lib/style-content.js';
import { applyStyle } from '../../services/unicode/engine.js';

const LIST_A = new Set(
  readFileSync(new URL('../../indexed-urls.txt', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url) => new URL(url).pathname),
);

const B_FONT_SLUGS = catalog()
  .styles
  .filter((style) => style.indexable && !LIST_A.has(`/fonts/${style.slug}`))
  .map((style) => style.slug);

const entries = Object.entries(fontPageContent);

const words = (value) => String(value || '').trim().split(/\s+/).filter(Boolean);
const paragraphsFor = (entry) => [
  entry.lede,
  entry.quick,
  entry.intro,
  entry.where,
  ...entry.faqs.map((faq) => faq.a),
];

const normalizeSentence = (value) => words(value).join(' ').toLowerCase();
const sentencesFor = (entry) => new Set(
  [entry.lede, entry.quick, entry.intro, entry.where, ...entry.faqs.flatMap((faq) => [faq.q, faq.a])]
    .join(' ')
    .toLowerCase()
    .match(/[^.!?]+[.!?]+/g)
    ?.map(normalizeSentence)
    .filter(Boolean) || [],
);

const wordSet = (value) => new Set(
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean),
);

const jaccard = (a, b) => {
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  return shared / (a.size + b.size - shared);
};

describe('list-B font page content', () => {
  test('only list-B font pages are in the editable content file', () => {
    const allowed = new Set(B_FONT_SLUGS);
    for (const [slug] of entries) {
      assert.ok(allowed.has(slug), `${slug} is not a list-B font page and must not be changed`);
    }
  });

  test('no protected page appears in the content file', () => {
    for (const [slug] of entries) {
      assert.ok(!LIST_A.has(`/fonts/${slug}`), `${slug} is protected by list A`);
    }
  });

  test('titles are unique and under 60 characters including the site suffix', () => {
    const seen = new Map();
    for (const [slug, entry] of entries) {
      const full = `${entry.title} | ${site.name}`;
      assert.ok(full.length < 60, `${slug} title is ${full.length} characters: ${full}`);
      assert.ok(!seen.has(full), `${slug} repeats the title used by ${seen.get(full)}`);
      seen.set(full, slug);
    }
  });

  test('meta-only description overrides are editable and fit the budget', () => {
    const allowed = new Set(B_FONT_SLUGS);
    const seen = new Set();
    for (const [slug, description] of Object.entries(FONT_DESCRIPTION_OVERRIDES)) {
      assert.ok(allowed.has(slug), `${slug} is not an editable list-B page`);
      assert.ok(description.length < 160, `${slug} description is ${description.length} characters`);
      assert.ok(!seen.has(description), `${slug} repeats another override description`);
      seen.add(description);
    }
  });

  test('descriptions are unique and under 160 characters', () => {
    const seen = new Map();
    for (const [slug, entry] of entries) {
      assert.ok(entry.description.length < 160, `${slug} description is ${entry.description.length} characters`);
      assert.ok(!seen.has(entry.description), `${slug} repeats the description used by ${seen.get(entry.description)}`);
      seen.set(entry.description, slug);
    }
  });

  test('each page has one unique H1', () => {
    const seen = new Map();
    for (const [slug, entry] of entries) {
      assert.ok(entry.h1 && entry.h1.trim(), `${slug} has no H1`);
      assert.ok(!seen.has(entry.h1), `${slug} repeats the H1 used by ${seen.get(entry.h1)}`);
      seen.set(entry.h1, slug);
    }
  });

  test('every paragraph is unique across pages', () => {
    const seen = new Map();
    for (const [slug, entry] of entries) {
      for (const paragraph of paragraphsFor(entry)) {
        const normalized = words(paragraph).join(' ').toLowerCase();
        assert.ok(normalized, `${slug} has an empty paragraph`);
        assert.ok(!seen.has(normalized), `${slug} repeats a paragraph from ${seen.get(normalized)}`);
        seen.set(normalized, slug);
      }
    }
  });

  test('no two pages share more than 30% of their sentences', () => {
    const sentences = entries.map(([slug, entry]) => [slug, sentencesFor(entry)]);
    for (let i = 0; i < sentences.length; i += 1) {
      for (let j = i + 1; j < sentences.length; j += 1) {
        const [slugA, setA] = sentences[i];
        const [slugB, setB] = sentences[j];
        let shared = 0;
        for (const sentence of setA) if (setB.has(sentence)) shared += 1;
        const ratio = shared / Math.min(setA.size, setB.size);
        assert.ok(
          ratio <= 0.30,
          `${slugA} and ${slugB} share ${(ratio * 100).toFixed(0)}% of their sentences`,
        );
      }
    }
  });

  test('no two pages have more than 40% similar main text', () => {
    const mainText = entries.map(([slug, entry]) => [
      slug,
      wordSet([entry.quick, entry.intro, entry.where, ...entry.faqs.map((faq) => faq.a)].join(' ')),
    ]);
    for (let i = 0; i < mainText.length; i += 1) {
      for (let j = i + 1; j < mainText.length; j += 1) {
        const [slugA, setA] = mainText[i];
        const [slugB, setB] = mainText[j];
        const ratio = jaccard(setA, setB);
        assert.ok(
          ratio <= 0.40,
          `${slugA} and ${slugB} are ${(ratio * 100).toFixed(0)}% similar`,
        );
      }
    }
  });

  test('emoji-frame, kaomoji, symbol and zalgo pages stay under 30% similar within their group', () => {
    const groups = ['emoji-frame-', 'kaomoji-', 'symbol-', 'zalgo-'];
    const mainText = new Map(entries.map(([slug, entry]) => [
      slug,
      wordSet([entry.quick, entry.intro, entry.where, ...entry.faqs.map((faq) => faq.a)].join(' ')),
    ]));
    for (const prefix of groups) {
      const group = entries.map(([slug]) => slug).filter((slug) => slug.startsWith(prefix));
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          const slugA = group[i];
          const slugB = group[j];
          const ratio = jaccard(mainText.get(slugA), mainText.get(slugB));
          assert.ok(
            ratio <= 0.30,
            `${slugA} and ${slugB} are ${(ratio * 100).toFixed(0)}% similar within ${prefix}`,
          );
        }
      }
    }
  });

  test('visitor-facing copy never exposes internal content notes', () => {
    const forbidden = /\bmarked (?:as )?(?:good|limited|safe)\b|\bsupport level\b|\bthis page\b|\bcatalog\b|\blist B\b|\beditable\b|\bgenerated prose\b/i;
    for (const [slug, entry] of entries) {
      const text = [entry.lede, entry.quick, entry.intro, entry.where, ...entry.faqs.flatMap((faq) => [faq.q, faq.a])].join(' ');
      assert.doesNotMatch(text, forbidden, `${slug} contains internal wording`);
    }
  });

  test('every page has a 120-200 word style description', () => {
    for (const [slug, entry] of entries) {
      const count = words(entry.intro).length;
      assert.ok(count >= 120 && count <= 200, `${slug} intro has ${count} words`);
    }
  });

  test('every page has at least 250 words of unique content', () => {
    for (const [slug, entry] of entries) {
      const text = [entry.lede, entry.quick, entry.intro, entry.where, ...entry.faqs.flatMap((faq) => [faq.q, faq.a])].join(' ');
      const count = words(text).length;
      assert.ok(count >= 250, `${slug} has only ${count} words`);
    }
  });

  test('every page has 2-3 FAQs and at least one question unique to that style', () => {
    const questionCounts = new Map();
    for (const [, entry] of entries) {
      for (const faq of entry.faqs) {
        questionCounts.set(faq.q, (questionCounts.get(faq.q) || 0) + 1);
      }
    }
    for (const [slug, entry] of entries) {
      assert.ok(entry.faqs.length >= 2 && entry.faqs.length <= 3, `${slug} has ${entry.faqs.length} FAQs`);
      const unique = entry.faqs.some((faq) => questionCounts.get(faq.q) === 1);
      assert.ok(unique, `${slug} has no question unique to its style`);
    }
  });

  test('no FAQ question or answer is repeated across pages', () => {
    const seenQuestions = new Map();
    const seenAnswers = new Map();
    for (const [slug, entry] of entries) {
      for (const faq of entry.faqs) {
        const question = words(faq.q).join(' ').toLowerCase();
        const answer = words(faq.a).join(' ').toLowerCase();
        assert.ok(!seenQuestions.has(question), `${slug} repeats a question from ${seenQuestions.get(question)}: ${faq.q}`);
        assert.ok(!seenAnswers.has(answer), `${slug} repeats an answer from ${seenAnswers.get(answer)}: ${faq.q}`);
        seenQuestions.set(question, slug);
        seenAnswers.set(answer, slug);
      }
    }
  });

  test('every page links to 4-6 related styles plus the category hub and /fonts', () => {
    for (const [slug, entry] of entries) {
      assert.ok(entry.related.length >= 4 && entry.related.length <= 6, `${slug} has ${entry.related.length} related links`);
      assert.equal(new Set(entry.related).size, entry.related.length, `${slug} repeats a related style`);
      assert.ok(!entry.related.includes(slug), `${slug} links to itself`);
      for (const related of entry.related) {
        assert.ok(getStyle(related), `${slug} links to unknown style ${related}`);
      }
    }
  });

  test('every example is rendered by the converter and changed by the style', () => {
    for (const [slug, entry] of entries) {
      const style = getStyle(slug);
      assert.equal(entry.examples.length, 3, `${slug} does not have three examples`);
      const rendered = renderCustomFontExamples(style, entry.examples);
      assert.equal(rendered.length, 3);
      for (const example of rendered) {
        assert.ok(example.output, `${slug} produced an empty example`);
        assert.notEqual(example.output, example.plain, `${slug} left an example unstyled`);
      }
      assert.equal(new Set(rendered.map((example) => example.output)).size, 3, `${slug} repeats an example output`);
    }
  });

  test('every rendered example exactly matches a direct converter run', () => {
    const baseStyle = { slug: 'bold', name: 'Bold', pipeline: [{ type: 'map', name: 'bold' }] };
    const direct = (style, input) => {
      const kind = styleKind(style).kind;
      const base = kind === 'combine' ? applyStyle(input, baseStyle, { maxLength: 300 }) : input;
      return applyStyle(base, style, { maxLength: 300 });
    };
    for (const [slug, entry] of entries) {
      const style = getStyle(slug);
      const rendered = renderCustomFontExamples(style, entry.examples);
      entry.examples.forEach((input, index) => {
        assert.equal(
          rendered[index].output,
          direct(style, input),
          `${slug} example ${index + 1} does not match the converter`,
        );
      });
    }
  });

  test('combining-mark examples preserve every base character', () => {
    const baseStyle = { slug: 'bold', name: 'Bold', pipeline: [{ type: 'map', name: 'bold' }] };
    const stripMarks = (value) => value.replace(/\p{M}/gu, '');
    const graphemes = (value) => Array.from(
      new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value),
      (part) => part.segment,
    );
    for (const [slug, entry] of entries) {
      const style = getStyle(slug);
      if (styleKind(style).kind !== 'combine') continue;
      const rendered = renderCustomFontExamples(style, entry.examples);
      entry.examples.forEach((input, index) => {
        const base = applyStyle(input, baseStyle, { maxLength: 300 });
        assert.equal(stripMarks(rendered[index].output), base, `${slug} example ${index + 1} lost or duplicated a letter`);
        assert.equal(graphemes(rendered[index].output).length, graphemes(base).length, `${slug} example ${index + 1} changed its character count`);
      });
    }
  });

  // TODO: enable this after batch 7. It must fail if any list-B font page still
  // falls back to the generated prose instead of the editable content file.
  test('every list-B font page has editable content', { skip: 'batches 3-7 still pending' }, () => {
    const missing = B_FONT_SLUGS.filter((slug) => !fontPageContent[slug]);
    assert.deepEqual(missing, [], `missing content for: ${missing.join(', ')}`);
  });
});
