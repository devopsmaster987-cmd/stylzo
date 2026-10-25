import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { get, startServer } from '../helpers/server.js';
import { HOME_META, HOME_HOW, HOME_COLLECTIONS, HOME_SIZES, HOME_LIBRARIES, HOME_DESTINATIONS, HOME_LINKS } from '../../lib/home-content.js';
import { getStyle } from '../../services/catalog.js';

const title = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
const desc = (html) => (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';

// Next.js repeats rendered props in its RSC flight payload, so count markup only.
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

describe('home page content', () => {
  let server;
  before(async () => { server = await startServer(3231); });
  after(() => server?.stop());

  test('renders a unique title and description, with the site name exactly once', async () => {
    const html = await (await get(server.base, '/')).text();
    assert.equal(title(html), `Stylzo: ${HOME_META.title}`);
    assert.equal(desc(html), HOME_META.description);
    assert.equal((title(html).match(/\| Stylzo/g) || []).length, 0, 'home title must not use the | suffix');
    assert.equal((title(html).match(/Stylzo/g) || []).length, 1, 'home title must name the site once');
  });

  test('title and description are not reused from another page', async () => {
    const html = await (await get(server.base, '/')).text();
    const others = ['/styles/instagram', '/fonts', '/tools', '/about'];
    for (const p of others) {
      const other = await (await get(server.base, p)).text();
      assert.notEqual(title(html), title(other), `home title matches ${p}`);
      assert.notEqual(desc(html), desc(other), `home description matches ${p}`);
    }
  });

  test('description length stays inside the crawler budget', async () => {
    assert.ok(HOME_META.description.length <= 300, `description is ${HOME_META.description.length} chars`);
    assert.ok(HOME_META.description.length >= 70, 'description is too thin to rank');
  });

  test('exactly one h1, self-referencing canonical, indexable', async () => {
    const html = await (await get(server.base, '/')).text();
    const doc = markup(html);
    assert.equal((doc.match(/<h1[ >]/g) || []).length, 1);
    assert.equal(new URL(canonical(html)).pathname, '/', `${canonical(html)} is not self-referencing`);
    assert.match(html, /<meta name="robots" content="index,follow"/);
  });

  test('keeps the generator working above the new content', async () => {
    const doc = markup(await (await get(server.base, '/')).text());
    assert.ok(doc.includes('data-rows'), 'style results list missing');
    assert.ok((doc.match(/data-copy/g) || []).length > 0, 'no copy buttons rendered');
    assert.ok(doc.includes('data-style-search'), 'style search missing');
    assert.match(doc, /data-output="true">[^<]{2,}/);
  });

  test('renders every content section heading', async () => {
    const doc = markup(await (await get(server.base, '/')).text());
    const headings = [
      HOME_HOW.h2,
      ...HOME_COLLECTIONS.map((c) => c.h2),
      HOME_SIZES.h2,
      HOME_LIBRARIES.h2,
      HOME_DESTINATIONS.h2,
    ];
    for (const h of headings) assert.ok(doc.includes(h), `missing section heading: ${h}`);
  });

  test('every linked style resolves to a real indexable catalog style', async () => {
    const slugs = [...HOME_COLLECTIONS.flatMap((c) => c.slugs), ...HOME_SIZES.slugs];
    for (const slug of slugs) {
      const s = getStyle(slug);
      assert.ok(s, `content references a style the catalog does not have: ${slug}`);
      assert.ok(s.indexable, `${slug} is not indexable but is used as home page content`);
    }
  });

  test('style sections render real styled output, not placeholders', async () => {
    const doc = markup(await (await get(server.base, '/')).text());
    const previews = doc.match(/<p class="preview-out" aria-hidden="true">([^<]*)<\/p>/g) || [];
    const expected = [...HOME_COLLECTIONS.flatMap((c) => c.slugs), ...HOME_SIZES.slugs]
      .filter((s) => getStyle(s)?.indexable).length;
    assert.equal(previews.length, expected, 'not every curated style has a preview');
    for (const p of previews) {
      const value = p.replace(/<[^>]*>/g, '');
      assert.ok(value.length >= 2, `preview is empty for ${value}`);
      // Every preview must be transformed Unicode, not the plain sample text.
      assert.notEqual(value, 'Stylzo', 'a preview shows unstyled text');
    }
  });

  test('previews link to the style page and stay out of the generator row budget', async () => {
    const doc = markup(await (await get(server.base, '/')).text());
    // features.test.js caps the interactive generator at PAGE_SIZE rows; the
    // curated previews must not push the page past that weight guard.
    assert.ok((doc.match(/data-style-id=/g) || []).length <= 48, 'preview cards leaked into the interactive row budget');
    for (const s of ['fraktur', 'small-caps', 'zalgo-light']) {
      assert.ok(doc.includes(`<a href="/fonts/${s}">`), `preview does not link to /fonts/${s}`);
    }
  });

  test('keeps every internal link on a real route', async () => {
    const html = await (await get(server.base, '/')).text();
    const hrefs = new Set((html.match(/href="(\/[^"#?]*)"/g) || []).map((h) => h.slice(6, -1)));
    assert.ok(hrefs.size > 5, 'expected the home page to link out to its libraries');
    for (const href of hrefs) {
      const res = await get(server.base, href);
      assert.equal(res.status, 200, `home links to ${href}, which returns ${res.status}`);
    }
  });

  test('no brand names appear in home page headings, title or text', async () => {
    const html = await (await get(server.base, '/')).text();
    // Scoped to <main>: the shared footer lists platform names on every page and
    // is out of scope for this page's own copy.
    const doc = markup(html);
    const main = doc.slice(doc.indexOf('<main'), doc.indexOf('</main>'));
    const h1 = (main.match(/<h1[^>]*>([^<]*)</) || [])[1] || '';
    const h2s = (main.match(/<h2[^>]*>([^<]*)</g) || []).join(' ');

    const brands = [
      'Instagram', 'WhatsApp', 'Discord', 'TikTok', 'Twitter', 'Facebook', 'Telegram',
      'LingoJam', 'Lingojam', 'FontVilla', 'MessLetters', 'TextTrick', 'NickFinder',
      'CoolSymbol', 'Free Fire', 'PUBG', 'Roblox', 'Minecraft', 'BGMI',
    ];
    for (const b of brands) {
      assert.ok(!h1.includes(b), `h1 contains brand "${b}": ${h1}`);
      assert.ok(!h2s.includes(b), `an h2 contains brand "${b}": ${h2s}`);
      assert.ok(!main.includes(b), `home page text contains brand "${b}"`);
    }
  });

  test('landing-page links are labelled descriptively, not by platform', async () => {
    const doc = markup(await (await get(server.base, '/')).text());
    const section = doc.slice(doc.indexOf('id="home-destinations"'), doc.indexOf('id="home-planned"'));
    for (const l of HOME_DESTINATIONS.links) {
      assert.ok(section.includes(l.label), `destination label missing: ${l.label}`);
    }
    // The routes are still linked; only the visible wording avoids brand names.
    for (const l of HOME_DESTINATIONS.links) {
      assert.ok(doc.includes(`href="${l.href}"`), `missing link to ${l.href}`);
    }
  });

  test('related pages nav links every page it lists', async () => {
    const doc = markup(await (await get(server.base, '/')).text());
    for (const l of HOME_LINKS) {
      assert.ok(doc.includes(`href="${l.href}"`), `related pages nav is missing ${l.href}`);
    }
  });

  test('still in the sitemap', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    const paths = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    assert.ok(paths.includes('/'), 'sitemap no longer lists the home page');
  });
});

describe('home page query variants', () => {
  let server;
  before(async () => { server = await startServer(3232); });
  after(() => server?.stop());

  test('?text= stays noindex and drops the FAQ JSON-LD', async () => {
    const html = await (await get(server.base, '/?text=Hi')).text();
    assert.match(html, /noindex,follow/);
    assert.ok(!html.includes('"@type":"FAQPage"'), 'noindex render should not carry FAQ structured data');
    assert.ok(html.includes('data-sample="Hi"'));
  });

  test('?category= redirects to the real category hub', async () => {
    const res = await get(server.base, '/?category=gothic', { redirect: 'manual' });
    assert.equal(res.status, 301);
    const location = new URL(res.headers.get('location'), server.base);
    assert.equal(location.pathname, '/fonts/category/gothic');
  });

  test('the category hub is indexable and self-canonical', async () => {
    const html = await (await get(server.base, '/fonts/category/gothic')).text();
    assert.match(html, /<meta name="robots" content="index,follow"/);
    assert.equal(new URL(canonical(html)).pathname, '/fonts/category/gothic');
    assert.equal((markup(html).match(/<h1[ >]/g) || []).length, 1);
    assert.ok(markup(html).includes('Gothic text styles'));
  });

  test('unknown category still 404s', async () => {
    assert.equal((await get(server.base, '/?category=zzz')).status, 404);
  });
});

describe('home page scroll reveal', () => {
  let server;
  before(async () => { server = await startServer(3233); });
  after(() => server?.stop());

  test('marks content sections for reveal without hiding them by default', async () => {
    const doc = markup(await (await get(server.base, '/')).text());
    assert.ok(doc.includes('data-reveal="pending"'), 'no section is marked for reveal');
    // Progressive enhancement: "pending" is only honoured after the script arms it,
    // so the server-rendered page must still expose the content in markup.
    assert.ok(doc.includes('id="how-heading"'), 'reveal content missing from the server HTML');
  });

  test('loads the reveal script and is reduced-motion safe', async () => {
    const html = await (await get(server.base, '/')).text();
    assert.match(html, /reveal\.js/);

    const css = readFileSync(new URL('../../public/css/main.css', import.meta.url), 'utf8');
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(css, /\[data-reveal="pending"\] \{ opacity: 1; transform: none; \}/);

    const js = readFileSync(new URL('../../public/js/reveal.js', import.meta.url), 'utf8');
    assert.match(js, /prefers-reduced-motion: reduce/);
    assert.match(js, /typeof IntersectionObserver !== 'function'/, 'must fall back when IntersectionObserver is missing');
  });
});

