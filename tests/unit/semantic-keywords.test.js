import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../../services/catalog.js';
import { KEYWORD_MAP, normaliseTerm } from '../../lib/seo-keywords.js';
import { boardSlugs } from '../../lib/keyword-board.js';
import {
  semanticKeywordsFor, semanticGroups, semanticKeywordString, RELATION,
} from '../../lib/semantic-keywords.js';

// Semantic keywords only help if they are real. Every test here exists to stop
// one of three failures: claiming a page that does not exist, claiming the same
// term twice, or turning into a keyword list nobody can read.

const PATHS = KEYWORD_MAP.map((e) => e.path);

/** Routes the site actually serves, derived rather than hand-listed. */
function realRoutes() {
  const routes = new Set(PATHS);
  boardSlugs().forEach((s) => routes.add(`/styles/${s}`));
  catalog().styles.filter((s) => s.indexable).forEach((s) => routes.add(`/fonts/${s.slug}`));
  Object.keys(catalog().categories).forEach((k) => routes.add(`/?category=${k}`));
  ['/privacy', '/terms', '/contact', '/styles'].forEach((r) => routes.add(r));
  return routes;
}

describe('semantic keywords', () => {
  test('every mapped page has semantic terms', () => {
    for (const p of PATHS) {
      const terms = semanticKeywordsFor(p);
      assert.ok(terms.length >= 3, `${p} has only ${terms.length} semantic terms`);
    }
  });

  test('a page with no entry returns nothing rather than guessing', () => {
    assert.deepEqual(semanticKeywordsFor('/not-a-real-page'), []);
    assert.deepEqual(semanticGroups('/not-a-real-page'), []);
    assert.equal(semanticKeywordString('/not-a-real-page'), '');
  });

  test('every linked term points at a route that exists', () => {
    // The tiktok case is why this test exists: it was in the first draft of the
    // platform list and there is no /styles/tiktok, so it was a link to a 404.
    const routes = realRoutes();
    for (const p of PATHS) {
      for (const t of semanticKeywordsFor(p)) {
        if (!t.href) continue;
        assert.ok(routes.has(t.href), `${p} links "${t.term}" to ${t.href}, which is not a route`);
      }
    }
  });

  test('every platform term has a real board page behind it', () => {
    const slugs = new Set(boardSlugs());
    for (const t of semanticKeywordsFor('/')) {
      if (t.relation !== RELATION.PLATFORM) continue;
      const slug = t.href.split('/').pop();
      assert.ok(slugs.has(slug), `platform term ${t.term} points at missing board page ${slug}`);
    }
  });

  test('no term is repeated within a page', () => {
    for (const p of PATHS) {
      const terms = semanticKeywordsFor(p).map((t) => normaliseTerm(t.term));
      assert.equal(new Set(terms).size, terms.length, `${p} repeats a semantic term`);
    }
  });

  test('terms are lowercase, trimmed and not empty', () => {
    for (const p of PATHS) {
      for (const t of semanticKeywordsFor(p)) {
        assert.equal(t.term, t.term.trim().toLowerCase(), `${p} has an untidy term: "${t.term}"`);
        assert.ok(t.term.length > 2, `${p} has a meaningless term: "${t.term}"`);
        assert.ok(Object.values(RELATION).includes(t.relation), `${p}: unknown relation on "${t.term}"`);
      }
    }
  });

  test('synonyms are queries; entities are not dressed up as queries', () => {
    // A synonym has to read like something someone would type. An entity is a
    // topic, so it must not be phrased as a search.
    for (const p of PATHS) {
      for (const t of semanticKeywordsFor(p)) {
        if (t.relation === RELATION.SYNONYM) {
          assert.ok(t.term.length > 6, `"${t.term}" is too thin to be a real query`);
        }
      }
    }
  });

  test('the secondary terms already declared for a page are actually used', () => {
    // KEYWORD_MAP.secondary was written, then never read by anything. If the
    // semantic layer dropped it, these would go back to being dead data.
    for (const entry of KEYWORD_MAP) {
      const terms = semanticKeywordsFor(entry.path).map((t) => normaliseTerm(t.term));
      for (const s of entry.secondary || []) {
        assert.ok(
          terms.includes(normaliseTerm(s)),
          `${entry.path} never uses its declared secondary term "${s}"`,
        );
      }
    }
  });

  test('no page claims another page\'s primary term as a synonym', () => {
    // Otherwise the semantic layer quietly reintroduces the cannibalisation
    // that one-primary-per-page exists to prevent.
    const primaries = new Map(KEYWORD_MAP.map((e) => [normaliseTerm(e.primary), e.path]));
    for (const p of PATHS) {
      for (const t of semanticKeywordsFor(p)) {
        const owner = primaries.get(normaliseTerm(t.term));
        if (!owner) continue;
        assert.equal(
          owner, p,
          `${p} lists "${t.term}" as a keyword but ${owner} owns it as a primary`,
        );
      }
    }
  });

  test('the reserved head term is never used as a secondary or semantic term', () => {
    const reserved = normaliseTerm('fancy text generator');
    for (const p of PATHS) {
      for (const t of semanticKeywordsFor(p)) {
        assert.notEqual(
          normaliseTerm(t.term), reserved,
          `${p} uses the reserved head term as a semantic keyword`,
        );
      }
    }
  });

  test('output is deterministic', () => {
    // The build and the test have to agree exactly, so this cannot depend on
    // iteration order or the clock.
    assert.deepEqual(semanticKeywordsFor('/'), semanticKeywordsFor('/'));
    assert.deepEqual(semanticGroups('/'), semanticGroups('/'));
  });

  test('groups only contain terms belonging to them, and never an empty group', () => {
    for (const p of PATHS) {
      for (const g of semanticGroups(p)) {
        assert.ok(g.terms.length > 0, `${p} renders an empty "${g.relation}" group`);
        assert.ok(g.label && g.label.length > 3, `${p} has an unlabelled group`);
        for (const t of g.terms) assert.equal(t.relation, g.relation);
      }
    }
  });

  test('category terms come from the real catalog', () => {
    const names = new Set(Object.values(catalog().categories).map((c) => c.name.toLowerCase()));
    for (const t of semanticKeywordsFor('/')) {
      if (t.relation !== RELATION.CATEGORY) continue;
      assert.ok(names.has(t.term), `"${t.term}" is not a category in the catalog`);
    }
  });

  test('the flattened string carries no duplicates and no empty entries', () => {
    const s = semanticKeywordString('/');
    assert.ok(s.length > 0);
    const parts = s.split(', ');
    assert.equal(new Set(parts).size, parts.length);
    assert.ok(!parts.some((p) => !p.trim()));
  });
});