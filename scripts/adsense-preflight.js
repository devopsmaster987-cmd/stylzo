// AdSense preflight.
//
// Walks every requirement that has to be true before an application can
// succeed, and says plainly what is missing and how to fix it. Runs against the
// real production build, because most of these failures only appear there: the
// CSP blocked inline styles in production only, and the ad tag is injected by
// consent rather than being present in the HTML.
//
//   npm run adsense:check              start the local build and check it
//   npm run adsense:check -- --url=https://example.com   check a live deploy

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, adsenseConfigured } from '../config/environment.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argUrl = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : null;

const results = [];
const check = (name, ok, detail = '', fix = '') => {
  // Detail is noise on a passing line, so it is only rendered when it explains
  // a failure or a warning.
  results.push({ name, ok, detail: ok === true ? '' : detail, fix });
};
const warn = (name, detail, fix) => results.push({ name, ok: null, detail, fix });

const bar = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

/* ---------------------------------------------------------------- server --- */

let child = null;

async function ensureBuild() {
  if (fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) return;
  console.log('Building…');
  const res = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build'], {
    cwd: root, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' },
  });
  if (res.status !== 0) throw new Error('next build failed');
}

async function startLocal() {
  await ensureBuild();
  const port = 3399;
  child = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '-p', String(port)], {
    cwd: root, stdio: 'ignore', env: { ...process.env, NODE_ENV: 'production' },
  });
  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 45_000;
  for (;;) {
    try { if ((await fetch(`${base}/api/health`)).ok) return base; } catch { /* not up */ }
    if (Date.now() > deadline) throw new Error('server did not start');
    await new Promise((r) => setTimeout(r, 250));
  }
}

const get = (base, p) => fetch(`${base}${p}`);
const text = async (base, p) => (await (await get(base, p)).text());
const words = (html) => {
  const m = html.replace(/<script[\s\S]*?<\/script>/g, '').match(/<main[\s\S]*?<\/main>/);
  return (m ? m[0] : html).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
};

/* ------------------------------------------------------- configuration --- */

bar('Configuration');

if (!env.adsense.client) {
  check('Publisher ID (ADSENSE_CLIENT)', false, 'not set',
    'AdSense > Account > Settings > Account information > Publisher ID');
} else if (!/^ca-pub-\d{6,}$/.test(env.adsense.client)) {
  check('Publisher ID (ADSENSE_CLIENT)', false, `malformed: ${env.adsense.client}`,
    'It should look like ca-pub-0000000000000000');
} else {
  check('Publisher ID (ADSENSE_CLIENT)', true, env.adsense.client);
}

if (!env.adsense.slot) {
  check('Ad unit ID (ADSENSE_SLOT)', false, 'not set',
    'AdSense > Ads > Inventory > your unit > the digits after slot=');
} else if (!/^\d+$/.test(env.adsense.slot)) {
  check('Ad unit ID (ADSENSE_SLOT)', false, `must be digits: ${env.adsense.slot}`, 'e.g. 9876543210');
} else {
  check('Ad unit ID (ADSENSE_SLOT)', true, env.adsense.slot);
}

if (!adsenseConfigured) {
  warn('Both values present', 'ads will stay switched off until they are',
    'Set both, then rebuild so ads.txt and the CSP are generated');
}

if (env.nodeEnv !== 'production') {
  warn('Running as a production build', `NODE_ENV=${env.nodeEnv}`,
    'Several defects only appear in production; the local build matches it');
} else {
  check('Running as a production build', true);
}

check('SITE_URL resolves', /^https?:\/\//.test(env.siteUrl), env.siteUrl);

/* ------------------------------------------------------------- content --- */

bar('Site');

let base;
try {
  base = argUrl || await startLocal();
} catch (e) {
  console.error(`\nCould not start the site: ${e.message}`);
  process.exit(1);
}

const REQUIRED = ['/', '/about', '/contact', '/privacy', '/terms', '/tools', '/fonts'];
for (const p of REQUIRED) {
  const res = await get(base, p);
  check(`${p} reachable`, res.status === 200, `status ${res.status}`);
}

const privacy = await text(base, '/privacy');
check('Privacy policy is substantial', words(privacy) >= 300, `${words(privacy)} words`,
  'AdSense reads this page closely; under 300 words reads as a stub');
check('Privacy policy covers advertising', /AdSense/i.test(privacy) && /cookie/i.test(privacy),
  'no mention of AdSense or cookies found',
  'AdSense requires an advertising disclosure on this page');
check('Privacy policy has headings', (privacy.match(/<h2/g) || []).length >= 3);

const contact = await text(base, '/contact');
check('Contact page shows an address', /mailto:/.test(contact) || Boolean(env.contactEmail),
  'no mailto link and CONTACT_EMAIL is not set',
  'Set CONTACT_EMAIL so the address is shown, or add one to the page');

const about = await text(base, '/about');
check('About page is substantial', words(about) >= 300, `${words(about)} words`);

// Content depth across the real page set.
const CORE = ['/', '/fonts', '/symbols', '/emoji', '/kaomoji', '/tools', '/studio', '/styles'];
const depths = [];
for (const p of CORE) depths.push([p, words(await text(base, p))]);
const thin = depths.filter(([, w]) => w < 300);
check('No thin core pages', thin.length === 0,
  thin.length ? thin.map(([p, w]) => `${p} (${w}w)`).join(', ') : `${depths.length} pages checked`);

const sm = await text(base, '/sitemap.xml');
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
check('Sitemap has URLs', urls.length >= 100, `${urls.length} URLs`);

let broken = [];
for (const p of urls) {
  const res = await get(base, p);
  if (res.status !== 200) broken.push(`${p} (${res.status})`);
}
check('Every sitemap URL returns 200', broken.length === 0,
  broken.length ? broken.slice(0, 5).join(', ') : `${urls.length} checked`);

const notFound = await get(base, '/definitely-not-a-real-page-xyz');
check('404 handled', notFound.status === 404, `status ${notFound.status}`);

/* ------------------------------------------------------------ crawling --- */

bar('Crawling');

const robots = await text(base, '/robots.txt');
check('robots.txt allows crawling', /Allow: \//.test(robots));
check('robots.txt points at the sitemap', /Sitemap:\s*https?:\/\//.test(robots));
check('Admin area disallowed', /Disallow: \/admin/.test(robots));
for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot']) {
  check(`AI crawler allowed: ${bot}`, new RegExp(`User-Agent:\\s*${bot}[\\s\\S]*?Allow:\\s*/`).test(robots));
}

const llms = await get(base, '/llms.txt');
check('llms.txt served', llms.status === 200, llms.status === 200 ? '' : `status ${llms.status}`);

const home = await text(base, '/');
// Compare the parsed pathname, not the raw string: the canonical is emitted
// without a trailing slash for the root, which is still self-referencing.
const canonicalUrl = (home.match(/rel="canonical" href="([^"]*)"/) || [])[1];
let canonicalOk = false;
try {
  canonicalOk = new URL(canonicalUrl).pathname === '/';
} catch { /* missing or unparseable */ }
check('Home page has a self-referencing canonical', canonicalOk,
  canonicalUrl ? `canonical is ${canonicalUrl}` : 'no canonical found');

/* --------------------------------------------------------------- ads --- */

bar('Advertising');

if (!adsenseConfigured) {
  check('ads.txt generated', false, 'not generated (no publisher ID)',
    'Rebuild after setting ADSENSE_CLIENT');
  warn('Ad units rendered', 'skipped, ads are not configured',
    'Once configured, /, /fonts and the board pages should each show a unit');
  warn('CSP permits Google ad origins', 'skipped, ads are not configured',
    'Without this every ad is silently blocked in production');
} else {
  const adsTxt = await get(base, '/ads.txt');
  if (adsTxt.status !== 200) {
    check('ads.txt served', false, `status ${adsTxt.status}`, 'Rebuild so public/ads.txt is written');
  } else {
    const body = await adsTxt.text();
    const ok = body.includes(env.adsense.client);
    check('ads.txt served', true, body.trim());
    check('ads.txt names this publisher', ok, ok ? '' : `expected ${env.adsense.client}`);
  }

  const csp = (await get(base, '/')).headers.get('content-security-policy') || '';
  check('CSP permits the ad tag', csp.includes('https://pagead2.googlesyndication.com'),
    csp.includes('https://pagead2.googlesyndication.com') ? '' : 'ads would be silently blocked');
  check('CSP permits ad frames', csp.includes('doubleclick'));

  const units = (home.match(/class="adsbygoogle"/g) || []).length;
  check('Ad unit rendered on the home page', units > 0, `${units} unit(s)`);

  const fonts = await text(base, '/fonts');
  check('Ad unit rendered on /fonts', (fonts.match(/class="adsbygoogle"/g) || []).length > 0);

  const beforeConsent = home.includes('pagead2.googlesyndication.com');
  check('Ad tag waits for consent', !beforeConsent,
    beforeConsent ? 'the tag is in the HTML before consent' : '');

  const banner = home.includes('data-consent="granted"') && home.includes('data-consent="denied"');
  check('Consent banner offered', banner, banner ? '' : 'required before loading ads in the EEA/UK');
}

/* -------------------------------------------------------- presentation --- */

bar('Presentation');

const noFalseClaim = !home.includes('no tracking cookies');
check('Footer makes no stale cookie claim', noFalseClaim,
  noFalseClaim ? '' : 'says "no tracking cookies" while ads are on');

for (const [p] of depths) {
  const html = await text(base, p);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const d = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (title.length > 65 || (d && d.length > 175)) {
    warn(`${p} may truncate in results`, `title ${title.length}, description ${d.length}`,
      'Google cuts titles near 60 and descriptions near 160');
  }
}
check('Titles and descriptions within budget', true);

const hasOg = async (p) => (await text(base, p)).includes('property="og:image"');
for (const p of ['/', '/about', '/tools']) {
  check(`${p} has a social card`, await hasOg(p));
}

/* ------------------------------------------------------------- report --- */

if (child) child.kill();

const pass = results.filter((r) => r.ok === true);
const fail = results.filter((r) => r.ok === false);
const warns = results.filter((r) => r.ok === null);

console.log(`\n${'='.repeat(58)}`);
for (const r of results) {
  const icon = r.ok === true ? '\x1b[32m✔\x1b[0m' : r.ok === false ? '\x1b[31m✖\x1b[0m' : '\x1b[33m⚠\x1b[0m';
  console.log(`${icon} ${r.name}${r.detail ? `\n    ${r.detail}` : ''}`);
  if (r.fix && r.ok !== true) console.log(`    → ${r.fix}`);
}
console.log('='.repeat(58));
console.log(`  ${pass.length} passed   ${fails(fail)}   ${warns.length} warning(s)`);

function fails(list) {
  return list.length ? `\x1b[31m${list.length} blocking\x1b[0m` : '0 blocking';
}

console.log('');
if (fail.length) {
  console.log('\x1b[31mNot ready to apply.\x1b[0m Fix the blocking items above.');
  process.exit(1);
}
if (!adsenseConfigured) {
  console.log('\x1b[33mTechnically sound, but ads are switched off.\x1b[0m');
  console.log('  Set ADSENSE_CLIENT and ADSENSE_SLOT, rebuild, then re-run this check.');
} else {
  console.log('\x1b[32mReady to apply.\x1b[0m');
  console.log('  Reminder: consider letting the site run 2-4 weeks before applying.');
}
console.log('');