import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog, relatedStyles, getStyle } from '../../services/catalog.js';

const indexable = catalog().styles.filter((s) => s.indexable);

describe('related styles links', () => {
  test('every indexable style gets at most six related rows and never itself', () => {
    const problems = [];
    for (const style of indexable) {
      const list = relatedStyles(style);
      if (list.length > 6) problems.push(`${style.slug} has ${list.length} related rows`);
      if (list.some((s) => s.slug === style.slug)) {
        problems.push(`${style.slug} links to itself in its related block`);
      }
    }
    assert.deepEqual(problems, [], `\n${problems.join('\n')}`);
  });

  test('parent chains stay intact: a child lists its parent when one exists and is indexable', () => {
    for (const style of indexable) {
      if (!style.parent) continue;
      const parent = getStyle(style.parent);
      if (!parent || !parent.indexable) continue;
      const list = relatedStyles(style).map((s) => s.slug);
      assert.ok(
        list.includes(style.parent),
        `${style.slug} (child of ${style.parent}) omits its parent row`,
      );
    }
  });

  test('styles in the same category no longer share identical related lists', () => {
    // Regression: every page in a category rendered the same related block in
    // catalog order, which made the whole category print one boilerplate
    // cross-link set repeated on dozens of pages.
    const same = [];
    const byCategory = catalog().byCategory;
    for (const [key, styles] of byCategory) {
      const pageStyles = styles.filter((s) => s.indexable);
      if (pageStyles.length < 2) continue;
      const lists = pageStyles.map((s) => relatedStyles(s).map((r) => r.slug).join(','));
      if (new Set(lists).size === 1) same.push(key);
    }
    assert.deepEqual(same, [], `categories where every page shares one related list: ${same.join(', ')}`);
  });

  test('the ordering is deterministic, not random per call', () => {
    for (const style of indexable.slice(0, 50)) {
      const a = relatedStyles(style).map((s) => s.slug);
      const b = relatedStyles(style).map((s) => s.slug);
      assert.deepEqual(a, b, `${style.slug} related order is not stable`);
    }
  });

  test('shared tags outrank unrelated picks within a category', () => {
    // A candidate sharing a tag with the style must rank ahead of same-category
    // candidates that share nothing but the category (the parent row is always
    // allowed ahead of everything).
    const problems = [];
    for (const style of indexable) {
      const tags = new Set(style.tags || []);
      const list = relatedStyles(style);
      if (list.length < 2) continue;
      let seenUntagged = false;
      for (const candidate of list) {
        const shares = (candidate.tags || []).some((t) => tags.has(t));
        if (shares) {
          if (seenUntagged) {
            problems.push(`${style.slug}: ${candidate.slug} is tagged but ranks below untagged rows`);
          }
        } else if (candidate.slug !== style.parent) {
          seenUntagged = true;
        }
      }
    }
    assert.deepEqual(problems, [], `\n${problems.join('\n')}`);
  });
});
