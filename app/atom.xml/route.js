import { env } from '@/config/environment.js';
import { site } from '@/config/site.js';
import { GUIDES_UPDATED } from '@/lib/guides.js';
import sitemap from '@/app/sitemap.js';

// A full-site Atom feed. The guides RSS feed covers the articles; this one
// lists every indexable URL so a feed reader or crawler that only follows
// feeds still sees the style pages, hubs and tools. Entries come from the
// sitemap builder, so the two lists cannot drift apart.

const escapeXml = (value) => String(value == null ? '' : value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

export function GET() {
  const updated = new Date(`${GUIDES_UPDATED}T00:00:00.000Z`).toUTCString();
  const entries = sitemap();

  const items = entries.map(({ url }) => {
    const path = url === env.siteUrl ? '/' : url.slice(env.siteUrl.length);
    return [
      '  <entry>',
      `    <title>${escapeXml(path)}</title>`,
      `    <link href="${escapeXml(url)}" rel="alternate" type="text/html"/>`,
      `    <id>${escapeXml(url)}</id>`,
      `    <updated>${updated}</updated>`,
      '  </entry>',
    ].join('\n');
  }).join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${escapeXml(`${site.name} pages`)}</title>`,
    `  <subtitle>${escapeXml(`Every indexable page on ${site.name}.`)}</subtitle>`,
    `  <link href="${escapeXml(`${env.siteUrl}/atom.xml`)}" rel="self" type="application/atom+xml"/>`,
    `  <link href="${escapeXml(env.siteUrl)}" rel="alternate" type="text/html"/>`,
    `  <id>${escapeXml(`${env.siteUrl}/atom.xml`)}</id>`,
    `  <updated>${updated}</updated>`,
    `  <author><name>${escapeXml(site.name)}</name></author>`,
    items,
    '</feed>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
