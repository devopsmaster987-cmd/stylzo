import { catalog, listStyles } from '@/services/catalog.js';
import { pageMeta, toMetadata, renderCards, SUPPORT_LABEL } from '@/lib/pages.js';
import { FONTS_ANSWER, FONTS_QA } from '@/lib/aeo.js';
import { FONTS_SUPPORT } from '@/lib/fonts-content.js';
import { RelatedSearches } from '@/components/related-searches.jsx';
import { itemListLd, safeJson } from '@/services/seo.js';
import { StyleRow } from '@/components/style-row.jsx';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';
import { categoryHref } from '@/lib/category-routing.js';

function fontsMeta({ noindex = false } = {}) {
  return pageMeta({
    title: 'Fancy Font Styles',
    description: 'Browse every text style by category, see how well each one is supported, and open a style page to generate with it.',
    path: '/fonts',
    canonicalPath: '/fonts',
    noindex,
    // A filtered view is the same page with a subset of the same list. It is
    // noindex and canonicalises to /fonts, so it must not also claim the
    // unfiltered page's questions as its own.
    faq: noindex ? [] : FONTS_QA,
    quickAnswer: FONTS_ANSWER,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Font styles', path: '/fonts' }],
  });
}

export async function generateMetadata({ searchParams }) {
  const sp = (await searchParams) || {};
  const query = (typeof sp.q === 'string' ? sp.q : '').trim();
  // A filtered view is the same page with a subset of the same list, so it
  // canonicalises to /fonts and must not be indexed separately.
  return toMetadata(fontsMeta({ noindex: Boolean(query) }));
}

export default async function FontsIndexPage({ searchParams }) {
  const { categories, indexableCounts, sample, indexableStyles } = catalog();
  const sp = (await searchParams) || {};
  const supportCounts = { safe: 0, good: 0, limited: 0 };
  for (const style of indexableStyles) supportCounts[style.support] += 1;

  // ?q= filters the server-rendered list, so a search result is a real URL with
  // real content rather than something that only exists after JavaScript runs.
  // That is what makes a SearchAction sitelink honest if it is ever declared.
  const query = (typeof sp.q === 'string' ? sp.q : '').trim().toLowerCase().slice(0, 60);
  const searching = query.length > 0;

  // The JSON-LD rendered below has to be the same variant generateMetadata()
  // describes. Calling fontsMeta() with no argument here made a filtered render
  // advertise the unfiltered page's FAQ while its robots tag said noindex.
  const meta = fontsMeta({ noindex: searching });

  const matches = (s) => !searching
    || s.name.toLowerCase().includes(query)
    || (s.category || '').toLowerCase().includes(query);

  const groups = Object.entries(categories)
    .map(([key, c]) => ({
      key,
      name: c.name,
      intro: c.intro,
      count: indexableCounts[key] || 0,
      styles: renderCards(listStyles({ category: key }).filter((s) => s.indexable && matches(s)), sample),
    }))
    // A search legitimately narrows the list; the unfiltered view must not.
    .filter((g) => g.styles.length || !searching);

  // One ItemList per category rather than a single 100-item list: a carousel
  // that long is truncated by Google anyway, and per-category lists describe
  // what each section of the page actually contains.
  const itemLd = groups.map((g) => safeJson(
    itemListLd(g.name, g.styles.map((s) => ({ name: s.name, path: `/fonts/${s.slug}` }))),
  ));

  const found = groups.reduce((n, g) => n + g.styles.length, 0);

  return (
    <>
      <JsonLd items={[...meta.jsonLd, ...itemLd]} />
      <Scripts pageKey="fonts" />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">Font styles</span>
      </nav>

      <section className="hero">
        <h1>Fancy font styles</h1>
        <nav className="chips" aria-label="Style categories">
          {groups.map((g) => (
            <a key={g.key} href={categoryHref(g.key)}>{g.name} ({g.count})</a>
          ))}
        </nav>
        <div className="search">
          <label className="skip" htmlFor="fonts-q">Search font styles</label>
          <form method="get" action="/fonts" role="search">
            <input
              id="fonts-q"
              name="q"
              type="search"
              defaultValue={typeof sp.q === 'string' ? sp.q : ''}
              placeholder="Search — try gothic, bubble, glitch, mono"
              autoComplete="off"
            />
          </form>
        </div>
        {searching ? (
          <p className="muted" data-fonts-count>
            {found} style{found === 1 ? '' : 's'} matching “{sp.q}”.{' '}
            <a href="/fonts">Show all styles</a>
          </p>
        ) : null}
      </section>

      {/* The list above is the product. This is the short passage an assistant
          can quote when asked what the page lists and how to search it. Hidden
          from a filtered view, which is noindex and does not claim it. */}
      {!searching ? (
        <>
          <section className="quick-answer" aria-labelledby="fonts-answer">
            <h2 id="fonts-answer">{FONTS_ANSWER.q}</h2>
            <p>{FONTS_ANSWER.a}</p>
          </section>

          <section aria-labelledby="fonts-faq">
            <h2 id="fonts-faq">Common questions</h2>
            {FONTS_QA.map((f) => (
              <div key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>

          <RelatedSearches path="/fonts" />
        </>
      ) : null}

      {!searching ? (
        <section className="prose" aria-labelledby="fonts-support">
          <h2 id="fonts-support">{FONTS_SUPPORT.h2}</h2>
          <p className="muted">{FONTS_SUPPORT.intro}</p>
          <div className="table-wrap">
            <table className="table">
              <caption>
                Counts cover the {indexableStyles.length} styles with their own page.
              </caption>
              <thead>
                <tr>{FONTS_SUPPORT.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
              </thead>
              <tbody>
                {FONTS_SUPPORT.rows.map((r) => (
                  <tr key={r.key}>
                    <th scope="row">{SUPPORT_LABEL[r.key]} ({supportCounts[r.key]})</th>
                    <td>{r.meaning}</td>
                    <td>{r.examples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>{FONTS_SUPPORT.fieldHeading}</h3>
          <p className="muted">{FONTS_SUPPORT.fieldBody}</p>
          <h3>{FONTS_SUPPORT.fallbackHeading}</h3>
          <p className="muted">{FONTS_SUPPORT.fallbackBody}</p>
        </section>
      ) : null}

      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`cat-${g.key}`}>
          <h2 id={`cat-${g.key}`}>
            <a href={categoryHref(g.key)}>{g.name}</a>
          </h2>
          <p className="muted">{g.intro}</p>
          <ul className="rows">
            {g.styles.map((s) => <StyleRow key={s.id} s={s} />)}
          </ul>
          <p className="more">
            <a href={categoryHref(g.key)}>All {g.count} {g.name.toLowerCase()} styles</a>
          </p>
        </section>
      ))}
    </>
  );
}