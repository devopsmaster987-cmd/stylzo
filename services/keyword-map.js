// Read-only access to the artifacts produced by scripts/build-keyword-map.js.
//
// Same pattern as services/catalog.js: the persisted JSON is loaded once, and if it is
// missing the pipeline is re-run in memory so a fresh clone still boots. Nothing here
// ever writes to data/.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildKeywordMap, summarize, groupKeywords, KEYWORD_CATEGORIES } from '../lib/keywords.js';
import { buildVariations } from '../lib/emoji-variations.js';
import { LANDING_PAGES } from '../lib/landing-pages.js';

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');
const MAP_FILE = path.join(dataDir, 'keyword-map.json');

function derive() {
  const rawLines = readFileSync(path.join(dataDir, 'keywords.txt'), 'utf8').split(/\r?\n/);
  const { rows, removals, duplicates } = buildKeywordMap(rawLines);

  const sections = LANDING_PAGES.map((page) => {
    const v = buildVariations(page.variationSection.key, page.variationSection.subject, {
      source: `${page.key}:variation-rule`,
    });
    return { page: page.key, section: page.variationSection.key, h2: page.variationSection.h2, ...v };
  });

  for (const row of rows) {
    if (row.status !== 'mapped' || !row.route?.startsWith('/styles/')) continue;
    const key = row.route.slice('/styles/'.length);
    const own = sections.filter((s) => s.page === key);
    if (!own.length) continue;
    row.variations = own.reduce((n, s) => n + s.generated, 0);
    row.displayedVariations = own.reduce((n, s) => n + s.displayed, 0);
    row.page = key;
  }

  return {
    summary: summarize(rows, removals, duplicates, sections),
    validation: { failures: 0, warnings: sections.filter((s) => !s.met).length },
    keywords: rows,
    categories: groupKeywords(rows).map(({ id, icon, label, count }) => ({ id, icon, label, count })),
    sections: sections.map((s) => ({
      page: s.page, section: s.section, h2: s.h2, source: s.source,
      target: s.target, generated: s.generated, displayed: s.displayed,
      met: s.met, shortfall: s.shortfall,
      displayVariations: s.displayVariations,
    })),
    removals,
    duplicates,
  };
}

function load() {
  try {
    return JSON.parse(readFileSync(MAP_FILE, 'utf8'));
  } catch {
    return derive();
  }
}

let cache = null;
export function keywordMap() {
  if (!cache) cache = load();
  return cache;
}

export { KEYWORD_CATEGORIES };
