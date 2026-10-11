import 'dotenv/config';
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { get, startServer } from '../helpers/server.js';
import { readFileSync } from 'node:fs';

const pages = JSON.parse(readFileSync(new URL('../../data/pages.json', import.meta.url), 'utf8'));

const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');
const count = (html, re) => (text(html).match(re) || []).length;

// The integration suite runs against a single prebuilt .next, so exactly one of
// the two advertising states can be live in a given run. The privacy policy
// checks are configuration-independent and always run.
//
// dotenv is imported above so this reads the same values `next build` read.
// Without it the process env is empty, ADS_ON is false, and the "ads off" suite
// runs against an ads-on build and fails for the wrong reason.
const ADS_ON = Boolean(process.env.ADSENSE_CLIENT && process.env.ADSENSE_SLOT);
const onlyWith = (on) => (on ? {} : { skip: 'build without ads' });

describe('privacy policy', () => {
  let server;
  before(async () => { server = await startServer(3271); });
  after(() => server?.stop());

  test('does not claim a theme setting the site does not have', async () => {
    // Regression: the policy described a light/dark toggle that has never
    // existed, which is exactly the kind of inaccurate disclosure that gets
    // an AdSense application rejected.
    const html = await (await get(server.base, '/privacy')).text();
    assert.ok(!html.includes('light or dark theme choice'));
    assert.ok(!html.includes('theme choice'));
  });

  test('describes advertising and how to change the decision', async () => {
    const html = await (await get(server.base, '/privacy')).text();
    assert.match(html, /Google AdSense/);
    assert.match(html, /decline/i);
    assert.match(html, /European Economic Area|United Kingdom|Switzerland/);
    assert.match(html, /Ad Settings|opt out/i);
  });

  test('lists the storage keys the site really writes', async () => {
    const html = await (await get(server.base, '/privacy')).text();
    // Each of these corresponds to a real localStorage/sessionStorage write.
    assert.match(html, /advertising choice/i);
    assert.match(html, /favourited/i);
    assert.match(html, /recents|most recently/i);
    assert.match(html, /session storage/i);
  });

  test('is structured with real headings so it can be scanned', async () => {
    const html = await (await get(server.base, '/privacy')).text();
    const headings = (text(html).match(/<h2>([^<]*)<\/h2>/g) || [])
      .map((h) => h.replace(/<[^>]*>/g, ''));
    for (const expected of ['Advertising and cookies', 'Analytics', 'Children']) {
      assert.ok(headings.includes(expected), `privacy policy is missing the "${expected}" section`);
    }
  });

  test('links the official opt-out destinations', async () => {
    const html = await (await get(server.base, '/privacy')).text();
    for (const href of [
      'https://policies.google.com/technologies/ads',
      'https://www.google.com/settings/ads',
      'https://optout.aboutads.info/',
    ]) {
      assert.ok(html.includes(`href="${href}"`), `privacy policy does not link ${href}`);
    }
  });

  test('every privacy claim about storage matches what the code does', async () => {
    // Guard against the policy drifting from the implementation again.
    const lib = readFileSync(new URL('../../public/js/lib.js', import.meta.url), 'utf8');
    const claimsFavourites = /favourited/i.test(pages.privacy.sections
      .find((s) => /stored on your device/i.test(s.heading)).body.join(' '));
    assert.ok(lib.includes('stylix:favs') && lib.includes('stylix:recents'));
    assert.ok(claimsFavourites, 'the policy no longer mentions the storage the code performs');
  });
});

describe('ads.txt generation', () => {
  test('is generated from ADSENSE_CLIENT, not committed with a placeholder', () => {
    const build = readFileSync(new URL('../../scripts/build-ads-txt.js', import.meta.url), 'utf8');
    assert.match(build, /publisher = env\.adsense\.client\.replace\(\/\^ca-\/, ''\)/);
    assert.match(build, /google\.com, \$\{publisher\}, DIRECT/);
    // A file with the wrong publisher id silently serves zero ads, so no id may
    // be baked into the script itself.
    assert.ok(!/ca-pub-\d/.test(build), 'the generator must not hard-code a publisher id');
  });
});

describe('advertising with ads unconfigured', () => {
  let server;
  before(async () => { server = await startServer(3271); });
  after(() => server?.stop());

  test('no ad markup, no consent banner, no ad-shaped gaps', onlyWith(!ADS_ON), async () => {
    for (const path of ['/', '/fonts', '/styles/instagram', '/tools']) {
      const html = await (await get(server.base, path)).text();
      assert.equal(count(html, /class="adsbygoogle"/g), 0, `${path} renders an ad slot while ads are off`);
      assert.equal(count(html, /class="consent"/g), 0, `${path} shows a consent banner while ads are off`);
      assert.equal(count(html, /googlesyndication/g), 0, `${path} references the ad tag while ads are off`);
    }
  });

  test('the CSP does not open up advertising origins it does not use', onlyWith(!ADS_ON), async () => {
    const csp = (await get(server.base, '/')).headers.get('content-security-policy');
    assert.ok(!csp.includes('googlesyndication'), 'CSP allows the ad tag while ads are off');
    assert.ok(!csp.includes('doubleclick'), 'CSP allows ad frames while ads are off');
  });

  test('a build without credentials leaves no bogus ads.txt behind', onlyWith(!ADS_ON), async () => {
    assert.equal((await get(server.base, '/ads.txt')).status, 404);
  });
});

describe('advertising with a configured publisher', () => {
  let server;
  const CLIENT = process.env.ADSENSE_CLIENT;
  const enabled = ADS_ON;

  before(async () => {
    if (!enabled) return;
    server = await startServer(3272);
  });
  after(() => server?.stop());

  test('ads are wired end to end when a publisher id is configured', onlyWith(enabled), async () => {
    // ads.txt exists, otherwise Google serves nothing even once approved. It
    // carries the bare pub- id: the ca- from data-ad-client is stripped.
    const adsTxt = await get(server.base, '/ads.txt');
    assert.equal(adsTxt.status, 200);
    const body = await adsTxt.text();
    assert.match(body, new RegExp(`^google\\.com, ${CLIENT.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0`));
    assert.ok(!body.includes('ca-pub-'), 'ads.txt must not carry the ca- prefix');

    // The consent banner is offered before any ad can load.
    const html = await (await get(server.base, '/')).text();
    assert.match(html, /data-consent="granted"/);
    assert.match(html, /data-consent="denied"/);

    // Ad slots exist on the content pages, but the tag is NOT in the server
    // HTML: it must only be injected after consent is recorded.
    assert.ok(count(html, /class="adsbygoogle"/g) > 0, 'no ad unit was rendered');
    assert.equal(count(html, /pagead2\.googlesyndication\.com/g), 0, 'the ad tag must not load before consent');

    // A visitor can change their mind later.
    assert.match(html, /href="\/privacy"[^>]*>cookie policy</);
  });

  test('the unit uses the responsive display settings', onlyWith(enabled), async () => {
    const html = await (await get(server.base, '/')).text();
    const unit = text(html).match(/<ins[^>]*class="adsbygoogle"[^>]*>/)?.[0] || '';
    assert.match(unit, /data-ad-format="auto"/);
    assert.match(unit, /data-full-width-responsive="true"/);
  });

  test('ads appear only on pages with real content, at most one each', onlyWith(enabled), async () => {
    for (const p of ['/', '/fonts', '/styles/instagram', '/styles/gaming']) {
      const html = await (await get(server.base, p)).text();
      const n = count(html, /class="adsbygoogle"/g);
      assert.equal(n, 1, `${p} should carry exactly one ad, found ${n}`);
    }
    // Thin and policy pages never carry one.
    for (const p of ['/about', '/contact', '/privacy', '/terms', '/tools']) {
      const html = await (await get(server.base, p)).text();
      assert.equal(count(html, /class="adsbygoogle"/g), 0, `${p} must not render an ad`);
    }
  });

  test('every ad is visibly labelled', onlyWith(enabled), async () => {
    // Google requires ads to be distinguishable from site content.
    const html = text(await (await get(server.base, '/')).text());
    assert.equal(count(html, /class="ad-slot"/g), count(html, /class="ad-label"/g),
      'every ad slot needs a visible label');
  });

  test('the CSP permits the ad tag, ad frames and their beacons', onlyWith(enabled), async () => {
    const csp = (await get(server.base, '/')).headers.get('content-security-policy');
    assert.match(csp, /script-src[^;]*https:\/\/pagead2\.googlesyndication\.com/);
    assert.match(csp, /frame-src[^;]*https:\/\/googleads\.g\.doubleclick\.net/);
    assert.match(csp, /connect-src[^;]*https:\/\/googleads\.g\.doubleclick\.net/);
    // Ad creatives use inline styles in their own frames.
    assert.match(csp, /style-src[^;]*'unsafe-inline'/);
  });
});