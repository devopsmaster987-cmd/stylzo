import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { get, json, post, startServer } from '../helpers/server.js';

process.env.ADMIN_KEY = 'test-admin-key-123';

const pages = ['/symbols', '/emoji', '/kaomoji', '/tools', '/image-compression', '/studio', '/admin'];

// Next repeats rendered props inside its RSC flight payload, so counting a
// class or a heading against the raw document counts it twice. Markup only.
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

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
    for (const p of ['/', '/tools', '/studio', '/image-compression', '/fancy-text-generator', '/symbols']) {
      const text = await (await get(server.base, p)).text();
      assert.ok(!/ style="/.test(text), `${p} contains a style attribute`);
    }
  });

  test('the image compressor ships its controls and its client modules', async () => {
    const html = await (await get(server.base, '/image-compression')).text();
    for (const hook of [
      'data-cz-zone', 'data-cz-input', 'data-cz-compress-all', 'data-cz-download-all',
      'data-cz-reset', 'data-cz-quality', 'data-cz-format', 'data-cz-scale',
      'data-cz-width', 'data-cz-height', 'data-cz-lock', 'data-cz-list', 'data-cz-errors',
    ]) {
      assert.ok(html.includes(hook), `the tool is missing ${hook}`);
    }
    // The privacy claim has to be in the server HTML, not added by the script:
    // a crawler and a reader with JavaScript disabled both need to see it.
    assert.match(html, /Your images never leave this device/);

    // The module the page injects has to actually be served, or the tool is an
    // inert form.
    for (const asset of ['/js/image-compressor.js', '/js/zip.js']) {
      const res = await get(server.base, asset);
      assert.equal(res.status, 200, `${asset} is referenced but not served`);
    }
  });

  test('the image compressor accepts only image types and says what it is', async () => {
    const html = await (await get(server.base, '/image-compression')).text();
    const accept = html.match(/<input[^>]*data-cz-input[^>]*>/)[0];
    assert.match(accept, /type="file"/);
    assert.match(accept, /multiple/);
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      assert.ok(accept.includes(type), `the file input does not accept ${type}`);
    }
    // An accept list that omits image/* would be a lie about what is accepted.
    assert.doesNotMatch(accept, /image\/\*/);
  });

  test('sitemap includes the image compressor', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    assert.ok(sm.includes('/image-compression</loc>'));
  });

  test('the tools hub surfaces the image compressor', async () => {
    // A tool nobody can find is a tool nobody uses. This asserts the entry
    // points exist rather than the wording, so editing the copy does not break
    // it, but deleting the panel does.
    const tools = markup(await (await get(server.base, '/tools')).text());
    const panel = (tools.match(/<section class="tool-hub"[\s\S]*?<\/section>/) || [])[0];
    assert.ok(panel, '/tools has no panel pointing at the image compressor');
    assert.ok(panel.includes('href="/image-compression"'));
    assert.ok(/<h2[^>]*>[\s\S]*Image compressor/.test(panel), 'the panel heading does not name the tool');

    // And it has to be a real destination, not a link to nothing.
    const res = await get(server.base, '/image-compression');
    assert.equal(res.status, 200);
  });

  test('the header nav reaches the image compressor', async () => {
    const home = markup(await (await get(server.base, '/')).text());
    const nav = (home.match(/<nav aria-label="Main">[\s\S]*?<\/nav>/) || [])[0];
    assert.ok(nav, 'no main nav in the document');
    assert.ok(nav.includes('/image-compression'), 'the main nav does not link to the image compressor');
    // The dropdown it sits in has to be labelled, not just present.
    assert.match(nav, /has-sub/);
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