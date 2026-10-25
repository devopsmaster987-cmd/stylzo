import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { get, startServer } from '../helpers/server.js';
import { categoryKeys } from '../../lib/category-content.js';

const title = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
const desc = (html) => (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

describe('category hubs', () => {
  let server;
  before(async () => { server = await startServer(3234); });
  after(() => server?.stop());

  test('every catalog category has an indexable, self-canonical page', async () => {
    const keys = categoryKeys();
    assert.ok(keys.length >= 18);
    for (const key of keys) {
      const path = `/fonts/category/${key}`;
      const res = await get(server.base, path);
      const html = await res.text();
      assert.equal(res.status, 200, `${path} returned ${res.status}`);
      assert.match(html, /<meta name="robots" content="index,follow"/, `${path} is not indexable`);
      assert.equal(new URL(canonical(html)).pathname, path, `${path} canonical is wrong`);
      assert.equal((markup(html).match(/<h1[ >]/g) || []).length, 1, `${path} must have one h1`);
      assert.ok(markup(html).includes('Common questions'), `${path} has no FAQ`);
      assert.match(html, /"@type":"FAQPage"/, `${path} has no FAQ structured data`);
    }
  });

  test('titles, descriptions and h1s are unique across hubs', async () => {
    const seen = { title: new Map(), desc: new Map(), h1: new Map() };
    for (const key of categoryKeys()) {
      const html = await (await get(server.base, `/fonts/category/${key}`)).text();
      const h1 = (markup(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
      for (const [field, value] of [['title', title(html)], ['desc', desc(html)], ['h1', h1]]) {
        assert.ok(value.trim(), `${key} has an empty ${field}`);
        assert.ok(!seen[field].has(value), `${key} reuses the ${field} from ${seen[field].get(value)}`);
        seen[field].set(value, key);
      }
    }
  });

  test('hubs link to real indexable styles and back to the font index', async () => {
    for (const key of categoryKeys()) {
      const html = await (await get(server.base, `/fonts/category/${key}`)).text();
      assert.ok(html.includes('href="/fonts"'), `${key} does not link back to /fonts`);
      assert.match(html, /href="\/fonts\/[a-z0-9-]+"/, `${key} lists no style page`);
    }
  });

  test('?text= on a hub is noindex but still renders the typed sample', async () => {
    const html = await (await get(server.base, '/fonts/category/gothic?text=Hi')).text();
    assert.match(html, /<meta name="robots" content="noindex,follow"/);
    assert.ok(html.includes('data-sample="Hi"'));
    assert.ok(!html.includes('"@type":"FAQPage"'));
  });

  test('unknown categories 404 and are not in the sitemap', async () => {
    assert.equal((await get(server.base, '/fonts/category/zzz')).status, 404);
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    for (const key of categoryKeys()) {
      assert.ok(sm.includes(`/fonts/category/${key}</loc>`), `sitemap misses ${key}`);
    }
    assert.ok(!sm.includes('/fonts/category/zzz</loc>'));
  });
});
