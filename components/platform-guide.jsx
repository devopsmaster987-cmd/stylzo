import {
  PLATFORM_PAGES, PLATFORM_CHECKED, getPlatformPage,
} from '@/lib/platform-pages.js';

import { getStyle } from '@/services/catalog.js';
import { pageMeta, toMetadata, renderCards, inputFromQuery } from '@/lib/pages.js';
import { GeneratorInput } from '@/components/generator-input.jsx';
import { StyleRow } from '@/components/style-row.jsx';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';
import { Hero3D } from '@/components/hero-3d.jsx';
import { RelatedSearches } from '@/components/related-searches.jsx';

const VERDICT_LABEL = {
  try: 'Try styled text',
  plain: 'Plain text only',
};

function platformMeta(page, hasText) {
  return pageMeta({
    title: page.title,
    description: page.description,
    path: page.path,
    noindex: hasText,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: page.subject, path: page.path },
    ],
    quickAnswer: hasText ? null : page.quickAnswer,
  });
}

export function platformMetadata(key) {
  return async function generateMetadata({ searchParams }) {
    const page = getPlatformPage(key);
    if (!page) return { robots: { index: false, follow: false } };
    const sp = (await searchParams) || {};
    return toMetadata(platformMeta(page, Boolean(sp.text)));
  };
}

const sectionId = (value) => value.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

export async function renderPlatformPage({ key, searchParams }) {
  const page = getPlatformPage(key);
  if (!page) return null;

  const sp = (await searchParams) || {};
  const hasText = Boolean(sp.text);
  const text = hasText ? inputFromQuery(sp) : page.sample;
  const meta = platformMeta(page, hasText);

  const sections = page.sections.map((section) => {
    const styles = section.styles.map(getStyle).filter((style) => style && style.indexable);
    return { ...section, cards: renderCards(styles, text) };
  }).filter((section) => section.cards.length > 0);

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey={`platform-${page.key}`} generator />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">{page.subject} font generator</span>
      </nav>

      <section className="hero">
        <Hero3D />
        <h1>{page.h1}</h1>

        <section className="quick-answer" aria-labelledby={`answer-${page.key}`}>
          <h2 id={`answer-${page.key}`}>{page.quickAnswer.q}</h2>
          <p>{page.quickAnswer.a}</p>
        </section>

        {page.intro.map((paragraph, i) => (
          <p key={paragraph.slice(0, 40)} className={i === 0 ? 'lede' : 'muted'}>{paragraph}</p>
        ))}
        <GeneratorInput formAction={page.path} text={text} />
      </section>

      {sections.map((section, index) => (
        <section key={section.h2} aria-labelledby={`section-${sectionId(section.h2)}`}>
          <h2 id={`section-${sectionId(section.h2)}`}>{section.h2}</h2>
          <p className="muted">{section.body}</p>
          <ul className="rows" data-rows>
            {section.cards.map((s) => <StyleRow key={`${index}-${s.id}`} s={s} />)}
          </ul>
        </section>
      ))}

      <section className="prose" aria-labelledby={`fields-${page.key}`}>
        <h2 id={`fields-${page.key}`}>{`Which ${page.subject} fields accept styled text`}</h2>
        <p className="muted">{page.fieldIntro}</p>
        <div className="table-wrap">
          <table className="table">
            <caption>Documented field rules only. Every row links to the help page it came from.</caption>
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">What to try</th>
                <th scope="col">Documented limit</th>
                <th scope="col">Why</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {page.fields.map((row) => (
                <tr key={row.field}>
                  <th scope="row">{row.field}</th>
                  <td>
                    <span className="verdict" data-verdict={row.verdict}>
                      {VERDICT_LABEL[row.verdict]}
                    </span>
                  </td>
                  <td>{row.limit}</td>
                  <td>{row.detail}</td>
                  <td>
                    <a
                      href={row.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${row.source.label} (opens in a new tab)`}
                    >
                      {row.source.label}
                    </a>
                    <span className="platform-source-date">
                      Checked <time dateTime={PLATFORM_CHECKED}>26 October 2026</time>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted how-note">{page.limitsNote}</p>
      </section>

      <section className="prose" aria-labelledby={`fallback-${page.key}`}>
        <h2 id={`fallback-${page.key}`}>If {page.subject} removes the styling</h2>
        <p>{page.fallback}</p>
      </section>

      <section className="prose" aria-labelledby={`faq-${page.key}`}>
        <h2 id={`faq-${page.key}`}>Frequently asked questions</h2>
        {page.faq.map((item) => (
          <div key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </section>

      <RelatedSearches path={page.path} />

      <nav className="crumbs" aria-label="Related pages">
        <h2>Related pages</h2>
        <ul className="chip-list">
          {page.links.map((link) => (
            <li key={link.href}><a href={link.href}>{link.label}</a></li>
          ))}
          {PLATFORM_PAGES.filter((other) => other.key !== page.key).map((other) => (
            <li key={other.key}><a href={other.path}>{other.subject} font generator</a></li>
          ))}
          <li><a href="/styles">All style guides</a></li>
        </ul>
      </nav>
    </>
  );
}
