import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { get, startServer } from '../helpers/server.js';
import { LANDING_PAGES } from '../../lib/landing-pages.js';

process.env.ADMIN_KEY = 'test-admin-key-123';

const MAP = JSON.parse(readFileSync(new URL('../../data/keyword-map.json', import.meta.url), 'utf8'));

const title = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
const desc = (html) => (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';

// Next.js repeats the rendered props inside its RSC flight payload, so counting a
// data attribute against the raw document counts it twice. Assert against the
// markup only.
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

const stats = (html) => {
  const map = {};
  for (const [, value, label] of markup(html).matchAll(/<div class="stat-card"><b>([^<]*)<\/b><span>([^<]*)<\/span>/g)) {
    map[label] = value;
  }
  return map;
};

describe('landing pages', () => {
  let server;
  before(async () => { server = await startServer(3224); });
  after(() => server?.stop());

  for (const page of LANDING_PAGES) {
    const path = `/styles/${page.key}`;

    test(`GET ${path} returns complete SEO HTML`, async () => {
      const res = await get(server.base, path);
      assert.equal(res.status, 200);
      const html = await res.text();

      assert.equal((html.match(/<h1[ >]/g) || []).length, 1, 'expected exactly one h1');
      assert.match(html, new RegExp(`<h1[^>]*>${page.h1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      assert.equal(title(html), `${page.title} | Stylzo`);
      assert.equal(desc(html), page.description);
      assert.ok(canonical(html).endsWith(path), `${canonical(html)} is not self-referencing`);
      assert.match(html, /<meta name="robots" content="index,follow"/);
    });

    test(`GET ${path} has breadcrumbs and valid JSON-LD`, async () => {
      const html = await (await get(server.base, path)).text();
      assert.match(html, /<nav class="crumbs" aria-label="Breadcrumb">/);
      assert.match(html, /"@type":"BreadcrumbList"/);

      const crumbs = JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>(\{"@context":"https:\/\/schema\.org","@type":"BreadcrumbList".*?)<\/script>/)[1]);
      assert.equal(crumbs.itemListElement.length, 2);
      assert.equal(crumbs.itemListElement[0].name, 'Home');
    });

    test(`GET ${path} renders exactly three visible FAQs and matching JSON-LD`, async () => {
      const html = await (await get(server.base, path)).text();

      // Visible FAQ questions live in h3s inside the FAQ section only.
      const faqSection = html.slice(html.indexOf('id="faq-heading"'));
      const visible = faqSection.match(/<h3>/g) || [];
      assert.equal(visible.length, 3, `${page.key} must show exactly 3 FAQ questions`);

      const faqLd = JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>(\{"@context":"https:\/\/schema\.org","@type":"FAQPage".*?)<\/script>/)[1]);
      assert.equal(faqLd.mainEntity.length, 3);
      for (const q of faqLd.mainEntity) assert.ok(q.acceptedAnswer.text.length > 30);
    });

    test(`GET ${path} server-renders real styled output`, async () => {
      const html = await (await get(server.base, path)).text();
      assert.ok((html.match(/data-style-id=/g) || []).length > 0, 'no style rows rendered');
      assert.ok((html.match(/data-copy/g) || []).length > 0, 'no copy buttons rendered');
      // Output must be real Unicode, not an empty placeholder.
      assert.match(html, /data-output="true">[^<]{2,}/);
    });

    test(`GET ${path} shows emoji-wrapped variations`, async () => {
      const html = await (await get(server.base, path)).text();
      const chips = html.match(/<li class="chip-phrase">([^<]*)<\/li>/g) || [];
      assert.ok(chips.length > 0, `${page.key} rendered no variations`);
      assert.ok(chips.length <= 12, `${page.key} dumped ${chips.length} phrases onto the page`);
      for (const chip of chips) {
        const text = chip.replace(/<[^>]*>/g, '').trim();
        const chars = Array.from(text);
        assert.ok(/\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(chars[0]), `variation does not start with an emoji: ${text}`);
        assert.ok(
          /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(chars.filter((c) => c !== '️').slice(-1)[0]),
          `variation does not end with an emoji: ${text}`,
        );
      }
    });

    test(`GET ${path} keeps every internal link on a real route`, async () => {
      const html = await (await get(server.base, path)).text();
      const hrefs = new Set((html.match(/href="(\/[^"#?]*)"/g) || []).map((h) => h.slice(6, -1)));
      for (const href of hrefs) {
        const res = await get(server.base, href);
        assert.equal(res.status, 200, `${page.key} links to ${href}, which returns ${res.status}`);
      }
    });
  }

  test('?text= is server-rendered and noindex, with a self-referencing canonical', async () => {
    const html = await (await get(server.base, '/styles/instagram?text=Hi')).text();
    assert.match(html, /noindex,follow/);
    assert.match(html, /rel="canonical" href="[^"]*\/styles\/instagram"/);
    assert.ok(html.includes('data-sample="Hi"'));
  });

  test('an unknown /styles/<slug> redirects instead of rendering a page', async () => {
    // The route 404s, but the redirect fires first, so a visitor never lands on
    // an error page and any accumulated link equity is passed on rather than lost.
    const res = await get(server.base, '/styles/not-a-page', { redirect: 'manual' });
    assert.equal(res.status, 301);
    assert.equal(new URL(res.headers.get('location'), 'http://x.test').pathname, '/');
  });

  test('the styles index is the hub, not a redirect', async () => {
    const res = await get(server.base, '/styles', { redirect: 'manual' });
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /Fancy text styles, side by side/);
  });

  test('titles are unique across landing pages and never double-suffix the site name', async () => {
    const titles = [];
    for (const page of LANDING_PAGES) {
      const t = title(await (await get(server.base, `/styles/${page.key}`)).text());
      titles.push(t);
      assert.equal((t.match(/\| Stylzo/g) || []).length, 1, `doubled site suffix in "${t}"`);
    }
    assert.equal(new Set(titles).size, titles.length);
  });

  test('introductions differ across landing pages', async () => {
    const intros = [];
    for (const page of LANDING_PAGES) {
      const html = await (await get(server.base, `/styles/${page.key}`)).text();
      const lede = (html.match(/<p class="lede">([^<]*)<\/p>/) || [])[1];
      assert.ok(lede && lede.length > 60, `${page.key} has a thin introduction`);
      intros.push(lede);
    }
    assert.equal(new Set(intros).size, intros.length);
  });
});

describe('sitemap', () => {
  let server;
  before(async () => { server = await startServer(3222); });
  after(() => server?.stop());

  test('contains every eligible indexable page', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    const paths = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    for (const p of ['/', '/fonts', '/tools']) {
      assert.ok(paths.includes(p), `sitemap misses ${p}`);
    }
    for (const page of LANDING_PAGES) {
      assert.ok(paths.includes(`/styles/${page.key}`), `sitemap misses /styles/${page.key}`);
    }
    assert.ok(paths.includes('/fonts/bold'));
    assert.ok(paths.includes('/fonts/category/gothic'));
  });

  test('never lists admin or the dashboard', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    for (const p of ['/admin', '/admin/seo']) {
      assert.ok(!sm.includes(`${p}</loc>`), `sitemap must not list ${p}`);
    }
  });

  test('robots.txt allows crawling and points at the sitemap', async () => {
    const rb = await (await get(server.base, '/robots.txt')).text();
    assert.match(rb, /Sitemap:/);
    assert.match(rb, /Allow: \//);
  });
});

describe('seo keyword dashboard', () => {
  let server;
  before(async () => { server = await startServer(3223); });
  after(() => server?.stop());

  test('is closed without the admin key and leaks no keyword data', async () => {
    for (const url of ['/admin/seo', '/admin/seo?key=wrong']) {
      const html = await (await get(server.base, url)).text();
      assert.match(html, /Enter your key/);
      assert.ok(!html.includes('instagram fancy text generator'), `${url} leaked keyword rows`);
      assert.ok(!html.includes('source entries'), `${url} leaked dashboard statistics`);
      assert.match(html, /noindex,follow/);
    }
  });

  test('opens with the right key and renders the sidebar and controls', async () => {
    const html = await (await get(server.base, '/admin/seo?key=test-admin-key-123')).text();
    assert.match(html, /SEO keyword dashboard/);
    assert.match(html, /id="kw-sidebar"/);
    assert.match(html, /data-kw-search/);
    assert.match(html, /data-kw-rows/);
    assert.match(html, /data-kw-category="all"/);
  });

  test('renders real rows matching the generated keyword map', async () => {
    const html = await (await get(server.base, '/admin/seo?key=test-admin-key-123')).text();
    const rows = markup(html).match(/data-kw-row="true"/g) || [];
    assert.equal(rows.length, MAP.keywords.length);

    const doc = markup(html);
    for (const k of MAP.keywords.slice(0, 12)) {
      assert.ok(doc.includes(`data-normalized="${k.normalized}"`), `dashboard is missing ${k.normalized}`);
      assert.ok(doc.includes(`data-route="${k.route || ''}"`), `dashboard route missing for ${k.normalized}`);
    }
  });

  test('sidebar categories are built from data and never empty', async () => {
    const doc = markup(await (await get(server.base, '/admin/seo?key=test-admin-key-123')).text());
    const shown = new Set(Array.from(doc.matchAll(/data-kw-category="([a-z-]+)"/g), (m) => m[1]));
    assert.ok(shown.has('all'));
    assert.ok(shown.has('competitor'), 'the skipped-competitor group should be present');

    // Every rendered category button must carry a non-zero count.
    for (const id of shown) {
      assert.match(doc, new RegExp(`data-kw-count-for="${id}">[1-9]`), `category ${id} shows an empty count`);
    }
  });

  test('statistics on the page match the generated report', async () => {
    const html = await (await get(server.base, '/admin/seo?key=test-admin-key-123')).text();
    const s = stats(html);
    const want = MAP.summary;
    assert.equal(s['unique keywords'], String(want.uniqueKeywords));
    assert.equal(s.mapped, String(want.mapped));
    assert.equal(s['skipped competitors'], String(want.skipped));
    assert.equal(s['planned features'], String(want.planned));
    assert.equal(s['need review'], String(want.unmapped + want.needsReview));
    assert.equal(s['indexable pages'], String(want.indexablePages));
    assert.equal(s['variations generated'], String(want.totalVariations));
    assert.equal(s['variations displayed'], String(want.displayedVariations));
    assert.equal(s['source entries'], String(want.sourceEntries));
    assert.equal(s['SEO failures'], String(MAP.validation.failures));
  });

  test('provides every mapping status filter and a sort control', async () => {
    const html = await (await get(server.base, '/admin/seo?key=test-admin-key-123')).text();
    for (const v of ['all', 'mapped', 'skipped', 'planned', 'unmapped', 'needs-review']) {
      assert.match(html, new RegExp(`value="${v}"`), `missing status filter ${v}`);
    }
    for (const v of ['keyword', 'category', 'status', 'variations']) {
      assert.match(html, new RegExp(`<option value="${v}"`), `missing sort option ${v}`);
    }
    assert.match(html, /data-kw-empty/);
  });

  test('shows the mapping detail for every keyword', async () => {
    const html = await (await get(server.base, '/admin/seo?key=test-admin-key-123')).text();
    assert.match(html, /<dt>Original<\/dt>/);
    assert.match(html, /<dt>Core modifier<\/dt>/);
    assert.match(html, /<dt>Target route<\/dt>/);
    assert.match(html, /<dt>Reason<\/dt>/);
    assert.match(html, /<dt>Variations<\/dt>/);
  });
});
