// Writes public/ads.txt from ADSENSE_CLIENT.
//
// AdSense serves no ads at all without a valid ads.txt, but the file has to
// contain the real publisher id, so it is generated from the environment rather
// than committed with a placeholder that would silently do nothing.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/environment.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'public', 'ads.txt');

if (!env.adsense.client) {
  // Leave any previously generated file alone rather than writing an empty one,
  // so a build without credentials cannot break a working deployment's file.
  console.log('ads.txt: skipped (ADSENSE_CLIENT is not set)');
  process.exit(0);
}

const line = `google.com, ${env.adsense.client}, DIRECT, f08c47fec0942fa0`;
const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;

if (existing === line) {
  console.log('ads.txt: unchanged');
  process.exit(0);
}

fs.writeFileSync(file, `${line}\n`);
console.log(`ads.txt: wrote ${env.adsense.client}`);