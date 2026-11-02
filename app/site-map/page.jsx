import { catalog } from '@/services/catalog.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { LANDING_PAGES } from '@/lib/landing-pages.js';
import { PLATFORM_PAGES } from '@/lib/platform-pages.js';
import { GUIDES } from '@/lib/guides.js';
import { INDEXABLE_CATEGORY_KEYS, categoryHref } from '@/lib/category-routing.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

// A single, well-linked index of every page worth crawling.
//
// The XML sitemap already lists these URLs, but an HTML page does something the
// XML file cannot: it gives each link a human-readable anchor and places it
// three clicks or fewer from the home page. When a site is young, that extra
// internal path is often the difference between "discovered" and "indexed".
const TOOLS = [
  { path: '/tools', label: 'Text tools' },
  { path: '/image-compression', label: 'Image compressor' },
  { path: '/qr-code-generator', label: 'QR code generator' },
  { path: '/qr-code-reader', label: 'QR code reader' },
  { path: '/universal-text-fixer', label: 'Text fixer' },
  { path: '/screenshot-to-text', label: 'Screenshot to text' },
  { path: '/pdf-editor', label: 'PDF editor' },
  { path: '/pdf-accessibility-checker', label: 'PDF accessibility checker' },
];

const LIBRARIES = [
  { path: '/symbols', label: 'Symbols' },
  { path: '/emoji', label: 'Emoji' },
  { path: '/kaomoji', label: 'Kaomoji' },
];

const CREATE = [
  { path: '/', label: 'Text generator' },
  { path: '/styles', label: 'Style guides' },
  { path: '/fonts', label: 'Font styles' },
  { path: '/studio', label: 'Font studio' },
  { path: '/embed', label: 'Embed the generator' },
];

const COMPANY = [
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
  { path: '/privacy', label: 'Privacy' },
  { path: '/terms', label: 'Terms' },
];

function siteMapMeta() {
  const { indexableStyles } = catalog();
  return pageMeta({
    title: 'Site Map — Every Page on Stylzo',
    description:
      `Every page in one place: the text generator, ${GUIDES.length} guides, `
      + `${indexableStyles.length} font style pages, platform guides, text libraries and browser tools.`,
    path: '/site-map',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Site map', path: '/site-map' },
    ],
    quickAnswer: {
      q: 'What is on this site map?',
      a: `A complete index of Stylzo: the main generator, ${indexableStyles.length} font style pages grouped by category, `
        + 'platform guides, text libraries, browser tools and the written guides. Every link goes to a live page.',
    },
  });
}

export function generateMetadata() {
  return toMetadata(siteMapMeta());
}

function LinkList({ items, labelledBy }) {
  return (
    <ul className="site-map-list" aria-labelledby={labelledBy}>
      {items.map((item) => (
        <li key={item.path}>
          <a href={item.path}>{item.label}</a>
        </li>
      ))}
    </ul>
  );
}

export default function SiteMapPage() {
  const meta = siteMapMeta();
  const { categories, indexableStyles } = catalog();

  // Group every indexable style page by its real category so the map mirrors
  // /fonts. Only the category hubs that are meant to rank get a clickable
  // heading; the noindex and redirected hubs stay as plain labels so this page
  // does not send crawlers to a URL that cannot be indexed.
  const stylesByCategory = new Map(
    Object.keys(categories).map((key) => [key, []]),
  );
  for (const style of indexableStyles) {
    const bucket = stylesByCategory.get(style.category);
    if (bucket) bucket.push(style);
  }
  const indexableHubs = new Set(INDEXABLE_CATEGORY_KEYS);

  const guides = [
    { path: '/guides', label: 'All guides' },
    ...GUIDES.map((guide) => ({ path: `/guides/${guide.slug}`, label: guide.title })),
  ];

  const platforms = [
    ...LANDING_PAGES.map((page) => ({ path: `/styles/${page.key}`, label: page.subject })),
    ...PLATFORM_PAGES.map((page) => ({ path: page.path, label: page.subject })),
  ];

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="site-map" />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">Site map</span>
      </nav>

      <section className="hero">
        <h1>Site map</h1>
        <p className="lede">
          Every important page on {meta.og.siteName}, grouped by what it does. Nothing here is
          hidden behind a search box or a menu.
        </p>
      </section>

      <section className="prose" aria-labelledby="map-create">
        <h2 id="map-create">Create</h2>
        <LinkList items={CREATE} labelledBy="map-create" />

        <h2 id="map-styles">Font styles by category</h2>
        <p className="muted">
          Each category lists every style that has its own page. A category name links to the
          hub, and each style name opens its generator.
        </p>
        {[...stylesByCategory.entries()].map(([key, styles]) => {
          const category = categories[key];
          if (!category || !styles.length) return null;
          return (
            <div key={key} className="site-map-group">
              <h3>
                {indexableHubs.has(key)
                  ? <a href={categoryHref(key)}>{category.name}</a>
                  : category.name} ({styles.length})
              </h3>
              <ul className="site-map-list">
                {styles.map((style) => (
                  <li key={style.slug}>
                    <a href={`/fonts/${style.slug}`}>{style.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <h2 id="map-guides">Guides</h2>
        <LinkList items={guides} labelledBy="map-guides" />

        <h2 id="map-platforms">Platform guides</h2>
        <LinkList items={platforms} labelledBy="map-platforms" />

        <h2 id="map-libraries">Text libraries</h2>
        <LinkList items={LIBRARIES} labelledBy="map-libraries" />

        <h2 id="map-tools">Tools</h2>
        <LinkList items={TOOLS} labelledBy="map-tools" />

        <h2 id="map-company">About the site</h2>
        <LinkList items={COMPANY} labelledBy="map-company" />
      </section>
    </>
  );
}
