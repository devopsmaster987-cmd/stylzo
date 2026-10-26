import { env } from '../config/environment.js';
import { site } from '../config/site.js';
import { appFeatures } from '../lib/facts.js';

/** Serialize JSON-LD safely for embedding in a <script> tag. */
export function safeJson(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/**
 * Absolute URL for a site path. Normalises through the URL parser rather than
 * concatenating, so a trailing slash, an uppercase segment or a stray query
 * string can never produce a malformed canonical or `og:url`.
 *
 * The parser is only reached for paths that can actually need it. `abs()` runs
 * inside the ItemList builders, so a page with a hundred styles asked for a
 * hundred URLs; those are all plain `/segment` or `/segment#fragment` paths,
 * where concatenating against the already-normalised site URL is identical to
 * what the parser returns. Anything else — a dot segment, a query string, a
 * percent-encoded byte, a protocol-relative `//` — falls through to the parser.
 */
const PLAIN_PATH = /^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*(?:#[A-Za-z0-9_-]+)?$/;

export function abs(p = '/') {
  return PLAIN_PATH.test(p) ? `${env.siteUrl}${p}` : new URL(p, `${env.siteUrl}/`).toString();
}

export const OG_IMAGE = {
  url: abs('/og-default.png'),
  width: 1200,
  height: 630,
  alt: 'Stylzo — turn plain text into fancy Unicode styles you can copy and paste',
};

/** Entity ids are defined in config/site.js and re-exported for existing callers. */
export const ids = site.ids;

/**
 * The site as a publisher. Emitted on every page so the brand, host and owner
 * are linked to one stable Organization node.
 */
export function organizationLd() {
  const owner = String(site.ownerName || '').trim();
  const email = String(site.businessEmail || '').trim();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ids.organization,
    name: site.name,
    alternateName: site.alternateName,
    url: abs('/'),
    logo: { '@type': 'ImageObject', url: abs('/icon-512.png'), width: 512, height: 512 },
    description: site.defaultDescription,
    // The owner is a real person, not a brand placeholder. The Person node has
    // a stable @id so other pages can reference it without restating the name.
    ...(owner ? {
      founder: {
        '@type': 'Person',
        '@id': ids.owner,
        name: owner,
        email: email || undefined,
        url: abs('/about'),
        jobTitle: 'Owner',
      },
    } : {}),
    // Only ever the profiles the operator configured. Never guessed: a sameAs
    // pointing at an account the brand does not own is a claim about someone
    // else's identity.
    ...(env.sameAs.length ? { sameAs: env.sameAs } : {}),
    contactPoint: email
      ? { '@type': 'ContactPoint', contactType: 'customer support', email, availableLanguage: 'English' }
      : undefined,
  };
}

/** The site itself, referenced by every WebPage and every WebApplication. */
export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': ids.website,
    name: site.name,
    alternateName: site.alternateName,
    url: abs('/'),
    description: site.defaultDescription,
    inLanguage: 'en',
    publisher: { '@id': ids.organization },
  };
}

/**
 * One WebApplication, looked up by key from config/site.js.
 *
 * The generator reads its feature list from lib/facts.js so the style counts
 * cannot drift; every tool has its own name, description and features. A tool
 * page must never publish the generator's feature list, which is what made the
 * old PDF and image pages claim they could restyle text.
 */
export function webApplicationLd(key) {
  const app = site.apps[key];
  if (!app) throw new Error(`Unknown WebApplication key: ${key}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': ids.app(key),
    name: app.name,
    url: abs(app.path),
    description: app.description,
    image: OG_IMAGE.url,
    applicationCategory: app.applicationCategory,
    applicationSubCategory: app.applicationSubCategory,
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    featureList: app.features || appFeatures(),
    isAccessibleForFree: true,
    isPartOf: { '@id': ids.website },
    publisher: { '@id': ids.organization },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}

/**
 * A category listing as an ordered list of the pages it contains.
 * `itemList` is [{ name, path }]; position is 1-based per schema.org.
 */
export function itemListLd(name, itemList) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: itemList.length,
    itemListElement: itemList.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: abs(item.path),
    })),
  };
}

/**
 * An answer-first block: a question phrased the way someone would ask an
 * assistant, followed by a short self-contained answer.
 *
 * This is the core of answer engine optimisation. An assistant answering
 * "what is a gothic font generator" is looking for a short passage that answers
 * the question without surrounding context, not a page it has to interpret. The
 * same text is rendered as visible page content and as Question/Answer schema,
 * so it is never schema that the page does not actually show.
 */
export function quickAnswerLd(question, answer) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  };
}

/**
 * Attach a page's JSON-LD, serialized only if something actually reads it.
 *
 * Every page calls its meta builder twice: once in generateMetadata(), where
 * `toMetadata()` discards the JSON-LD, and once in the component, where it is
 * rendered. Serializing up front meant every request paid for the whole block
 * once to throw it away — 219 KB of string on /emoji, for a value nothing read.
 *
 * `ld` stays on the object unserialized so a caller that wants to extend the
 * block set can, and `jsonLd` is a lazy getter so `buildMeta()` itself stays
 * cheap. It is deliberately non-enumerable: spreading a meta object must not
 * quietly materialize the JSON-LD, which is exactly what made the double build
 * invisible.
 */
export function attachJsonLd(meta, ld) {
  let jsonLd = null;
  Object.defineProperty(meta, 'jsonLd', {
    enumerable: false,
    get() {
      return jsonLd ?? (jsonLd = ld.map(safeJson));
    },
  });
  return meta;
}

/** One builder for title, description, canonical, social tags, breadcrumbs and JSON-LD. */
export function buildMeta({ title, description, path = '/', canonicalPath, breadcrumbs = [], quickAnswer = null, noindex = false, app = null, home = false }) {
  const fullTitle = home ? `${site.name}: ${title}` : `${title} | ${site.name}`;
  const desc = (description || site.defaultDescription).slice(0, 300);
  const resolvedPath = canonicalPath || path;
  const canonical = abs(resolvedPath);
  const ld = [];

  // Every page belongs to one WebSite and is one WebPage. The ids are the
  // join, not a repeated block of prose: a crawler can follow
  // WebPage -> WebSite -> publisher -> Organization -> founder from any URL.
  ld.push(websiteLd());
  if (app) ld.push(webApplicationLd(app));
  ld.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': ids.page(resolvedPath),
    url: canonical,
    name: fullTitle,
    description: desc,
    inLanguage: 'en',
    isPartOf: { '@id': ids.website },
    publisher: { '@id': ids.organization },
    ...(breadcrumbs.length ? { breadcrumb: { '@id': `${canonical}#breadcrumb` } } : {}),
    ...(app ? { mainEntity: { '@id': ids.app(app) } } : {}),
  });

  // The answer-first claim is emitted as one Question node. The visible FAQ and
  // how-to sections stay in the page; FAQPage and HowTo markup are deliberately
  // not emitted, because those rich-result types are no longer used here.
  if (quickAnswer && !noindex) ld.push(quickAnswerLd(quickAnswer.q, quickAnswer.a));
  if (breadcrumbs.length) {
    ld.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`,
      itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: abs(b.path) })),
    });
  }
  return attachJsonLd({
    title: fullTitle, description: desc, canonical, noindex, breadcrumbs,
    ld,
    robots: noindex ? 'noindex,follow' : 'index,follow',
    og: { title: fullTitle, description: desc, url: canonical, type: 'website', siteName: site.name, images: [OG_IMAGE] },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      images: [OG_IMAGE.url],
      ...(site.twitter ? { site: site.twitter } : {}),
    },
  }, ld);
}