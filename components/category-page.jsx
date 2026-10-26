import { catalog, getCategory, listStyles } from '@/services/catalog.js';
import { pageMeta, toMetadata, renderCards, inputFromQuery } from '@/lib/pages.js';
import { itemListLd, safeJson } from '@/services/seo.js';
import { categoryContent } from '@/lib/category-content.js';
import {
  CATEGORY_PAGE_KEYS,
  categoryHref,
  isIndexableCategory,
} from '@/lib/category-routing.js';
import { GeneratorInput } from '@/components/generator-input.jsx';
import { StyleRow } from '@/components/style-row.jsx';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

function categoryMeta(key, hasText) {
  const content = categoryContent(key);
  const cat = getCategory(key);
  if (!content || !cat) return null;
  const label = content.styleLabel || cat.name;
  return pageMeta({
    title: content.title,
    description: content.description,
    path: `/fonts/category/${key}`,
    canonicalPath: `/fonts/category/${key}`,
    noindex: hasText || !isIndexableCategory(key),
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Font styles', path: '/fonts' },
      { name: cat.name, path: `/fonts/category/${key}` },
    ],
    faq: hasText ? [] : content.faq,
    quickAnswer: hasText ? null : {
      q: `What are ${label.toLowerCase()} text styles?`,
      a: content.paragraphs[0],
    },
  });
}

export function generateStaticParams() {
  return CATEGORY_PAGE_KEYS.map((key) => ({ key }));
}

export async function generateMetadata({ params, searchParams }) {
  const { key } = await params;
  const sp = (await searchParams) || {};
  const meta = categoryMeta(key, Boolean(sp.text));
  if (!meta) return { robots: { index: false, follow: false } };
  return toMetadata(meta);
}

export async function renderCategoryPage({ key, searchParams }) {
  const cat = getCategory(key);
  const content = categoryContent(key);
  if (!cat || !content) return null;
  const label = content.styleLabel || cat.name;

  const sp = (await searchParams) || {};
  const text = inputFromQuery(sp);
  const meta = categoryMeta(key, Boolean(sp.text));
  const styles = listStyles({ category: key }).filter((s) => s.indexable);
  const cards = renderCards(styles, text);
  const allCategories = Object.entries(catalog().categories).map(([k, c]) => ({
    key: k,
    name: c.name,
    count: catalog().indexableCounts[k] || 0,
  }));

  const itemLd = safeJson(itemListLd(
    `${label} text styles`,
    cards.map((s) => ({ name: s.name, path: `/fonts/${s.slug}` })),
  ));

  return (
    <>
      <JsonLd items={[...meta.jsonLd, itemLd]} />
      <Scripts pageKey="category" generator />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/fonts">Font styles</a> /{' '}
        <span aria-current="page">{cat.name}</span>
      </nav>

      <section className="hero">
        <h1>{content.h1}</h1>
        {content.paragraphs.map((p, i) => (
          <p key={p.slice(0, 40)} className={i === 0 ? 'lede' : 'muted'}>{p}</p>
        ))}
        <GeneratorInput formAction={`/fonts/category/${key}`} text={text} />
      </section>

      <section className="quick-answer" aria-labelledby="category-answer">
        <h2 id="category-answer">Where these styles work best</h2>
        <ul>
          {content.useCases.map((use) => <li key={use}>{use}</li>)}
        </ul>
      </section>

      <section aria-labelledby="category-styles">
        <h2 id="category-styles">{label} styles you can copy</h2>
        <p className="muted">
          {cards.length === 1
            ? 'This category has one indexable style. The other combinations live in the full generator, but this is the distinct style that gets its own page.'
            : `Every indexable ${label.toLowerCase()} style in the catalog, rendered with the same engine the generator uses.`}
        </p>
        <ul className="rows" data-rows>
          {cards.map((s) => <StyleRow key={s.id} s={s} />)}
        </ul>
        <p className="more">
          <a href="/fonts">Browse every font style</a>
          {' · '}
          <a href="/">Open the main generator</a>
        </p>
      </section>

      <section className="prose" aria-labelledby="category-how">
        <h2 id="category-how">How {label.toLowerCase()} text works</h2>
        <p>
          The text on this page is Unicode, not a font file. Each style replaces letters with
          look-alike characters, which is why the result can be pasted into a bio, a caption or a
          chat without installing anything. The page renders real output rather than a picture of
          output, so the copy button gives you exactly what you see.
        </p>
        <p>
          Support is decided by the receiving app, not by this page. A style built from common
          mathematical or Latin characters is likely to render widely; a style built from rarer
          symbols or long stacks of combining marks is more likely to be stripped or drawn as an
          empty box. Check the support label on each row and preview the result in the field you
          plan to use.
        </p>
        <p>
          If a style does not appear correctly, the problem is usually the destination font. Try a
          simpler letter swap, or use the <a href="/studio">font studio</a> to turn the styled text
          into an image that nothing can flatten. For a broader comparison, see the{' '}
          <a href="/styles">style guides</a> or browse the <a href="/symbols">symbols</a>,{' '}
          <a href="/emoji">emoji</a> and <a href="/kaomoji">kaomoji</a> libraries.
        </p>
      </section>

      <section aria-labelledby="category-faq">
        <h2 id="category-faq">Common questions</h2>
        {content.faq.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      <nav className="categories-nav" aria-labelledby="all-categories">
        <h2 id="all-categories">Browse other style categories</h2>
        <ul className="chip-list">
          {allCategories.map((c) => (
            <li key={c.key}>
              <a href={categoryHref(c.key)} aria-current={c.key === key ? 'page' : undefined}>
                {c.name} ({c.count})
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
