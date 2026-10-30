import { getStyle } from '@/services/catalog.js';
import { applyStyle } from '@/services/unicode/engine.js';
import { env, adsenseConfigured } from '@/config/environment.js';
import { guideMeta } from '@/lib/guides.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';
import { AdUnit } from '@/components/ad-unit.jsx';

const TRY_INTRO = 'Every example in this guide can be tested on your own words:';

const formatDate = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

/**
 * One real engine output. `plain` is what a reader would type; `output` is
 * computed here at render time by the same engine the generator uses, so the
 * characters on the page are the characters any copy button produces.
 */
function OutputExample({ example }) {
  const style = getStyle(example.style);
  const output = style ? applyStyle(example.plain, style) : '';
  return (
    <li>
      <span className="example-label">{example.label}</span>
      <p className="example-out" data-output="true">{output}</p>
      <span className="example-plain">typed as: {example.plain}</span>
    </li>
  );
}

function Section({ section, headingId }) {
  const hasExamples = Boolean(section.examples?.length);
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{section.heading}</h2>
      {(section.paragraphs || []).map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
      {section.steps?.length ? (
        <ol>
          {section.steps.map((step) => <li key={step.slice(0, 40)}>{step}</li>)}
        </ol>
      ) : null}
      {hasExamples ? (
        <ul className="example-list">
          {section.examples.map((ex) => <OutputExample key={ex.label} example={ex} />)}
        </ul>
      ) : null}
      {section.list?.length ? (
        <ul>
          {section.list.map((item) => <li key={item.slice(0, 40)}>{item}</li>)}
        </ul>
      ) : null}
      {(section.paragraphs2 || []).map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
    </section>
  );
}

export function GuideArticle({ guide }) {
  const meta = guideMeta(guide);
  const related = (guide.related || [])
    .map((r) => ({ href: `/guides/${r.slug}`, label: r.label }));
  const headingId = (s) => `guide-${guide.slug}-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const body = guide.sections.map((section, i) => (
    <Section key={section.heading} section={section} headingId={headingId(section.heading)} />
  ));

  // One unit per article, placed after the second section: never above the
  // first paragraph, and clearly labelled by the component itself.
  const mid = Math.min(2, body.length - 1);
  const withAd = [
    ...body.slice(0, mid),
    <AdUnit key="ad" slot={env.adsense.slot} client={adsenseConfigured ? env.adsense.client : ''} />,
    ...body.slice(mid),
  ];

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey={`guide-${guide.slug}`} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/guides">Guides</a> / <span aria-current="page">{guide.title}</span>
      </nav>

      <article className="prose" aria-labelledby="guide-title">
        <p className="muted guide-updated">
          Last updated: <time dateTime={guide.updated}>{formatDate(guide.updated)}</time>
        </p>
        <h1 id="guide-title">{guide.title}</h1>

        {guide.intro.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}

        {withAd}

        <section aria-labelledby={`tips-${guide.slug}`}>
          <h2 id={`tips-${guide.slug}`}>{guide.tips.heading}</h2>
          <ul>
            {guide.tips.items.map((tip) => <li key={tip.slice(0, 40)}>{tip}</li>)}
          </ul>
        </section>

        <section aria-labelledby={`faq-${guide.slug}`}>
          <h2 id={`faq-${guide.slug}`}>Frequently asked questions</h2>
          {guide.faq.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>

        <section aria-labelledby={`try-${guide.slug}`}>
          <h2 id={`try-${guide.slug}`}>Try it</h2>
          <p>
            {TRY_INTRO}
            {' '}
            <a href={guide.tryIt.href}>{guide.tryIt.label}</a>
            {' '}and type your own words in.
          </p>
          <p>
            Keep going with{' '}
            <a href={related[0].href}>{related[0].label}</a>{' '}
            {'and'}{' '}
            <a href={related[1].href}>{related[1].label}</a>.
          </p>
        </section>
      </article>
    </>
  );
}
