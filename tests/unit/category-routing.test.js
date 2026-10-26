import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog, getStyle } from '../../services/catalog.js';
import {
  CATEGORY_PAGE_KEYS,
  CATEGORY_REDIRECTS,
  INDEXABLE_CATEGORY_KEYS,
  NOINDEX_CATEGORY_KEYS,
  REDIRECTED_CATEGORY_KEYS,
  categoryHref,
} from '../../lib/category-routing.js';

describe('category hub routing', () => {
  test('every catalog category is either indexable, noindex or redirected', () => {
    const all = Object.keys(catalog().categories).sort();
    const covered = [
      ...INDEXABLE_CATEGORY_KEYS,
      ...NOINDEX_CATEGORY_KEYS,
      ...REDIRECTED_CATEGORY_KEYS,
    ].sort();
    assert.deepEqual(covered, all);
    assert.equal(new Set(covered).size, covered.length, 'a category appears in two buckets');
  });

  test('only the twelve substantial hubs are indexable', () => {
    assert.equal(INDEXABLE_CATEGORY_KEYS.length, 12);
    assert.equal(CATEGORY_PAGE_KEYS.length, 16);
    assert.equal(NOINDEX_CATEGORY_KEYS.length, 4);
    assert.equal(REDIRECTED_CATEGORY_KEYS.length, 2);
  });

  test('redirect targets are real indexable style pages', () => {
    for (const [key, destination] of Object.entries(CATEGORY_REDIRECTS)) {
      assert.match(destination, /^\/fonts\/[a-z0-9-]+$/, `${key} redirects to ${destination}`);
      const style = getStyle(destination.slice('/fonts/'.length));
      assert.ok(style, `${key} redirects to a style that does not exist`);
      assert.ok(style.indexable, `${key} redirects to a non-indexable style`);
    }
  });

  test('the redirected categories are not also listed as live or indexable', () => {
    for (const key of REDIRECTED_CATEGORY_KEYS) {
      assert.ok(!INDEXABLE_CATEGORY_KEYS.includes(key), `${key} is still in the sitemap list`);
      assert.ok(!NOINDEX_CATEGORY_KEYS.includes(key), `${key} is in both redirect and noindex lists`);
      assert.ok(!CATEGORY_PAGE_KEYS.includes(key), `${key} still has a live category page`);
    }
  });

  test('internal category links skip the redirect and point at the final URL', () => {
    for (const key of REDIRECTED_CATEGORY_KEYS) {
      assert.equal(categoryHref(key), CATEGORY_REDIRECTS[key], `${key} still links to its redirecting hub`);
    }
    for (const key of CATEGORY_PAGE_KEYS) {
      assert.equal(categoryHref(key), `/fonts/category/${key}`, `${key} changed its live URL`);
    }
  });
});
