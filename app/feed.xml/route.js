import { GUIDES, GUIDES_UPDATED, GUIDES_UPDATED_LABEL } from '@/lib/guides.js';
import { env } from '@/config/environment.js';
import { site } from '@/config/site.js';

// A feed for the written guides.
//
// The XML sitemap is still the primary discovery file, but a feed is a second,
// independent way for a crawler or reader to learn about new articles without
// re-fetching the whole site. It costs one small response to serve.

const escapeXml = (value) => String(value == null ? '' : value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

export function GET() {
  const base = env.siteUrl;
  const published = new Date(`${GUIDES_UPDATED}T00:00:00.000Z`).toUTCString();

  const items = GUIDES.map((guide) => {
    const url = `${base}/guides/${guide.slug}`;
    return [
      '    <item>',
      `      <title>${escapeXml(guide.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <description>${escapeXml(guide.metaDescription || guide.summary)}</description>`,
      `      <pubDate>${published}</pubDate>`,
      '    </item>',
    ].join('\n');
  }).join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(`${site.name} guides`)}</title>`,
    `    <link>${escapeXml(`${base}/guides`)}</link>`,
    `    <description>${escapeXml(`Practical guides to styled Unicode text from ${site.name}.`)}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${published}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(`${base}/feed.xml`)}" rel="self" type="application/rss+xml"/>`,
    `    <copyright>${escapeXml(`© ${new Date().getFullYear()} ${site.name}. Updated ${GUIDES_UPDATED_LABEL}.`)}</copyright>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
