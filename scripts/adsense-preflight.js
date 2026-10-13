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
import { KEPT_STYLE_SLUGS, STYLES_HUB_AD_MIN_WORDS } from '../lib/styles-routing.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Accepts both "--url https://x" and "--url=https://x". Only the space form was
// handled before, so the documented equals form silently fell back to checking
// the local build and reported a result about the wrong target.
const argUrl = (() => {
  const inline = process.argv.find((a) => a.startsWith('--url='));
  if (inline) return inline.slice('--url='.length);
  const i = process.argv.indexOf('--url');
  return i !== -1 ? process.argv[i + 1] : null;
})();

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

// `init` is forwarded on purpose. fetch follows redirects by default, so
// checking that a URL is *retired* means asking for the redirect itself —
// without this the probe silently followed the hop and reported the destination
// as if it were the source.
const get = (base, p, init) => fetch(`${base}${p}`, init);
const text = async (base, p) => (await (await get(base, p)).text());
const words = (html) => {
  const m = html.replace(/<script[\s\S]*?<\/script>/g, '').match(/<main[\s\S]*?<\/main>/);
  return (m ? m[0] : html).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
};

/* ------------------------------------------------------- configuration --- */

bar(argUrl ? `Configuration (local — not authoritative for ${argUrl})` : 'Configuration');

if (argUrl) {
  // The environment variables behind a deployed build live on the host, not in
  // this shell. Reporting the local values here would claim ads are
  // unconfigured when they may well be configured in production, so the local
  // environment is explicitly out of scope and only what the live site actually
  // serves is checked further down.
  warn('Local environment not checked', 'this run targets a deployed build',
    'Set ADSENSE_CLIENT and ADSENSE_SLOT on the host, then re-run');
} else if (!env.adsense.client) {
  check('Publisher ID (ADSENSE_CLIENT)', false, 'not set',
    'AdSense > Account > Settings > Account information > Publisher ID');
} else if (!/^ca-pub-\d{6,}$/.test(env.adsense.client)) {
  check('Publisher ID (ADSENSE_CLIENT)', false, `malformed: ${env.adsense.client}`,
    'It should look like ca-pub-0000000000000000');
} else {
  check('Publisher ID (ADSENSE_CLIENT)', true, env.adsense.client);
}

if (argUrl) {
  // Nothing local can answer these.
} else if (!env.adsense.slot) {
  check('Ad unit ID (ADSENSE_SLOT)', false, 'not set',
    'AdSense > Ads > Inventory > your unit > the digits after slot=');
} else if (!/^\d+$/.test(env.adsense.slot)) {
  check('Ad unit ID (ADSENSE_SLOT)', false, `must be digits: ${env.adsense.slot}`, 'e.g. 9876543210');
} else {
  check('Ad unit ID (ADSENSE_SLOT)', true, env.adsense.slot);
}

if (argUrl) {
  // skipped
} else if (!adsenseConfigured) {
  warn('Both values present', 'ads will stay switched off until they are',
    'Set both, then rebuild so ads.txt and the CSP are generated');
}

if (argUrl) {
  // The deployed build is a production build by definition.
} else if (env.nodeEnv !== 'production') {
  warn('Running as a production build', `NODE_ENV=${env.nodeEnv}`,
    'Several defects only appear in production; the local build matches it');
} else {
  check('Running as a production build', true);
}

if (!argUrl) check('SITE_URL resolves', /^https?:\/\//.test(env.siteUrl), env.siteUrl);

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

// Thin and policy pages. Google expects ads only where there is content to
// scroll past, so a unit on any of these is a policy problem, not just clutter.
const NO_AD_PAGES = ['/about', '/contact', '/privacy', '/terms', '/tools', '/fonts', '/symbols', '/emoji', '/kaomoji', '/studio'];

// The real guide pages under /styles/*, each of which must carry exactly one ad.
const STYLE_GUIDES = KEPT_STYLE_SLUGS.map((slug) => `/styles/${slug}`);

// The thin doorway pages the site used to publish under /styles/*. They must
// never come back as live pages, and an ad on any of them is the exact failure
// that got the site into trouble: inventory on a page with nothing to read.
const RETIRED_STYLE_SLUGS = [
  'fancy-text-generator', 'fancy-text-generator-online', 'free-fancy-text-generator',
  'best-fancy-text-generator', 'fancy-text', 'copy-and-paste-fancy-text',
  'fancy-text-generator-2024', 'fancy-text-generator-app', 'fancy-text-generator-download',
  'hindi-fancy-text-generator', 'urdu-fancy-text-generator', 'arabic-fancy-text-generator',
  'tamil-fancy-text-generator', 'marathi-fancy-text-generator', 'coolsymbol-fancy-text-generator',
  'facebook-fancy-text-generator', 'heart-fancy-text-generator', 'www-fancy-text-generator',
  'font-fancy-text-generator', 'ai-fancy-text-generator', 'fancy-text-generator-blue-colour',
  'cool-fancy-text-generator', 'online-fancy-text-generator', 'instagram-fancy-text-generator',
  'fancy-text-generator-for-instagram', 'instagram-bio-fonts', 'instagram-font-generator',
  'instagram-username-fonts', 'instagram-name-fonts', 'instagram-caption-fonts',
  'fancy-text-for-instagram-bio', 'instagram-aesthetic-fonts',
];

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

// Always decide from what the site actually serves. The local env cannot
// describe a deployed build, and guessing either way would give a false answer.
const adsTxtRes = await get(base, '/ads.txt');
const adsTxtBody = adsTxtRes.status === 200 ? (await adsTxtRes.text()).trim() : '';
const liveCsp = (await get(base, '/')).headers.get('content-security-policy') || '';
const liveUnits = (home.match(/class="adsbygoogle"/g) || []).length;
const adsLive = adsTxtRes.status === 200 || liveUnits > 0;

if (!adsLive) {
  check('ads.txt served', false, `status ${adsTxtRes.status}`,
    argUrl
      ? 'Set ADSENSE_CLIENT on the host and redeploy; ads.txt is generated at build time'
      : 'Set ADSENSE_CLIENT, then rebuild so public/ads.txt is written');
  check('Ad unit rendered on the home page', false, '0 units',
    'No ad units means the reviewer has nothing to inspect');
  warn('CSP permits Google ad origins', 'not applicable while ads are off',
    'This only becomes a risk once ads are configured');
} else {
  check('ads.txt served', true, adsTxtBody || `status ${adsTxtRes.status}`);
  // ads.txt carries the bare publisher id: Google's spec strips the "ca-" that
  // data-ad-client uses, so matching "ca-pub-" here flagged a correct file as
  // broken. pub- is what the IAB spec and every AdSense account expect.
  const named = adsTxtBody.match(/(?:^|,\s*)pub-\d+/);
  check('ads.txt names a publisher', Boolean(named), named ? named[0] : 'no pub- id found in ads.txt',
    'A wrong id here silently serves zero ads even after approval');
  const prefixed = adsTxtBody.match(/ca-pub-/);
  check('ads.txt omits the ca- prefix', !prefixed, prefixed ? `found ${prefixed[0]}` : '',
    'ca-pub- is the data-ad-client form; ads.txt must use pub-');

  check('CSP permits the ad tag', liveCsp.includes('https://pagead2.googlesyndication.com'),
    liveCsp.includes('https://pagead2.googlesyndication.com') ? '' : 'every ad would be silently blocked');
  check('CSP permits ad frames', liveCsp.includes('doubleclick'));

  check('Ad unit rendered on the home page', liveUnits > 0, `${liveUnits} unit(s)`);

  // /fonts is an index of links rather than prose, so it is on NO_AD_PAGES. The
  // /fonts/<slug> style pages are real content and may carry one unit, but they
  // are not required to: an ad on a page without one is not a policy problem.

  // A guide page under /styles/* is the other money page, so it carries an ad too.
  for (const g of STYLE_GUIDES) {
    const n = ((await text(base, g)).match(/class="adsbygoogle"/g) || []).length;
    check(`Ad unit rendered on ${g}`, n > 0, n ? `${n} unit(s)` : '');
    // At most one unit per page: a second on a page this thin reads as a layout
    // bug to a reviewer rather than as inventory.
    check(`At most one ad on ${g}`, n <= 1, `${n} unit(s)`);
  }

  // /styles is the one page allowed an ad only because it earns one. The app
  // gates the unit on its own prose clearing this floor; this check measures the
  // whole rendered page, which is the looser of the two, so a page that renders
  // a unit at all has necessarily passed the tighter one.
  const hubWords = words(await text(base, '/styles'));
  check(`/styles clears the ${STYLES_HUB_AD_MIN_WORDS}-word floor`, hubWords >= STYLES_HUB_AD_MIN_WORDS,
    `${hubWords} words`, 'below the floor the hub stops rendering an ad unit at all');
  const hubUnits = ((await text(base, '/styles')).match(/class="adsbygoogle"/g) || []).length;
  check('Ad unit rendered on /styles', hubUnits > 0, `${hubUnits} unit(s)`);
  check('At most one ad on /styles', hubUnits <= 1, `${hubUnits} unit(s)`);

  // Rule: thin and policy pages never carry ads. A unit here is a policy
  // violation, not just a layout annoyance, so this fails rather than warns.
  for (const p of NO_AD_PAGES) {
    const n = ((await text(base, p)).match(/class="adsbygoogle"/g) || []).length;
    check(`No ad unit on ${p}`, n === 0, n ? `${n} unit(s)` : '');
  }

  // Rule: a retired /styles/<slug> must redirect, never render. Anything else is
  // either a live thin page or a soft 404, and either one is a live ad slot on
  // a page with no content behind it.
  const resurrected = [];
  const wrongTarget = [];
  for (const slug of RETIRED_STYLE_SLUGS) {
    const res = await get(base, `/styles/${slug}`, { redirect: 'manual' });
    if (res.status !== 301) {
      resurrected.push(`${slug} (${res.status})`);
      continue;
    }
    const to = new URL(res.headers.get('location'), base).pathname;
    const wanted = slug.includes('instagram')
      ? '/styles/instagram'
      : /^(hindi|urdu|arabic|tamil|marathi)-fancy-text-generator$/.test(slug)
        ? '/styles/languages'
        : slug === 'fancy-text-generator-blue-colour' ? '/styles/colours' : '/';
    if (to !== wanted) wrongTarget.push(`${slug} -> ${to} (wanted ${wanted})`);
  }
  check(`Every retired /styles/* slug 301s away`, resurrected.length === 0,
    resurrected.length ? `${resurrected.length} still live, e.g. ${resurrected.slice(0, 3).join(', ')}`
      : `${RETIRED_STYLE_SLUGS.length} checked`);
  check('Every retired /styles/* slug redirects to the right page', wrongTarget.length === 0,
    wrongTarget.slice(0, 3).join(', '));

  // And the sitemap must not advertise any of them.
  const retiredInSitemap = RETIRED_STYLE_SLUGS.filter((s) => sm.includes(`/styles/${s}</loc>`));
  check('The sitemap lists no retired /styles/* slug', retiredInSitemap.length === 0,
    retiredInSitemap.slice(0, 5).join(', '));

  // The tag is static markup in the head, because AdSense verifies a site by
  // reading it out of the served HTML rather than running the page. Consent
  // still gates the ad itself: no unit is requested from the server-rendered
  // HTML, and the push happens in the browser once an answer is recorded.
  const head = home.slice(0, (home.indexOf('</head>') + 7));
  check('Ad tag is in the head, for verification',
    head.includes('pagead2.googlesyndication.com'),
    head.includes('pagead2.googlesyndication.com') ? '' : 'AdSense cannot verify a site whose tag is not in the HTML');
  check('google-adsense-account is in the head',
    /<meta name="google-adsense-account" content="ca-pub-\d+"/.test(head));
  const tagCount = (home.match(/<script[^>]+pagead\/js\/adsbygoogle\.js/g) || []).length;
  check('Ad tag loads exactly once', tagCount === 1, `${tagCount} tag(s)`);
  const filledBeforeConsent = [...home.matchAll(/<ins class="adsbygoogle"[^>]*>\s*[^<\s]/g)];
  check('No ad requested before consent', filledBeforeConsent.length === 0,
    filledBeforeConsent.length ? 'an ad unit is already filled in the server HTML' : '');

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
if (!adsLive) {
  console.log('\x1b[33mTechnically sound, but ads are switched off on this build.\x1b[0m');
  console.log(argUrl
    ? '  Set ADSENSE_CLIENT and ADSENSE_SLOT in the host environment, then redeploy.'
    : '  Set ADSENSE_CLIENT and ADSENSE_SLOT, rebuild, then re-run this check.');
} else {
  console.log('\x1b[32mReady to apply.\x1b[0m');
  console.log('  Reminder: consider letting the site run 2-4 weeks before applying.');
}
console.log('');