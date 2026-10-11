// The keyword board page: /styles is a vertical dashboard — a sticky keyword
// sidebar on the left and a panel that loads the selected keyword's material on
// the same page. /styles/<slug> still serves the same material as a standalone
// page for search engines and direct links.
//
// Rendered on the server so both pages are complete without JavaScript: the
// first keyword's 25 words are in the panel, the sidebar links are real links,
// and the copy handler in /js/ui.js copies the whole decorated line.

import { pageMeta, toMetadata } from '@/lib/pages.js';
import { clampText } from '@/lib/validation.js';
import { env, adsenseConfigured } from '@/config/environment.js';
import { GeneratorInput } from '@/components/generator-input.jsx';
import { StyleRow } from '@/components/style-row.jsx';
import { AdUnit } from '@/components/ad-unit.jsx';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';
import { Hero3D } from '@/components/hero-3d.jsx';
import {
  keywordBoard, boardEntry, boardNeighbours, boardRows, slugify, boardSlugs,
  emojiFor, headingParts,
  BOARD_SIZE, WORDS_PER_KEYWORD, EMOJI_MIN, EMOJI_MAX,
} from '@/lib/keyword-board.js';

function boardMeta() {
  return pageMeta({
    title: 'Fancy Text Keyword Board — 25 Styles With Colour Emoji',
    description: `Pick any of ${BOARD_SIZE} searches. Each one opens ${WORDS_PER_KEYWORD} words in ${WORDS_PER_KEYWORD} different styles, every word decorated with ${EMOJI_MIN} to ${EMOJI_MAX} colour emoji you can copy in one tap.`,
    path: '/styles',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Styles', path: '/styles' },
    ],
  });
}

export function generateMetadata() {
  return toMetadata(boardMeta());
}

/** The board index: a sticky vertical dashboard that loads a keyword's material on the same page. */
export function renderKeywordBoard() {
  const meta = boardMeta();
  const entries = keywordBoard();
  const first = entries[0];
  const rows = boardRows(first.position, null, first.slug);

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="styles" scripts={['/js/keyword-board.js', '/js/keyword-dashboard.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">Styles</span>
      </nav>

      <section className="hero">
        <Hero3D />
        <h1>Fancy text keyword board</h1>
      </section>

      <div className="kw-dash">
        {/* In-page panel first in the DOM (primary content for no-JS and screen
            readers); CSS grid places it to the right of the dashboard. */}
        <div className="kw-dash-main" id="kw-main">
          <article className="kw-panel" data-kw-panel aria-live="polite" aria-busy="false">
            <header className="kw-panel-head">
              <span className="kw-eyebrow" data-kw-eyebrow>
                Keyword {String(first.position).padStart(2, '0')} of {BOARD_SIZE}
              </span>
              <h2 data-kw-heading>{first.heading}</h2>
              <p className="lede" data-kw-intro>{first.intro}</p>
              <GeneratorInput formAction={`/styles/${first.slug}`} text="" />
            </header>
            <ul className="rows" data-kw-rows>
              {rows.map((r) => (
                <StyleRow
                  key={r.slug}
                  s={{
                    id: r.slug,
                    name: r.styleName,
                    slug: r.slug,
                    category: 'board',
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
          </article>
        </div>

        <aside className="kw-dash-side" data-kw-dashboard aria-label="Keyword dashboard">
          <div className="kw-dash-tools">
            <div className="search">
              <label className="visually-hidden" htmlFor="kw-board-search">Filter keywords</label>
              <input id="kw-board-search" type="search" placeholder="Filter keywords…" data-kw-search autoComplete="off" />
            </div>
            <div className="kw-progress">
              <span className="kw-progress-label" data-kw-progress-label>
                Keyword {String(first.position).padStart(2, '0')} / {BOARD_SIZE}
              </span>
              <span className="kw-progress-track" aria-hidden="true">
                <span className="kw-progress-fill" data-kw-progress-fill style={{ width: `${(first.position / BOARD_SIZE) * 100}%` }} />
              </span>
            </div>
          </div>
          <nav className="kw-boards" aria-labelledby="kw-boards-heading">
            <h2 id="kw-boards-heading">Pick a keyword</h2>
            <ol className="kw-boards-list" data-kw-list>
              {entries.map((entry) => (
                <li key={entry.slug}>
                  <a
                    href={`/styles/${entry.slug}`}
                    data-kw-link
                    data-kw-slug={entry.slug}
                    data-kw-heading-text={entry.heading}
                    aria-current={entry.position === 1 ? 'page' : undefined}
                  >
                    <b className="kw-boards-num">{String(entry.position).padStart(2, '0')}</b>
                    <span className="kw-boards-name">{entry.heading}</span>
                    {/* 6 to 8 colour emoji, the same pool the words use. */}
                    <span className="kw-boards-emoji" aria-hidden="true">
                      {emojiFor(entry.position, 0, entry.slug).join(' ')}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="kw-empty" data-kw-empty hidden>No keywords match that filter.</p>
          </nav>
        </aside>
      </div>
    </>
  );
}

function keywordMeta(entry, text = '') {
  const hasText = Boolean(text);
  return pageMeta({
    title: entry.title,
    description: entry.description,
    path: `/styles/${entry.slug}`,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Styles', path: '/styles' },
      { name: entry.heading, path: `/styles/${entry.slug}` },
    ],
    app: !hasText,
    noindex: hasText,
  });
}

export async function generateKeywordMetadata({ params, searchParams }) {
  // The route segment is `[key]`, so the board slug arrives as `key`.
  const { key } = await params;
  const entry = boardEntry(key);
  if (!entry) return { robots: { index: false, follow: false } };
  const sp = (await searchParams) || {};
  return toMetadata(keywordMeta(entry, clampText(sp.text, { max: env.maxInputLength })));
}

/**
 * A keyword heading may contain its language name in that language's own script
 * (हिंदी, اردو, தமிழ்). The document is lang="en", so those runs get their own
 * lang attribute rather than being read as English by assistive tech and
 * mis-classified by search engines.
 */
function KeywordHeading({ heading }) {
  const parts = headingParts(heading);
  const simple = parts.every((p) => !p.lang);
  if (simple) return heading;
  // Mixed content needs an array, but splitting on whitespace would otherwise
  // wrap every single space in its own <span>. Group the plain runs instead.
  return parts.reduce((nodes, part, i) => {
    const last = nodes[nodes.length - 1];
    if (!part.lang && last && !last.lang) {
      nodes[nodes.length - 1] = { ...last, text: last.text + part.text };
      return nodes;
    }
    nodes.push({ key: i, text: part.text, lang: part.lang });
    return nodes;
  }, []).map((part) => (part.lang
    ? <span key={part.key} lang={part.lang}>{part.text}</span>
    : <span key={part.key}>{part.text}</span>));
}

/** One keyword page: the text box, then the 25 styled, emoji-decorated words. */
export async function renderKeywordPage({ slug, searchParams }) {
  const entry = boardEntry(slug);
  if (!entry) return null;
  // ?text= lets a visitor share a URL that already shows their own text, and is
  // noindex so every rendering of a keyword page is not a duplicate of another.
  const sp = (await searchParams) || {};
  const text = clampText(sp.text, { max: env.maxInputLength });
  const hasText = Boolean(text.trim());
  const meta = keywordMeta(entry, text);
  const rows = boardRows(entry.position, hasText ? text : null, entry.slug);
  const { prev, next, around } = boardNeighbours(entry.slug);

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="styles" scripts={['/js/keyword-board.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/styles">Styles</a>{' '}
        / <span aria-current="page"><KeywordHeading heading={entry.heading} /></span>
      </nav>

      <section className="hero">
        <Hero3D />
        <h1><KeywordHeading heading={entry.heading} /></h1>
        <p className="lede">{entry.intro}</p>
        <GeneratorInput formAction={`/styles/${entry.slug}`} text={text} />
      </section>

      <section aria-labelledby="kw-words-heading">
        <h2 id="kw-words-heading">{rows.length} words, {rows.length} styles</h2>
        <p className="muted">
          Every word below is styled differently and wrapped in {EMOJI_MIN} to {EMOJI_MAX} colour
          emoji. The copy button copies the whole decorated line. Type in the box above to restyle
          all {rows.length} rows with your own text.
        </p>
        <ul className="rows" data-rows>
          {rows.map((r) => (
            <StyleRow
              key={r.slug}
              s={{
                id: r.slug,
                name: r.styleName,
                slug: r.slug,
                category: 'board',
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

      <AdUnit slot={env.adsense.slot} client={adsenseConfigured ? env.adsense.client : ''} />

      {prev && next ? (
        <nav className="crumbs kw-pager" aria-label="Keyword pagination">
          <a rel="prev" href={prev.path}>← {prev.heading}</a>
          <a rel="next" href={next.path}>{next.heading} →</a>
        </nav>
      ) : null}

      <nav className="crumbs" aria-label="Related pages">
        <h2>Related pages</h2>
        <ul className="chip-list">
          <li><a href="/styles">All {BOARD_SIZE} keywords</a></li>
          {around.map((n) => (
            <li key={n.slug}><a href={n.path}>{n.heading}</a></li>
          ))}
          <li><a href="/">Main text generator</a></li>
          <li><a href="/fonts">Every font style</a></li>
          <li><a href="/symbols">Symbols library</a></li>
          <li><a href="/emoji">Emoji library</a></li>
          <li><a href="/kaomoji">Kaomoji library</a></li>
        </ul>
      </nav>
    </>
  );
}

/**
 * Every /styles/<slug> the app serves: the approved landing pages plus the board.
 * One set, used by both the static params and the sitemap, so a page can never be
 * prerendered but missing from the sitemap or the other way round.
 */
export function generateStaticParams() {
  return [...boardSlugs()].map((key) => ({ key }));
}