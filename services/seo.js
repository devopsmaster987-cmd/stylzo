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
 */
export const abs = (p = '/') => new URL(p, `${env.siteUrl}/`).toString();

export const OG_IMAGE = {
  url: abs('/og-default.png'),
  width: 1200,
  height: 630,
  alt: 'Stylzo — turn plain text into fancy Unicode styles you can copy and paste',
};

/** Entity ids so schema nodes can cross-reference each other instead of duplicating. */
export const ids = {
  organization: `${abs('/')}#organization`,
  website: `${abs('/')}#website`,
  page: (path) => `${abs(path)}#webpage`,
};

/** The site as a publisher. Emitted on every page so the brand and host are linked. */
export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ids.organization,
    name: site.name,
    url: abs('/'),
    logo: { '@type': 'ImageObject', url: abs('/icon-512.png'), width: 512, height: 512 },
    description: site.defaultDescription,
    // Only ever the profiles the operator configured. Never guessed: a sameAs
    // pointing at an account the brand does not own is a claim about someone
    // else's identity.
    ...(env.sameAs.length ? { sameAs: env.sameAs } : {}),
    contactPoint: env.contactEmail
      ? { '@type': 'ContactPoint', contactType: 'customer support', email: env.contactEmail, availableLanguage: 'English' }
      : undefined,
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
 * A page's questions and answers as one FAQPage.
 *
 * Note on comparison tables, which generative engines prefer over prose when
 * asked which option to pick: schema.org has no type for one. The honest form
 * is a real semantic `<table>` with headers, which models read directly, and
 * inventing a wrapper type to label it would be schema the standard does not
 * define. The studio's text-vs-image comparison is therefore rendered as a
 * table and left unmarked rather than given a made-up `@type`.
 */
export function faqLd(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => quickAnswerLd(f.q, f.a)),
  };
}

/**
 * A step-by-step instruction set. Assistants answering "how do I make a text
 * image" prefer this over prose, and the steps must be the ones the page really
 * shows — the studio's own how-to list is the source of the wording here.
 */
export function howToLd(name, description, path, steps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    // The instructions belong to the page, not to a separate tutorial URL.
    ...(path ? { url: abs(path) } : {}),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/** One builder for title, description, canonical, social tags, breadcrumbs and JSON-LD. */
export function buildMeta({ title, description, path = '/', canonicalPath, breadcrumbs = [], faq = [], quickAnswer = null, howTo = null, noindex = false, app = false, home = false }) {
  const fullTitle = home ? `${site.name}: ${title}` : `${title} | ${site.name}`;
  const desc = (description || site.defaultDescription).slice(0, 300);
  const canonical = abs(canonicalPath || path);
  const ld = [];
  if (home) ld.push({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': ids.website, name: site.name, url: abs('/'), publisher: { '@id': ids.organization } });
  // The answer-first claim is emitted before the FAQ so it is the first
  // Question node a crawler meets. It is only claimed when no ?text= render is
  // involved, because a personalised render is not the same page.
  if (quickAnswer && !noindex) ld.push(quickAnswerLd(quickAnswer.q, quickAnswer.a));
  if (breadcrumbs.length) {
    ld.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: abs(b.path) })),
    });
  }
  if (faq.length) {
    ld.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  if (howTo && !noindex) ld.push(howToLd(howTo.name, howTo.description, canonical, howTo.steps));
  if (app) {
    ld.push({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', '@id': `${canonical}#app`,
      name: site.name, url: canonical, image: OG_IMAGE.url, applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'Text generator', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript',
      featureList: appFeatures(),
      isAccessibleForFree: true, publisher: { '@id': ids.organization },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } });
  }
  return {
    title: fullTitle, description: desc, canonical, noindex, breadcrumbs,
    robots: noindex ? 'noindex,follow' : 'index,follow',
    og: { title: fullTitle, description: desc, url: canonical, type: 'website', siteName: site.name, images: [OG_IMAGE] },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      images: [OG_IMAGE.url],
      ...(site.twitter ? { site: site.twitter } : {}),
    },
    jsonLd: ld.map(safeJson),
  };
}