import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { get, startServer } from '../helpers/server.js';

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
      for (const path of ['/', '/fonts', '/fonts/bold', '/styles', '/tools', '/about']) {
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
      for (const path of ['/', '/fonts', '/fonts/bold', '/styles']) {
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
    test('no page links to a retired /styles/* slug', async () => {
      // The 32 keyword-board pages are permanently redirected. A live internal
      // link to one is worse than no link: it spends crawl budget and passes
      // authority into a redirect hop on every visit.
      const hrefRe = /href="(\/styles\/[^"]+)"/g;
      const checked = ['/', '/fonts', '/fonts/bold', '/styles', '/tools', '/studio', '/symbols',
        '/styles/instagram', '/styles/whatsapp', '/styles/discord', '/styles/gaming',
        '/styles/languages', '/styles/colours'];
      const dead = [];
      for (const path of checked) {
        const doc = await (await get(server.base, path)).text();
        for (const [, href] of doc.matchAll(hrefRe)) {
          const res = await get(server.base, href, { redirect: 'manual' });
          if (res.status !== 200) dead.push(`${path} -> ${href} (${res.status})`);
        }
      }
      assert.deepEqual(dead, [], 'internal links that do not land on a 200');
    });

    test('the header and footer link only to the six real style pages', async () => {
      const doc = await (await get(server.base, '/')).text();
      const stylesHrefs = [...doc.matchAll(/href="(\/styles(?:\/[^"]*)?)"/g)].map((m) => m[1]);
      for (const href of stylesHrefs) {
        const res = await get(server.base, href, { redirect: 'manual' });
        assert.equal(res.status, 200, `the site chrome links to ${href}, which returns ${res.status}`);
      }
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
    test('static assets revalidate, because their filenames are not content-addressed', async () => {
      // These were served `max-age=31536000, immutable`. Nothing under /public
      // is hashed — main.css is not main.<hash>.css — so a stylesheet change
      // could never reach a returning visitor, including during local
      // development. Revalidation costs a 304 and no body; correctness wins.
      for (const asset of ['/css/main.css', '/js/image-compressor.js', '/js/zip.js']) {
        const res = await get(server.base, asset);
        const cache = res.headers.get('cache-control') || '';
        assert.doesNotMatch(cache, /immutable/, `${asset} is still marked immutable`);
        assert.match(cache, /max-age=0|must-revalidate|no-cache/, `${asset} does not revalidate: ${cache}`);
      }
      const sw = await get(server.base, '/sw.js');
      assert.match(sw.headers.get('cache-control') || '', /no-cache|must-revalidate|max-age=0/);
    });

    test('the service worker is not registered on localhost', async () => {
      // A worker on the machine you are editing from serves the old files you
      // just changed, behind a hard reload, and fights HMR. Production is the
      // only place it should install.
      const src = readFileSync(new URL('../../public/js/ui.js', import.meta.url), 'utf8');
      const condition = src.match(/if \('serviceWorker' in navigator[^)]*\)/g) || [];

      const registering = condition.filter((c) => /serviceWorker\.register/.test(
        src.slice(src.indexOf(c) + c.length, src.indexOf(c) + c.length + 400),
      ));
      assert.equal(registering.length, 1, 'expected exactly one registering branch');

      // The condition itself, not the file: prose about localhost is fine, a
      // hostname check in the guard is not.
      assert.match(registering[0], /location\.protocol === 'https:'/, 'registration is not gated on https');
      assert.doesNotMatch(registering[0], /localhost|127\.0\.0\.1|hostname/, 'the registering branch still checks the hostname');

      // And there has to be something that retires a worker installed before the
      // rule changed, or the stale one keeps controlling the origin.
      assert.match(src, /getRegistrations\(\)/, 'stale workers are never unregistered');
      assert.match(src, /unregister\(\)/, 'stale workers are never unregistered');
      assert.match(src, /startsWith\('stylix-'\)/, 'cache cleanup is not scoped to this site');
    });

    test('production CSP permits the inline style attributes the pages actually emit', async () => {
      // style-src does not govern style="" attributes. The pages that need one
      // would silently render unstyled without this directive in production,
      // while looking correct in dev.
      const res = await get(server.base, '/styles');
      assert.match(res.headers.get('content-security-policy') || '', /style-src-attr 'unsafe-inline'/);
    });

    test('the prefetched response still carries a usable CSP', async () => {
      // Prefetch requests used to bypass proxy.js entirely, so the flight payload
      // was served with no nonce and its script tags were refused.
      const res = await get(server.base, '/', { headers: { 'next-router-prefetch': '1', purpose: 'prefetch' } });
      assert.match(res.headers.get('content-security-policy') || '', /'nonce-/);
    });
  });
});