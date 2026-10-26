import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { get, startServer } from '../helpers/server.js';
import { PLATFORM_PAGES } from '../../lib/platform-pages.js';

const title = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
const desc = (html) => (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

describe('platform font guide pages', () => {
  let server;
  before(async () => { server = await startServer(3295); });
  after(() => server?.stop());

  for (const page of PLATFORM_PAGES) {
    test(`GET ${page.path} returns complete, indexable SEO HTML`, async () => {
      const res = await get(server.base, page.path);
      assert.equal(res.status, 200);
      const html = await res.text();

      assert.equal((html.match(/<h1[ >]/g) || []).length, 1, 'expected exactly one h1');
      assert.match(html, new RegExp(`<h1[^>]*>${page.h1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      assert.equal(title(html), `${page.title} | Stylzo`);
      assert.equal(desc(html), page.description);
      assert.ok(canonical(html).endsWith(page.path), `${canonical(html)} is not self-referencing`);
      assert.match(html, /<meta name="robots" content="index,follow"/);
      assert.match(html, /"@type":"BreadcrumbList"/);
      assert.ok(!html.includes('"@type":"FAQPage"'), `${page.key} emits FAQPage`);
      assert.ok(!html.includes('"@type":"WebApplication"'), `${page.key} claims to be the app`);
    });

    test(`GET ${page.path} renders sourced field rules and converter output`, async () => {
      const html = await (await get(server.base, page.path)).text();
      const doc = markup(html);

      assert.match(doc, /Which [^<]+ fields accept styled text/);
      for (const field of page.fields) {
        assert.ok(doc.includes(field.field), `${page.key} omits field ${field.field}`);
        assert.ok(doc.includes(field.source.label), `${page.key} omits source ${field.source.label}`);
        assert.ok(doc.includes(field.source.url), `${page.key} omits source URL ${field.source.url}`);
      }
      assert.ok((html.match(/datetime="2026-10-26"/gi) || []).length >= page.fields.length,
        `${page.key} does not date every field rule`);
      assert.ok((doc.match(/data-style-id=/g) || []).length > 0, `${page.key} rendered no style rows`);
      assert.ok((doc.match(/data-copy/g) || []).length > 0, `${page.key} rendered no copy buttons`);
      assert.match(doc, /data-output="true">[^<]{2,}/, `${page.key} rendered no real output`);
    });

    test(`GET ${page.path} shows exactly three visible FAQs`, async () => {
      const html = await (await get(server.base, page.path)).text();
      const start = html.indexOf(`id="faq-${page.key}"`);
      const faq = html.slice(start, html.indexOf('</section>', start));
      assert.equal((faq.match(/<h3>/g) || []).length, 3, `${page.key} must show 3 FAQs`);
    });
  }

  test('?text= is noindex with a self-referencing canonical', async () => {
    const html = await (await get(server.base, '/tiktok-font-generator?text=Ali')).text();
    assert.match(html, /noindex,follow/);
    assert.match(html, /rel="canonical" href="[^"]*\/tiktok-font-generator"/);
    assert.ok(html.includes('data-sample="Ali"'));
  });

  test('every internal link on the five pages resolves', async () => {
    const hrefs = new Set();
    for (const page of PLATFORM_PAGES) {
      const html = await (await get(server.base, page.path)).text();
      for (const [, href] of html.matchAll(/href="(\/[^"#?]*)"/g)) hrefs.add(href);
    }
    for (const href of hrefs) {
      const res = await get(server.base, href);
      assert.equal(res.status, 200, `${href} returns ${res.status}`);
    }
  });

  test('sitemap and llms.txt list every platform guide', async () => {
    const sitemap = await (await get(server.base, '/sitemap.xml')).text();
    const llms = await (await get(server.base, '/llms.txt')).text();
    for (const page of PLATFORM_PAGES) {
      assert.ok(sitemap.includes(`<loc>https://www.abdulsamad.shop${page.path}</loc>`),
        `sitemap omits ${page.path}`);
      assert.ok(llms.includes(`https://www.abdulsamad.shop${page.path}`),
        `llms.txt omits ${page.path}`);
    }
  });
});
