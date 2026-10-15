import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { KEYWORD_MAP, QUESTION_QUERIES, RESERVED, normaliseTerm } from '../../lib/seo-keywords.js';

describe('keyword targeting', () => {
  test('no two pages target the same primary query', () => {
    // Two pages competing for one term split its ranking signals and both
    // underperform. One page, one primary.
    const seen = new Map();
    const clashes = [];
    for (const entry of KEYWORD_MAP) {
      const key = normaliseTerm(entry.primary);
      if (seen.has(key)) clashes.push(`"${entry.primary}" claimed by ${entry.path} and ${seen.get(key)}`);
      else seen.set(key, entry.path);
    }
    assert.deepEqual(clashes, [], `\n${clashes.join('\n')}`);
  });

  test('no page but the home page targets the reserved head term', () => {
    // "fancy text generator" is the term the whole site competes on. It is
    // owned by the home page and cannot be won by a subpage.
    const offenders = KEYWORD_MAP
      .filter((e) => e.path !== '/')
      .filter((e) => [e.primary, ...(e.secondary || [])]
        .some((t) => normaliseTerm(t) === normaliseTerm(RESERVED[0])));
    assert.deepEqual(offenders.map((e) => e.path), []);
  });

  test('every mapped page exists as a route', () => {
    const ROUTES = new Set([
      '/', '/fonts', '/tools', '/studio', '/image-compression', '/qr-code-generator',
      '/symbols', '/emoji', '/kaomoji', '/styles', '/about', '/privacy', '/terms', '/contact',
    ]);
    const missing = KEYWORD_MAP.filter((e) => !ROUTES.has(e.path));
    assert.deepEqual(missing.map((e) => e.path), [], 'keyword map points at a route that does not exist');
  });

  test('every entry states a primary and a rationale worth having', () => {
    for (const entry of KEYWORD_MAP) {
      assert.ok(entry.primary && entry.primary.length >= 3, `${entry.path} has no primary term`);
      // A map entry with no reasoning is how a page ends up targeting a term it
      // cannot win without anyone noticing.
      assert.ok(entry.note || entry.secondary?.length,
        `${entry.path} has neither a note nor secondary terms`);
    }
  });

  test('primary terms are specific enough to be winnable', () => {
    for (const entry of KEYWORD_MAP) {
      const words = entry.primary.split(' ').length;
      assert.ok(words >= 1 && words <= 4,
        `"${entry.primary}" (${entry.path}) is ${words} words, too broad to target`);
    }
  });

  test('every question query names a page that answers it', () => {
    // An unanswerable question is worse than not listing it: it is a promise
    // the site does not keep.
    const KNOWN = new Set([...KEYWORD_MAP.map((e) => e.path), '/fonts/[slug]', '/terms']);
    for (const q of QUESTION_QUERIES) {
      assert.ok(KNOWN.has(q.answeredOn), `${q.query} points at unknown page ${q.answeredOn}`);
      assert.ok(q.section, `${q.query} does not name the section that answers it`);
    }
  });
});