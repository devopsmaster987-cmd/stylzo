import { library } from '@/services/catalog.js';
import { LIB_META, pageMeta, toMetadata } from '@/lib/pages.js';
import { abs, attachJsonLd } from '@/services/seo.js';
import { LIBRARY_QA, LIBRARY_ANSWER } from '@/lib/aeo.js';
import { RelatedSearches } from './related-searches.jsx';
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
    + `Every symbol on this page is one click to copy.`,
  emoji: `Find the emoji you want and copy it to your keyboard in one tap. `
    + `No app, no long-press menu, and no account — pick an emoji, press copy, and paste it anywhere.`,
  kaomoji: `Kaomoji are text emoticons made from ordinary characters, so you can copy and paste them `
    + `into any app that accepts text. Pick a face for the mood you are going for.`,
};

/**
 * The lead, with the library's own size folded in.
 *
 * Resolved per render rather than at module scope: a template literal in the
 * table above would run `libraryGroups()` while the module was still being
 * evaluated, which is a synchronous read of symbols.json on every server boot
 * whether or not anyone ever visits /symbols.
 */
function libLead(key) {
  return key === 'symbols'
    ? `${LIB_LEAD.symbols} There are ${libraryGroups('symbols').total} of them.`
    : LIB_LEAD[key];
}

/**
 * What to do with a character after copying it.
 *
 * These pages answered their own question and stopped: nothing in the body copy
 * linked anywhere, so the three libraries were dead ends that gave their visitors
 * no route back to the pages that do the styling. One sentence each, pointing at
 * the page that does the next job, with anchors that describe the destination
 * rather than saying "here".
 */
const LIB_NEXT = {
  symbols: (
    <>
      Every symbol here is plain text, so it can be styled like anything else: put a line of it
      through the <a href="/">fancy text generator</a>, browse the{' '}
      <a href="/fonts">font styles</a>, or see a whole batch of styled words at once on the{' '}
      <a href="/styles">style guides</a>.
    </>
  ),
  emoji: (
    <>
      Copied emoji sometimes arrive with invisible characters attached, which are invisible to you
      and obvious to everyone else. The <a href="/tools">text cleaner</a> strips zero-width
      characters and emoji when you need the plain text underneath.
    </>
  ),
  kaomoji: (
    <>
      A kaomoji is typed by hand, so styling it would only make it harder to read. Style the text
      around it instead, with the <a href="/">fancy text generator</a> or a{' '}
      <a href="/fonts">font style</a>, or check a whole phrase in the{' '}
      <a href="/styles">style guides</a>.
    </>
  ),
};

/**
 * A library's categories, flattened into what the page renders.
 *
 * Memoised per library key. There are only three of them, the data is a build
 * artifact that cannot change while the process runs, and the emoji page used
 * to rebuild all 1,923 items on every request — and then build them again, and
 * a third time for the JSON-LD.
 */
const groupCache = new Map();

export function libraryGroups(key) {
  const cached = groupCache.get(key);
  if (cached) return cached;

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
  const result = { groups, total: groups.reduce((n, g) => n + g.count, 0) };
  groupCache.set(key, result);
  return result;
}

export async function generateLibraryMetadata(key) {
  return toMetadata(libraryMetadata(key));
}

/**
 * The library page schema, including a CollectionPage and one ItemList per
 * category. These pages list hundreds or thousands of copyable characters, so
 * describing them as a collection lets search engines understand what the page
 * actually holds rather than seeing one undifferentiated list of buttons.
 *
 * Memoised for the same reason as libraryGroups(): the blocks are a pure
 * function of the library file, and generateMetadata() built the whole
 * 219 KB emoji ItemList on every request only for toMetadata() to drop it.
 */
const metadataCache = new Map();

export function libraryMetadata(key) {
  const cached = metadataCache.get(key);
  if (cached) return cached;

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
    quickAnswer: LIBRARY_ANSWER,
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
  //
  // The anchor URL is resolved once per category, not once per item: every
  // entry in a list points at that section, so resolving it per item built the
  // same 1,923 URLs to throw 1,914 of them away.
  const lists = groups.map((g) => {
    const url = abs(`${path}#${g.key}`);
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${url}`,
      name: g.name,
      numberOfItems: g.count,
      itemListElement: g.items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        url,
      })),
    };
  });

  // Spreading `built` drops its lazy jsonLd getter and keeps its `ld`, so the
  // page's blocks are serialized once, from the merged set.
  const result = attachJsonLd({ ...built }, [...built.ld, collection, ...lists]);
  metadataCache.set(key, result);
  return result;
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
        <p className="lede">{libLead(key)}</p>
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
        <h2 id="quick-answer-heading">{LIBRARY_ANSWER.q}</h2>
        <p>{LIBRARY_ANSWER.a}</p>
      </section>

      <p className="next-step">{LIB_NEXT[key]}</p>

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

      <RelatedSearches path={`/${key}`} />

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