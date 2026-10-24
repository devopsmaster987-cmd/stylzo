import { TEXT_FIXER_ANSWER, TEXT_FIXER_QA } from '@/lib/aeo.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { RelatedSearches } from '@/components/related-searches.jsx';
import { Scripts } from '@/components/scripts.jsx';

function textFixerMeta() {
  return pageMeta({
    title: 'Text Fixer — Fix and Clean Up Text Online',
    description: 'Fix messy text in your browser: collapse extra spaces and blank lines, normalise curly '
      + 'quotes and dashes, remove zero-width characters, apply sentence case, collapse repeated words and '
      + 'correct common misspellings. Free, no upload, every fix a toggle.',
    path: '/universal-text-fixer',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Text fixer', path: '/universal-text-fixer' },
    ],
    faq: TEXT_FIXER_QA,
    quickAnswer: TEXT_FIXER_ANSWER,
    app: true,
  });
}

export function generateMetadata() {
  return toMetadata(textFixerMeta());
}

const FIX_OPTIONS = [
  ['spaces', 'Tidy spacing'],
  ['punctuation', 'Normalise punctuation'],
  ['invisible', 'Strip invisible characters'],
  ['casing', 'Apply sentence case'],
  ['duplicates', 'Collapse repeats'],
  ['typos', 'Fix common misspellings'],
];

export default function TextFixerPage() {
  const meta = textFixerMeta();

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="universal-text-fixer" scripts={['/js/universal-text-fixer.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/tools">Tools</a>{' '}
        / <span aria-current="page">Text fixer</span>
      </nav>

      <section className="hero">
        <h1>Text fixer</h1>
        <p className="lede">
          Paste in text that arrived mangled and take back a clean copy. The fixer repairs spacing,
          punctuation, invisible characters, sentence case, repeated words and a list of common
          misspellings. Your wording is never rewritten, every fix is a toggle, and nothing leaves
          your browser.
        </p>
      </section>

      <section className="quick-answer" aria-labelledby="text-fixer-answer">
        <h2 id="text-fixer-answer">{TEXT_FIXER_ANSWER.q}</h2>
        <p>{TEXT_FIXER_ANSWER.a}</p>
      </section>

      <div className="fix-layout" data-fix-tool>
        <div className="tool-panel panel">
          <label htmlFor="fix-in">Text to fix</label>
          <textarea
            id="fix-in"
            data-fix-input
            placeholder="Paste the text you want to clean up here"
          />
        </div>

        <div className="fix-stack">
          <div className="panel">
            <h2 className="fix-heading">What to fix</h2>
            <div className="fix-options">
              {FIX_OPTIONS.map(([value, label]) => (
                <label className="fix-option" key={value}>
                  <input type="checkbox" value={value} data-fix-option defaultChecked />
                  <span>
                    <b>{label}</b>
                  </span>
                </label>
              ))}
            </div>
            <div className="gen-tools">
              <button type="button" className="btn grad" data-fix-run>Fix the text</button>
              <button type="button" className="btn subtle" data-fix-reset>Start over</button>
            </div>
          </div>

          <div className="panel">
            <label htmlFor="fix-out">Fixed text</label>
            <textarea
              id="fix-out"
              className="fix-out"
              data-fix-out
              placeholder="The cleaned-up text appears here"
              aria-describedby="fix-summary"
            />
            <p className="fix-summary" id="fix-summary" data-fix-summary aria-live="polite" />
            <div className="gen-tools">
              <button type="button" className="btn" data-fix-copy disabled>Copy fixed text</button>
            </div>
          </div>
        </div>
      </div>

      <section className="prose" aria-labelledby="fix-what">
        <h2 id="fix-what">What each fix does</h2>
        <p>
          The fixer works on the text you paste and leaves your choice of words alone. It will not
          rewrite a sentence, change a tone or replace a word it merely thinks is wrong — the
          misspelling list is a fixed set of frequent typos, and each replacement is counted and
          reported so you can check it before copying.
        </p>
        <p>
          If the text is fine but you need something else done to it, the{' '}
          <a href="/tools">text tools page</a> counts words and characters, converts case and reverse
          text, and the <a href="/screenshot-to-text">screenshot-to-text tool</a> turns an image of
          text into editable text in the first place. To change how the words look rather than how
          they are written, use the <a href="/">fancy text generator</a> or the{' '}
          <a href="/styles">style guides</a>.
        </p>
      </section>

      <RelatedSearches path="/universal-text-fixer" />

      <section className="prose" aria-labelledby="fix-faq">
        <h2 id="fix-faq">Common questions</h2>
        {TEXT_FIXER_QA.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}
