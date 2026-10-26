import { env } from '@/config/environment.js';

/**
 * AI answer engines are the fastest-growing source of referrals for a tool site,
 * but only if they are allowed to read it. `User-Agent: *` already permitted
 * them implicitly; naming them explicitly makes the decision deliberate and
 * keeps it from being reversed by accident.
 *
 * Note on Google: `Googlebot` drives Google Search and AI Overviews, and must
 * stay allowed for either. `Google-Extended` is a separate, optional control
 * over Gemini training and grounding. Blocking it does NOT remove the site from
 * AI Overviews. If you would rather opt out of training on your content, add
 * 'Google-Extended' to ALLOWED below.
 */
const AI_CRAWLERS = [
  'GPTBot',              // OpenAI, ChatGPT
  'OAI-SearchBot',       // OpenAI search
  'ChatGPT-User',        // OpenAI live user fetch
  'ClaudeBot',           // Anthropic
  'anthropic-ai',        // Anthropic (legacy)
  'PerplexityBot',       // Perplexity
  'Perplexity-User',     // Perplexity live user fetch
  'Google-Extended',     // Gemini training/grounding (not AI Overviews)
  'Applebot-Extended',   // Apple Intelligence
  'CCBot',               // Common Crawl, used by many AI datasets
  'Bingbot',             // Bing / Copilot
  'cohere-ai',           // Cohere
  'meta-externalagent',  // Meta AI
];

export default function robots() {
  // Private paths only. Nothing public is blocked here: filtered catalogue
  // views are noindexed on the page instead, because a robots block would stop
  // the crawler seeing the noindex directive at all. /event is deliberately not
  // blocked: it carries noindex,follow and needs to remain crawlable for that
  // directive to be read.
  const DISALLOW = ['/api/', '/admin'];

  return {
    rules: [
      {
        userAgent: '*',
        // /ads.txt is named separately because AdSense treats a robots block as
        // a missing file. The wildcard already allows it, but an explicit rule
        // survives a later tightening of the crawl policy.
        allow: ['/', '/ads.txt'],
        disallow: DISALLOW,
      },
      // Named explicitly after the wildcard so the AI permission is visible and
      // survives a later tightening of the wildcard rule.
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
    // Points answer engines at the curated summary rather than making them
    // infer the site structure.
    host: env.siteUrl,
  };
}