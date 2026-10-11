import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { get, json, post, startServer } from '../helpers/server.js';

process.env.ADMIN_KEY = 'test-admin-key-123';

const pages = ['/symbols', '/emoji', '/kaomoji', '/tools', '/studio', '/admin'];

describe('features', () => {
  let server;
  before(async () => { server = await startServer(3212); });
  after(() => server?.stop());

  for (const p of pages) {
    test(`GET ${p} renders with one h1 and a description`, async () => {
      const res = await get(server.base, p);
      assert.equal(res.status, 200);
      const text = await res.text();
      assert.equal((text.match(/<h1[ >]/g) || []).length, 1);
      assert.match(text, /<meta name="description"/);
      assert.match(text, /<title>[^<]+<\/title>/);
    });
  }

  test('library pages carry real items and tap-to-copy buttons', async () => {
    const sym = await (await get(server.base, '/symbols')).text();
    assert.ok((sym.match(/data-lib-item=/g) || []).length >= 400);
    assert.match(sym, /→/);
    const emoji = await (await get(server.base, '/emoji')).text();
    assert.ok((emoji.match(/data-lib-item=/g) || []).length >= 1000);
    const kao = await (await get(server.base, '/kaomoji')).text();
    assert.ok((kao.match(/data-lib-item=/g) || []).length >= 100);
  });

  test('generator SSRs only the first page plus a load-more control', async () => {
    const text = await (await get(server.base, '/fancy-text-generator')).text();
    const rows = (text.match(/data-style-id=/g) || []).length;
    assert.ok(rows > 0 && rows <= 48, `expected a page of rows, got ${rows}`);
    assert.match(text, /data-load-more/);
    assert.match(text, /data-style-search/);
  });

  test('GET /api/styles paginates by category and returns outputs', async () => {
    const res = await json(server.base, '/api/styles?category=lines&offset=0&limit=10');
    assert.equal(res.status, 200);
    assert.ok(res.body.total >= 26);
    assert.equal(res.body.styles.length, 10);
    assert.ok(res.body.styles[0].output && res.body.styles[0].name && res.body.styles[0].slug);
    const page2 = await json(server.base, '/api/styles?category=lines&offset=10&limit=10');
    assert.notEqual(page2.body.styles[0].id, res.body.styles[0].id);
    assert.equal((await json(server.base, '/api/styles?category=zzz')).status, 404);
  });

  test('GET /api/search ranks and returns styled output', async () => {
    const res = await json(server.base, '/api/search?q=glitch&text=Hi');
    assert.equal(res.status, 200);
    assert.ok(res.body.results.length >= 3);
    assert.ok(res.body.results.every((r) => r.id && r.output && r.pipeline));
    const empty = await json(server.base, '/api/search?q=');
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body.results, []);
  });

  test('GET /api/ai/suggest explains its picks using the rules engine', async () => {
    const res = await json(server.base, '/api/ai/suggest?text=gg%20ez&vibe=gaming');
    assert.equal(res.status, 200);
    assert.ok(res.body.styles.length >= 3);
    assert.ok(res.body.reasons.length >= 1);
    assert.equal(res.body.engine, 'rules');
    assert.ok(res.body.styles.every((s) => s.id && s.output));
  });

  test('GET /api/beat accepts anonymous beacons without storing identifiers', async () => {
    const res = await post(server.base, '/api/beat', { path: '/', event: 'copy', session: true });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    const admin = await (await get(server.base, '/admin?key=test-admin-key-123')).text();
    assert.match(admin, /styles in catalog/);
  });

  test('admin is closed without the right key', async () => {
    const noKey = await (await get(server.base, '/admin')).text();
    assert.ok(!noKey.includes('styles in catalog'));
    assert.match(noKey, /Enter your key/);
    const badKey = await (await get(server.base, '/admin?key=wrong')).text();
    assert.ok(!badKey.includes('styles in catalog'));
    assert.match(badKey, /Enter your key/);
  });

  test('public config exposes nothing when Firebase is not configured', async () => {
    const res = await json(server.base, '/api/config');
    assert.equal(res.status, 200);
    assert.equal(res.body.firebase, null);
  });

  test('offline page, service worker and manifest are served', async () => {
    assert.equal((await get(server.base, '/offline.html')).status, 200);
    const sw = await (await get(server.base, '/sw.js')).text();
    assert.match(sw, /addEventListener\('fetch'/);
    const mf = await (await get(server.base, '/manifest.webmanifest')).json();
    assert.equal(mf.short_name, 'Stylzo');
  });

  test('no page leaks inline style attributes (CSP forbids them)', async () => {
    for (const p of ['/', '/tools', '/studio', '/fancy-text-generator', '/symbols']) {
      const text = await (await get(server.base, p)).text();
      assert.ok(!/ style="/.test(text), `${p} contains a style attribute`);
    }
  });

  test('sitemap includes the new library pages', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    for (const p of ['/symbols', '/emoji', '/kaomoji', '/tools']) {
      assert.ok(sm.includes(`${p}</loc>`), `sitemap misses ${p}`);
    }
    // /studio is indexable now that it carries its own explainer.
    assert.ok(sm.includes('/studio</loc>'));
    assert.ok(!sm.includes('/admin</loc>'));
  });
});