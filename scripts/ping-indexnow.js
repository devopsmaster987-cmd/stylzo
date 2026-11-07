// Submits every sitemap URL to IndexNow so Bing, Yandex, Seznam, Naver and
// other participating engines re-crawl them without waiting for the next
// scheduled crawl. Google does not consume IndexNow; for Google the sitemap
// in Search Console plus URL Inspection remains the lever.
//
// Usage:
//   node scripts/ping-indexnow.js              # submit all sitemap URLs
//   node scripts/ping-indexnow.js /fonts/bold  # submit one path
//
// Requires the site to be reachable at SITE_URL (or the production default).

import { env } from '../config/environment.js';

const KEY = '3e435a70ff9404d7aa033c02865624bc';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

async function sitemapUrls() {
  const res = await fetch(`${env.siteUrl}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function submit(urls) {
  const host = new URL(env.siteUrl).hostname;
  const body = {
    host,
    key: KEY,
    keyLocation: `${env.siteUrl}/indexnow-key.txt`,
    urlList: urls,
  };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  // IndexNow answers 200 (accepted), 202 (accepted, key check pending) or
  // 422 (bad key / bad request). Anything else is a hard failure.
  if (res.status !== 200 && res.status !== 202) {
    const text = await res.text().catch(() => '');
    throw new Error(`IndexNow returned ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.status;
}

const only = process.argv[2];
try {
  let urls = await sitemapUrls();
  if (only) {
    const path = only.startsWith('/') ? only : `/${only}`;
    urls = urls.filter((u) => new URL(u).pathname === path);
    if (urls.length === 0) {
      console.error(`ping-indexnow: ${path} is not in the sitemap`);
      process.exit(1);
    }
  }
  const status = await submit(urls);
  console.log(`ping-indexnow: submitted ${urls.length} URL(s) (HTTP ${status})`);
} catch (error) {
  console.error(`ping-indexnow: ${error.message}`);
  process.exit(1);
}
