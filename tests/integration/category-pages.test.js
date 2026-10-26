import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { get, startServer } from '../helpers/server.js';
import {
  CATEGORY_PAGE_KEYS,
  CATEGORY_REDIRECTS,
  INDEXABLE_CATEGORY_KEYS,
  NOINDEX_CATEGORY_KEYS,
  REDIRECTED_CATEGORY_KEYS,
} from '../../lib/category-routing.js';

const title = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
const desc = (html) => (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

describe('category hubs', () => {
  let server;
  before(async () => { server = await startServer(3234); });
  after(() => server?.stop());

  test('the twelve substantial hubs are indexable and self-canonical', async () => {
    assert.equal(INDEXABLE_CATEGORY_KEYS.length, 12);
    for (const key of INDEXABLE_CATEGORY_KEYS) {
      const path = `/fonts/category/${key}`;
      const res = await get(server.base, path);
      const html = await res.text();
      assert.equal(res.status, 200, `${path} returned ${res.status}`);
      assert.match(html, /<meta name="robots" content="index,follow"/, `${path} is not indexable`);
      assert.equal(new URL(canonical(html)).pathname, path, `${path} canonical is wrong`);
      assert.equal((markup(html).match(/<h1[ >]/g) || []).length, 1, `${path} must have one h1`);
      assert.ok(markup(html).includes('Common questions'), `${path} has no FAQ`);
      assert.ok(!html.includes('"@type":"FAQPage"'), `${path} still emits FAQPage`);
    }
  });

  test('the four thin hubs stay live but noindex, with their copy and canonical', async () => {
    assert.equal(NOINDEX_CATEGORY_KEYS.length, 4);
    for (const key of NOINDEX_CATEGORY_KEYS) {
      const path = `/fonts/category/${key}`;
      const res = await get(server.base, path);
      const html = await res.text();
      assert.equal(res.status, 200, `${path} returned ${res.status}`);
      assert.match(html, /<meta name="robots" content="noindex,follow"/, `${path} is not noindex`);
      assert.equal(new URL(canonical(html)).pathname, path, `${path} canonical is wrong`);
      assert.ok(markup(html).includes('Common questions'), `${path} lost its copy`);
    }
  });

  test('Outline and Wide permanently redirect to their only style page', async () => {
    assert.equal(REDIRECTED_CATEGORY_KEYS.length, 2);
    for (const key of REDIRECTED_CATEGORY_KEYS) {
      const path = `/fonts/category/${key}`;
      const res = await get(server.base, path, { redirect: 'manual' });
      assert.equal(res.status, 301, `${path} returned ${res.status}, not 301`);
      const location = new URL(res.headers.get('location'), server.base);
      assert.equal(location.pathname, CATEGORY_REDIRECTS[key], `${path} redirect target is wrong`);

      const target = await get(server.base, location.pathname);
      assert.equal(target.status, 200, `${location.pathname} is not a live page`);
      assert.match(await target.text(), /<meta name="robots" content="index,follow"/);
    }
  });

  test('titles, descriptions and h1s are unique across live hubs', async () => {
    const seen = { title: new Map(), desc: new Map(), h1: new Map() };
    for (const key of CATEGORY_PAGE_KEYS) {
      const html = await (await get(server.base, `/fonts/category/${key}`)).text();
      const h1 = (markup(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
      for (const [field, value] of [['title', title(html)], ['desc', desc(html)], ['h1', h1]]) {
        assert.ok(value.trim(), `${key} has an empty ${field}`);
        assert.ok(!seen[field].has(value), `${key} reuses the ${field} from ${seen[field].get(value)}`);
        seen[field].set(value, key);
      }
    }
  });

  test('live hubs link to real indexable styles and back to the font index', async () => {
    for (const key of CATEGORY_PAGE_KEYS) {
      const html = await (await get(server.base, `/fonts/category/${key}`)).text();
      assert.ok(html.includes('href="/fonts"'), `${key} does not link back to /fonts`);
      assert.match(html, /href="\/fonts\/[a-z0-9-]+"/, `${key} lists no style page`);
    }
  });

  test('?text= on a hub is noindex but still renders the typed sample', async () => {
    const html = await (await get(server.base, '/fonts/category/italic?text=Hi')).text();
    assert.match(html, /<meta name="robots" content="noindex,follow"/);
    assert.ok(html.includes('data-sample="Hi"'));
    assert.ok(!html.includes('"@type":"FAQPage"'));
  });

  test('unknown categories 404 and only indexable hubs are in the sitemap', async () => {
    assert.equal((await get(server.base, '/fonts/category/zzz')).status, 404);
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    for (const key of INDEXABLE_CATEGORY_KEYS) {
      assert.ok(sm.includes(`/fonts/category/${key}</loc>`), `sitemap misses ${key}`);
    }
    for (const key of [...NOINDEX_CATEGORY_KEYS, ...REDIRECTED_CATEGORY_KEYS]) {
      assert.ok(!sm.includes(`/fonts/category/${key}</loc>`), `sitemap includes ${key}`);
    }
    assert.ok(!sm.includes('/fonts/category/zzz</loc>'));
  });
});
