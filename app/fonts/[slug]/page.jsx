import { notFound } from 'next/navigation';
import { getStyle, getCategory, relatedStyles } from '@/services/catalog.js';
import { SLUG_RE } from '@/lib/validation.js';
import { pageMeta, toMetadata, renderCards, inputFromQuery, faqFor, SUPPORT_LABEL } from '@/lib/pages.js';
import { site as SITE } from '@/config/site.js';
import { styleContent } from '@/lib/style-content.js';
import { GeneratorInput } from '@/components/generator-input.jsx';
import { StyleRow } from '@/components/style-row.jsx';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

const SITE_NAME = SITE.name;

function load(slug) {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return null;
  return getStyle(slug);
}

/**
 * Title for a style page.
 *
 * Two constraints fight here. The query people actually type carries the
 * "copy and paste" modifier, which is worth having. But 29 style names already
 * end in "Text", so naively appending "Text Generator" produces
 * "Underline Text Text Generator". The trailing word is dropped first, and the
 * modifier is only added when the result still fits the search-result budget.
 */
function styleTitle(name, budget = 60) {
  const base = / Text$/.test(name) ? name.replace(/ Text$/, '') : name;
  const core = `${base} Text Generator`;
  const withModifier = `${core} — Copy & Paste`;
  const suffix = ` | ${SITE_NAME}`;
  return (withModifier + suffix).length <= budget ? withModifier : core;
}

function detailMeta(style, parent, hasText) {
  const support = SUPPORT_LABEL[style.support] || '';
  return pageMeta({
    title: styleTitle(style.name),
    description: `${style.description}`.slice(0, 160),
    path: `/fonts/${style.slug}`,
    canonicalPath: `/fonts/${style.indexable ? style.slug : (parent ? parent.slug : style.slug)}`,
    noindex: !style.indexable || hasText,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Font styles', path: '/fonts' },
      { name: style.name, path: `/fonts/${style.slug}` },
    ],
    faq: hasText ? [] : faqFor(style),
    // The same question the visible answer block answers, so an assistant can
    // quote the page's own opening claim.
    quickAnswer: {
      q: `What is ${style.name} text and will it work in my app?`,
      a: `${style.name} text is ordinary text with each letter replaced by its Unicode `
        + `look-alike, so it works anywhere plain text is accepted without installing a font. `
        + `${support ? `Support: ${support.toLowerCase()}. ` : ''}`
        + 'If an app draws empty boxes, that app is missing the characters this style uses.',
    },
  });
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const style = load(slug);
  if (!style) return { robots: { index: false, follow: false } };
  const parent = style.parent ? getStyle(style.parent) : null;
  // `?text=` renders a unique page per arbitrary string. Without this the route
  // would ship index,follow for every variant while its canonical points at the
  // bare slug, leaking an unbounded duplicate set.
  const sp = (await searchParams) || {};
  return toMetadata(detailMeta(style, parent, Boolean(sp.text)));
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
  const content = styleContent(style, sp.text);

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
        {/* Answer first. "What is this style and will it work for me" is the
            question an assistant is asked about a font page, and it is answered
            by the support level, which is the one fact that decides it. */}
        <section className="quick-answer" aria-labelledby="quick-answer-heading">
          <h2 id="quick-answer-heading">What is {style.name} text and will it work in my app?</h2>
          <p>
            {style.name} text is ordinary text converted to {content.label}, so it works anywhere
            plain text is accepted without installing a font. Support level:{' '}
            {card.supportLabel ? card.supportLabel.toLowerCase() : content.support.toLowerCase()}.{' '}
            {content.supportAdvice} If an app draws empty boxes, that app is missing the characters
            this style uses, so the style itself is fine but that app cannot display it.
          </p>
        </section>

        <h2 id="about-style">How {style.name} text works</h2>
        <p>{content.how}</p>
        <p>{content.fact}</p>
        <p>{content.distinct}</p>
        <p>
          Category: <a href={`/fonts/category/${style.category}`}>{cat ? cat.name : style.category}</a>.{' '}
          {style.tags?.length ? `Tagged as ${style.tags.slice(0, 3).join(', ')}.` : ''}
        </p>
        {parent ? <p>This style builds on <a href={`/fonts/${parent.slug}`}>{parent.name}</a>.</p> : null}
      </section>

      {/* Real output, not a description of output. These are rendered by the
          same engine the generator uses, so what the reader sees here is
          exactly what the copy button gives them. */}
      <section className="style-examples" aria-labelledby="examples-heading">
        <h2 id="examples-heading">{style.name} examples</h2>
        <p className="muted">
          Real output from this style. Copy any line to use it exactly as shown.
        </p>
        <ul className="example-list">
          {content.examples.map((ex) => (
            <li key={ex.label}>
              <span className="example-label">{ex.label}</span>
              <p className="example-out" data-output="true">{ex.output}</p>
              <span className="example-plain">typed as: {ex.plain}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="prose" aria-labelledby="where-heading">
        <h2 id="where-heading">Where {style.name} text works</h2>
        <p>{content.supportAdvice}</p>
        <p>The apps people paste styled text into most often behave like this:</p>
        <ul>
          {content.appNotes.map(([app, note, good]) => (
            <li key={app}>
              <strong>{app}</strong> {good ? 'works' : 'is unreliable'}: {note}.
            </li>
          ))}
        </ul>
        <p>
          If you need a result that cannot break, pair this style with a plain-text fallback.
          Some apps let you paste an alternative that appears only when styled text is not
          rendered, which is worth doing for a profile name other people have to read.
        </p>
      </section>

      <section className="prose" aria-labelledby="when-heading">
        <h2 id="when-heading">When to use {style.name}</h2>
        <p>
          This style suits {content.uses[0]}, {content.uses[1]} and {content.uses[2]}. It is
          built from Unicode characters rather than a font, so the result stays selectable and
          searchable in most apps, and it will not change shape when someone else views it.
        </p>
        <p>
          It will not work for anything that needs to be read reliably, such as a support
          message, an address or a link. Styled text is for display, where a reader is looking at
          it rather than searching through it.
        </p>
        {content.betterIn.length ? (
          <p>
            For something more legible, try{' '}
            {content.betterIn.map((b, i) => (
              <span key={b.slug}>
                <a href={`/fonts/${b.slug}`}>{b.name}</a>
                {i < content.betterIn.length - 1 ? ', ' : ''}
              </span>
            ))}.
          </p>
        ) : null}
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