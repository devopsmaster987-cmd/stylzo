import { library } from '@/services/catalog.js';
import { LIB_META, pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from './json-ld.jsx';
import { Scripts } from './scripts.jsx';

export function libraryMeta(key) {
  return LIB_META[key];
}

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
  const meta = LIB_META[key];
  return toMetadata(pageMeta({
    ...meta,
    path: `/${key}`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: meta.title, path: `/${key}` }],
  }));
}

export function LibraryPage({ libraryKey }) {
  const key = libraryKey;
  const meta = LIB_META[key];
  const { groups, total } = libraryGroups(key);

  return (
    <>
      <JsonLd items={pageMeta({
        ...meta,
        path: `/${key}`,
        breadcrumbs: [{ name: 'Home', path: '/' }, { name: meta.title, path: `/${key}` }],
      }).jsonLd} />
      <Scripts pageKey={key} scripts={['/js/library.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">{meta.title}</span>
      </nav>

      <section className="hero">
        <h1>{meta.title}</h1>
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