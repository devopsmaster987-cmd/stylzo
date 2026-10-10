// Precomputes every derived lookup the server needs, so a request never parses
// 3 MB of JSON or rebuilds an index. Writes data/.catalog-cache.json.
//
// data/fonts.json stays the human-editable source of truth (tests read it directly,
// including the `example` field). This artifact is a machine-generated projection of
// it, produced by the same buildCache() the runtime uses.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildCache } from '../services/catalog-index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const readJson = (f) => JSON.parse(readFileSync(path.join(dataDir, f), 'utf8'));

const cache = buildCache(readJson('fonts.json'), readJson('categories.json'), readJson('pages.json'));
const json = JSON.stringify(cache);
writeFileSync(path.join(dataDir, '.catalog-cache.json'), json);

const mb = (n) => `${(n / 1048576).toFixed(2)} MB`;
console.log(
  `Catalog cache built: ${cache.styles.length} styles, ${Object.keys(cache.byCategory).length} categories, ` +
  `${mb(readFileSync(path.join(dataDir, 'fonts.json')).length)} source -> ${mb(json.length)} cache`,
);