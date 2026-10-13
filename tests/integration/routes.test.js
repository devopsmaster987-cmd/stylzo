import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { get, json, post, startServer } from '../helpers/server.js';

const pages = ['/', '/fancy-text-generator', '/fonts', '/fonts/bold', '/fonts/fraktur', '/about', '/privacy', '/terms', '/contact'];

const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

describe('related searches', () => {
  let server;
  before(async () => { server = await startServer(3221); });
  after(() => server?.stop());

  test('the block is visible text on the pages that show it', async () => {
    for (const path of ['/', '/fonts', '/tools', '/styles', '/symbols']) {
      const doc = markup(await (await get(server.base, path)).text());
      assert.match(doc, /<h2[^>]*>Related searches<\/h2>/, `${path} has no related-searches block`);
      // Visible, not hidden: a block tucked away is keyword stuffing with extra steps.
      assert.doesNotMatch(doc, /class="related-searches"[^>]*hidden/, `${path} hides its keywords`);
      assert.doesNotMatch(doc, /related-searches[^"]*"[^>]*style="display:\s*none/, `${path} hides its keywords`);
    }
  });

  test('no page ships a meta keywords tag', async () => {
    for (const path of ['/', '/fonts', '/tools', '/styles']) {
      const html = await (await get(server.base, path)).text();
      assert.doesNotMatch(html, /<meta[^>]+name="keywords"/i, `${path} has a meta keywords tag`);
    }
  });

  test('every internal link in the block resolves', async () => {
    const html = await (await get(server.base, '/')).text();
    const block = (html.match(/<section class="related-searches"[\s\S]*?<\/section>/) || [])[0];
    assert.ok(block, 'no related-searches block to check');
    const hrefs = [...block.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(hrefs.length >= 5, `only ${hrefs.length} linked terms`);
    for (const href of hrefs) {
      const res = await get(server.base, href);
      assert.ok(res.status < 400, `${href} from the related-searches block returned ${res.status}`);
    }
  });
});

describe('pages', () => {
  let server;
  before(async () => { server = await startServer(3211); });
  after(() => server?.stop());

  for (const p of pages) {
    test(`GET ${p} returns complete HTML with one h1, canonical and description`, async () => {
      const res = await get(server.base, p);
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type'), /html/);
      const text = await res.text();
      assert.equal((text.match(/<h1[ >]/g) || []).length, 1);
      assert.match(text, /<link rel="canonical"/);
      assert.match(text, /<meta name="description"/);
      assert.match(text, /<title>[^<]+<\/title>/);
    });
  }

  test('first render is real content without JS (styled output is in the HTML)', async () => {
    const text = await (await get(server.base, '/fonts/bold')).text();
    assert.ok(text.includes('\u{1D412}\u{1D42D}\u{1D432}\u{1D425}\u{1D433}\u{1D428}'));
  });

  test('?text= produces server-rendered output and is noindex', async () => {
    const text = await (await get(server.base, '/fancy-text-generator?text=Hi')).text();
    assert.ok(text.includes('\u{1D407}\u{1D422}'));
    assert.match(text, /noindex,follow/);
  });

  test('user text is HTML-escaped', async () => {
    const text = await (await get(server.base, '/fancy-text-generator?text=%3Cscript%3Ealert(1)%3C%2Fscript%3E')).text();
    assert.ok(!text.includes('<script>alert(1)</script>'));
  });

  test('composed combination pages are noindex and canonicalise to their parent', async () => {
    const text = await (await get(server.base, '/fonts/bold-underline')).text();
    assert.match(text, /noindex,follow/);
    assert.match(text, /rel="canonical" href="[^"]+\/fonts\/bold"/);
  });

  test('404s: unknown page, bad slug, unknown category', async () => {
    assert.equal((await get(server.base, '/nope')).status, 404);
    assert.equal((await get(server.base, '/fonts/Bad_Slug')).status, 404);
    assert.equal((await get(server.base, '/fancy-text-generator?category=zzz')).status, 404);
  });

  test('security headers: CSP with nonce, nosniff, no x-powered-by', async () => {
    const res = await get(server.base, '/');
    const csp = res.headers.get('content-security-policy');
    assert.match(csp, /script-src 'self' 'nonce-/);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-powered-by'), null);
    const nonce = csp.match(/'nonce-([^']+)'/)[1];
    assert.ok((await res.text()).includes(`nonce="${nonce}"`));
  });

  test('sitemap lists only indexable pages; robots points to sitemap', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    assert.ok(sm.includes('/fonts/bold</loc>'));
    assert.ok(!sm.includes('/fonts/bold-underline</loc>'));
    const rb = await (await get(server.base, '/robots.txt')).text();
    assert.match(rb, /Sitemap:/);
  });

  test('GET /api/styles returns compact pipelines for 5000+ styles', async () => {
    const res = await json(server.base, '/api/styles');
    assert.equal(res.status, 200);
    assert.ok(res.body.styles.length >= 5000);
    assert.ok(Array.isArray(res.body.styles[0].pipeline));
  });

  test('POST /api/generate: valid, unknown id, invalid input, oversized text', async () => {
    const ok = await post(server.base, '/api/generate', { text: 'Hi', styles: ['bold', 'nope'] });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.results[0].output, '\u{1D407}\u{1D422}');
    assert.equal(ok.body.results[1].error, 'unknown_style');
    assert.equal((await post(server.base, '/api/generate', { text: 'Hi', styles: [] })).status, 400);
    assert.equal((await post(server.base, '/api/generate', { text: 'Hi', styles: ['../x'] })).status, 400);
    assert.equal((await post(server.base, '/api/generate', { text: 5, styles: ['bold'] })).status, 400);
    assert.equal((await post(server.base, '/api/generate', { text: 'x'.repeat(5001), styles: ['bold'] })).status, 400);
    const malformed = await post(server.base, '/api/generate', '{bad');
    assert.equal(malformed.status, 400);
    assert.equal(malformed.body.error, 'bad_json');
  });

  test('unknown API route returns JSON 404', async () => {
    const res = await json(server.base, '/api/nothing');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'not_found');
  });
});