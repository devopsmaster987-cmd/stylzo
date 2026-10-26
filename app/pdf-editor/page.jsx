import { PDF_EDITOR_ANSWER, PDF_EDITOR_QA } from '@/lib/aeo.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { RelatedSearches } from '@/components/related-searches.jsx';
import { Scripts } from '@/components/scripts.jsx';

const HOW_TO = {
  name: 'How to edit a PDF in your browser',
  description: 'Reorder, rotate, duplicate, merge and stamp pages in a PDF, then download a new copy '
    + 'without uploading the document.',
  steps: [
    {
      name: 'Choose a PDF',
      text: 'Drop a PDF onto the area above or use the file picker. Each file can be up to 50 MB, '
        + 'and the document can hold up to 300 pages. The file is opened by your browser and never uploaded.',
    },
    {
      name: 'Work through the pages',
      text: 'Select a page in the thumbnail rail. Move it earlier or later, rotate it in either '
        + 'direction, duplicate it, delete it, or insert a blank page after it.',
    },
    {
      name: 'Add more pages or text',
      text: 'Drop another PDF to append its pages to the document. Add a single-line text stamp or '
        + 'page numbers to the current page or to every page, and choose where each one sits.',
    },
    {
      name: 'Download the edited PDF',
      text: 'Enter a file name and download the rebuilt document. The original pages are copied '
        + 'rather than flattened into images, so the PDF you get keeps its original quality.',
    },
  ],
};

const TEXT_POSITIONS = [
  ['top-left', 'Top left'],
  ['top-center', 'Top centre'],
  ['top-right', 'Top right'],
  ['middle-left', 'Middle left'],
  ['middle-center', 'Middle centre'],
  ['middle-right', 'Middle right'],
  ['bottom-left', 'Bottom left'],
  ['bottom-center', 'Bottom centre'],
  ['bottom-right', 'Bottom right'],
];

const NUMBER_FORMATS = [
  ['n', '1'],
  ['page-n', 'Page 1'],
  ['n-of-total', '1 of 12'],
  ['dash-n-dash', '- 1 -'],
];

function pdfEditorMeta() {
  return pageMeta({
    title: 'PDF Editor — Reorder, Rotate and Add Text Free',
    description: 'Edit a PDF in your browser: reorder, rotate, duplicate, delete or merge pages, '
      + 'then add text or page numbers. Download the result. Free, no upload.',
    path: '/pdf-editor',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'PDF editor', path: '/pdf-editor' },
    ],
    faq: PDF_EDITOR_QA,
    quickAnswer: PDF_EDITOR_ANSWER,
    howTo: HOW_TO,
    app: 'pdf-editor',
  });
}

export function generateMetadata() {
  return toMetadata(pdfEditorMeta());
}

export default function PdfEditorPage() {
  const meta = pdfEditorMeta();

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="pdf-editor" scripts={['/js/pdf-editor.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/tools">Tools</a>{' '}
        / <span aria-current="page">PDF editor</span>
      </nav>

      <section className="hero">
        <span className="eyebrow">Runs on your device — no upload, no sign-up</span>
        <h1>PDF editor</h1>
        <p className="lede">
          Reorder, rotate, duplicate, delete and merge PDF pages, add blank pages, then stamp text or
          page numbers where they belong. Download a rebuilt PDF without sending the document
          anywhere.
        </p>
        <ul className="cz-specs">
          <li><b>50 MB</b><span>per PDF, up to 300 pages</span></li>
          <li><b>Merge</b><span>drop another PDF to append it</span></li>
          <li><b>Text + numbers</b><span>stamped on one page or all</span></li>
          <li><b>Zero uploads</b><span>nothing leaves this device</span></li>
        </ul>
      </section>

      <section className="quick-answer" aria-labelledby="pdf-editor-answer">
        <h2 id="pdf-editor-answer">{PDF_EDITOR_ANSWER.q}</h2>
        <p>{PDF_EDITOR_ANSWER.a}</p>
      </section>

      <div className="pe-layout" data-pe-tool>
        <div className="pe-main">
          <div className="panel">
            <label className="pe-dropzone" htmlFor="pe-input" data-pe-zone>
              <span className="visually-hidden">Choose a PDF to edit, or add another to append</span>
              <input
                id="pe-input"
                className="visually-hidden"
                type="file"
                accept="application/pdf,.pdf"
                multiple
                data-pe-input
              />
              <svg className="pe-drop-icon" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 0v5h5M8.5 12.5h7M8.5 16h4.5M15.5 15.5l2 2m0-2-2 2"
                />
              </svg>
              <h2>Drop a PDF here</h2>
              <p>
                or <span className="pe-browse">choose a file</span> from your device. Drop another
                PDF later to append its pages. Up to 50 MB and 300 pages.
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
                <b>Your PDF never leaves this device.</b> The document is opened, changed and rebuilt
                by your own browser. No page is uploaded, no third party sees it, and nothing is stored
                on a server. Closing the tab discards everything.
              </span>
            </p>

            <div className="pe-toolbar">
              <button type="button" className="btn subtle" data-pe-add>Add another PDF</button>
              <button type="button" className="btn subtle" data-pe-reset>Start over</button>
              <p className="pe-file" data-pe-file />
              <p className="pe-status" role="status" aria-live="polite" data-pe-status />
            </div>
          </div>

          <div className="tp-errors" role="alert" data-pe-errors hidden />

          <p className="tp-empty" data-pe-empty>
            <span className="visually-hidden">Empty state. </span>
            <b>No PDF open yet</b>
            Add a file above and its pages will appear here.
          </p>

          <section className="pe-workspace" data-pe-workspace hidden aria-label="PDF pages">
            <aside className="pe-rail panel" aria-label="Page thumbnails">
              <div className="pe-rail-head">
                <h2>Pages</h2>
                <p className="pe-page-summary" data-pe-page-summary />
              </div>
              <ol className="pe-pages" data-pe-pages />
            </aside>

            <div className="pe-editor">
              <div className="panel pe-preview">
                <div className="pe-preview-head">
                  <p className="pe-current" data-pe-current-label>Page 1 of 1</p>
                  <span className="badge" data-pe-rotation hidden>Rotated</span>
                </div>
                <div className="pe-stage" data-pe-stage>
                  <div className="pe-canvas-wrap" data-pe-canvas-wrap>
                    <canvas data-pe-canvas aria-label="Preview of the selected PDF page" />
                    <div className="pe-stamps" data-pe-overlays aria-hidden="true" />
                    <p className="pe-preview-loading" data-pe-preview-status hidden>Rendering page</p>
                  </div>
                </div>

                <div className="pe-page-actions">
                  <button type="button" className="btn small subtle" data-pe-prev>Previous</button>
                  <button type="button" className="btn small subtle" data-pe-move-earlier>Move earlier</button>
                  <button type="button" className="btn small subtle" data-pe-move-later>Move later</button>
                  <button type="button" className="btn small subtle" data-pe-rotate-left>Rotate left</button>
                  <button type="button" className="btn small subtle" data-pe-rotate-right>Rotate right</button>
                  <button type="button" className="btn small subtle" data-pe-duplicate>Duplicate</button>
                  <button type="button" className="btn small subtle" data-pe-blank>Add blank</button>
                  <button type="button" className="btn small subtle" data-pe-delete>Delete page</button>
                  <button type="button" className="btn small subtle" data-pe-next>Next</button>
                </div>

                <div className="pe-overlay-panel">
                  <div className="pe-overlay-head">
                    <h3>Stamps on this page</h3>
                    <button type="button" className="linkish pe-clear-page" data-pe-clear-overlays>
                      Clear stamps
                    </button>
                  </div>
                  <ul className="pe-overlay-list" data-pe-overlays-list />
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="pe-side" aria-label="PDF editing controls">
          <div className="panel">
            <h2 className="pe-group">Add text</h2>
            <div className="pe-field">
              <label htmlFor="pe-text">Text</label>
              <input
                id="pe-text"
                className="field-input"
                type="text"
                maxLength="120"
                placeholder="Confidential"
                data-pe-text
              />
            </div>

            <div className="pe-pair">
              <div className="pe-field">
                <label htmlFor="pe-size">Font size</label>
                <input
                  id="pe-size"
                  className="field-input"
                  type="number"
                  min="8"
                  max="96"
                  step="1"
                  defaultValue="18"
                  data-pe-size
                />
              </div>
              <div className="pe-field">
                <label htmlFor="pe-colour">Colour</label>
                <input id="pe-colour" className="pe-colour" type="color" defaultValue="#4b2fe0" data-pe-colour />
              </div>
            </div>

            <div className="pe-field">
              <label htmlFor="pe-opacity">
                Opacity <span className="pe-value" data-pe-opacity-out>100%</span>
              </label>
              <input id="pe-opacity" type="range" min="10" max="100" step="5" defaultValue="100" data-pe-opacity />
            </div>

            <div className="pe-field">
              <label htmlFor="pe-position">Position</label>
              <select id="pe-position" className="field-input" data-pe-position defaultValue="middle-center">
                {TEXT_POSITIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="pe-field">
              <label htmlFor="pe-apply">Apply to</label>
              <select id="pe-apply" className="field-input" data-pe-apply defaultValue="current">
                <option value="current">This page</option>
                <option value="all">All pages</option>
              </select>
            </div>

            <button type="button" className="btn grad pe-wide" data-pe-add-text>Add text stamp</button>
            <p className="pe-note">
              Stamps are single lines of Latin text. Existing words in the PDF are not reflowed or
              replaced.
            </p>
          </div>

          <div className="panel">
            <h2 className="pe-group">Page numbers</h2>
            <div className="pe-field">
              <label htmlFor="pe-number-format">Format</label>
              <select id="pe-number-format" className="field-input" data-pe-number-format defaultValue="n">
                {NUMBER_FORMATS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="pe-pair">
              <div className="pe-field">
                <label htmlFor="pe-number-position">Position</label>
                <select
                  id="pe-number-position"
                  className="field-input"
                  data-pe-number-position
                  defaultValue="bottom-center"
                >
                  {TEXT_POSITIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="pe-field">
                <label htmlFor="pe-number-start">Start at</label>
                <input
                  id="pe-number-start"
                  className="field-input"
                  type="number"
                  min="1"
                  max="9999"
                  step="1"
                  defaultValue="1"
                  data-pe-number-start
                />
              </div>
            </div>

            <button type="button" className="btn pe-wide" data-pe-add-numbers>Add page numbers</button>
            <button type="button" className="linkish pe-remove-numbers" data-pe-clear-numbers>
              Remove page numbers from every page
            </button>
          </div>

          <div className="panel">
            <h2 className="pe-group">Download</h2>
            <div className="pe-field">
              <label htmlFor="pe-name">File name</label>
              <input
                id="pe-name"
                className="field-input"
                type="text"
                defaultValue="edited.pdf"
                spellCheck="false"
                data-pe-name
              />
            </div>
            <button type="button" className="btn grad pe-wide" data-pe-download disabled>
              Download edited PDF
            </button>
            <p className="pe-note" data-pe-output-note>
              The new file is built from the pages you arranged. The original is left untouched.
            </p>
          </div>
        </aside>
      </div>

      <section className="prose" aria-labelledby="pe-how">
        <h2 id="pe-how">How to edit a PDF in your browser</h2>
        <ol className="how-steps">
          {HOW_TO.steps.map((step) => (
            <li key={step.name}>
              <h3>{step.name}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>

        <h3>What this editor changes, and what it does not</h3>
        <p>
          A PDF is a page description, not a word-processing document. This editor arranges the pages
          and draws new marks on top of them; it does not reach into an existing paragraph and
          reflow the sentence around an edit. That distinction is worth knowing before you start,
          because it decides whether this is the right tool for the job.
        </p>
        <table className="table">
          <caption>PDF editing tasks and whether this browser tool handles them.</caption>
          <thead>
            <tr>
              <th scope="col">Task</th>
              <th scope="col">Supported here</th>
              <th scope="col">What to do instead</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Reorder, rotate, delete or duplicate pages</th>
              <td>Yes.</td>
              <td>Use the controls under the preview.</td>
            </tr>
            <tr>
              <th scope="row">Merge another PDF into this one</th>
              <td>Yes, by appending its pages.</td>
              <td>Drop a second file, then move its pages where they belong.</td>
            </tr>
            <tr>
              <th scope="row">Add a text stamp or page numbers</th>
              <td>Yes, on one page or every page.</td>
              <td>Choose a position and add the stamp from the controls.</td>
            </tr>
            <tr>
              <th scope="row">Rewrite existing paragraphs</th>
              <td>No.</td>
              <td>Edit the source document and export a new PDF.</td>
            </tr>
            <tr>
              <th scope="row">Read text from a scanned PDF</th>
              <td>No OCR.</td>
              <td>
                Turn the page into an image and use{' '}
                <a href="/screenshot-to-text">screenshot to text</a>.
              </td>
            </tr>
            <tr>
              <th scope="row">Check tags, alt text and reading order</th>
              <td>Not on this page.</td>
              <td>
                Use the <a href="/pdf-accessibility-checker">PDF accessibility checker</a>.
              </td>
            </tr>
          </tbody>
        </table>

        <h3>Why the quality survives the edit</h3>
        <p>
          The pages are copied from the source PDF into a new document rather than rendered to images
          and stitched back together. Text stays selectable, vector artwork stays sharp, and a
          photograph is not recompressed. The rotation and the stamps you add are the only new content
          in the file. That is also why a 50 MB document can still be slow to open on a phone: the
          whole file is being parsed locally, not uploaded to a faster machine.
        </p>

        <h3>Why the document stays on your device</h3>
        <p>
          Contracts, medical records, invoices and identity documents are the files people most often
          need to rearrange, and those are exactly the files that should not be handed to a stranger&apos;s
          server. This tool opens the PDF with JavaScript running in your browser, keeps the pages in
          memory, and writes the download on the same device. There is no upload endpoint to audit,
          because there is no upload.
        </p>

        <h3>Working with scanned pages</h3>
        <p>
          A scan has a picture of text rather than text itself, so page numbers and stamps can be added
          normally, but the words on the page cannot be searched or selected. If you need the words,
          the <a href="/screenshot-to-text">screenshot-to-text tool</a> can read a page image in your
          browser, and the <a href="/universal-text-fixer">text fixer</a> will clean up the result.
          For the document&apos;s structure rather than its text, the{' '}
          <a href="/pdf-accessibility-checker">PDF accessibility checker</a> reports what a screen
          reader would find missing.
        </p>

        <p>
          For files rather than documents, the <a href="/image-compression">image compressor</a> shrinks
          JPG, PNG and WebP images and the <a href="/qr-code-generator">QR code generator</a> builds a
          code you can print beside them. For the words themselves, the{' '}
          <a href="/tools">text tools</a> count and convert them, the <a href="/studio">font studio</a>{' '}
          turns styled text into an image, and the <a href="/">fancy text generator</a> changes how they
          look.
        </p>
      </section>

      <RelatedSearches path="/pdf-editor" />

      <section className="prose" aria-labelledby="pe-faq">
        <h2 id="pe-faq">Common questions</h2>
        {PDF_EDITOR_QA.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}
