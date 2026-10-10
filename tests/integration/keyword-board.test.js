import { test, describe, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { get, startServer } from '../helpers/server.js';
import {
  keywordBoard, boardEntry, boardRows, boardKeywords, boardSlugs, emojiFor, slugify,
  WORD_LIST, WORD_STYLES, EMOJI_POOL, BOARD_SIZE, WORDS_PER_KEYWORD, EMOJI_MIN, EMOJI_MAX,
} from '../../lib/keyword-board.js';
import { LANDING_PAGE_KEYS } from '../../lib/landing-pages.js';
import { catalog, getStyle } from '../../services/catalog.js';
import { applyStyle } from '../../services/unicode/engine.js';

const indexable = new Set(catalog().styles.filter((s) => s.indexable).map((s) => s.slug));

// Emoji are counted as sequences, because several are two code points joined by a
// zero-width joiner or end in a variation selector.
const emojiIn = (text) => (String(text).match(/\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu) || []).length;

const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

describe('keyword board data', () => {
  test('the board lists the first 25 keywords from data/keywords.txt', () => {
    const board = keywordBoard();
    assert.equal(board.length, BOARD_SIZE);
    assert.equal(boardKeywords()[0].keyword, 'fancy text generator');
    // Positions are dense and 1-based so the list reads as an ordered column.
    board.forEach((e, i) => assert.equal(e.position, i + 1));
  });

  test('every entry has a unique, URL-safe slug', () => {
    const board = keywordBoard();
    const slugs = board.map((e) => e.slug);
    assert.equal(new Set(slugs).size, slugs.length, 'two keywords share a slug');
    for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `unsafe slug: ${slug}`);
  });

  test('slugify handles spacing, punctuation and case', () => {
    assert.equal(slugify('Fancy Text Generator'), 'fancy-text-generator');
    assert.equal(slugify('copy and paste fancy text'), 'copy-and-paste-fancy-text');
    assert.equal(slugify('  Spaced  Out  '), 'spaced-out');
  });

  test('boardEntry resolves a slug and rejects anything else', () => {
    assert.equal(boardEntry('fancy-text-generator').keyword, 'fancy text generator');
    assert.equal(boardEntry('not-a-real-slug'), null);
  });

  test('the style list is 25 distinct indexable catalog styles', () => {
    assert.equal(WORD_STYLES.length, WORDS_PER_KEYWORD);
    assert.equal(new Set(WORD_STYLES).size, WORD_STYLES.length, 'a style is used twice');
    for (const slug of WORD_STYLES) assert.ok(indexable.has(slug), `not indexable: ${slug}`);
  });

  test('the word list is 25 distinct words', () => {
    assert.equal(WORD_LIST.length, WORDS_PER_KEYWORD);
    assert.equal(new Set(WORD_LIST).size, WORD_LIST.length, 'a word is repeated');
  });

  test('every entry has a unique title, description and heading', () => {
    const board = keywordBoard();
    assert.equal(new Set(board.map((e) => e.title)).size, board.length, 'duplicate titles');
    assert.equal(new Set(board.map((e) => e.description)).size, board.length, 'duplicate descriptions');
    assert.equal(new Set(board.map((e) => e.heading)).size, board.length, 'duplicate headings');
    assert.equal(new Set(board.map((e) => e.intro)).size, board.length, 'duplicate introductions');
  });
});

describe('emoji decoration', () => {
  test('the pool holds colour emoji, not text-presentation glyphs', () => {
    // A text-presentation emoji renders in the surrounding text colour, so it
    // would not look colourful at all. Each entry must carry Emoji_Presentation.
    for (const emoji of EMOJI_POOL) {
      assert.match(emoji, /\p{Emoji_Presentation}/u, `not colour emoji: ${emoji}`);
    }
  });

  test(`every word gets between ${EMOJI_MIN} and ${EMOJI_MAX} emoji`, () => {
    for (let k = 0; k < BOARD_SIZE; k++) {
      for (let w = 0; w < WORD_LIST.length; w++) {
        const n = emojiFor(k + 1, w).length;
        assert.ok(n >= EMOJI_MIN && n <= EMOJI_MAX, `word ${w} of keyword ${k + 1} got ${n} emoji`);
      }
    }
  });

  test('emoji are drawn from the pool and never repeated inside one word', () => {
    for (let k = 0; k < BOARD_SIZE; k++) {
      for (let w = 0; w < WORD_LIST.length; w++) {
        const picked = emojiFor(k + 1, w);
        assert.equal(new Set(picked).size, picked.length, 'a word repeats an emoji');
        for (const emoji of picked) assert.ok(EMOJI_POOL.includes(emoji), `${emoji} is not in the pool`);
      }
    }
  });

  test('the same keyword and word always produce the same emoji', () => {
    assert.deepEqual(emojiFor(3, 7), emojiFor(3, 7));
  });

  test('different keyword pages decorate the same word differently', () => {
    const first = emojiFor(1, 0).join('');
    const differs = [...Array(BOARD_SIZE).keys()].some((k) => emojiFor(k + 1, 0).join('') !== first);
    assert.ok(differs, 'every keyword page decorates the first word identically');
  });
});

describe('board rows', () => {
  const rows = boardRows(1);

  test('there is one row per style, and every style is distinct', () => {
    assert.equal(rows.length, WORDS_PER_KEYWORD);
    assert.equal(new Set(rows.map((r) => r.slug)).size, rows.length, 'a style repeats across rows');
  });

  test('every row is real styled Unicode, not the plain word', () => {
    for (const row of rows) {
      assert.ok(row.output.length > 0, `${row.slug} produced no output`);
      assert.notEqual(row.output, row.word, `${row.slug} left the word unstyled`);
      assert.ok(row.line.includes(row.output), `${row.slug} lost its styled output in the decorated line`);
    }
  });

  test('the decorated line carries the emoji around the styled word', () => {
    for (const row of rows) {
      const n = emojiIn(row.line);
      assert.ok(n >= EMOJI_MIN && n <= EMOJI_MAX, `${row.slug} line has ${n} emoji`);
      // The emoji wrap the word rather than sitting on one side of it.
      assert.match(row.line, /^\S+ /, `${row.slug} does not start with an emoji`);
      assert.ok(row.line.trimEnd().endsWith(row.emoji.at(-1)), `${row.slug} does not end with an emoji`);
    }
  });

  test('the styled word itself carries no emoji, so the style is not mangled', () => {
    for (const row of rows) {
      assert.equal(emojiIn(row.output), 0, `${row.slug} mixed emoji into the styled output`);
    }
  });

  test('the copy text is the full decorated line', () => {
    for (const row of rows) assert.equal(row.line, row.line.trim());
  });
});

describe('board routing', () => {
  test('board slugs cover the board and never collide with a landing page', () => {
    const slugs = boardSlugs();
    assert.equal(new Set(slugs).size, slugs.length, 'duplicate slug in the /styles route set');
    for (const entry of keywordBoard()) assert.ok(slugs.includes(entry.slug), `${entry.slug} is not routable`);
    for (const key of LANDING_PAGE_KEYS) assert.ok(slugs.includes(key), `landing page ${key} is not routable`);
    // A board slug that shadows a landing page would silently serve the wrong page.
    for (const entry of keywordBoard()) {
      assert.ok(!LANDING_PAGE_KEYS.includes(entry.slug), `${entry.slug} collides with a landing page key`);
    }
  });
});

describe('keyword board pages', () => {
  let server;
  before(async () => { server = await startServer(3251); });
  after(() => server?.stop());

  test('GET /styles is the vertical board, not a redirect', async () => {
    const res = await get(server.base, '/styles', { redirect: 'manual' });
    assert.equal(res.status, 200);
    const doc = markup(await res.text());
    assert.equal((doc.match(/<h1[ >]/g) || []).length, 1);
    assert.match(doc, /<h1[^>]*>Fancy text keyword board<\/h1>/);
    assert.match(doc, /<link rel="canonical"/);
  });

  test('GET /styles lists all 25 keywords in one vertical column', async () => {
    const doc = markup(await (await get(server.base, '/styles')).text());
    const list = doc.slice(doc.indexOf('class="kw-boards-list"'), doc.indexOf('class="kw-empty"'));
    const links = list.match(/<li>/g) || [];
    assert.equal(links.length, BOARD_SIZE, 'the board does not list 25 keywords');
    for (const entry of keywordBoard()) {
      assert.ok(list.includes(`href="/styles/${entry.slug}"`), `the board is missing ${entry.keyword}`);
    }
    // One column, not a wrapping grid.
    assert.equal((list.match(/class="kw-boards-list"/g) || []).length, 1);
  });

  for (const entry of keywordBoard()) {
    test(`GET /styles/${entry.slug} shows 25 styled words with ${EMOJI_MIN} to ${EMOJI_MAX} emoji each`, async () => {
      const path = `/styles/${entry.slug}`;
      const res = await get(server.base, path);
      assert.equal(res.status, 200);
      const doc = markup(await res.text());

      const cards = doc.match(/data-style-id=/g) || [];
      assert.equal(cards.length, WORDS_PER_KEYWORD, `${entry.slug} rendered ${cards.length} words`);

      const outs = [...doc.matchAll(/<p class="out"[^>]*>([^<]*)<\/p>/g)].map((m) => m[1]);
      assert.equal(outs.length, WORDS_PER_KEYWORD, `${entry.slug} rendered the wrong number of outputs`);
      for (const out of outs) {
        const n = emojiIn(out);
        assert.ok(n >= EMOJI_MIN && n <= EMOJI_MAX, `${entry.slug} has a word with ${n} emoji`);
      }

      assert.equal((doc.match(/<h1[ >]/g) || []).length, 1, 'expected exactly one h1');
      assert.match(doc, new RegExp(`<h1[^>]*>${entry.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      assert.match(doc, new RegExp(`<link rel="canonical" href="[^"]*${entry.slug}"`));
      assert.match(doc, /<meta name="robots" content="index,follow"/);
    });

    test(`GET /styles/${entry.slug} copies the full decorated line`, async () => {
      const doc = markup(await (await get(server.base, `/styles/${entry.slug}`)).text());
      const copies = [...doc.matchAll(/data-copy-text="([^"]*)"/g)].map((m) => m[1]);
      assert.equal(copies.length, WORDS_PER_KEYWORD, 'every row needs a copy target');
      for (const line of copies) {
        const n = emojiIn(line);
        assert.ok(n >= EMOJI_MIN && n <= EMOJI_MAX, `copy text has ${n} emoji: ${line}`);
      }
      assert.equal((doc.match(/data-copy="/g) || []).length, WORDS_PER_KEYWORD, 'every row needs a copy button');
    });
  }

  test('every board word page is listed in the sitemap exactly once', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    const locations = (sm.match(/<loc>[^<]+<\/loc>/g) || []);
    for (const entry of keywordBoard()) {
      const path = `/styles/${entry.slug}`;
      const hits = locations.filter((loc) => new URL(loc.slice(5, -6)).pathname === path);
      assert.equal(hits.length, 1, `sitemap lists ${path} ${hits.length} times`);
    }
    assert.ok(sm.includes('/styles</loc>'), 'the board index is missing from the sitemap');
  });

  test('an unknown board slug is a 404', async () => {
    assert.equal((await get(server.base, '/styles/definitely-not-a-keyword')).status, 404);
  });

  test('the original landing pages still work under /styles', async () => {
    for (const key of LANDING_PAGE_KEYS) {
      assert.equal((await get(server.base, `/styles/${key}`)).status, 200, `/styles/${key} is broken`);
    }
  });

  test('the board is one click away from every page via the site nav', async () => {
    // The board is easy to miss, so it needs to sit in the main nav rather than only
    // in the footer-style related-pages rows.
    for (const path of ['/', '/styles', '/styles/fancy-text-generator', '/fonts', '/styles/whatsapp']) {
      const html = await (await get(server.base, path)).text();
      assert.match(html, /<a href="\/styles">Fancy Keyword board<\/a>/, `${path} does not link to the board in its nav`);
    }
  });

  test('every keyword page has the text generator input', async () => {
    for (const entry of keywordBoard()) {
      const doc = markup(await (await get(server.base, `/styles/${entry.slug}`)).text());
      assert.match(doc, /<form class="gen"/, `${entry.slug} is missing the generator form`);
      assert.match(doc, /name="text"/, `${entry.slug} input is missing name="text"`);
      assert.match(doc, /data-input/, `${entry.slug} textarea is missing data-input for the live script`);
      assert.match(doc, new RegExp(`action="/styles/${entry.slug}"`), `${entry.slug} form does not post back to itself`);
    }
  });

  test('?text= renders the typed text in all 25 rows', async () => {
    const name = 'Ali';
    const doc = markup(await (await get(server.base, `/styles/fancy-text-generator?text=${name}`)).text());
    const outs = [...doc.matchAll(/<p class="out"[^>]*>([^<]*)<\/p>/g)].map((m) => m[1]);
    assert.equal(outs.length, WORDS_PER_KEYWORD, 'expected 25 rows');
    for (let i = 0; i < outs.length; i++) {
      // Each row styles the typed text through its own pipeline, so the raw
      // "Ali" will not appear literally — check the styled form instead.
      const style = getStyle(WORD_STYLES[i]);
      const styled = applyStyle(name, style);
      assert.ok(outs[i].includes(styled), `row ${i} does not contain styled "${name}": ${outs[i]}`);
      const n = emojiIn(outs[i]);
      assert.ok(n >= EMOJI_MIN && n <= EMOJI_MAX, `row ${i} has ${n} emoji`);
    }
  });

  test('?text= pages are noindex while the clean URL stays indexable', async () => {
    const clean = await (await get(server.base, '/styles/fancy-text-generator')).text();
    assert.match(clean, /<meta name="robots" content="index,follow"/, 'clean URL must stay indexable');
    const withText = await (await get(server.base, '/styles/fancy-text-generator?text=Ali')).text();
    assert.match(withText, /<meta name="robots" content="noindex/, '?text= must be noindex');
  });

  test('clearing the input restores the sample words via data-word', async () => {
    for (const entry of keywordBoard().slice(0, 3)) {
      const doc = markup(await (await get(server.base, `/styles/${entry.slug}`)).text());
      const words = [...doc.matchAll(/data-word="([^"]*)"/g)].map((m) => m[1]);
      assert.equal(words.length, WORDS_PER_KEYWORD, `${entry.slug} rows are missing data-word`);
      for (let i = 0; i < words.length; i++) {
        assert.equal(words[i], WORD_LIST[i], `${entry.slug} row ${i} fallback word is wrong`);
      }
    }
  });

  test('rows carry the emoji split so the live script can re-wrap', async () => {
    const doc = markup(await (await get(server.base, '/styles/fancy-text-generator')).text());
    const befores = [...doc.matchAll(/data-emoji-before="([^"]*)"/g)].map((m) => m[1]);
    const afters = [...doc.matchAll(/data-emoji-after="([^"]*)"/g)].map((m) => m[1]);
    assert.equal(befores.length, WORDS_PER_KEYWORD, 'every row needs data-emoji-before');
    assert.equal(afters.length, WORDS_PER_KEYWORD, 'every row needs data-emoji-after');
    for (let i = 0; i < befores.length; i++) {
      const total = emojiIn(befores[i]) + emojiIn(afters[i]);
      assert.ok(total >= EMOJI_MIN && total <= EMOJI_MAX, `row ${i} split loses emoji: ${total}`);
    }
  });
});