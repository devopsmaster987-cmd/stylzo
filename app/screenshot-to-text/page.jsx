import { SCREENSHOT_TO_TEXT_ANSWER, SCREENSHOT_TO_TEXT_QA } from '@/lib/aeo.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { RelatedSearches } from '@/components/related-searches.jsx';
import { Scripts } from '@/components/scripts.jsx';

// The same steps the page's own how-to section renders, so the HowTo schema
// cannot describe a procedure the page does not show.
const HOW_TO = {
  name: 'How to turn a screenshot into editable text',
  description: 'Read the text out of a screenshot with OCR that runs in your own browser, then edit, copy '
    + 'or download the result.',
  steps: [
    {
      name: 'Add the screenshot',
      text: 'Drop a PNG, JPG or WebP onto the area above, use the file picker, or paste the screenshot '
        + 'straight from the clipboard. Several images can be added at once, up to 25 MB each.',
    },
    {
      name: 'Wait for the recognition',
      text: 'The OCR engine runs in a Web Worker on your own device. A progress bar shows the language '
        + 'model loading on the first run and then the text being read.',
    },
    {
      name: 'Edit and take the text',
      text: 'The recognised text lands in an editable box. Correct any mistakes the recogniser made, then '
        + 'copy a single result or everything at once, or download the text as a file.',
    },
  ],
};

function screenshotToTextMeta() {
  return pageMeta({
    title: 'Screenshot to Text Converter — Extract Editable Text Free',
    description: 'Turn a screenshot into editable text in your browser. Paste or drop an image, read it '
      + 'with OCR in a Web Worker on your own device, then copy or download the text. Free, no upload, no sign-up.',
    path: '/screenshot-to-text',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Screenshot to text', path: '/screenshot-to-text' },
    ],
    faq: SCREENSHOT_TO_TEXT_QA,
    quickAnswer: SCREENSHOT_TO_TEXT_ANSWER,
    howTo: HOW_TO,
    app: true,
  });
}

export function generateMetadata() {
  return toMetadata(screenshotToTextMeta());
}

const PSM_OPTIONS = [
  ['3', 'Automatic — one pass over the page'],
  ['6', 'One block of text'],
  ['7', 'One single line'],
  ['11', 'Sparse text, scattered words'],
];

export default function ScreenshotToTextPage() {
  const meta = screenshotToTextMeta();

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="screenshot-to-text" scripts={['/js/screenshot-to-text.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/tools">Tools</a>{' '}
        / <span aria-current="page">Screenshot to text</span>
      </nav>

      <section className="hero">
        <h1>Screenshot to editable text</h1>
        <p className="lede">
          Paste a screenshot, get the text back. The recogniser runs in your own browser, so the
          image is never uploaded to an OCR service, and the result lands in an editable box you can
          fix, copy or download.
        </p>
      </section>

      <section className="quick-answer" aria-labelledby="ocr-answer">
        <h2 id="ocr-answer">{SCREENSHOT_TO_TEXT_ANSWER.q}</h2>
        <p>{SCREENSHOT_TO_TEXT_ANSWER.a}</p>
      </section>

      <div className="tp-layout" data-ocr-tool>
        <div className="tp-main">
          <div className="panel">
            <label className="tp-dropzone" htmlFor="ocr-input" data-ocr-zone>
              <span className="visually-hidden">Choose screenshots to read</span>
              <input
                id="ocr-input"
                className="visually-hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                multiple
                data-ocr-input
              />
              <svg className="tp-drop-icon" viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                />
              </svg>
              <h2>Drop a screenshot here</h2>
              <p>
                or <span className="tp-browse">choose a file</span> — or just paste with Ctrl+V. PNG, JPG
                and WebP, several at a time, up to 25 MB each.
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
                <b>Your screenshot never leaves this device.</b> The OCR engine is served from this site and
                runs in a Web Worker on your own machine. No image is sent to an OCR service, no request
                carries one, and closing the tab discards everything.
              </span>
            </p>
          </div>

          <div className="tp-errors" role="alert" data-ocr-errors hidden />

          <div className="tp-toolbar">
            <button type="button" className="btn grad" data-ocr-copy-all disabled>Copy all text</button>
            <button type="button" className="btn" data-ocr-download disabled>Download .txt</button>
            <button type="button" className="btn subtle" data-ocr-reset>Clear all</button>
            <p className="tp-status" role="status" aria-live="polite" data-ocr-status />
          </div>

          <div className="tp-progress" data-ocr-progress hidden>
            <span className="tp-progress-track">
              <span className="tp-progress-fill" data-ocr-bar />
            </span>
          </div>

          <p className="tp-empty" data-ocr-empty>
            <span className="visually-hidden">Empty state. </span>
            <b>No screenshots yet</b>
            Add one above, paste one from the clipboard, and the text will appear here.
          </p>

          <ul className="tp-list" data-ocr-list aria-label="Recognised screenshots" />
        </div>

        <div className="tp-controls">
          <div className="panel">
            <div className="tp-field">
              <label htmlFor="ocr-lang">Language</label>
              <select id="ocr-lang" data-ocr-lang defaultValue="eng">
                <option value="eng">English</option>
              </select>
              <p className="tp-note">
                English is the model that ships with this page. It is stored by your browser after the
                first run, so later recognitions start faster.
              </p>
            </div>

            <div className="tp-field">
              <label htmlFor="ocr-psm">Page layout</label>
              <select id="ocr-psm" data-ocr-psm defaultValue="3">
                {PSM_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <p className="tp-note">
                Automatic suits a full screenshot. Pick one line for a single strip of text, or sparse
                text when the words are scattered across the image.
              </p>
            </div>
          </div>

          <div className="panel">
            <div className="tp-field">
              <h2 className="tp-field-title">Getting a better result</h2>
              <ul className="tp-tips">
                <li>Capture at full size rather than scaling the screenshot down.</li>
                <li>Crop to the text you need — a small sharp region beats a full desktop.</li>
                <li>High contrast helps most: dark text on a light background reads best.</li>
                <li>Handwriting and heavily filtered images are still read poorly by every OCR.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section className="prose" aria-labelledby="ocr-how">
        <h2 id="ocr-how">How to turn a screenshot into editable text</h2>
        <ol className="how-steps">
          {HOW_TO.steps.map((step) => (
            <li key={step.name}>
              <h3>{step.name}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>

        <h3>Where the recognition actually happens</h3>
        <p>
          OCR is usually sold as an API: you POST a picture and get text back, which means somebody
          else has a copy of your picture. This page does it the other way round. The recogniser, its
          language model and its core engine are all served from this site and run inside a Web Worker
          on your own machine, so the image never becomes part of a request.
        </p>
        <p>
          That is also why the first run takes a moment: the language model is downloaded and stored
          by your browser once, then reused. The progress bar under the file area says what stage the
          worker is at, and everything already on the page keeps working while it loads.
        </p>

        <h3>Why the result is editable</h3>
        <p>
          OCR is good, never perfect. Small type, tight leading, icons next to words and low contrast
          all produce mistakes, which is why the text lands in an editable box instead of a finished
          document. Correct what is wrong, then copy it or download it as a plain text file.
        </p>

        <p>
          If the text you need is inside a PDF rather than an image, the{' '}
          <a href="/pdf-accessibility-checker">PDF accessibility checker</a> reads a document for its
          structure, the <a href="/universal-text-fixer">text fixer</a> cleans up what you get out,
          and the <a href="/tools">text tools page</a> counts it and converts it to the case you want.
        </p>
      </section>

      <RelatedSearches path="/screenshot-to-text" />

      <section className="prose" aria-labelledby="ocr-faq">
        <h2 id="ocr-faq">Common questions</h2>
        {SCREENSHOT_TO_TEXT_QA.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}
