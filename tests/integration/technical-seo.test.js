import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { get, startServer } from '../helpers/server.js';
import { CATEGORY_REDIRECTS, REDIRECTED_CATEGORY_KEYS } from '../../lib/category-routing.js';
import { site, ids } from '../../config/site.js';
import { TOPIC_CLUSTERS } from '../../lib/topic-clusters.js';

const meta = (html, name) => (html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`)) || [])[1] || '';
const prop = (html, p) => (html.match(new RegExp(`<meta property="${p}" content="([^"]*)"`)) || [])[1] || '';
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
const link = (html, rel) => (html.match(new RegExp(`<link rel="${rel}" href="([^"]*)"`)) || [])[1] || '';
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');
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
        await res.arrayBuffer();
      }
    });

    test('the og image and icons have the dimensions they declare', () => {
      const dimensions = (file) => {
        const png = readFileSync(new URL(`../../public/${file}`, import.meta.url));
        return [png.readUInt32BE(16), png.readUInt32BE(20)];
      };
      assert.deepEqual(dimensions('og-default.png'), [1200, 630]);
      assert.deepEqual(dimensions('icon-192.png'), [192, 192]);
      assert.deepEqual(dimensions('icon-512.png'), [512, 512]);
      assert.deepEqual(dimensions('apple-touch-icon.png'), [180, 180]);
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

    test('every page joins one WebSite, one WebPage and one Organization by id', async () => {
      for (const path of ['/', '/fonts', '/fonts/bold', '/styles', '/styles/instagram', '/about', '/tools']) {
        const html = await (await get(server.base, path)).text();
        const org = jsonLd(html, 'Organization');
        const website = jsonLd(html, 'WebSite');
        const page = jsonLd(html, 'WebPage');
        assert.equal(org?.['@id'], ids.organization, `${path} has no canonical Organization`);
        assert.equal(website?.['@id'], ids.website, `${path} has no canonical WebSite`);
        assert.equal(page?.['@id'], ids.page(new URL(canonical(html)).pathname), `${path} has no canonical WebPage`);
        assert.equal(new URL(page.url).href, new URL(canonical(html)).href);
        assert.equal(page.isPartOf?.['@id'], ids.website);
        assert.equal(page.publisher?.['@id'], ids.organization);
        assert.equal((html.match(/"@type":"WebPage"/g) || []).length, 1, `${path} emits more than one WebPage`);
      }
    });

    test('the Organization names the real owner and links the Stylzo domain', async () => {
      const org = jsonLd(await (await get(server.base, '/')).text(), 'Organization');
      assert.equal(org.alternateName, 'abdulsamad.shop');
      assert.ok(org.founder, 'Organization has no owner/founder');
      assert.equal(org.founder['@id'], ids.owner);
      assert.equal(org.founder.name, site.ownerName);
      assert.match(org.founder.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/);
      assert.doesNotMatch(org.founder.name, /todo|placeholder|owner name/i);
    });

    test('the generator and each tool publish one WebApplication with its own identity', async () => {
      const pages = {
        '/': 'generator',
        '/tools': 'text-tools',
        '/qr-code-generator': 'qr-code-generator',
        '/qr-code-reader': 'qr-code-reader',
        '/image-compression': 'image-compression',
        '/universal-text-fixer': 'universal-text-fixer',
        '/screenshot-to-text': 'screenshot-to-text',
        '/pdf-editor': 'pdf-editor',
        '/pdf-accessibility-checker': 'pdf-accessibility-checker',
        '/studio': 'studio',
      };
      const seen = new Set();
      for (const [path, key] of Object.entries(pages)) {
        const html = await (await get(server.base, path)).text();
        const app = jsonLd(html, 'WebApplication');
        assert.ok(app, `${path} is missing its WebApplication`);
        assert.equal(app['@id'], ids.app(key), `${path} uses a different app id`);
        assert.equal(new URL(app.url).href, new URL(canonical(html)).href);
        assert.equal(app.name, site.apps[key].name);
        assert.match(app.name, /^Stylzo /, `${path} does not use the Stylzo brand consistently`);
        assert.ok(app.featureList?.length >= 3, `${path} has a thin feature list`);
        assert.equal(app.isPartOf?.['@id'], ids.website);
        assert.equal(app.publisher?.['@id'], ids.organization);
        assert.ok(!seen.has(app['@id']), `two pages share the app id ${app['@id']}`);
        seen.add(app['@id']);
      }
      assert.equal(seen.size, 10);
    });

    test('guide pages do not pretend to be the application', async () => {
      for (const path of ['/styles/instagram', '/fonts/bold', '/embed', '/about']) {
        const html = await (await get(server.base, path)).text();
        assert.equal(jsonLd(html, 'WebApplication'), null, `${path} claims a WebApplication it is not`);
        assert.equal(jsonLd(html, 'SoftwareApplication'), null, `${path} still uses the old app type`);
      }
    });

    test('breadcrumbs use the same id the WebPage references', async () => {
      for (const path of ['/fonts', '/tools', '/about', '/styles/instagram']) {
        const html = await (await get(server.base, path)).text();
        const page = jsonLd(html, 'WebPage');
        const crumbs = jsonLd(html, 'BreadcrumbList');
        assert.equal(crumbs?.['@id'], `${canonical(html)}#breadcrumb`);
        assert.equal(page.breadcrumb?.['@id'], crumbs['@id']);
      }
    });

    test('each topic cluster has one defining page linked in both directions', async () => {
      const plain = (html) => markup(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
      for (const cluster of TOPIC_CLUSTERS) {
        const ownerHtml = await (await get(server.base, cluster.owner)).text();
        assert.ok(plain(ownerHtml).includes(cluster.term.toLowerCase()),
          `${cluster.owner} does not define "${cluster.term}"`);
        for (const member of cluster.members) {
          assert.ok(ownerHtml.includes(`href="${member}"`), `${cluster.owner} does not link to ${member}`);
          const memberHtml = await (await get(server.base, member)).text();
          assert.ok(memberHtml.includes(`href="${cluster.owner}"`), `${member} does not link back to ${cluster.owner}`);
        }
      }
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
      assert.ok([301, 308].includes(res.status), `expected a permanent redirect, got ${res.status}`);
      assert.match(res.headers.get('location'), /\/(?:\?|$)/);
    });

    test('the redirect carries the query string through', async () => {
      const res = await get(server.base, '/fancy-text-generator?text=Hi', { redirect: 'manual' });
      assert.ok([301, 308].includes(res.status), `expected a permanent redirect, got ${res.status}`);
      assert.match(res.headers.get('location'), /\?text=Hi/);
    });

    test('uppercase dynamic segments redirect to the lowercase route', async () => {
      for (const [from, to] of [['/fonts/Bold', '/fonts/bold'], ['/styles/Instagram', '/styles/instagram']]) {
        const res = await get(server.base, from, { redirect: 'manual' });
        assert.equal(res.status, 308, `${from} did not redirect`);
        assert.equal(new URL(res.headers.get('location'), server.base).pathname, to);
      }
    });

    test('the category query redirect lands on the final URL in one hop', async () => {
      for (const key of REDIRECTED_CATEGORY_KEYS) {
        const res = await get(server.base, `/?category=${key}`, { redirect: 'manual' });
        const target = new URL(res.headers.get('location'), server.base);
        assert.equal(res.status, 301);
        assert.equal(target.pathname, CATEGORY_REDIRECTS[key], `?category=${key} still passes through the retired hub`);
        const final = await get(server.base, `${target.pathname}${target.search}`, { redirect: 'manual' });
        assert.equal(final.status, 200, `${target.pathname} is not the final page`);
      }
      const withText = await get(server.base, '/?category=outline&text=Hi', { redirect: 'manual' });
      assert.equal(new URL(withText.headers.get('location'), server.base).search, '?text=Hi');
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

    test('internal category links skip retired hubs and land on a 200', async () => {
      const pages = ['/', '/fonts', '/fonts/category/lines', '/fonts/category/bold', '/fonts/double-struck', '/styles/instagram'];
      for (const path of pages) {
        const doc = await (await get(server.base, path)).text();
        for (const key of REDIRECTED_CATEGORY_KEYS) {
          assert.ok(
            !doc.includes(`href="/fonts/category/${key}"`),
            `${path} still links to the redirecting /fonts/category/${key}`,
          );
        }
        const hrefs = new Set([...doc.matchAll(/href="(\/fonts\/category\/[^"]+)"/g)].map((m) => m[1]));
        for (const href of hrefs) {
          const res = await get(server.base, href, { redirect: 'manual' });
          assert.equal(res.status, 200, `${path} -> ${href} returned ${res.status}`);
        }
      }
    });
  });

  describe('sitemap', () => {
    test('is deterministic and its lastmod is not stamped at request time', async () => {
      const first = await (await get(server.base, '/sitemap.xml')).text();
      const second = await (await get(server.base, '/sitemap.xml')).text();
      assert.equal(first, second, 'sitemap changes between requests');
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

    test('no sitemap URL redirects, 404s, noindexes or canonicalises elsewhere', async () => {
      const sm = await (await get(server.base, '/sitemap.xml')).text();
      for (const loc of sm.match(/<loc>([^<]+)<\/loc>/g).map((l) => l.slice(5, -6))) {
        const res = await get(server.base, new URL(loc).pathname, { redirect: 'manual' });
        assert.equal(res.status, 200, `${loc} returns ${res.status}`);
        const html = await res.text();
        assert.equal(meta(html, 'robots'), 'index,follow', `${loc} is not indexable`);
        assert.equal(canonical(html), loc, `${loc} is not self-canonical`);
        assert.equal(prop(html, 'og:url'), loc, `${loc} has a different og:url`);
        assert.equal((markup(html).match(/<h1[ >]/g) || []).length, 1, `${loc} must have exactly one h1`);
        assert.ok(markup(html).includes('id="main"'), `${loc} has no server-rendered main content`);
        assert.ok((html.match(/<title>[^<]+<\/title>/) || []).length, `${loc} has no title`);
        assert.ok(meta(html, 'description'), `${loc} has no meta description`);
        assert.doesNotMatch(markup(html), /\bTODO\b|lorem ipsum|\[name\]/i, `${loc} contains a placeholder`);
      }
    });
  });

  describe('robots', () => {
    test('leaves /event crawlable so its noindex directive can be read', async () => {
      const rb = await (await get(server.base, '/robots.txt')).text();
      assert.doesNotMatch(rb, /Disallow: \/event/, 'robots.txt blocks /event while the page relies on noindex');
      assert.match(rb, /Disallow: \/api\//);
      assert.match(rb, /Disallow: \/admin/);
      assert.doesNotMatch(rb, /Disallow: .*\.(?:css|js|png|svg)/, 'robots.txt blocks a render asset');
      const event = await get(server.base, '/event');
      assert.equal(event.status, 200);
      assert.equal(meta(await event.text(), 'robots'), 'noindex,follow');
    });
  });

  describe('delivery', () => {
    test('pages are not cached stale and send HSTS', async () => {
      for (const path of ['/', '/fonts', '/about']) {
        const res = await get(server.base, path);
        const cache = res.headers.get('cache-control') || '';
        assert.match(cache, /no-store|no-cache|max-age=0/, `${path} may be cached stale: ${cache}`);
        assert.doesNotMatch(cache, /max-age=31536000/, `${path} has a year-long page cache`);
        assert.match(res.headers.get('strict-transport-security') || '', /max-age=\d+/, `${path} has no HSTS`);
      }
    });

    test('hashed framework assets are immutable and compressed', async () => {
      const html = await (await get(server.base, '/')).text();
      const asset = html.match(/\/_next\/static\/[^"']+\.js/)?.[0];
      assert.ok(asset, 'the page references no framework script');
      const res = await get(server.base, asset, { headers: { 'accept-encoding': 'gzip, br' } });
      assert.equal(res.status, 200);
      assert.match(res.headers.get('cache-control') || '', /immutable/, `${asset} is not immutable`);
      assert.match(res.headers.get('content-encoding') || '', /gzip|br/, `${asset} is not compressed`);
      await res.arrayBuffer();
    });

    test('HTML, CSS and JS are compressed', async () => {
      for (const path of ['/', '/css/main.css', '/js/ui.js']) {
        const res = await get(server.base, path, { headers: { 'accept-encoding': 'gzip, br' } });
        assert.match(res.headers.get('content-encoding') || '', /gzip|br/, `${path} is not compressed`);
        await res.arrayBuffer();
      }
    });

    test('unknown URLs get the real 404 page, not a 200 soft 404', async () => {
      const res = await get(server.base, '/this-page-does-not-exist', { redirect: 'manual' });
      assert.equal(res.status, 404);
      const html = await res.text();
      assert.match(html, /<title>Page not found \| Stylzo<\/title>/);
      assert.match(html, /<meta name="robots" content="noindex/);
      assert.match(html, /<h1[^>]*>Page not found<\/h1>/);
    });

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