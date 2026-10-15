import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { get, startServer } from '../helpers/server.js';

const title = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
const desc = (html) => (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
const robots = (html) => (html.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || '';
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

describe('search appearance budgets', () => {
  let server;
  before(async () => { server = await startServer(3281); });
  after(() => server?.stop());

  test('no indexable page has a title past the SERP cut', async () => {
    // Regression: the old board pages reached 79 characters, so roughly half of
    // every one of those titles was truncated away in the results.
    const long = [];
    for (const path of ['/', '/fonts', '/styles', '/tools', '/about', '/studio', '/symbols']) {
      const t = title(await (await get(server.base, path)).text());
      if (t.length > 62) long.push(`${path}: ${t.length}`);
    }
    assert.deepEqual(long, [], `titles too long:\n  ${long.join('\n  ')}`);
  });

  test('no page has a description past the SERP cut', async () => {
    for (const path of [
      '/', '/fonts', '/tools', '/about', '/privacy', '/terms', '/contact', '/studio',
      '/symbols', '/emoji', '/kaomoji', '/styles', '/styles/instagram', '/fonts/bold',
    ]) {
      const d = desc(await (await get(server.base, path)).text());
      assert.ok(d.length > 0, `${path} has no description`);
      assert.ok(d.length <= 175, `${path} description is ${d.length} chars and will be truncated`);
    }
  });

  test('previously thin descriptions are now substantial', async () => {
    // /terms was 41 characters and /contact 39, both too thin to rank for
    // anything on their own.
    for (const [path, floor] of [['/terms', 120], ['/contact', 100], ['/about', 120], ['/privacy', 100]]) {
      const d = desc(await (await get(server.base, path)).text());
      assert.ok(d.length >= floor, `${path} description is only ${d.length} chars`);
    }
  });
});

describe('link equity is not spent on unindexable pages', () => {
  let server;
  before(async () => { server = await startServer(3282); });
  after(() => server?.stop());

  test('/studio is indexable because it now has real content', async () => {
    // It was noindex while holding a main-nav slot, a footer slot and a home
    // page slot: three of the strongest internal links on the site, wasted.
    const html = await (await get(server.base, '/studio')).text();
    assert.equal(robots(html), 'index,follow');
    assert.match(markup(html), /What the font studio does/);
    assert.match(markup(html), /<h3>How to make a text image</);
  });

  test('/studio is in the sitemap and every page that links it is indexable', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    assert.ok(sm.includes('/studio</loc>'), 'sitemap omits /studio');

    for (const path of ['/', '/tools']) {
      const html = await (await get(server.base, path)).text();
      assert.match(html, /href="\/studio"/, `${path} no longer links the studio`);
      assert.equal(robots(html), 'index,follow', `${path} links to /studio but cannot rank itself`);
    }
  });

  test('indexable pages do not spend links on the admin dashboard', async () => {
    for (const path of ['/', '/fonts', '/styles']) {
      const doc = markup(await (await get(server.base, path)).text());
      assert.ok(!doc.includes('href="/admin'), `${path} links to the noindex admin area`);
    }
  });

  test('the home page still lists every curated destination', async () => {
    const doc = markup(await (await get(server.base, '/')).text());
    assert.ok(doc.includes('id="home-destinations"'));
    assert.ok(doc.includes('id="home-libraries"'));
  });
});

// The links a visitor can follow out of a page, ignoring the chrome that every
// page carries. Header, footer, breadcrumbs and the related-searches chips are
// navigation rather than editorial links, so they do not count here: a page can
// have a hundred of them and still be a dead end.
function contextualLinks(html) {
  const body = markup(html.slice(html.indexOf('<main'), html.indexOf('</main>')))
    .replace(/<nav class="crumbs"[\s\S]*?<\/nav>/g, '')
    .replace(/<section class="related-searches"[\s\S]*?<\/section>/g, '');
  return [...body.matchAll(/<a href="(\/[^"]*)"[^>]*>([^<]*)<\/a>/g)]
    .map((m) => ({ href: m[1], anchor: m[2].trim() }))
    .filter((l) => l.anchor);
}

describe('every page links onward, not just around itself', () => {
  let server;
  before(async () => { server = await startServer(3284); });
  after(() => server?.stop());

  // Regression: /tools, /symbols, /emoji, /kaomoji, /about and /contact had no
  // editorial link at all. Each one answered its own question and then stopped,
  // so the pages a visitor most likely lands on could not pass a reader on to
  // the pages that do the styling.
  const OUTBOUND = {
    '/tools': ['/', '/fonts', '/styles', '/studio', '/image-compression', '/qr-code-generator'],
    '/symbols': ['/', '/fonts', '/styles'],
    '/emoji': ['/tools'],
    '/kaomoji': ['/', '/fonts', '/styles'],
    '/about': ['/', '/fonts', '/styles', '/styles/instagram', '/symbols', '/emoji', '/kaomoji', '/tools', '/studio'],
    '/contact': ['/fonts', '/about', '/styles/instagram'],
    // The compressor is the other image tool on the site, so the two have to
    // point at each other rather than each claiming to be the only one.
    '/image-compression': ['/', '/fonts', '/styles', '/tools', '/studio', '/qr-code-generator'],
    // The generator is the other tool on this site that produces something a
    // visitor downloads and prints, so the two point at each other.
    '/qr-code-generator': ['/', '/fonts', '/styles', '/tools', '/studio', '/image-compression'],
    '/studio': ['/', '/fonts', '/styles', '/image-compression'],
  };

  for (const [path, destinations] of Object.entries(OUTBOUND)) {
    test(`${path} links onward to ${destinations.join(', ')}`, async () => {
      const links = contextualLinks(await (await get(server.base, path)).text());
      const hrefs = new Set(links.map((l) => l.href));
      for (const destination of destinations) {
        assert.ok(hrefs.has(destination), `${path} has no contextual link to ${destination}`);
      }
    });
  }

  test('the anchors describe the destination rather than the act of clicking', async () => {
    // "click here" and "read more" pass a link check and help nobody, a reader
    // or a crawler. The anchor has to carry what is on the other side.
    const junk = /^(click here|here|read more|more|link|this|learn more|see more)$/i;
    for (const path of Object.keys(OUTBOUND)) {
      for (const { href, anchor } of contextualLinks(await (await get(server.base, path)).text())) {
        assert.ok(!junk.test(anchor), `${path} links to ${href} with the anchor "${anchor}"`);
        assert.ok(anchor.length > 1, `${path} links to ${href} with an empty anchor`);
      }
    }
  });
});

describe('server-side search on /fonts', () => {
  let server;
  before(async () => { server = await startServer(3283); });
  after(() => server?.stop());

  test('?q= filters the server-rendered list without JavaScript', async () => {
    const all = markup(await (await get(server.base, '/fonts')).text());
    const filtered = markup(await (await get(server.base, '/fonts?q=gothic')).text());
    const count = (s) => (s.match(/data-style-id=/g) || []).length;
    assert.ok(count(all) > count(filtered), 'the query did not narrow the list');
    assert.ok(count(filtered) > 0, 'the query matched nothing');
    assert.match(filtered, /matching/);
  });

  test('?q= is noindex and canonicalises to /fonts', async () => {
    const html = await (await get(server.base, '/fonts?q=gothic')).text();
    assert.equal(robots(html), 'noindex,follow');
    assert.equal(new URL(canonical(html)).pathname, '/fonts');
  });

  test('an unmatched query renders an empty result rather than the full list', async () => {
    const filtered = markup(await (await get(server.base, '/fonts?q=zzzznotastyle')).text());
    assert.equal((filtered.match(/data-style-id=/g) || []).length, 0);
  });

  test('the unfiltered page is unaffected', async () => {
    const html = await (await get(server.base, '/fonts')).text();
    assert.equal(robots(html), 'index,follow');
    assert.ok((markup(html).match(/data-style-id=/g) || []).length > 50);
  });
});

describe('library structured data', () => {
  let server;
  before(async () => { server = await startServer(3284); });
  after(() => server?.stop());

  for (const path of ['/symbols', '/emoji', '/kaomoji']) {
    test(`${path} declares itself a CollectionPage with per-category ItemLists`, async () => {
      const html = await (await get(server.base, path)).text();

      const collection = JSON.parse(html.match(
        /<script type="application\/ld\+json"[^>]*>(\{"@context":"https:\/\/schema\.org","@type":"CollectionPage".*?\})<\/script>/,
      )[1]);
      assert.equal(collection.name.length > 0, true);
      assert.ok(collection.numberOfItems > 0, `${path} collection reports no items`);
      assert.match(collection.url, /^https?:\/\//);

      const lists = [...html.matchAll(
        /<script type="application\/ld\+json"[^>]*>(\{"@context":"https:\/\/schema\.org","@type":"ItemList".*?\})<\/script>/g,
      )].map((m) => JSON.parse(m[1]));
      assert.ok(lists.length > 1, `${path} should have one ItemList per category`);
      for (const list of lists) {
        assert.equal(list.itemListElement.length, list.numberOfItems);
        assert.equal(list.itemListElement[0].position, 1);
        assert.match(list.itemListElement[0].url, /^https?:\/\//);
      }
    });
  }

  test('the catalog index keeps one ItemList per category', async () => {
    const lists = [...(await (await get(server.base, '/fonts')).text()).matchAll(
      /<script type="application\/ld\+json"[^>]*>(\{"@context":"https:\/\/schema\.org","@type":"ItemList".*?\})<\/script>/g,
    )].map((m) => JSON.parse(m[1]));
    assert.ok(lists.length > 5, 'expected one ItemList per font category');
    for (const list of lists) {
      assert.equal(list.itemListElement.length, list.numberOfItems);
    }
  });
});

describe('3d hero performance gating', () => {
  const hero = readFileSync(new URL('../../components/hero-3d.jsx', import.meta.url), 'utf8');
  const scene = readFileSync(new URL('../../components/hero3d.jsx', import.meta.url), 'utf8');

  test('the scene is not imported at all on a device that cannot afford it', () => {
    // The scene costs ~895 KB of three.js. Loading it unconditionally means a
    // phone on a metered connection pays for decoration.
    assert.match(hero, /getContext\('webgl2'\)|getContext\('webgl'\)/, 'no WebGL capability check');
    assert.match(hero, /saveData/, 'no Data Saver guard');
    assert.match(hero, /effectiveType/, 'no slow-connection guard');
    assert.ok(hero.includes("dynamic(() => import('./hero3d.jsx')"), 'the scene must stay a lazy import');
  });

  test('rendering stops when the hero scrolls out of view', () => {
    assert.match(scene, /IntersectionObserver/);
    assert.match(scene, /frameloop=/, 'the render loop must be switchable');
    assert.match(scene, /frameloop=\{inView \? 'always' : 'never'\}/);
  });

  test('the skeleton cannot get stuck when the scene never loads', () => {
    // onCreated only fires once the canvas exists, so an unavailable scene used
    // to leave the skeleton on screen permanently.
    assert.match(hero, /showSkeleton/);
  });
});