import { PDF_ACCESSIBILITY_ANSWER, PDF_ACCESSIBILITY_QA } from '@/lib/aeo.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { RelatedSearches } from '@/components/related-searches.jsx';
import { Scripts } from '@/components/scripts.jsx';

const HOW_TO = {
  name: 'How to check a PDF for accessibility',
  description: 'Read a PDF in your browser and see which structural accessibility signals are present, '
    + 'missing or need attention, with the fix for each one.',
  steps: [
    {
      name: 'Choose the PDF',
      text: 'Drop a PDF onto the area above or use the file picker. One file at a time, up to 50 MB. '
        + 'The file is read on your own device and is never uploaded.',
    },
    {
      name: 'Read the score and the checks',
      text: 'The checker reports the document tags, structure tree, language, title, fonts, images, '
        + 'links, form fields, bookmarks and encryption. Each check passes, warns or fails, and the '
        + 'score summarises the result.',
    },
    {
      name: 'Fix the failures at the source',
      text: 'Every warning and failure names its fix. Most are fixed in the application the PDF was '
        + 'authored in — enable tagging on export, set the title and language, add alt text and '
        + 'accessible names — then export again and re-check the file.',
    },
  ],
};

function pdfAccessibilityMeta() {
  return pageMeta({
    title: 'PDF Accessibility Checker — Test a PDF in Your Browser',
    description: 'Check a PDF for accessibility in your browser: tags, structure tree, document language, '
      + 'title, readable fonts, alt text, labelled links and form fields, bookmarks and encryption. '
      + 'Every check comes with its fix. Free, private, no upload.',
    path: '/pdf-accessibility-checker',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'PDF accessibility checker', path: '/pdf-accessibility-checker' },
    ],
    faq: PDF_ACCESSIBILITY_QA,
    quickAnswer: PDF_ACCESSIBILITY_ANSWER,
    howTo: HOW_TO,
    app: true,
  });
}

export function generateMetadata() {
  return toMetadata(pdfAccessibilityMeta());
}

const CHECKS_DOC = [
  ['Tagged document', 'The Marked flag and a structure tree, which give a screen reader headings, lists and a reading order.'],
  ['Document language', 'The language a screen reader uses to choose pronunciation rules.'],
  ['Document title', 'The title announced instead of the file name, and whether the viewer is asked to show it.'],
  ['Readable fonts', 'Fonts with a ToUnicode map, without which copied and spoken text can turn into gibberish.'],
  ['Images have alt text', 'Alternative text entries in the file, or the absence of images entirely.'],
  ['Labelled links', 'Links and annotations that sit inside the structure tree so they can be reached and announced.'],
  ['Labelled form fields', 'A tooltip or accessible name on every field, so an unnamed edit box does not read as blank.'],
  ['Selectable text', 'Real text-drawing commands rather than a picture of text, which is what a scan produces.'],
  ['Bookmarks and metadata', 'An outline for long documents, XMP metadata, and a PDF/UA identifier when one is claimed.'],
  ['Encryption and XFA', 'Protection that may block accessibility tools, and XFA forms that most readers cannot handle.'],
];

export default function PdfAccessibilityPage() {
  const meta = pdfAccessibilityMeta();

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="pdf-accessibility-checker" scripts={['/js/pdf-accessibility-checker.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/tools">Tools</a>{' '}
        / <span aria-current="page">PDF accessibility checker</span>
      </nav>

      <section className="hero">
        <h1>PDF accessibility checker</h1>
        <p className="lede">
          See what a PDF is missing before a screen reader user finds it. The checker reads the file
          in your browser and reports its tags, language, title, fonts, alt text, links, form fields,
          bookmarks and encryption — with the fix beside every failure.
        </p>
      </section>

      <section className="quick-answer" aria-labelledby="pa-answer">
        <h2 id="pa-answer">{PDF_ACCESSIBILITY_ANSWER.q}</h2>
        <p>{PDF_ACCESSIBILITY_ANSWER.a}</p>
      </section>

      <div className="tp-layout" data-pa-tool>
        <div className="tp-main">
          <div className="panel">
            <label className="tp-dropzone tp-dropzone-pdf" htmlFor="pa-input" data-pa-zone>
              <span className="visually-hidden">Choose a PDF to check</span>
              <input
                id="pa-input"
                className="visually-hidden"
                type="file"
                accept="application/pdf,.pdf"
                data-pa-input
              />
              <svg className="tp-drop-icon" viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 0v5h5M8.5 13h7M8.5 16.5h4.5"
                />
              </svg>
              <h2>Drop a PDF here</h2>
              <p>
                or <span className="tp-browse">choose a file</span> from your device. One PDF at a
                time, up to 50 MB. It is read by your browser and never uploaded.
              </p>
            </label>

            <p className="tp-privacy">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2 4 5v6c0 4.5 3.2 8.7 8 10 4.8-1.3 8-5.5 8-10V5l-8-3Zm0 6a2 2 0 0 1 1 3.7V15h-2v-3.3A2 2 0 0 1 12 8Zm0 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
                />
              </svg>
              <span>
                <b>Your PDF never leaves this device.</b> The file is parsed by your own browser, including
                any compressed streams it contains. No document is uploaded, no third party sees it, and
                nothing is stored on a server. Closing the tab discards everything.
              </span>
            </p>
          </div>

          <div className="tp-errors" role="alert" data-pa-errors hidden />

          <div className="tp-toolbar">
            <p className="tp-file" data-pa-file />
            <button type="button" className="btn grad" data-pa-copy disabled>Copy report</button>
            <button type="button" className="btn subtle" data-pa-reset>Check another</button>
            <p className="tp-status" role="status" aria-live="polite" data-pa-status />
          </div>

          <p className="tp-empty" data-pa-empty>
            <span className="visually-hidden">Empty state. </span>
            <b>No PDF checked yet</b>
            Add a file above and its accessibility report will appear here.
          </p>

          <section className="pa-results" data-pa-results hidden aria-label="Accessibility report">
            <div className="panel pa-score-card">
              <div className="pa-score-ring">
                <b data-pa-score>0</b>
                <span>/ 100</span>
              </div>
              <div>
                <p className="pa-grade" data-pa-grade>Not checked</p>
                <p className="pa-summary" data-pa-summary />
                <p className="pa-disclaimer">
                  A structural scan, not a conformance audit. Reading order, writing quality and whether
                  alt text is meaningful still need a human with a screen reader.
                </p>
              </div>
            </div>

            <div className="panel">
              <h2 className="pa-heading">File details</h2>
              <dl className="pa-facts" data-pa-facts />
            </div>

            <div className="panel">
              <h2 className="pa-heading">Checks</h2>
              <ul className="pa-checks" data-pa-checks />
            </div>
          </section>
        </div>

        <div className="tp-controls">
          <div className="panel">
            <h2 className="tp-field-title">What gets checked</h2>
            <ul className="tp-tips">
              {CHECKS_DOC.map(([label, hint]) => (
                <li key={label}><b>{label}.</b> {hint}</li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <h2 className="tp-field-title">What it cannot tell you</h2>
            <p className="tp-note">
              A file can pass every structural check and still be unusable. This tool cannot judge
              whether the reading order makes sense, whether an image description is accurate, whether
              a table is marked up correctly, or whether the language is plain enough. Use it as a fast
              first pass, then test the document with a screen reader.
            </p>
          </div>
        </div>
      </div>

      <section className="prose" aria-labelledby="pa-how">
        <h2 id="pa-how">How to check a PDF for accessibility</h2>
        <ol className="how-steps">
          {HOW_TO.steps.map((step) => (
            <li key={step.name}>
              <h3>{step.name}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>

        <h3>What a tagged PDF means</h3>
        <p>
          A PDF describes where marks go on a page, not what those marks mean. Tagging adds the
          meaning back: this run of text is a heading, this is a list, this is a table row, read this
          before that. Without tags a screen reader has to guess the reading order from the position
          of the text on the page, and on a two-column layout or a sidebar it guesses wrong.
        </p>
        <p>
          The checker looks for the two things that make a PDF tagged — the Marked flag and a
          structure tree — and then for the properties that hang off them: a language on the document,
          a title, alternative text on images, accessible names on form fields and annotations inside
          the structure tree.
        </p>

        <h3>Why a high score is not a certificate</h3>
        <p>
          Accessibility is a property of the reading experience, not of the file. A structural scan can
          prove that alt text is absent; it cannot prove that present alt text is useful. That is why
          the report separates passes from warnings, and why the disclaimer stays on the page rather
          than in a footer: a green score is a good sign, not a conformance claim.
        </p>

        <p>
          If the PDF turns out to be a scan, the text has to be recovered before anything else: the{' '}
          <a href="/screenshot-to-text">screenshot-to-text tool</a> reads an image of text in your
          browser, and the <a href="/universal-text-fixer">text fixer</a> cleans up what comes out. For
          the document&apos;s words rather than its structure, use the{' '}
          <a href="/tools">text tools</a>.
        </p>
      </section>

      <RelatedSearches path="/pdf-accessibility-checker" />

      <section className="prose" aria-labelledby="pa-faq">
        <h2 id="pa-faq">Common questions</h2>
        {PDF_ACCESSIBILITY_QA.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}
