import { catalog, listStyles } from '@/services/catalog.js';
import { pageMeta, toMetadata, renderCards } from '@/lib/pages.js';
import { StyleRow } from '@/components/style-row.jsx';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

function fontsMeta() {
  return pageMeta({
    title: 'Fancy Font Styles',
    description: 'Browse every text style by category, see how well each one is supported, and open a style page to generate with it.',
    path: '/fonts',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Font styles', path: '/fonts' }],
  });
}

export function generateMetadata() {
  return toMetadata(fontsMeta());
}

export default function FontsIndexPage() {
  const { categories, counts, sample } = catalog();
  const meta = fontsMeta();

  const groups = Object.entries(categories)
    .map(([key, c]) => ({
      key,
      name: c.name,
      intro: c.intro,
      count: counts[key] || 0,
      styles: renderCards(listStyles({ category: key }).filter((s) => s.indexable), sample),
    }))
    .filter((g) => g.styles.length);

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="fonts" />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">Font styles</span>
      </nav>

      <section className="hero">
        <h1>Fancy font styles</h1>
      </section>

      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`cat-${g.key}`}>
          <h2 id={`cat-${g.key}`}>{g.name}</h2>
          <p className="muted">{g.intro}</p>
          <ul className="rows">
            {g.styles.map((s) => <StyleRow key={s.id} s={s} />)}
          </ul>
          <p className="more">
            <a href={`/?category=${g.key}`}>All {g.count} {g.name.toLowerCase()} variations</a>
          </p>
        </section>
      ))}
    </>
  );
}