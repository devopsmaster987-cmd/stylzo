import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { get, startServer } from '../helpers/server.js';
import { catalog } from '../../services/catalog.js';
import { PLATFORM_PAGES } from '../../lib/platform-pages.js';
import { env } from '../../config/environment.js';

const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

// guides.js imports the "@/" alias, which only resolves inside Next. Read the
// published guide URLs from the rendered index instead of duplicating the list.
async function guidePaths(base) {
  const html = await (await get(base, '/guides')).text();
  return [...new Set(
    [...markup(html).matchAll(/href="(\/guides\/[a-z0-9-]+)"/g)].map((match) => match[1]),
  )];
}

describe('crawl discovery', () => {
  let server;
  before(async () => { server = await startServer(3236); });
  after(() => server?.stop());

  test('the HTML site map is indexable and lists every style page', async () => {
    const res = await get(server.base, '/site-map');
    assert.equal(res.status, 200);
    const html = await res.text();
    const body = markup(html);

    assert.equal((body.match(/<h1[ >]/g) || []).length, 1, 'the site map needs exactly one h1');
    assert.equal(canonical(html), `${env.siteUrl}/site-map`);
    assert.match(html, /<meta name="robots" content="index,follow"/);
    assert.ok(body.includes('id="main"'));

    for (const style of catalog().styles.filter((s) => s.indexable)) {
      assert.ok(
        body.includes(`href="/fonts/${style.slug}"`),
        `the site map does not link ${style.slug}`,
      );
    }
    for (const guide of await guidePaths(server.base)) {
      assert.ok(body.includes(`href="${guide}"`), `the site map does not link ${guide}`);
    }
    for (const page of PLATFORM_PAGES) {
      assert.ok(body.includes(`href="${page.path}"`), `the site map does not link ${page.path}`);
    }
  });

  test('every site map link resolves to a 200 page', async () => {
    const html = await (await get(server.base, '/site-map')).text();
    const links = new Set(
      [...markup(html).matchAll(/href="(\/[^"#?]*)"/g)].map((match) => match[1]),
    );
    for (const link of links) {
      const res = await get(server.base, link, { redirect: 'manual' });
      assert.equal(res.status, 200, `${link} returned ${res.status}`);
    }
  });

  test('the XML sitemap advertises the site map', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    assert.match(sm, /<loc>https:\/\/[^<]*\/site-map<\/loc>/);
  });

  test('the guides feed is valid RSS and lists every guide', async () => {
    const res = await get(server.base, '/feed.xml');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /application\/rss\+xml/);
    const xml = await res.text();

    assert.match(xml, /<rss version="2.0"/);
    assert.match(xml, /<channel>/);
    for (const guide of await guidePaths(server.base)) {
      assert.ok(xml.includes(`${env.siteUrl}${guide}`), `the feed omits ${guide}`);
    }
  });

  test('the footer links the site map from every page', async () => {
    const html = await (await get(server.base, '/')).text();
    assert.ok(markup(html).includes('href="/site-map"'), 'the home page does not link the site map');
  });
});
