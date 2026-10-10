import { notFound } from 'next/navigation';
import { getStyle, getCategory, relatedStyles } from '@/services/catalog.js';
import { SLUG_RE } from '@/lib/validation.js';
import { pageMeta, toMetadata, renderCards, inputFromQuery, faqFor } from '@/lib/pages.js';
import { GeneratorInput } from '@/components/generator-input.jsx';
import { StyleRow } from '@/components/style-row.jsx';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

function load(slug) {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return null;
  return getStyle(slug);
}

function detailMeta(style, parent, hasText) {
  return pageMeta({
    title: `${style.name} Text Generator`,
    description: `${style.description}`.slice(0, 160),
    path: `/fonts/${style.slug}`,
    canonicalPath: `/fonts/${style.indexable ? style.slug : (parent ? parent.slug : style.slug)}`,
    noindex: !style.indexable || hasText,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Font styles', path: '/fonts' },
      { name: style.name, path: `/fonts/${style.slug}` },
    ],
    faq: faqFor(style),
  });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const style = load(slug);
  if (!style) return { robots: { index: false, follow: false } };
  const parent = style.parent ? getStyle(style.parent) : null;
  return toMetadata(detailMeta(style, parent, false));
}

export default async function FontDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const style = load(slug);
  if (!style) notFound();

  const sp = (await searchParams) || {};
  const text = inputFromQuery(sp);
  const cat = getCategory(style.category);
  const parent = style.parent ? getStyle(style.parent) : null;
  const meta = detailMeta(style, parent, Boolean(sp.text));
  const card = renderCards([style], text)[0];
  const related = renderCards(relatedStyles(style), text);
  const faq = faqFor(style);

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="font-detail" generator />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/fonts">Font styles</a> / <span aria-current="page">{style.name}</span>
      </nav>

      <section className="hero">
        <h1>{style.name} text generator</h1>
        <p className="lede">{style.description}</p>
        <GeneratorInput formAction={`/fonts/${style.slug}`} text={text} />
        <ul className="rows big" data-rows>
          <StyleRow s={card} />
        </ul>
      </section>

      <section className="prose" aria-labelledby="about-style">
        <h2 id="about-style">About this style</h2>
        <p>
          Category: <a href={`/?category=${style.category}`}>{cat ? cat.name : style.category}</a>. {card.supportLabel}.
        </p>
        {parent ? <p>This style builds on <a href={`/fonts/${parent.slug}`}>{parent.name}</a>.</p> : null}
      </section>

      <section className="prose" aria-labelledby="faq">
        <h2 id="faq">Questions</h2>
        {faq.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      {related.length ? (
        <section aria-labelledby="related">
          <h2 id="related">Related styles</h2>
          <ul className="rows" data-rows>
            {related.map((s) => <StyleRow key={s.id} s={s} />)}
          </ul>
        </section>
      ) : null}
    </>
  );
}