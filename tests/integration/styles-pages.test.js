import 'dotenv/config';
import { test, describe, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { get, startServer } from '../helpers/server.js';
import {
  boardRows, emojiFor, styleSlugs, WORD_LIST, WORD_STYLES, EMOJI_POOL,
  WORDS_PER_KEYWORD, EMOJI_MIN, EMOJI_MAX,
  stylesHubWordCount, stylesHubAdPlan,
  STYLES_FIELD_ROWS, STYLES_LIMITS, STYLES_LIMIT_CHECKED,
} from '../../lib/styles-material.js';
import {
  KEPT_STYLE_SLUGS, STYLE_REDIRECT_RULES, isKeptStyleSlug, styleRedirectFor, styleRedirects,
  isAdAllowedPath, adAllowedOn, STYLES_HUB_AD_MIN_WORDS,
} from '../../lib/styles-routing.js';
import { LANDING_PAGE_KEYS, LANDING_PAGES } from '../../lib/landing-pages.js';
import { catalog, getStyle } from '../../services/catalog.js';
import { applyStyle } from '../../services/unicode/engine.js';

const indexable = new Set(catalog().styles.filter((s) => s.indexable).map((s) => s.slug));

// Emoji are counted as sequences, because several are two code points joined by a
// zero-width joiner or end in a variation selector.
const emojiIn = (text) => (String(text).match(/\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu) || []).length;

const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');
const adUnits = (html) => (markup(html).match(/class="adsbygoogle"/g) || []).length;

/**
 * Every slug the keyword board used to serve, with where it belongs now.
 *
 * These are the 32 slugs that were live under /styles and are now permanently
 * redirected. The list is written out rather than derived from the redirect
 * rules on purpose: a test that computes the expected answer from the code under
 * test only proves the code agrees with itself. The rule names the destination
 * group, and the server has to agree.
 */
const RETIRED = {
  instagram: [
    'instagram-fancy-text-generator',
    'fancy-text-generator-for-instagram',
    'instagram-bio-fonts',
    'instagram-font-generator',
    'instagram-username-fonts',
    'instagram-name-fonts',
    'instagram-caption-fonts',
    'fancy-text-for-instagram-bio',
    'instagram-aesthetic-fonts',
  ],
  languages: [
    'hindi-fancy-text-generator',
    'urdu-fancy-text-generator',
    'arabic-fancy-text-generator',
    'tamil-fancy-text-generator',
    'marathi-fancy-text-generator',
  ],
  colours: ['fancy-text-generator-blue-colour'],
  home: [
    'fancy-text-generator',
    'fancy-text-generator-online',
    'free-fancy-text-generator',
    'best-fancy-text-generator',
    'fancy-text',
    'copy-and-paste-fancy-text',
    'fancy-text-generator-2024',
    'fancy-text-generator-app',
    'fancy-text-generator-download',
    'coolsymbol-fancy-text-generator',
    'facebook-fancy-text-generator',
    'heart-fancy-text-generator',
    'www-fancy-text-generator',
    'font-fancy-text-generator',
    'ai-fancy-text-generator',
    'cool-fancy-text-generator',
    'online-fancy-text-generator',
  ],
};

const DESTINATION = {
  instagram: '/styles/instagram',
  languages: '/styles/languages',
  colours: '/styles/colours',
  home: '/',
};

const ALL_RETIRED = Object.entries(RETIRED).flatMap(([group, slugs]) => slugs.map((slug) => [slug, group]));

// The whole point of the change: the ad goes wherever the reader would have been
// sent, never to a page that was a keyword match and nothing more.
const ADS_ON = Boolean(process.env.ADSENSE_CLIENT && process.env.ADSENSE_SLOT);
const onlyWith = (on) => (on ? {} : { skip: 'build without ads' });

describe('styles routing data', () => {
  test('the kept slugs are exactly the landing pages that exist', () => {
    assert.deepEqual([...KEPT_STYLE_SLUGS].sort(), [...LANDING_PAGE_KEYS].sort());
    assert.equal(new Set(styleSlugs()).size, KEPT_STYLE_SLUGS.length);
  });

  test('styleSlugs and the landing pages cannot drift apart', () => {
    for (const key of styleSlugs()) {
      assert.ok(
        LANDING_PAGES.some((p) => p.key === key),
        `/styles/${key} is routable but has no content behind it`,
      );
    }
  });

  test('a kept slug resolves to no redirect', () => {
    for (const key of KEPT_STYLE_SLUGS) {
      assert.ok(isKeptStyleSlug(key), `${key} is not recognised as kept`);
      assert.equal(styleRedirectFor(key), null, `${key} would be redirected off its own page`);
    }
  });

  test('the destination every retired slug is given', () => {
    for (const [slug, group] of ALL_RETIRED) {
      assert.equal(styleRedirectFor(slug), DESTINATION[group], `${slug} maps somewhere unexpected`);
    }
  });

  test('an unknown slug is a real 404, not a soft 404', () => {
    assert.equal(styleRedirectFor('brand-new-slug-nobody-has-heard-of'), null);
    assert.equal(styleRedirectFor(''), null);
  });

  test('the redirect list ends in a catch-all, after the narrow rules', () => {
    const redirects = styleRedirects();
    assert.equal(redirects.length, STYLE_REDIRECT_RULES.length + 1);
    for (const r of redirects) {
      // `permanent: true` would emit a 308, which reads as "moved, maybe
      // temporarily" and leaves the old URL in the index.
      assert.equal(r.statusCode, 301, 'every /styles redirect must be a 301');
    }
    assert.equal(redirects.at(-1).destination, '/', 'the last rule must be the catch-all');
    // Order is load-bearing: Next takes the first match, so a catch-all ahead of
    // a narrow rule would swallow it.
    assert.ok(redirects.length >= 4);
  });
});

describe('styles material', () => {
  test('the style list is 25 distinct indexable catalog styles', () => {
    assert.equal(WORD_STYLES.length, WORDS_PER_KEYWORD);
    assert.equal(new Set(WORD_STYLES).size, WORD_STYLES.length, 'a style is used twice');
    for (const slug of WORD_STYLES) assert.ok(indexable.has(slug), `not indexable: ${slug}`);
  });

  test('the word list is 25 distinct words', () => {
    assert.equal(WORD_LIST.length, WORDS_PER_KEYWORD);
    assert.equal(new Set(WORD_LIST).size, WORD_LIST.length, 'a word is repeated');
  });

  test('the pool holds colour emoji, not text-presentation glyphs', () => {
    // A text-presentation emoji renders in the surrounding text colour, so it
    // would not look colourful at all. Each entry must carry Emoji_Presentation.
    for (const emoji of EMOJI_POOL) {
      assert.match(emoji, /\p{Emoji_Presentation}/u, `not colour emoji: ${emoji}`);
    }
  });

  test(`every word gets between ${EMOJI_MIN} and ${EMOJI_MAX} emoji`, () => {
    for (let w = 0; w < WORD_LIST.length; w++) {
      const n = emojiFor(w).length;
      assert.ok(n >= EMOJI_MIN && n <= EMOJI_MAX, `word ${w} got ${n} emoji`);
    }
  });

  test('emoji are drawn from the pool, never repeated, and never change', () => {
    for (let w = 0; w < WORD_LIST.length; w++) {
      const picked = emojiFor(w);
      assert.equal(new Set(picked).size, picked.length, 'a word repeats an emoji');
      for (const emoji of picked) assert.ok(EMOJI_POOL.includes(emoji), `${emoji} is not in the pool`);
    }
    assert.deepEqual(emojiFor(4), emojiFor(4));
  });

  test('every row is real styled Unicode wrapped in its emoji', () => {
    const rows = boardRows();
    assert.equal(rows.length, WORDS_PER_KEYWORD);
    for (const row of rows) {
      assert.ok(row.output.length > 0, `${row.slug} produced no output`);
      assert.notEqual(row.output, row.word, `${row.slug} left the word unstyled`);
      assert.ok(row.line.includes(row.output), `${row.slug} lost its styled output`);
      assert.equal(emojiIn(row.output), 0, `${row.slug} mixed emoji into the styled output`);
      const n = emojiIn(row.line);
      assert.ok(n >= EMOJI_MIN && n <= EMOJI_MAX, `${row.slug} line has ${n} emoji`);
    }
  });

  test('typed text replaces the sample word in every row', () => {
    const name = 'Ali';
    const rows = boardRows(name);
    for (let i = 0; i < rows.length; i++) {
      const styled = applyStyle(name, getStyle(WORD_STYLES[i]));
      assert.ok(rows[i].line.includes(styled), `row ${i} does not contain styled "${name}"`);
      // The sample is kept so the live script can restore it when the box empties.
      assert.equal(rows[i].word, WORD_LIST[i]);
    }
  });
});

describe('the /styles hub', () => {
  test('carries enough of its own words to justify an ad', () => {
    // The unit is gated on this. Below the floor the page stops rendering one,
    // which is a policy win but a revenue loss, so the floor is asserted as a
    // fact about the copy rather than left to be discovered in production.
    assert.ok(
      stylesHubWordCount() >= STYLES_HUB_AD_MIN_WORDS,
      `/styles has ${stylesHubWordCount()} words of its own, below the ${STYLES_HUB_AD_MIN_WORDS} floor`,
    );
  });

  test('every published limit is sourced to an official help page', () => {
    const official = new Set([
      'help.instagram.com',
      'support.tiktok.com',
      'www.tiktok.com',
      'help.x.com',
      'support.discord.com',
      'core.telegram.org',
      'faq.whatsapp.com',
    ]);
    assert.equal(STYLES_LIMIT_CHECKED, '2026-10-26');
    assert.ok(STYLES_LIMITS.length >= 5);
    for (const row of STYLES_LIMITS) {
      const url = new URL(row.sourceUrl);
      assert.equal(url.protocol, 'https:', `${row.platform} source is not HTTPS`);
      assert.ok(official.has(url.hostname), `${row.platform} source host is not an official help page: ${url.hostname}`);
      assert.ok(row.limit && row.note && row.sourceLabel, `${row.platform} ${row.field} is missing limit copy`);
    }
  });

  test('the ad decision follows the same rule everywhere', () => {
    assert.equal(stylesHubAdPlan().allowed, true);
    assert.equal(stylesHubAdPlan().words, stylesHubWordCount());
  });

  test('the gate closes when the copy falls below the floor', () => {
    assert.equal(adAllowedOn('/styles', { stylesHubWords: 0 }), false);
    assert.equal(adAllowedOn('/styles', { stylesHubWords: 299 }), false);
    assert.equal(adAllowedOn('/styles', { stylesHubWords: 300 }), true);
  });

  test('only the real-content pages are allowed an ad', () => {
    // /fonts itself is not on the list: it is an index of links. A /fonts/<slug>
    // style page is real content and is.
    for (const p of ['/', '/fonts/bold', '/styles', ...KEPT_STYLE_SLUGS.map((s) => `/styles/${s}`)]) {
      assert.ok(isAdAllowedPath(p), `${p} should be allowed an ad`);
    }
    for (const p of [
      '/fonts', '/tools', '/about', '/contact', '/privacy', '/terms', '/studio', '/embed',
      '/symbols', '/emoji', '/kaomoji', '/admin', '/admin/seo',
      '/styles/fancy-text-generator', '/styles/instagram-extra', '/fonts/bold/extra',
    ]) {
      assert.equal(isAdAllowedPath(p), false, `${p} must not be allowed an ad`);
      assert.equal(adAllowedOn(p), false, `${p} must not render an ad`);
    }
  });
});

describe('styles pages', () => {
  let server;
  before(async () => { server = await startServer(3251); });
  after(() => server?.stop());

  test('GET /styles is the hub, not a redirect', async () => {
    const res = await get(server.base, '/styles', { redirect: 'manual' });
    assert.equal(res.status, 200);
    const doc = markup(await res.text());
    assert.equal((doc.match(/<h1[ >]/g) || []).length, 1);
    assert.match(doc, /<h1[^>]*>Fancy text styles, side by side<\/h1>/);
    assert.match(doc, /<link rel="canonical"/);
  });

  test('renders field guidance, sourced limits and accessibility notes', async () => {
    const doc = markup(await (await get(server.base, '/styles')).text());
    assert.ok(doc.includes('id="styles-fields"'), 'field guidance section missing');
    assert.ok(doc.includes('id="styles-limits"'), 'source-backed limits section missing');
    assert.ok(doc.includes('id="styles-accessibility"'), 'accessibility section missing');
    for (const row of STYLES_FIELD_ROWS) assert.ok(doc.includes(row.field), `field row missing: ${row.field}`);
    assert.equal((doc.match(/rel="noopener noreferrer"/g) || []).length, STYLES_LIMITS.length);
  });

  test('GET /styles shows 25 styled words with emoji and a copy button each', async () => {
    const doc = markup(await (await get(server.base, '/styles')).text());
    const outs = [...doc.matchAll(/<p class="out"[^>]*>([^<]*)<\/p>/g)].map((m) => m[1]);
    assert.equal(outs.length, WORDS_PER_KEYWORD, `expected ${WORDS_PER_KEYWORD} rows, got ${outs.length}`);
    for (const out of outs) {
      const n = emojiIn(out);
      assert.ok(n >= EMOJI_MIN && n <= EMOJI_MAX, `a row has ${n} emoji`);
    }
    assert.equal((doc.match(/data-copy="/g) || []).length, WORDS_PER_KEYWORD);
    assert.match(doc, /<form class="gen"/);
    assert.match(doc, /name="text"/);
    assert.match(doc, /data-input/, 'the live script needs data-input on the textarea');
  });

  test('rows carry the emoji split so the live script can re-wrap', async () => {
    const doc = markup(await (await get(server.base, '/styles')).text());
    const befores = [...doc.matchAll(/data-emoji-before="([^"]*)"/g)].map((m) => m[1]);
    const afters = [...doc.matchAll(/data-emoji-after="([^"]*)"/g)].map((m) => m[1]);
    assert.equal(befores.length, WORDS_PER_KEYWORD);
    assert.equal(afters.length, WORDS_PER_KEYWORD);
    for (let i = 0; i < befores.length; i++) {
      const total = emojiIn(befores[i]) + emojiIn(afters[i]);
      assert.ok(total >= EMOJI_MIN && total <= EMOJI_MAX, `row ${i} split loses emoji: ${total}`);
    }
  });

  test('?text= renders the typed text in all rows', async () => {
    const name = 'Ali';
    const doc = markup(await (await get(server.base, `/styles?text=${name}`)).text());
    const outs = [...doc.matchAll(/<p class="out"[^>]*>([^<]*)<\/p>/g)].map((m) => m[1]);
    assert.equal(outs.length, WORDS_PER_KEYWORD);
    for (let i = 0; i < outs.length; i++) {
      assert.ok(outs[i].includes(applyStyle(name, getStyle(WORD_STYLES[i]))), `row ${i} did not restyle`);
    }
  });

  test('the hub links to all six guides and to nothing that redirects', async () => {
    const doc = markup(await (await get(server.base, '/styles')).text());
    for (const key of KEPT_STYLE_SLUGS) {
      assert.ok(doc.includes(`href="/styles/${key}"`), `the hub does not link /styles/${key}`);
    }
    for (const [slug] of ALL_RETIRED) {
      assert.ok(!doc.includes(`/styles/${slug}`), `the hub still links to the retired /styles/${slug}`);
    }
  });

  test('the six landing pages are still live', async () => {
    for (const key of KEPT_STYLE_SLUGS) {
      const res = await get(server.base, `/styles/${key}`, { redirect: 'manual' });
      assert.equal(res.status, 200, `/styles/${key} is broken`);
    }
  });
});

describe('retired /styles/* pages', () => {
  let server;
  before(async () => { server = await startServer(3252); });
  after(() => server?.stop());

  for (const [slug, group] of ALL_RETIRED) {
    test(`GET /styles/${slug} 301s to ${DESTINATION[group]} and never renders`, async () => {
      const res = await get(server.base, `/styles/${slug}`, { redirect: 'manual' });
      assert.equal(res.status, 301, `/styles/${slug} answered ${res.status} instead of redirecting`);
      const to = new URL(res.headers.get('location'), server.base).pathname;
      assert.equal(to, DESTINATION[group], `/styles/${slug} redirected to ${to}`);
      // Next sends a small body naming the destination. What must never appear
      // is rendered page content: no heading, no ad slot, no HTML document.
      const body = await res.text();
      assert.ok(body.length < 200, `/styles/${slug} served ${body.length} bytes of body`);
      assert.doesNotMatch(body, /<h1|<html|adsbygoogle|ad-slot/,
        `/styles/${slug} rendered page content instead of redirecting`);
    });
  }

  test('a slug nobody has seen before 404s, not redirects', async () => {
    // Only the 32 known keyword-board URLs are redirected. An arbitrary slug
    // must reach the real 404 page; a 301 to the home page would be a soft 404.
    for (const slug of ['some-new-keyword-page', 'fancy-text-generator-2027', 'tiktok-fancy-text']) {
      const res = await get(server.base, `/styles/${slug}`, { redirect: 'manual' });
      assert.equal(res.status, 404, `/styles/${slug} answered ${res.status}`);
      const html = await res.text();
      assert.match(html, /<title>Page not found \| Stylzo<\/title>/);
      assert.match(html, /<meta name="robots" content="noindex/);
    }
  });

  test('a redirect carries its query string through', async () => {
    const res = await get(server.base, '/styles/fancy-text-generator-2024?text=Ali', { redirect: 'manual' });
    assert.equal(res.status, 301);
    assert.match(res.headers.get('location'), /\?text=Ali/);
  });

  test('the retired pages are gone from the sitemap', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    for (const [slug] of ALL_RETIRED) {
      assert.ok(!sm.includes(`/styles/${slug}</loc>`), `the sitemap still lists /styles/${slug}`);
    }
  });

  test('the sitemap lists only the seven real /styles pages', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    const listed = [...sm.matchAll(/<loc>([^<]*\/styles[^<]*)<\/loc>/g)]
      .map((m) => new URL(m[1].replace(/&amp;/g, '&')).pathname);
    const expected = ['/styles', ...KEPT_STYLE_SLUGS.map((s) => `/styles/${s}`)];
    assert.deepEqual(listed.sort(), expected.sort(), `sitemap /styles pages: ${listed.join(', ')}`);
  });

  test('every page the sitemap lists is still a 200, not a redirect', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    const redirected = [];
    for (const p of urls) {
      const res = await get(server.base, p, { redirect: 'manual' });
      if (res.status !== 200) redirected.push(`${p} (${res.status})`);
    }
    assert.deepEqual(redirected, [], 'the sitemap points at pages that redirect');
  });

  test('no retired page renders an ad', onlyWith(ADS_ON), async () => {
    // The bug being fixed: an ad box on a page with nothing behind it. Checked
    // against the redirect, so a 301 that somehow carried a body would fail too.
    for (const [slug] of ALL_RETIRED) {
      const res = await get(server.base, `/styles/${slug}`, { redirect: 'manual' });
      const html = await res.text();
      assert.equal(res.status, 301, `/styles/${slug} answered ${res.status}`);
      assert.equal(adUnits(html), 0, `/styles/${slug} served an ad unit`);
    }
  });

  test('a new spam slug cannot render an ad either', onlyWith(ADS_ON), async () => {
    const res = await get(server.base, '/styles/keyword-that-does-not-exist-yet', { redirect: 'manual' });
    assert.equal(res.status, 404);
    assert.equal(adUnits(await res.text()), 0);
  });
});

describe('the ad allowlist, against the running site', () => {
  let server;
  before(async () => { server = await startServer(3253); });
  after(() => server?.stop());

  test('pages outside the allowlist carry no ad', async () => {
    for (const p of [
      '/fonts', '/tools', '/about', '/contact', '/privacy', '/terms',
      '/studio', '/symbols', '/emoji', '/kaomoji', '/embed',
    ]) {
      assert.equal(adUnits(await (await get(server.base, p)).text()), 0, `${p} renders an ad unit`);
    }
  });

  test('the real-content pages carry exactly one ad', onlyWith(ADS_ON), async () => {
    for (const p of ['/', '/styles', ...KEPT_STYLE_SLUGS.map((s) => `/styles/${s}`)]) {
      const n = adUnits(await (await get(server.base, p)).text());
      assert.equal(n, 1, `${p} should carry exactly one ad, found ${n}`);
    }
  });

  test('the hub clears the word floor it gates its ad on', async () => {
    const html = await (await get(server.base, '/styles')).text();
    const main = (html.match(/<main[\s\S]*?<\/main>/) || [html])[0];
    const words = main.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    assert.ok(words >= STYLES_HUB_AD_MIN_WORDS, `/styles renders ${words} words`);
  });
});
