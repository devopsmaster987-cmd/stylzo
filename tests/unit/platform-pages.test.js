import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../../services/catalog.js';
import { realRoutes } from '../../lib/keywords.js';
import {
  PLATFORM_PAGES, PLATFORM_PAGE_KEYS, PLATFORM_CHECKED, getPlatformPage,
} from '../../lib/platform-pages.js';

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

const pageText = (page) => [
  ...page.intro,
  ...page.sections.map((section) => section.body),
  page.fieldIntro,
  ...page.fields.map((field) => field.detail),
  page.fallback,
  page.limitsNote,
  ...page.faq.flatMap((faq) => [faq.q, faq.a]),
].join(' ');

const pageShape = (page) => ({
  key: page.key,
  sentences: sentenceSet(pageText(page)),
  tokens: wordSet(pageText(page)),
});

describe('platform font guides', () => {
  test('the approved batch has five unique pages', () => {
    assert.deepEqual(PLATFORM_PAGE_KEYS, ['tiktok', 'facebook', 'x', 'youtube', 'telegram']);
    assert.equal(new Set(PLATFORM_PAGES.map((page) => page.path)).size, PLATFORM_PAGES.length);
    assert.equal(new Set(PLATFORM_PAGES.map((page) => page.title)).size, PLATFORM_PAGES.length);
    assert.equal(new Set(PLATFORM_PAGES.map((page) => page.description)).size, PLATFORM_PAGES.length);
    assert.equal(new Set(PLATFORM_PAGES.map((page) => page.h1)).size, PLATFORM_PAGES.length);
    assert.equal(getPlatformPage('x').path, '/x-font-generator');
    assert.equal(getPlatformPage('not-a-platform'), null);
  });

  test('every page has one H1, three FAQs and a substantial body', () => {
    for (const page of PLATFORM_PAGES) {
      assert.ok(page.h1.length > 5, `${page.key} has a thin H1`);
      assert.equal(page.faq.length, 3, `${page.key} must show exactly 3 FAQs`);
      assert.ok(words(pageText(page)).length >= 250, `${page.key} has only ${words(pageText(page)).length} words`);
      for (const faq of page.faq) {
        assert.match(faq.q, /\?$/, `${page.key} FAQ is not a question: ${faq.q}`);
        assert.ok(faq.a.length > 80, `${page.key} FAQ answer is too thin: ${faq.q}`);
      }
    }
    assert.equal(
      new Set(PLATFORM_PAGES.flatMap((page) => page.faq.map((faq) => faq.a))).size,
      PLATFORM_PAGES.length * 3,
      'a FAQ answer is reused across pages',
    );
  });

  test('quick answers are 40 to 60 words and contain a real question', () => {
    for (const page of PLATFORM_PAGES) {
      assert.match(page.quickAnswer.q, /\?$/, `${page.key} quick answer has no question`);
      const count = words(page.quickAnswer.a).length;
      assert.ok(count >= 40 && count <= 60, `${page.key} quick answer is ${count} words`);
    }
  });

  test('every rendered field rule has a source and a checked date', () => {
    assert.match(PLATFORM_CHECKED, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(!Number.isNaN(new Date(PLATFORM_CHECKED).getTime()), 'checked date is invalid');
    for (const page of PLATFORM_PAGES) {
      assert.ok(page.fields.length >= 3, `${page.key} has too few field rules`);
      const seen = new Set();
      for (const field of page.fields) {
        assert.ok(field.field && field.limit && field.detail, `${page.key} has an incomplete field rule`);
        assert.ok(['try', 'plain'].includes(field.verdict), `${page.key}/${field.field} has an unknown verdict`);
        assert.ok(!seen.has(field.field), `${page.key} repeats field ${field.field}`);
        seen.add(field.field);
        assert.ok(field.source?.label, `${page.key}/${field.field} has no source label`);
        assert.match(field.source.url, /^https:\/\//, `${page.key}/${field.field} has no source URL`);
        assert.ok(PLATFORM_CHECKED, `${page.key}/${field.field} has no checked date`);
      }
    }
  });

  test('every referenced style and internal link resolves', () => {
    const indexable = new Set(catalog().styles.filter((style) => style.indexable).map((style) => style.slug));
    const routes = realRoutes();
    for (const page of PLATFORM_PAGES) {
      assert.ok(page.sections.length >= 2, `${page.key} has too few sections`);
      for (const section of page.sections) {
        assert.ok(section.h2.length > 10, `${page.key} has a thin section heading`);
        assert.ok(section.body.length > 80, `${page.key}/${section.h2} has thin copy`);
        assert.ok(section.styles.length >= 3, `${page.key}/${section.h2} has too few styles`);
        for (const slug of section.styles) {
          assert.ok(indexable.has(slug), `${page.key} references a non-indexable style: ${slug}`);
        }
      }
      for (const link of page.links) {
        assert.ok(routes.has(link.href), `${page.key} links to a missing route: ${link.href}`);
      }
      assert.ok(page.fallback.length > 100, `${page.key} has no plain-text fallback tip`);
      assert.ok(page.fieldIntro.length > 50, `${page.key} has no field-table introduction`);
      assert.ok(page.limitsNote.length > 50, `${page.key} has no limits note`);
    }
  });

  test('the pages are not variants of one template', () => {
    const pages = PLATFORM_PAGES.map(pageShape);
    for (let i = 0; i < pages.length; i += 1) {
      for (let j = i + 1; j < pages.length; j += 1) {
        const a = pages[i];
        const b = pages[j];
        let shared = 0;
        for (const sentence of a.sentences) if (b.sentences.has(sentence)) shared += 1;
        const sentenceRatio = shared / Math.min(a.sentences.size, b.sentences.size);
        assert.ok(
          sentenceRatio <= 0.30,
          `${a.key} and ${b.key} share ${(sentenceRatio * 100).toFixed(0)}% of their sentences`,
        );
        const similarity = jaccard(a.tokens, b.tokens);
        assert.ok(
          similarity <= 0.40,
          `${a.key} and ${b.key} are ${(similarity * 100).toFixed(0)}% similar`,
        );
      }
    }
  });
});
