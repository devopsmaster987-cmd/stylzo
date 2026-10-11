import { library } from '@/services/catalog.js';
import { LIB_META, pageMeta, toMetadata } from '@/lib/pages.js';
import { abs, safeJson } from '@/services/seo.js';
import { LIBRARY_QA, WHY_BOXES } from '@/lib/aeo.js';
import { JsonLd } from './json-ld.jsx';
import { Scripts } from './scripts.jsx';

export function libraryMeta(key) {
  return LIB_META[key];
}

/** Short, plain H1s. The long targeting lives in the title, not the heading. */
const LIB_HEADING = {
  symbols: 'Text symbols',
  emoji: 'Emoji',
  kaomoji: 'Kaomoji',
};

/** The lead restates the query in a sentence, then says what the page does. */
const LIB_LEAD = {
  symbols: `Copy and paste symbols straight into a bio, a username or a message. `
    + `Every symbol on this page is one click to copy, and there are `
    + `${libraryGroups('symbols').total} of them.`,
  emoji: `Find the emoji you want and copy it to your keyboard in one tap. `
    + `No app, no long-press menu, and no account — pick an emoji, press copy, and paste it anywhere.`,
  kaomoji: `Kaomoji are text emoticons made from ordinary characters, so you can copy and paste them `
    + `into any app that accepts text. Pick a face for the mood you are going for.`,
};

export function libraryGroups(key) {
  const data = library(key);
  const groups = data.categories.map((c) => ({
    key: c.key,
    name: c.name,
    char: c.char,
    intro: c.intro,
    count: c.items.length,
    items: c.items.map((it) => ({
      char: it.text ?? it.e,
      name: it.n ?? it.text,
      tags: it.tags || [],
    })),
  }));
  const total = groups.reduce((n, g) => n + g.count, 0);
  return { groups, total };
}

export async function generateLibraryMetadata(key) {
  return toMetadata(libraryMetadata(key));
}

/**
 * The library page schema, including a CollectionPage and one ItemList per
 * category. These pages list hundreds or thousands of copyable characters, so
 * describing them as a collection lets search engines understand what the page
 * actually holds rather than seeing one undifferentiated list of buttons.
 */
export function libraryMetadata(key) {
  const meta = LIB_META[key];
  const { groups, total } = libraryGroups(key);
  const path = `/${key}`;
  const faq = LIBRARY_QA[key] || [];

  // Built through pageMeta first, so this keeps the full buildMeta shape that
  // toMetadata() consumes (canonical, robots, og, twitter) rather than the raw
  // LIB_META entry.
  const built = pageMeta({
    ...meta,
    path,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: meta.title, path }],
    faq,
  });

  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${abs(path)}#collection`,
    name: meta.title,
    description: meta.description,
    url: abs(path),
    isPartOf: { '@id': `${abs('/')}#website` },
    numberOfItems: total,
  };

  // One list per category rather than a single thousand-item list: a carousel
  // that long is truncated by Google, and per-category lists describe what each
  // section of the page really contains.
  const lists = groups.map((g) => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${abs(`${path}#${g.key}`)}`,
    name: g.name,
    numberOfItems: g.count,
    itemListElement: g.items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: abs(`${path}#${g.key}`),
    })),
  }));

  return { ...built, jsonLd: [...built.jsonLd, safeJson(collection), ...lists.map(safeJson)] };
}

export function LibraryPage({ libraryKey }) {
  const key = libraryKey;
  const meta = LIB_META[key];
  const { groups, total } = libraryGroups(key);

  return (
    <>
      <JsonLd items={libraryMetadata(key).jsonLd} />
      <Scripts pageKey={key} scripts={['/js/library.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">{meta.title}</span>
      </nav>

      <section className="hero">
        {/* The H1 is short and readable; the query terms live in the title and
            in this lead, which is what the page is actually about. */}
        <h1>{LIB_HEADING[key]}</h1>
        <p className="lede">{LIB_LEAD[key]}</p>
        <div className="search">
          <label className="skip" htmlFor="lib-search">Search {meta.title}</label>
          <input
            id="lib-search"
            type="search"
            data-lib-search
            placeholder="Search — tap any item to copy it"
            autoComplete="off"
          />
        </div>
      </section>

      {/* The single most common question about any copied character library,
          answered before the long list. */}
      <section className="quick-answer" aria-labelledby="quick-answer-heading">
        <h2 id="quick-answer-heading">Why do copied items sometimes appear as empty boxes?</h2>
        <p>{WHY_BOXES}</p>
      </section>

      {(LIBRARY_QA[key] || []).length ? (
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading">Common questions</h2>
          {(LIBRARY_QA[key] || []).map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>
      ) : null}

      <nav className="chips" aria-label="Jump to category">
        <a href="#top" data-lib-all>All ({total})</a>
        {groups.map((g) => (
          <a key={g.key} href={`#${g.key}`}>{g.name} ({g.count})</a>
        ))}
      </nav>

      {groups.map((g) => (
        <section key={g.key} className="lib-group" id={g.key} data-lib-group data-name={g.name.toLowerCase()}>
          <h2>
            {g.char ? <><span aria-hidden="true">{g.char}</span> </> : null}
            {g.name} <span className="badge">{g.count}</span>
          </h2>
          {g.intro ? <p className="muted">{g.intro}</p> : null}
          <div className={key === 'kaomoji' ? 'lib-grid kao' : 'lib-grid'}>
            {g.items.map((it, i) => (
              <button
                key={`${g.key}-${i}`}
                type="button"
                className="lib-item"
                data-lib-item
                data-char={it.char}
                data-name={it.name}
                title={`Copy ${it.name}`}
              >
                <span aria-hidden="true">{it.char}</span>
                <span className="lib-name">{it.name}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <p className="empty" data-lib-empty hidden>Nothing matches that search. Try a shorter word.</p>
    </>
  );
}