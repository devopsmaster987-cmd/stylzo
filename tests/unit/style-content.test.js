import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../../services/catalog.js';
import { styleContent, styleKind } from '../../lib/style-content.js';

const indexable = catalog().styles.filter((s) => s.indexable);

/** The prose a font page renders, excluding the rendered examples. */
function proseFor(style) {
  const c = styleContent(style);
  return [c.how, c.fact, c.distinct, c.supportAdvice, ...c.uses, ...c.appNotes.map((a) => a.join(' '))]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('font page content', () => {
  test('the catalog has the indexable pages this is written for', () => {
    assert.equal(indexable.length, 100);
  });

  test('no two pages share the same prose', () => {
    // Regression: the first version varied by category only, which left 29 of
    // 100 pages byte-identical to a sibling. That is duplicate content, which is
    // both a ranking problem and an AdSense low-value-content risk.
    const blocks = new Map();
    const dupes = [];
    for (const style of indexable) {
      const prose = proseFor(style);
      if (blocks.has(prose)) dupes.push(`${style.slug} is identical to ${blocks.get(prose)}`);
      else blocks.set(prose, style.slug);
    }
    assert.deepEqual(dupes, [], `\n${dupes.join('\n')}`);
  });

  test('no page is a near-duplicate of another', () => {
    const list = indexable.map((s) => [s.slug, proseFor(s)]);
    const worst = { sim: 0, a: '', b: '' };
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = new Set(list[i][1].split(' '));
        const b = new Set(list[j][1].split(' '));
        let shared = 0;
        for (const w of a) if (b.has(w)) shared += 1;
        const sim = shared / (a.size + b.size - shared);
        if (sim > worst.sim) Object.assign(worst, { sim, a: list[i][0], b: list[j][0] });
      }
    }
    // Genuinely related styles (zalgo-heavy vs zalgo-medium) sit just under
    // this. Anything above means the copy is template filler.
    assert.ok(worst.sim < 0.95, `${worst.a} and ${worst.b} overlap ${(worst.sim * 100).toFixed(0)}%`);
  });

  test('every page carries enough prose to be worth indexing', () => {
    for (const style of indexable) {
      const words = proseFor(style).split(' ').filter(Boolean).length;
      assert.ok(words >= 90, `${style.slug} has only ${words} words of prose`);
    }
  });

  test('examples are real rendered output, not descriptions', () => {
    for (const style of indexable) {
      const c = styleContent(style);
      assert.equal(c.examples.length, 3, `${style.slug} should show three examples`);
      for (const ex of c.examples) {
        assert.ok(ex.output && ex.output.length > 1, `${style.slug} produced an empty example`);
        assert.ok(ex.plain, `${style.slug} does not show what was typed`);
        // A real transform changes the text. An unchanged string means the
        // pipeline silently did nothing for this style, which is exactly the
        // bug the flair styles had: a seeded RNG returned the same value on
        // every call, so short phrases came back undecorated.
        assert.notEqual(ex.output, ex.plain, `${style.slug} example is unstyled`);
      }
    }
  });

  test('a modifier shows itself combined with a letter style', () => {
    // An underline on plain text is barely visible, so the examples pair it
    // with something that makes the effect legible.
    for (const style of indexable.filter((s) => styleKind(s).kind === 'combine')) {
      const c = styleContent(style);
      assert.ok(c.examples[0].output.length > 1, `${style.slug} rendered nothing`);
      assert.ok(
        c.examples.every((e) => /[\u0300-\u036F]/.test(e.output)),
        `${style.slug} should show a combining mark on every example`,
      );
    }
  });

  test('a flair style actually scatters its symbols', () => {
    // Regression: the seeded RNG replayed the same value on every call, so with
    // some seeds a short name came back with no symbol at all. A user typing
    // their name got unstyled text back with no indication anything was wrong.
    for (const style of indexable.filter((s) => styleKind(s).kind !== 'case' && s.pipeline?.some((p) => p.type === 'flair'))) {
      for (const ex of styleContent(style).examples) {
        const added = [...ex.output].filter((c) => !ex.plain.includes(c));
        assert.ok(added.length > 0, `${style.slug} added no symbol to "${ex.plain}"`);
      }
    }
  });

  test('the visitors own text replaces the first example', () => {
    const style = indexable.find((s) => s.slug === 'bold');
    const withText = styleContent(style, 'Ali');
    assert.equal(withText.examples[0].plain, 'Ali');
    assert.ok(withText.examples[0].output.includes('\u{1D400}'), 'the typed text was not styled');
  });

  test('the same style always produces the same content', () => {
    // Content is generated per request. If it varied, the page would differ
    // between crawls and could never be cached or compared.
    for (const style of indexable.slice(0, 20)) {
      assert.equal(proseFor(style), proseFor(style));
      assert.deepEqual(
        styleContent(style).examples.map((e) => e.output),
        styleContent(style).examples.map((e) => e.output),
      );
    }
  });

  test('every style is classified into a kind the copy understands', () => {
    const kinds = new Set(indexable.map((s) => styleKind(s).kind));
    for (const expected of ['map', 'combine', 'frame', 'zalgo', 'transform']) {
      assert.ok(kinds.has(expected), `no indexable style uses the "${expected}" pipeline`);
    }
    for (const style of indexable) {
      const c = styleContent(style);
      assert.ok(c.how.length > 60, `${style.slug} has no explanation of how it works`);
      assert.ok(c.distinct.length > 40, `${style.slug} has nothing distinguishing it from its neighbours`);
      assert.ok(c.appNotes.length >= 2, `${style.slug} names no apps`);
      assert.equal(c.uses.length, 3);
      assert.equal(new Set(c.uses).size, 3, `${style.slug} repeats a use case`);
    }
  });
});