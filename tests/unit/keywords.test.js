import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  cleanKeyword, coreModifier, classifyKeyword, mapKeyword, buildKeywordMap,
  summarize, groupKeywords, realRoutes, VARIATION_MIN,
} from '../../lib/keywords.js';
import { buildVariations, isWrapped } from '../../lib/emoji-variations.js';
import { LANDING_PAGES, LANDING_PAGE_KEYS } from '../../lib/landing-pages.js';
import { catalog } from '../../services/catalog.js';

const SOURCE = readFileSync(new URL('../../data/keywords.txt', import.meta.url), 'utf8').split(/\r?\n/);
const MAP = JSON.parse(readFileSync(new URL('../../data/keyword-map.json', import.meta.url), 'utf8'));
const REPORT = JSON.parse(readFileSync(new URL('../../data/keyword-report.json', import.meta.url), 'utf8'));

const routeExists = (route) => {
  if (route?.startsWith('/styles/')) return LANDING_PAGE_KEYS.includes(route.slice('/styles/'.length));
  return realRoutes().has(route);
};

describe('keyword cleaning', () => {
  test('lowercases, trims and collapses whitespace', () => {
    const r = cleanKeyword('  Fancy   TEXT   Generator  ');
    assert.equal(r.valid, true);
    assert.equal(r.normalized, 'fancy text generator');
  });

  test('the original is always preserved for traceability', () => {
    const r = cleanKeyword('Fancy TEXT Generator');
    assert.equal(r.original, 'Fancy TEXT Generator');
    assert.equal(r.normalized, 'fancy text generator');
  });

  test('drops empty lines, comments, URLs and emoji-only entries with a reason', () => {
    assert.equal(cleanKeyword('   ').reason, 'empty_line');
    assert.equal(cleanKeyword('# a comment').reason, 'comment_line');
    assert.equal(cleanKeyword('https://example.com/x').reason, 'url');
    assert.equal(cleanKeyword('🔥✨🎉').reason, 'emoji_or_punctuation_only');
    assert.equal(cleanKeyword('!!! ???').reason, 'emoji_or_punctuation_only');
  });

  test('core modifiers match the documented examples', () => {
    assert.equal(coreModifier('instagram fancy text generator'), 'instagram');
    assert.equal(coreModifier('discord fancy text generator'), 'discord');
    assert.equal(coreModifier('bold fancy text'), 'bold');
    assert.equal(coreModifier('free cursive text generator'), 'cursive');
  });

  test('the core modifier never replaces the SEO keyword', () => {
    const r = cleanKeyword('Free Cursive Text Generator');
    assert.equal(r.normalized, 'free cursive text generator');
    assert.equal(r.coreModifier, 'cursive');
  });

  test('a fully generic keyword falls back rather than losing the keyword', () => {
    assert.equal(coreModifier('fancy text generator'), 'fancy text generator');
  });

  test('word boundaries prevent false matches', () => {
    // "mirrored" must not be read as the colour "red".
    assert.notEqual(classifyKeyword('fancy text generator mirrored'), 'colours');
    assert.equal(classifyKeyword('fancy text generator red colour'), 'colours');
  });
});

describe('deduplication and the audit trail', () => {
  const { rows, removals, duplicates } = buildKeywordMap(SOURCE);

  test('no duplicate normalized keywords survive cleaning', () => {
    const seen = new Set();
    for (const r of rows) {
      assert.ok(!seen.has(r.normalized), `duplicate normalized keyword: ${r.normalized}`);
      seen.add(r.normalized);
    }
  });

  test('every source line is accounted for exactly once', () => {
    assert.equal(rows.length + removals.length + duplicates.length, SOURCE.length);
  });

  test('duplicate originals are retained in the audit', () => {
    assert.ok(duplicates.length > 0, 'expected the source list to contain a duplicate');
    for (const d of duplicates) {
      assert.ok(d.original && d.normalized);
      assert.ok(d.firstSeenLine > 0);
    }
  });

  test('every removed line records a reason', () => {
    for (const r of removals) assert.ok(r.reason, 'removal without a reason');
  });
});

describe('classification and mapping', () => {
  test('every mapped target resolves to a real route', () => {
    for (const k of MAP.keywords) {
      if (k.status !== 'mapped') continue;
      assert.ok(routeExists(k.route), `${k.normalized} maps to a route that does not exist: ${k.route}`);
    }
  });

  test('competitor keywords are never mapped to a landing page', () => {
    const competitors = MAP.keywords.filter((k) => k.category === 'competitor');
    assert.ok(competitors.length > 0, 'expected competitor keywords in the source list');
    for (const k of competitors) {
      assert.equal(k.status, 'skipped');
      assert.equal(k.route, null);
      assert.match(k.reason, /[Cc]ompetitor/);
    }
  });

  test('language keywords never create a misleading generator', () => {
    const langs = MAP.keywords.filter((k) => k.category === 'languages');
    assert.ok(langs.length > 0);
    for (const k of langs) {
      assert.equal(k.route, '/styles/languages', `${k.normalized} maps to ${k.route}`);
      assert.doesNotMatch(k.route, /^\/fonts\//, `${k.normalized} maps to a style generator`);
    }
  });

  test('unsupported features are planned, never faked as working generators', () => {
    const planned = MAP.keywords.filter((k) => k.category === 'unsupported');
    assert.ok(planned.length > 0);
    for (const k of planned) {
      assert.equal(k.status, 'planned');
      assert.equal(k.route, null);
    }
  });

  test('non-mapped keywords never carry a route', () => {
    for (const k of MAP.keywords) {
      if (k.status === 'mapped') continue;
      assert.equal(k.route, null, `${k.normalized} is ${k.status} but has route ${k.route}`);
    }
  });

  test('every keyword records a classification, a status and a reason', () => {
    for (const k of MAP.keywords) {
      assert.ok(k.category, `${k.normalized} has no category`);
      assert.ok(k.status, `${k.normalized} has no status`);
      assert.ok(k.reason && k.reason.length > 10, `${k.normalized} has no usable reason`);
    }
  });

  test('colour keywords map to the honest colour page, never a colour generator', () => {
    for (const k of MAP.keywords.filter((x) => x.category === 'colours')) {
      assert.equal(k.route, '/styles/colours');
    }
  });

  test('game keywords reuse one real page rather than thin per-game doorways', () => {
    const gameTargets = new Set(MAP.keywords.filter((k) => k.category === 'gaming').map((k) => k.route));
    assert.ok(gameTargets.size <= 2, `expected few gaming targets, got ${[...gameTargets].join(', ')}`);
  });
});

describe('emoji-wrapped variations', () => {
  test('every variation starts and ends with an emoji', () => {
    for (const section of REPORT.sections) {
      for (const v of section.allVariations) {
        assert.ok(isWrapped(v.text), `not emoji-wrapped: ${v.text}`);
        assert.ok(v.text.startsWith(v.emoji) && v.text.endsWith(v.emoji));
      }
    }
  });

  test('variations are unique within a section after normalization', () => {
    for (const section of REPORT.sections) {
      const seen = new Set();
      for (const v of section.allVariations) {
        const key = v.phrase.toLowerCase().replace(/\s+/g, ' ').trim();
        assert.ok(!seen.has(key), `duplicate variation in ${section.page}: ${v.text}`);
        seen.add(key);
      }
    }
  });

  test('variations vary the phrase, not only the emoji wrapper', () => {
    for (const section of REPORT.sections) {
      const emojis = new Set(section.allVariations.map((v) => v.emoji));
      const phrases = new Set(section.allVariations.map((v) => v.phrase));
      assert.ok(phrases.size === section.allVariations.length);
      assert.ok(emojis.size > 1, `${section.page} used a single emoji for every variation`);
    }
  });

  test('sections meet the configurable minimum when enough legitimate phrases exist', () => {
    for (const section of REPORT.sections) {
      assert.ok(
        section.generated >= section.target || section.shortfall > 0,
        `${section.page} reports neither a met target nor a shortfall`,
      );
    }
  });

  test('a short section reports its shortfall rather than hiding it', () => {
    for (const section of REPORT.sections) {
      if (section.generated >= section.target) assert.equal(section.shortfall, 0);
      else assert.equal(section.shortfall, section.target - section.generated);
    }
  });

  test('displayed variations are a subset of the validated variations', () => {
    for (const section of REPORT.sections) {
      assert.ok(section.displayed <= section.generated);
      for (const d of section.displayVariations) {
        assert.ok(section.allVariations.some((a) => a.text === d.text));
      }
    }
  });

  test('the display subset stays readable instead of dumping every phrase', () => {
    for (const section of REPORT.sections) {
      assert.ok(section.displayed <= 12, `${section.page} displays ${section.displayed} phrases`);
    }
  });

  test('each landing page gets its own distinct phrase pool', () => {
    const pools = REPORT.sections.map((s) => s.allVariations.map((v) => v.phrase).join('|'));
    assert.equal(new Set(pools).size, pools.length, 'two sections share a phrase pool');
  });

  test('an unknown section returns an empty, reported shortfall', () => {
    const v = buildVariations('not-a-real-section', 'Nothing');
    assert.equal(v.allVariations.length, 0);
    assert.equal(v.met, false);
    assert.equal(v.shortfall, v.min);
  });

  test('the minimum is configurable', () => {
    const low = buildVariations('discord', 'Discord', { min: 5 });
    assert.equal(low.target, 5);
    assert.ok(low.generated >= 5);
  });
});

describe('approved landing pages', () => {
  const slugs = new Set(catalog().styles.filter((s) => s.indexable).map((s) => s.slug));

  test('keys are unique', () => {
    assert.equal(new Set(LANDING_PAGE_KEYS).size, LANDING_PAGE_KEYS.length);
  });

  test('every page has exactly one H1 and three FAQs', () => {
    for (const p of LANDING_PAGES) {
      assert.ok(p.h1 && p.h1.length > 5, `${p.key} has no H1`);
      assert.equal(p.faq.length, 3, `${p.key} must have exactly 3 FAQs`);
      for (const f of p.faq) {
        assert.ok(f.q && f.a.length > 30, `${p.key} has a thin FAQ`);
      }
    }
  });

  test('titles, descriptions and introductions are unique across pages', () => {
    const titles = new Set(LANDING_PAGES.map((p) => p.title));
    const descriptions = new Set(LANDING_PAGES.map((p) => p.description));
    const intros = LANDING_PAGES.map((p) => p.intro.join(' '));
    assert.equal(titles.size, LANDING_PAGES.length, 'duplicate page titles');
    assert.equal(descriptions.size, LANDING_PAGES.length, 'duplicate page descriptions');
    assert.equal(new Set(intros).size, LANDING_PAGES.length, 'duplicate introductions');
  });

  test('FAQ answers are not copy-pasted across pages', () => {
    const answers = new Set(LANDING_PAGES.flatMap((p) => p.faq.map((f) => f.a)));
    const total = LANDING_PAGES.reduce((n, p) => n + p.faq.length, 0);
    assert.equal(answers.size, total, 'an FAQ answer is reused across pages');
  });

  test('introductions are 2-3 sentences and say what the tool does', () => {
    for (const p of LANDING_PAGES) {
      assert.ok(p.intro.length >= 2 && p.intro.length <= 3, `${p.key} intro length`);
    }
  });

  test('every referenced style exists and is indexable', () => {
    for (const p of LANDING_PAGES) {
      for (const section of p.sections) {
        assert.ok(section.styles.length > 0, `${p.key}:${section.h2} has no styles`);
        for (const slug of section.styles) {
          assert.ok(slugs.has(slug), `${p.key} references a non-indexable style: ${slug}`);
        }
      }
    }
  });

  test('every internal link points at a real route', () => {
    for (const p of LANDING_PAGES) {
      for (const link of p.links) assert.ok(routeExists(link.href), `${p.key} links to ${link.href}`);
    }
  });

  test('no colour or script page claims a feature the app does not have', () => {
    for (const key of ['colours', 'languages']) {
      const p = LANDING_PAGES.find((x) => x.key === key);
      const text = `${p.title} ${p.description} ${p.intro.join(' ')}`.toLowerCase();
      assert.ok(!/colou?red (?:text|letter) generator/.test(text), `${key} claims coloured text generation`);
    }
  });
});

describe('dashboard statistics match the generated data', () => {
  const { rows, removals, duplicates } = buildKeywordMap(SOURCE);
  const summary = summarize(rows, removals, duplicates, REPORT.sections);

  test('stored summary is reproducible from the source list', () => {
    assert.equal(summary.uniqueKeywords, MAP.summary.uniqueKeywords);
    assert.equal(summary.mapped, MAP.summary.mapped);
    assert.equal(summary.skipped, MAP.summary.skipped);
    assert.equal(summary.planned, MAP.summary.planned);
    assert.equal(summary.needsReview, MAP.summary.needsReview);
    assert.equal(summary.sourceEntries, MAP.summary.sourceEntries);
  });

  test('status counts add up to the unique keyword count', () => {
    const total = summary.mapped + summary.skipped + summary.planned + summary.unmapped + summary.needsReview;
    assert.equal(total, summary.uniqueKeywords);
  });

  test('variation totals come from the sections, counted once each', () => {
    assert.equal(summary.totalVariations, REPORT.sections.reduce((n, s) => n + s.generated, 0));
    assert.equal(summary.variationSections, REPORT.sections.length);
    assert.equal(summary.sectionsMeetingTarget + summary.sectionsShort, REPORT.sections.length);
  });

  test('every landing page has a variation section in the report', () => {
    const reported = new Set(REPORT.sections.map((s) => s.page));
    for (const key of LANDING_PAGE_KEYS) assert.ok(reported.has(key), `${key} has no variation section`);
  });

  test('sidebar groups are never empty and cover every keyword', () => {
    const groups = groupKeywords(rows);
    assert.ok(groups.every((g) => g.count > 0), 'an empty category reached the sidebar');
    const counted = groups.filter((g) => g.id !== 'all').reduce((n, g) => n + g.count, 0);
    const ungrouped = rows.filter((r) => !groups.some((g) => g.id !== 'all' && g.keywords.includes(r)));
    assert.equal(counted + ungrouped.length, rows.length);
  });

  test('no SEO validation failures were recorded', () => {
    assert.deepEqual(REPORT.validation.failures, []);
    assert.equal(MAP.validation.failures, 0);
  });

  test('the variation minimum is the documented default', () => {
    assert.equal(VARIATION_MIN, 30);
    for (const s of REPORT.sections) assert.equal(s.target, VARIATION_MIN);
  });
});
