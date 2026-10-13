import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../../services/catalog.js';
import { env } from '../../config/environment.js';
import { keyFacts, appFeatures } from '../../lib/facts.js';
import { organizationLd } from '../../services/seo.js';
import {
  BOARD_SIZE, WORDS_PER_KEYWORD, EMOJI_MIN, EMOJI_MAX,
} from '../../lib/keyword-board.js';

// Generative engines quote short, standalone claims. These tests protect the
// property that makes a quote safe: every number is real and every number is
// stated where a reader can see it.

describe('quotable facts', () => {
  const facts = keyFacts();

  test('every fact carries a label, a value and a restatement', () => {
    for (const f of facts) {
      assert.ok(f.id, 'a fact needs an id');
      assert.ok(f.label.length > 3, `thin label: "${f.label}"`);
      assert.ok(f.value.length > 0, `${f.id} has no value`);
      assert.ok(f.detail.length > 40, `${f.id} has a restatement too short to quote alone`);
    }
  });

  test('fact ids are unique', () => {
    assert.equal(new Set(facts.map((f) => f.id)).size, facts.length);
  });

  test('the style count is the real catalog count, not a remembered one', () => {
    const styles = facts.find((f) => f.id === 'styles');
    assert.equal(
      styles.value,
      catalog().styles.length.toLocaleString('en-US'),
      'the quoted style total has drifted from the catalog',
    );
  });

  test('the style count is a plain integer with no stray characters', () => {
    // A model will lift this verbatim into an answer, so it has to survive
    // being copied without a leading symbol or a trailing note.
    assert.match(facts.find((f) => f.id === 'styles').value, /^[\d,]+$/);
  });

  test('the category and style-page counts match the catalog', () => {
    assert.equal(
      facts.find((f) => f.id === 'categories').value,
      String(Object.keys(catalog().categories).length),
    );
    assert.equal(
      facts.find((f) => f.id === 'style-pages').value,
      String(catalog().indexable),
    );
  });

  test('the board fact uses the real board constants', () => {
    const board = facts.find((f) => f.id === 'board');
    assert.ok(
      board.value.includes(String(BOARD_SIZE)) && board.value.includes(String(WORDS_PER_KEYWORD)),
      `the quoted board size is not ${BOARD_SIZE} keywords of ${WORDS_PER_KEYWORD} words`,
    );
    assert.ok(
      board.detail.includes(String(EMOJI_MIN)) && board.detail.includes(String(EMOJI_MAX)),
      'the quoted emoji range has drifted from EMOJI_MIN/EMOJI_MAX',
    );
  });

  test('every number a fact quotes is restated in its own detail', () => {
    // A detail that contradicts its headline is the failure a model cannot
    // detect, because each half looks fine alone. The invariant is that no
    // figure appears as a claim without being repeated in the sentence that
    // gives it context.
    const bare = (s) => s.replace(/,/g, '');
    for (const f of facts) {
      const quoted = bare(f.value).match(/\d+/g) || [];
      for (const n of quoted) {
        assert.ok(
          bare(f.detail).includes(n),
          `${f.id} quotes "${f.value}" but its detail never repeats the figure ${n}`,
        );
      }
    }
  });

  test('the studio figure agrees between the fact and the studio page', () => {
    // 1200x630 is quoted in the fact, the HowTo description and the page
    // itself. Two different numbers across those three is how an assistant
    // ends up contradicting the site it is citing.
    const studio = facts.find((f) => f.id === 'studio');
    assert.match(studio.value, /1200 by 630/);
    assert.match(studio.detail, /1200 by 630/);
  });

  test('the feature list describes things that exist', () => {
    const list = appFeatures();
    assert.ok(list.length >= 4, 'a feature list this short describes nothing');
    for (const item of list) {
      assert.ok(item.length > 20, `feature too thin to be true: "${item}"`);
    }
    // The style counts in the feature list must not drift either.
    assert.ok(
      list.some((f) => f.includes(catalog().styles.length.toLocaleString('en-US'))),
      'the feature list no longer states how many styles there are',
    );
  });
});

describe('brand identity', () => {
  test('sameAs is only ever a configured profile, and only https', () => {
    assert.ok(
      env.sameAs.every((u) => u.startsWith('https://')),
      `a non-https or unfiltered sameAs entry got through: ${env.sameAs.join(', ')}`,
    );
    const org = organizationLd();
    if (env.sameAs.length) {
      assert.deepEqual(org.sameAs, env.sameAs);
    } else {
      assert.equal(
        org.sameAs,
        undefined,
        'sameAs was invented with no profiles configured',
      );
    }
  });

  test('the organization stays linked to the publisher id used across the site', () => {
    // Attribution depends on one canonical Organization node; a second,
    // slightly different one splits the identity it is meant to establish.
    assert.ok(organizationLd()['@id'].endsWith('#organization'));
    assert.equal(organizationLd().name, 'Stylzo');
  });
});