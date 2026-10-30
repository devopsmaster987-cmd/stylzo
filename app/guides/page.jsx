import { GUIDES, guideEntries, GUIDES_UPDATED, GUIDES_UPDATED_LABEL } from '@/lib/guides.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { site } from '@/config/site.js';
import { itemListLd } from '@/services/seo.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

function guidesIndexMeta() {
  const entries = guideEntries();
  const meta = pageMeta({
    title: 'Fancy text guides',
    description:
      'Plain-language guides to Unicode fancy text: bios, usernames, copying, screen readers, gaming names, and when to keep text plain.',
    path: '/guides',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Guides', path: '/guides' },
    ],
    quickAnswer: {
      q: 'What is on the guides index?',
      a: 'Eight practical guides about styled Unicode text: where it works, why it breaks, how to copy it, how assistive technology reads it, and where to keep text plain.',
    },
  });
  meta.ld.push(itemListLd('Stylzo guides', entries.map((e) => ({ name: e.title, path: e.path }))));
  return meta;
}

export function generateMetadata() {
  return toMetadata(guidesIndexMeta());
}

export default function GuidesIndex() {
  const meta = guidesIndexMeta();
  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="guides-index" />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">Guides</span>
      </nav>

      <section className="prose" aria-labelledby="guides-index-h1">
        <h1 id="guides-index-h1">Guides to fancy text</h1>
        <p>
          Short, plain-language guides about styled Unicode text: how it works, where it works,
          how it can go wrong, and when ordinary text is simply the better tool. Every example
          shown is real output from the site&rsquo;s generator.
        </p>
        <p className="muted">
          Written by <b>{site.ownerName}</b>, the developer and sole owner of {site.name}. Last
          reviewed: <time dateTime={GUIDES_UPDATED}>{GUIDES_UPDATED_LABEL}</time>
        </p>
      </section>

      <ul className="card-grid" aria-label="All guides">
        {GUIDES.map((guide) => (
          <li key={guide.slug} className="card">
            <h3><a href={`/guides/${guide.slug}`}>{guide.title}</a></h3>
            <p>{guide.summary}</p>
            <a className="card-link" href={`/guides/${guide.slug}`}>Read the guide</a>
          </li>
        ))}
      </ul>
    </>
  );
}
