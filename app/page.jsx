import { notFound } from 'next/navigation';
import { catalog, getCategory, listStyles } from '@/services/catalog.js';
import { env, adsenseConfigured } from '@/config/environment.js';
import { pageMeta, toMetadata, renderCards, PAGE_SIZE, inputFromQuery } from '@/lib/pages.js';
import {
  HOME_META, HOME_COLLECTIONS, HOME_SIZES, HOME_LIBRARIES, HOME_DESTINATIONS,
  HOME_HOW, HOME_LINKS,
} from '@/lib/home-content.js';
import { HOME_QA, HOME_ANSWER } from '@/lib/aeo.js';
import { RelatedSearches } from '@/components/related-searches.jsx';
import { GeneratorInput } from '@/components/generator-input.jsx';
import { StyleRow } from '@/components/style-row.jsx';
import { StylePreviewGrid, stylePreviews } from '@/components/style-preview-grid.jsx';
import { JsonLd } from '@/components/json-ld.jsx';
import { AdUnit } from '@/components/ad-unit.jsx';
import { Scripts } from '@/components/scripts.jsx';
import { Hero3D } from '@/components/hero-3d.jsx';

// The home page is the generator first, then keyword-driven content.
function homeMeta(params) {
  const hasQuery = Boolean(params.text || params.category);
  return pageMeta({
    title: HOME_META.title,
    description: HOME_META.description,
    path: '/',
    canonicalPath: '/',
    noindex: hasQuery,
    breadcrumbs: [],
    faq: hasQuery ? [] : HOME_QA,
    quickAnswer: HOME_ANSWER,
    app: !hasQuery,
    home: true,
  });
}

export async function generateMetadata({ searchParams }) {
  const params = (await searchParams) || {};
  if (typeof params.category === 'string' && params.category && !getCategory(params.category)) {
    return { robots: { index: false, follow: false } };
  }
  return toMetadata(homeMeta(params));
}



export default async function HomePage({ searchParams }) {
  const params = (await searchParams) || {};
  const category = typeof params.category === 'string' ? params.category : '';
  if (category && !getCategory(category)) notFound();

  const text = inputFromQuery(params);
  const cat = category ? getCategory(category) : null;
  const hasQuery = Boolean(params.text || category);
  // Resolved once: catalog() was previously re-entered inside the map below.
  const db = catalog();
  // listStyles() returns the prebuilt per-category list, so this is an array slice
  // rather than a scan over all 5.6k styles.
  const all = listStyles({ category });
  const meta = homeMeta(params);

  const cards = renderCards(all.slice(0, PAGE_SIZE), text);
  const total = all.length;
  const hasMore = total > PAGE_SIZE;

  const categories = Object.entries(db.categories).map(([key, c]) => ({
    key,
    name: c.name,
    count: db.indexableCounts[key] || 0,
  }));

  // A ?category= render is already narrowed by the chips above; showing the full
  // content library again would just repeat the same styles.
  const showContent = !hasQuery;
  const collections = showContent
    ? HOME_COLLECTIONS.map((c) => ({ ...c, items: stylePreviews(c.slugs, text) }))
        .filter((c) => c.items.length > 0)
    : [];
  const sizeItems = showContent ? stylePreviews(HOME_SIZES.slugs, text) : [];

  const vibes = ['cute', 'dark', 'gaming', 'retro', 'classy', 'chaos', 'bold', 'minimal'];

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="home" generator scripts={['/js/reveal.js']} />

      {showContent ? (
        <section className="hero">
          <Hero3D />
          <h1>{HOME_META.h1}</h1>
          <GeneratorInput formAction="/" text={text} />
        </section>
      ) : (
        <section className="hero">
          <Hero3D />
          <h1>{cat ? `${cat.name} fancy text generator` : 'Fancy text generator'}</h1>
          <GeneratorInput formAction="/" text={text} />
        </section>
      )}

      <nav aria-label="Style categories" className="chips">
        <a href="/" aria-current={!category ? 'page' : undefined}>All ({total})</a>
        {categories.map((c) => (
          <a
            key={c.key}
            href={`/fonts/category/${c.key}`}
            aria-current={category === c.key ? 'page' : undefined}
          >
            {c.name} ({c.count})
          </a>
        ))}
      </nav>

      <div className="search">
        <label className="skip" htmlFor="style-search">Search styles</label>
        <input
          id="style-search"
          type="search"
          data-style-search
          placeholder="Search styles — try glitch, hearts, stars, mono…"
          autoComplete="off"
        />
      </div>

      <div className="ai-assist" data-ai>
        <div className="gen-tools">
          <select data-ai-vibe aria-label="Choose a vibe" className="field-input">
            <option value="">Any vibe</option>
            {vibes.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <button type="button" className="btn small" data-ai-go>Suggest styles for this text</button>
          <span className="auth-note" data-ai-note aria-live="polite"></span>
        </div>
        <ul className="rows" data-ai-results hidden></ul>
      </div>

      <section aria-label="Styled results">
        <ul className="rows" data-rows>
          {cards.map((s) => <StyleRow key={s.id} s={s} />)}
        </ul>
        <ul className="rows" data-search-rows hidden aria-live="polite"></ul>
        {hasMore && (
          <div className="load-more">
            <button
              type="button"
              className="btn ghost"
              data-load-more
              data-offset={PAGE_SIZE}
              data-limit={PAGE_SIZE}
              data-category={category}
            >
              Load more styles
            </button>
            <span className="muted" data-load-status aria-live="polite">Showing {PAGE_SIZE} of {total}</span>
          </div>
        )}
      </section>

      {/* Placed after the results list rather than above the generator: an ad in
          the first viewport competes with the only thing the visitor came for.
          Renders nothing when ads are not configured. */}
      <AdUnit slot={env.adsense.slot} client={adsenseConfigured ? env.adsense.client : ''} />

      {showContent ? (
        <section className="quick-answer" aria-labelledby="quick-answer-heading">
          <h2 id="quick-answer-heading">{HOME_ANSWER.q}</h2>
          <p>{HOME_ANSWER.a}</p>
        </section>
      ) : null}

      {showContent ? (
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading">Common questions</h2>
          {HOME_QA.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>
      ) : null}

      {showContent ? <RelatedSearches path="/" /> : null}

      {showContent && (
        <>
          <section className="home-section prose" aria-labelledby="how-heading" data-reveal="pending">
            <h2 id="how-heading">{HOME_HOW.h2}</h2>
            <ol className="how-steps">
              {HOME_HOW.steps.map((s) => (
                <li key={s.h3}>
                  <h3>{s.h3}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
            <p className="muted how-note">{HOME_HOW.note}</p>
          </section>

          {collections.map((c) => (
            <section
              key={c.h2}
              className="home-section"
              aria-labelledby={`home-${c.h2.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}
              data-reveal="pending"
            >
              <h2 id={`home-${c.h2.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}>{c.h2}</h2>
              <p className="muted">{c.body}</p>
              <StylePreviewGrid items={c.items} />
            </section>
          ))}

          {sizeItems.length > 0 && (
            <section className="home-section" aria-labelledby="home-sizes" data-reveal="pending">
              <h2 id="home-sizes">{HOME_SIZES.h2}</h2>
              <p className="muted">{HOME_SIZES.body}</p>
              <StylePreviewGrid items={sizeItems} />
            </section>
          )}

          <section className="home-section" aria-labelledby="home-libraries" data-reveal="pending">
            <h2 id="home-libraries">{HOME_LIBRARIES.h2}</h2>
            <p className="muted">{HOME_LIBRARIES.body}</p>
            <ul className="dest-list">
              {HOME_LIBRARIES.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                  <p>{l.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="home-section" aria-labelledby="home-destinations" data-reveal="pending">
            <h2 id="home-destinations">{HOME_DESTINATIONS.h2}</h2>
            <p className="muted">{HOME_DESTINATIONS.body}</p>
            <ul className="dest-list">
              {HOME_DESTINATIONS.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                  <p>{l.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <nav className="crumbs" aria-label="Related pages" data-reveal="pending">
            <h2>Related pages</h2>
            <ul className="chip-list">
              {HOME_LINKS.map((l) => (
                <li key={l.href}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}