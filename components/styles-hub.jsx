// /styles — the hub.
//
// This used to be a keyword board: a dashboard listing 32 search phrases, each
// linking to its own near-identical page under /styles/<slug>. Those pages are
// gone (see lib/styles-routing.js); they were thin doorway pages that competed
// with the home page and with the six real landing pages below.
//
// What is left is a real page. It does the one thing a hub should do: show the
// material, then link to the six pages that go deep on it. The 25 styled,
// emoji-decorated words are the same material those pages are built from, so a
// reader can decide which direction to go without leaving.
//
// Rendered on the server so the page is complete without JavaScript: the words
// are in the HTML and the copy buttons work either way.

import { pageMeta, toMetadata } from '@/lib/pages.js';
import { STYLES_ANSWER, STYLES_QA } from '@/lib/aeo.js';
import { RelatedSearches } from './related-searches.jsx';
import { clampText } from '@/lib/validation.js';
import { env, adsenseConfigured } from '@/config/environment.js';
import { GeneratorInput } from '@/components/generator-input.jsx';
import { StyleRow } from '@/components/style-row.jsx';
import { AdUnit } from '@/components/ad-unit.jsx';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';
import { Hero3D } from '@/components/hero-3d.jsx';
import { LANDING_PAGES } from '@/lib/landing-pages.js';
import {
  boardRows, WORDS_PER_KEYWORD, EMOJI_MIN, EMOJI_MAX,
  STYLES_LEDE, STYLES_HOW_HEADING, STYLES_HOW,
  STYLES_GUIDES_HEADING, STYLES_GUIDES_BODY, stylesHubAdPlan,
  STYLES_FIELD_HEADING, STYLES_FIELD_INTRO, STYLES_FIELD_ROWS, STYLES_FIELD_NOTE,
  STYLES_LIMITS_HEADING, STYLES_LIMITS_INTRO, STYLES_LIMITS, STYLES_LIMITS_NOTE,
  STYLES_LIMIT_CHECKED, STYLES_ACCESS_HEADING, STYLES_ACCESS,
} from '@/lib/styles-material.js';

function stylesMeta(hasText = false) {
  return pageMeta({
    title: 'Fancy Text Styles: 25 Examples and Six Guides',
    description: `See the same 25 words in ${WORDS_PER_KEYWORD} Unicode styles at once, then go deeper on Instagram, WhatsApp, Discord, gaming, non-Latin scripts and colour.`,
    path: '/styles',
    // `?text=` renders arbitrary visitor input. That is a duplicate of the clean
    // hub with a different body, so it must not be indexed or claim the hub's
    // FAQ and answer as its own.
    noindex: hasText,
    faq: hasText ? [] : STYLES_QA,
    quickAnswer: hasText ? null : STYLES_ANSWER,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Styles', path: '/styles' },
    ],
  });
}

export async function generateMetadata({ searchParams }) {
  const sp = (await searchParams) || {};
  return toMetadata(stylesMeta(Boolean(sp.text)));
}

export function renderStylesHub(searchParams) {
  const sp = searchParams || {};
  const text = clampText(sp.text, { max: env.maxInputLength });
  const meta = stylesMeta(Boolean(text.trim()));
  const rows = boardRows(text.trim() ? text : null);
  const { allowed } = stylesHubAdPlan();

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="styles" scripts={['/js/keyword-board.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">Styles</span>
      </nav>

      <section className="hero">
        <Hero3D />
        <h1>Fancy text styles, side by side</h1>
        <p className="lede">{STYLES_LEDE}</p>
      </section>

      {/* The passages an assistant can quote when asked what this page is for. */}
      <section className="quick-answer" aria-labelledby="styles-answer">
        <h2 id="styles-answer">{STYLES_ANSWER.q}</h2>
        <p>{STYLES_ANSWER.a}</p>
      </section>

      <section className="prose" aria-labelledby="styles-how">
        <h2 id="styles-how">{STYLES_HOW_HEADING}</h2>
        {STYLES_HOW.map((paragraph, i) => (
          <p key={i} className={i === 0 ? 'lede' : 'muted'}>{paragraph}</p>
        ))}
      </section>

      <section aria-labelledby="styles-examples">
        <h2 id="styles-examples">{rows.length} words, {rows.length} styles</h2>
        <p className="muted">
          Every word below is styled differently and wrapped in {EMOJI_MIN} to {EMOJI_MAX} colour
          emoji. The copy button copies the whole decorated line. Type in the box above to restyle
          all {rows.length} rows with your own text instead of the sample words.
        </p>
        <GeneratorInput formAction="/styles" text={text} />
        <ul className="rows" data-rows>
          {rows.map((r) => (
            <StyleRow
              key={r.slug}
              s={{
                id: r.slug,
                name: r.styleName,
                slug: r.slug,
                category: 'styles',
                output: r.line,
                support: r.support,
                supportLabel: '',
                copyText: r.line,
                word: r.word,
                emojiBefore: r.emojiBefore,
                emojiAfter: r.emojiAfter,
              }}
            />
          ))}
        </ul>
      </section>

      {/* One unit, and only because this page carries enough of its own words to
          scroll past. AdSense treats an ad on a page with nothing behind it as a
          policy problem rather than a layout detail, so the floor is checked
          against the prose above rather than assumed. */}
      {allowed ? <AdUnit slot={env.adsense.slot} client={adsenseConfigured ? env.adsense.client : ''} /> : null}

      <section className="prose" aria-labelledby="styles-fields">
        <h2 id="styles-fields">{STYLES_FIELD_HEADING}</h2>
        <p className="muted">{STYLES_FIELD_INTRO}</p>
        <div className="table-wrap">
          <table className="table">
            <caption>A support label describes rendering; the field decides whether the string is accepted.</caption>
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">Safest first choice</th>
                <th scope="col">Avoid</th>
                <th scope="col">Why</th>
              </tr>
            </thead>
            <tbody>
              {STYLES_FIELD_ROWS.map((r) => (
                <tr key={r.field}>
                  <th scope="row">{r.field}</th>
                  <td>{r.pick}</td>
                  <td>{r.avoid}</td>
                  <td>{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted how-note">{STYLES_FIELD_NOTE}</p>
      </section>

      <section className="prose" aria-labelledby="styles-limits">
        <h2 id="styles-limits">{STYLES_LIMITS_HEADING}</h2>
        <p className="muted">
          {STYLES_LIMITS_INTRO} Source check: <time dateTime={STYLES_LIMIT_CHECKED}>26 October 2026</time>.
        </p>
        <div className="table-wrap">
          <table className="table">
            <caption>Documented limits only. Undocumented fields are left out rather than guessed.</caption>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">Field</th>
                <th scope="col">Limit</th>
                <th scope="col">What it means for styled text</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {STYLES_LIMITS.map((r) => (
                <tr key={`${r.platform}-${r.field}`}>
                  <th scope="row">{r.platform}</th>
                  <td>{r.field}</td>
                  <td>{r.limit}</td>
                  <td>{r.note}</td>
                  <td>
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${r.sourceLabel} (opens in a new tab)`}
                    >
                      {r.sourceLabel}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted how-note">{STYLES_LIMITS_NOTE}</p>
      </section>

      <section className="prose" aria-labelledby="styles-accessibility">
        <h2 id="styles-accessibility">{STYLES_ACCESS_HEADING}</h2>
        {STYLES_ACCESS.map((paragraph) => <p key={paragraph} className="muted">{paragraph}</p>)}
        <p><a href="/studio">Open the studio for image text</a></p>
      </section>

      <section className="prose" aria-labelledby="styles-guides">
        <h2 id="styles-guides">{STYLES_GUIDES_HEADING}</h2>
        <p className="muted">{STYLES_GUIDES_BODY}</p>
        <ul className="chip-list">
          {LANDING_PAGES.map((page) => (
            <li key={page.key}><a href={`/styles/${page.key}`}>{page.subject}</a></li>
          ))}
        </ul>
      </section>

      <RelatedSearches path="/styles" />

      <section aria-labelledby="styles-faq">
        <h2 id="styles-faq">Common questions</h2>
        {STYLES_QA.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      <nav className="crumbs" aria-label="Related pages">
        <h2>Related pages</h2>
        <ul className="chip-list">
          <li><a href="/">Main text generator</a></li>
          <li><a href="/fonts">Every font style</a></li>
          <li><a href="/symbols">Symbols library</a></li>
          <li><a href="/emoji">Emoji library</a></li>
          <li><a href="/kaomoji">Kaomoji library</a></li>
          {LANDING_PAGES.map((page) => (
            <li key={page.key}><a href={`/styles/${page.key}`}>{page.subject}</a></li>
          ))}
        </ul>
      </nav>
    </>
  );
}
