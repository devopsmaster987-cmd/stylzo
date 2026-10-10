// Builds the SEO keyword map, report and audit from data/keywords.txt.
//
//   npm run build:keywords
//
// Deterministic: same input file, same output bytes. The source keyword list is only
// ever read, never written. Anything rejected is recorded with a reason rather than
// being dropped silently.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildKeywordMap, summarize, groupKeywords, realRoutes, KEYWORD_CATEGORIES } from '../lib/keywords.js';
import { buildVariations } from '../lib/emoji-variations.js';
import { getLandingPage, LANDING_PAGES } from '../lib/landing-pages.js';
import { catalog } from '../services/catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');

const SOURCE_FILE = path.join(dataDir, 'keywords.txt');
const rawLines = readFileSync(SOURCE_FILE, 'utf8').split(/\r?\n/);

const routes = realRoutes();
const styleSlugs = new Set(catalog().styles.filter((s) => s.indexable).map((s) => s.slug));

// ---- 1. clean, classify, map ------------------------------------------------
const { rows, removals, duplicates } = buildKeywordMap(rawLines);

// ---- 2. attach emoji variations to each landing page ------------------------
// One variation section per landing page (the "Explore <topic> styles" block). Each
// approved page has its own phrase rule, so sections never share a phrase list.
const sections = [];
for (const page of LANDING_PAGES) {
  const variations = buildVariations(page.variationSection.key, page.variationSection.subject, {
    source: `${page.key}:variation-rule`,
  });
  sections.push({ page: page.key, section: page.variationSection.key, h2: page.variationSection.h2, ...variations });
}

// Map each mapped keyword onto the section(s) it belongs to, so the map carries a
// real per-keyword variation count.
for (const row of rows) {
  if (row.status !== 'mapped') continue;
  const key = landingKeyForRoute(row.route);
  if (!key) continue;
  const page = getLandingPage(key);
  if (!page) continue;
  const own = sections.filter((s) => s.page === key);
  row.variations = own.reduce((n, s) => n + s.generated, 0);
  row.displayedVariations = own.reduce((n, s) => n + s.displayed, 0);
  row.variationSections = own.map((s) => s.section);
  row.page = key;
}

const summary = summarize(rows, removals, duplicates, sections);

// ---- 3. SEO validation ------------------------------------------------------
const validation = { failures: [], warnings: [] };

for (const row of rows) {
  if (row.status === 'mapped' && !routes.has(row.route)) {
    validation.failures.push({ keyword: row.normalized, issue: `mapped route does not exist: ${row.route}` });
  }
  if (row.status !== 'mapped' && row.route) {
    validation.failures.push({ keyword: row.normalized, issue: `non-mapped keyword carries a route: ${row.route}` });
  }
}

const seenNormalized = new Map();
for (const row of rows) {
  if (seenNormalized.has(row.normalized)) {
    validation.failures.push({ keyword: row.normalized, issue: 'duplicate normalized keyword survived cleaning' });
  }
  seenNormalized.set(row.normalized, true);
}

for (const row of rows) {
  if (row.category === 'competitor' && row.status !== 'skipped') {
    validation.failures.push({ keyword: row.normalized, issue: 'competitor keyword is not skipped' });
  }
  if (row.category === 'unsupported' && row.status === 'mapped') {
    validation.failures.push({ keyword: row.normalized, issue: 'unsupported feature mapped to a live generator' });
  }
  if (row.category === 'languages' && row.route !== '/styles/languages') {
    validation.failures.push({ keyword: row.normalized, issue: `language keyword mapped to a misleading generator: ${row.route}` });
  }
}

for (const page of LANDING_PAGES) {
  if (page.faq.length !== 3) validation.failures.push({ keyword: page.key, issue: `landing page has ${page.faq.length} FAQs, expected exactly 3` });
  for (const section of page.sections) {
    for (const slug of section.styles) {
      if (!styleSlugs.has(slug)) validation.failures.push({ keyword: `${page.key}:${slug}`, issue: 'section references a style that is not indexable' });
    }
  }
}

for (const section of sections) {
  if (!section.met) {
    validation.warnings.push({ keyword: `${section.page}:${section.section}`, issue: `variation shortfall of ${section.shortfall} below the target of ${section.target}` });
  }
}

// ---- 4. write artifacts -----------------------------------------------------
const keywordMap = {
  generatedBy: 'scripts/build-keyword-map.js',
  source: 'data/keywords.txt',
  summary,
  validation: { failures: validation.failures.length, warnings: validation.warnings.length },
  keywords: rows.map(({ original, normalized, coreModifier, category, status, route, reason, variations, displayedVariations, variationSections }) => ({
    original, normalized, coreModifier, category, status, route, reason,
    variations, displayedVariations, variationSections: variationSections || [],
  })),
  categories: groupKeywords(rows).map(({ id, icon, label, count }) => ({ id, icon, label, count })),
};

const report = {
  generatedBy: 'scripts/build-keyword-map.js',
  summary,
  validation: { failures: validation.failures, warnings: validation.warnings },
  sections: sections.map((s) => ({
    page: s.page, section: s.section, h2: s.h2, source: s.source,
    target: s.target, generated: s.generated, displayed: s.displayed,
    met: s.met, shortfall: s.shortfall,
    allVariations: s.allVariations,
    displayVariations: s.displayVariations,
  })),
  removals,
  duplicates,
};

writeFileSync(path.join(dataDir, 'keyword-map.json'), `${JSON.stringify(keywordMap, null, 2)}\n`);
writeFileSync(path.join(dataDir, 'keyword-report.json'), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(path.join(dataDir, 'keyword-audit.md'), renderAudit(keywordMap, report));

console.log(
  `Keyword map built: ${summary.uniqueKeywords} unique from ${summary.sourceEntries} source lines ` +
  `(${summary.mapped} mapped, ${summary.skipped} skipped, ${summary.planned} planned, ${summary.needsReview} need review).`,
);
console.log(
  `Variations: ${summary.totalVariations} generated, ${summary.displayedVariations} displayed, ` +
  `${summary.sectionsMeetingTarget}/${summary.variationSections} sections met the target of ${sections[0]?.target ?? 30}.`,
);
if (validation.failures.length) {
  console.error(`SEO validation failures: ${validation.failures.length}`);
  for (const f of validation.failures) console.error(`  - ${f.keyword}: ${f.issue}`);
  process.exit(1);
}
console.log('SEO validation: 0 failures.');

// ---- helpers ----------------------------------------------------------------

function landingKeyForRoute(route) {
  if (!route || !route.startsWith('/styles/')) return null;
  const key = route.slice('/styles/'.length);
  return LANDING_PAGES.some((p) => p.key === key) ? key : null;
}

function renderAudit(map, rep) {
  const s = map.summary;
  const lines = [
    '# Keyword audit',
    '',
    'Generated by `scripts/build-keyword-map.js` from `data/keywords.txt`. Do not edit by hand.',
    '',
    '## Totals',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Source entries | ${s.sourceEntries} |`,
    `| Unique cleaned keywords | ${s.uniqueKeywords} |`,
    `| Mapped | ${s.mapped} |`,
    `| Skipped (competitors) | ${s.skipped} |`,
    `| Planned (unsupported features) | ${s.planned} |`,
    `| Unmapped / needs review | ${s.unmapped + s.needsReview} |`,
    `| Approved indexable pages referenced | ${s.indexablePages} |`,
    `| Emoji variations generated | ${s.totalVariations} |`,
    `| Emoji variations displayed | ${s.displayedVariations} |`,
    `| Sections meeting the variation target | ${s.sectionsMeetingTarget} |`,
    `| Sections with a legitimate shortfall | ${s.sectionsShort} |`,
    `| SEO validation failures | ${map.validation.failures} |`,
    `| Removed source lines | ${s.removed} |`,
    `| Duplicate source lines | ${s.duplicates} |`,
    '',
    '## Categories',
    '',
    '| Category | Icon | Count |',
    '| --- | --- | --- |',
    ...KEYWORD_CATEGORIES.map((c) => {
      const found = map.categories.find((x) => x.id === c.id);
      return found ? `| ${found.label} | ${found.icon} | ${found.count} |` : null;
    }).filter(Boolean),
    '',
  ];

  const table = (title, predicate) => {
    const picked = map.keywords.filter(predicate);
    lines.push(`## ${title} (${picked.length})`, '');
    if (!picked.length) {
      lines.push('_None._', '');
      return;
    }
    lines.push('| Keyword | Status | Route | Variations | Reason |', '| --- | --- | --- | --- | --- |');
    for (const k of picked) {
      lines.push(`| ${k.normalized} | ${k.status} | ${k.route || '—'} | ${k.variations || 0} | ${k.reason} |`);
    }
    lines.push('');
  };

  table('Skipped keywords', (k) => k.status === 'skipped');
  table('Planned keywords', (k) => k.status === 'planned');
  table('Unmapped keywords', (k) => k.status === 'needs-review' || k.status === 'unmapped');

  lines.push('## Emoji variation sections', '', '| Page | Section | Generated | Displayed | Target | Shortfall |', '| --- | --- | --- | --- | --- | --- |');
  for (const sec of rep.sections) {
    lines.push(`| ${sec.page} | ${sec.section} | ${sec.generated} | ${sec.displayed} | ${sec.target} | ${sec.shortfall} |`);
  }
  lines.push('');

  lines.push('## Removed source lines', '');
  if (!rep.removals.length) lines.push('_None._');
  else for (const r of rep.removals) lines.push(`- line ${r.line}: \`${r.original}\` — ${r.reason}`);
  lines.push('');

  lines.push('## Duplicate source lines', '');
  if (!rep.duplicates.length) lines.push('_None._');
  else for (const d of rep.duplicates) lines.push(`- line ${d.line}: \`${d.original}\` duplicates line ${d.firstSeenLine}`);
  lines.push('');

  lines.push('## SEO validation', '');
  if (!rep.validation.failures.length) lines.push('- 0 failures.');
  else for (const f of rep.validation.failures) lines.push(`- **FAIL** ${f.keyword}: ${f.issue}`);
  if (rep.validation.warnings.length) {
    lines.push('', 'Warnings:');
    for (const w of rep.validation.warnings) lines.push(`- ${w.keyword}: ${w.issue}`);
  }
  lines.push('');

  return lines.join('\n');
}
