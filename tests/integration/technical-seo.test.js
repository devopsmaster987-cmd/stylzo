import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { get, startServer } from '../helpers/server.js';
import { keywordBoard } from '../../lib/keyword-board.js';

const meta = (html, name) => (html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`)) || [])[1] || '';
const prop = (html, p) => (html.match(new RegExp(`<meta property="${p}" content="([^"]*)"`)) || [])[1] || '';
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
const link = (html, rel) => (html.match(new RegExp(`<link rel="${rel}" href="([^"]*)"`)) || [])[1] || '';
const jsonLd = (html, type) => {
  const block = html.match(new RegExp(`<script type="application/ld\\+json"[^>]*>(\\{[^<]*"@type":"${type}".*?\\})</script>`));
  return block ? JSON.parse(block[1]) : null;
};

describe('technical seo', () => {
  let server;
  before(async () => { server = await startServer(3261); });
  after(() => server?.stop());

  describe('social metadata', () => {
    test('every page carries a complete og and twitter card', async () => {
      for (const path of ['/', '/fonts', '/fonts/bold', '/styles/fancy-text-generator', '/tools', '/about']) {
        const html = await (await get(server.base, path)).text();
        for (const [label, value] of [
          ['og:title', prop(html, 'og:title')],
          ['og:description', prop(html, 'og:description')],
          ['og:url', prop(html, 'og:url')],
          ['og:image', prop(html, 'og:image')],
          ['og:site_name', prop(html, 'og:site_name')],
          ['twitter:card', meta(html, 'twitter:card')],
          ['twitter:title', meta(html, 'twitter:title')],
          ['twitter:image', meta(html, 'twitter:image')],
        ]) {
          assert.ok(value, `${path} is missing ${label}`);
        }
        assert.equal(meta(html, 'twitter:card'), 'summary_large_image', `${path} uses a weak twitter card`);
        assert.match(prop(html, 'og:image'), /^https?:\/\/.+\/og-default\.png$/);
      }
    });

    test('og:image dimensions are declared so the card is not re-crawled', async () => {
      const html = await (await get(server.base, '/')).text();
      assert.equal(prop(html, 'og:image:width'), '1200');
      assert.equal(prop(html, 'og:image:height'), '630');
      assert.ok(prop(html, 'og:image:alt'), 'og:image needs alt text');
    });

    test('the og image, apple touch icon and manifest icons are really served', async () => {
      const html = await (await get(server.base, '/')).text();
      for (const asset of [
        prop(html, 'og:image'),
        link(html, 'apple-touch-icon'),
        '/icon-192.png',
        '/icon-512.png',
      ]) {
        // og:image is absolute, the icon hrefs are root-relative.
        const pathname = new URL(asset, server.base).pathname;
        const res = await get(server.base, pathname);
        assert.equal(res.status, 200, `${pathname} is referenced but not served`);
        assert.match(res.headers.get('content-type'), /image/, `${pathname} is not an image`);
      }
    });
  });

  describe('structured data', () => {
    test('every page names the Organization that publishes it', async () => {
      for (const path of ['/', '/fonts', '/fonts/bold', '/styles/fancy-text-generator']) {
        const org = jsonLd(await (await get(server.base, path)).text(), 'Organization');
        assert.ok(org, `${path} is missing the Organization node`);
        assert.equal(org.name, 'Stylzo');
        assert.match(org.url, /^https?:\/\//);
        assert.ok(org.logo?.url, 'Organization needs a logo image object');
        assert.ok(org.logo.width && org.logo.height, 'Organization logo needs dimensions');
      }
    });

    test('SoftwareApplication is disambiguated by a url, not just a name', async () => {
      const app = jsonLd(await (await get(server.base, '/styles/instagram')).text(), 'SoftwareApplication');
      assert.ok(app, 'landing pages should describe the generator');
      assert.match(app.url, /^https?:\/\//);
      assert.ok(app.image, 'SoftwareApplication needs an image');
      assert.ok(app.publisher?.['@id'], 'SoftwareApplication should reference its publisher');
    });
  });

  describe('duplicate and query handling', () => {
    test('?text= on a font page is noindex, not an indexable duplicate', async () => {
      // Regression: generateMetadata() ignored searchParams here, so every
      // ?text= variant across all 100 font pages shipped index,follow while
      // its canonical pointed at the bare slug.
      const html = await (await get(server.base, '/fonts/bold?text=Ali')).text();
      assert.equal(meta(html, 'robots'), 'noindex,follow');
      assert.equal(new URL(canonical(html)).pathname, '/fonts/bold');
    });

    test('an oversized ?text= renders a page instead of throwing a 500', async () => {
      const huge = 'x'.repeat(9000);
      for (const path of ['/', '/fonts/bold', '/styles/instagram']) {
        const res = await get(server.base, `${path}?text=${huge}`);
        assert.equal(res.status, 200, `${path}?text=<9000 chars> returned ${res.status}`);
      }
    });

    test('the legacy /fancy-text-generator permanently redirects to /', async () => {
      const res = await get(server.base, '/fancy-text-generator', { redirect: 'manual' });
      assert.equal(res.status, 308);
      assert.match(res.headers.get('location'), /\/(?:\?|$)/);
    });

    test('the redirect carries the query string through', async () => {
      const res = await get(server.base, '/fancy-text-generator?text=Hi', { redirect: 'manual' });
      assert.equal(res.status, 308);
      assert.match(res.headers.get('location'), /\?text=Hi/);
    });

    test('uppercase dynamic segments redirect to the lowercase route', async () => {
      for (const [from, to] of [['/fonts/Bold', '/fonts/bold'], ['/styles/Instagram', '/styles/instagram']]) {
        const res = await get(server.base, from, { redirect: 'manual' });
        assert.equal(res.status, 308, `${from} did not redirect`);
        assert.equal(new URL(res.headers.get('location'), server.base).pathname, to);
      }
    });

    test('the case redirect does not loop or disturb valid lowercase URLs', async () => {
      assert.equal((await get(server.base, '/fonts/bold')).status, 200);
      assert.equal((await get(server.base, '/styles/instagram')).status, 200);
    });
  });

  describe('internal linking', () => {
    test('every board page links to its neighbours instead of dead-ending', async () => {
      // Regression: all 32 board pages previously linked only to hub pages, so
      // none of them passed authority to another.
      for (const entry of keywordBoard()) {
        const doc = await (await get(server.base, `/styles/${entry.slug}`)).text();
        assert.match(doc, /rel="prev" href="\/styles\//, `${entry.slug} has no prev link`);
        assert.match(doc, /rel="next" href="\/styles\//, `${entry.slug} has no next link`);
      }
    });

    test('the neighbour links resolve to real pages', async () => {
      for (const entry of keywordBoard()) {
        const doc = await (await get(server.base, `/styles/${entry.slug}`)).text();
        const hrefs = [...doc.matchAll(/rel="(?:prev|next)" href="([^"]+)"/g)].map((m) => m[1]);
        assert.equal(hrefs.length, 2);
        for (const href of hrefs) {
          assert.equal((await get(server.base, href)).status, 200, `${entry.slug} links to ${href}`);
        }
      }
    });

    test('a native-script heading declares its language', async () => {
      const doc = await (await get(server.base, '/styles/hindi-fancy-text-generator')).text();
      assert.match(doc, /<h1><span lang="hi">/, 'the Hindi heading needs a lang attribute');
      const urdu = await (await get(server.base, '/styles/urdu-fancy-text-generator')).text();
      assert.match(urdu, /<h1><span lang="ur">/, 'the Urdu heading needs a lang attribute');
    });

    test('an English heading is not wrapped in a lang span', async () => {
      const doc = await (await get(server.base, '/styles/fancy-text-generator')).text();
      assert.match(doc, /<h1>Fancy Text Generator<\/h1>/);
    });
  });

  describe('sitemap', () => {
    test('lastmod is stable rather than stamped at request time', async () => {
      const first = await (await get(server.base, '/sitemap.xml')).text();
      const second = await (await get(server.base, '/sitemap.xml')).text();
      const dates = (s) => new Set([...s.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((m) => m[1]));
      assert.deepEqual([...dates(first)], [...dates(second)], 'lastmod changes between requests');
    });

    test('every entry declares a priority and a change frequency', async () => {
      const sm = await (await get(server.base, '/sitemap.xml')).text();
      const urls = sm.match(/<url>[\s\S]*?<\/url>/g) || [];
      assert.ok(urls.length > 100);
      for (const url of urls) {
        assert.match(url, /<changefreq>[a-z]+<\/changefreq>/);
        assert.match(url, /<priority>[01](\.\d+)?<\/priority>/);
      }
    });

    test('no sitemap URL redirects or 404s', async () => {
      const sm = await (await get(server.base, '/sitemap.xml')).text();
      for (const loc of sm.match(/<loc>([^<]+)<\/loc>/g).map((l) => l.slice(5, -6))) {
        const res = await get(server.base, new URL(loc).pathname, { redirect: 'manual' });
        assert.equal(res.status, 200, `${loc} returns ${res.status}`);
      }
    });
  });

  describe('delivery', () => {
    test('static assets are cached so they are not re-fetched on every navigation', async () => {
      const css = await get(server.base, '/css/main.css');
      assert.match(css.headers.get('cache-control') || '', /max-age=\d{6,}/, 'the stylesheet must be cacheable');
      const sw = await get(server.base, '/sw.js');
      assert.match(sw.headers.get('cache-control') || '', /no-cache|must-revalidate|max-age=0/, 'the service worker must not be cached');
    });

    test('production CSP permits the inline style attributes the pages actually emit', async () => {
      // The keyword board sizes its progress bar with style="width:..%". Under a
      // strict style-src that attribute is dropped in production and the bar
      // renders at zero width.
      const res = await get(server.base, '/styles');
      assert.match(res.headers.get('content-security-policy') || '', /style-src-attr 'unsafe-inline'/);
      const doc = await res.text();
      assert.match(doc, /data-kw-progress-fill="true" style="width:/, 'expected an inline width on the progress bar');
    });

    test('the prefetched response still carries a usable CSP', async () => {
      // Prefetch requests used to bypass proxy.js entirely, so the flight payload
      // was served with no nonce and its script tags were refused.
      const res = await get(server.base, '/', { headers: { 'next-router-prefetch': '1', purpose: 'prefetch' } });
      assert.match(res.headers.get('content-security-policy') || '', /'nonce-/);
    });
  });
});