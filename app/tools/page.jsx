import { pageMeta, toMetadata } from '@/lib/pages.js';
import { TOOLS_QA, TOOLS_ANSWER } from '@/lib/aeo.js';
import { RelatedSearches } from '@/components/related-searches.jsx';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

function toolsMeta() {
  return pageMeta({
    // "Word counter" is the largest query this site can realistically win: high
    // volume, low competition, and the tool genuinely does it. It leads the title.
    title: 'Word Counter — Count Words & Characters Free',
    description: 'Free word counter and character counter, plus a text case converter. Count words, characters and sentences, then convert case, reverse text or clean it up.',
    path: '/tools',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }],
    faq: TOOLS_QA,
    quickAnswer: TOOLS_ANSWER,
  });
}

export function generateMetadata() {
  return toMetadata(toolsMeta());
}

const CASES = [
  ['upper', 'UPPERCASE'], ['lower', 'lowercase'], ['title', 'Title Case'], ['sentence', 'Sentence case'],
  ['camel', 'camelCase'], ['snake', 'snake_case'], ['kebab', 'kebab-case'], ['alt', 'aLtErNaTiNg'],
];

const REVERSALS = [['chars', 'Reverse characters'], ['words', 'Reverse words'], ['both', 'Reverse both']];

const LINE_OPS = [
  ['sort', 'Sort A→Z'], ['sortlen', 'Sort by length'], ['revsort', 'Sort Z→A'], ['dedupe', 'Remove duplicates'],
  ['trim', 'Trim each line'], ['dropempty', 'Drop empty lines'], ['shuffle', 'Shuffle'],
];

const CLEAN_OPS = [
  ['spaces', 'Collapse spaces'], ['lines', 'Collapse line breaks'], ['punct', 'Normalise punctuation'],
  ['zero', 'Strip zero-width chars'], ['emoji', 'Strip emoji'],
];

export default function ToolsPage() {
  const meta = toolsMeta();

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="tools" scripts={['/js/tools.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">Tools</span>
      </nav>

      <section className="hero">
        <h1>Word counter and text tools</h1>
        <p className="lede">
          Count words, characters and sentences as you type, then convert case, reverse text,
          build a slug, find and replace, or clean up a list. Everything runs in your browser,
          so there is no upload and no limit on how much text you can check.
        </p>
      </section>

      {/* Each of these is a whole page rather than another tab here. /tools
          targets "word counter", and putting a second tool's copy on this page
          would split its signals across two URLs — the one thing
          lib/seo-keywords.js exists to prevent. A panel that points at its own
          page keeps one tool per page while still putting it where someone
          looking for tools will actually see it. */}
      <section className="tool-hub" aria-labelledby="tools-qr">
        <span className="tool-hub-icon" aria-hidden="true">▦</span>
        <div>
          <h2 id="tools-qr">
            <a href="/qr-code-generator">QR code generator</a>
          </h2>
          <p>
            Create a QR code for a website, plain text, a Wi-Fi network, an email address, a phone
            number, an SMS, a WhatsApp chat, a contact card, a map location or a calendar event.
            Change the colors, size, error correction and logo, then download as PNG, SVG or JPG. The
            code is drawn by your own browser, so no Wi-Fi password or contact detail is uploaded.
          </p>
        </div>
        <a className="btn" href="/qr-code-generator">Open the QR code generator</a>
      </section>

      <section className="tool-hub" aria-labelledby="tools-qr-reader">
        <span className="tool-hub-icon" aria-hidden="true">🔍</span>
        <div>
          <h2 id="tools-qr-reader">
            <a href="/qr-code-reader">QR code reader</a>
          </h2>
          <p>
            Drop in a picture of a QR code and extract what it holds: a phone number, an email address, a
            Wi-Fi login, a contact card, a link, a map location or an event. The image is decoded in your
            browser, so nothing is uploaded, and the details come out as labelled fields you can copy.
          </p>
        </div>
        <a className="btn" href="/qr-code-reader">Open the QR code reader</a>
      </section>

      <section className="tool-hub" aria-labelledby="tools-images">
        <span className="tool-hub-icon" aria-hidden="true">🖼️</span>
        <div>
          <h2 id="tools-images">
            <a href="/image-compression">Image compressor</a>
          </h2>
          <p>
            Shrink JPG, PNG and WebP images and see the real file size before and after. Add a
            whole batch, set a quality level, resize, convert the format, then download one at a
            time or as a ZIP. Your images are decoded and re-encoded on your own device, so
            nothing is uploaded.
          </p>
        </div>
        <a className="btn" href="/image-compression">Open the image compressor</a>
      </section>

      <section className="tool-hub" aria-labelledby="tools-fixer">
        <span className="tool-hub-icon" aria-hidden="true">🧹</span>
        <div>
          <h2 id="tools-fixer">
            <a href="/universal-text-fixer">Text fixer</a>
          </h2>
          <p>
            Repair the mess that arrives with pasted text: repeated words, doubled spaces, stray
            spaces before punctuation, zero-width characters, curly quotes that break a search,
            sentences starting in lower case and common misspellings. Every fix is a toggle, your
            wording is never rewritten, and the text stays in your browser.
          </p>
        </div>
        <a className="btn" href="/universal-text-fixer">Open the text fixer</a>
      </section>

      <section className="tool-hub" aria-labelledby="tools-ocr">
        <span className="tool-hub-icon" aria-hidden="true">📷</span>
        <div>
          <h2 id="tools-ocr">
            <a href="/screenshot-to-text">Screenshot to text</a>
          </h2>
          <p>
            Read the text out of a screenshot and get it back as editable text you can copy or
            download. Drop an image or paste one from the clipboard and the recognition runs in a
            Web Worker on your own device, so the picture is never uploaded to an OCR service.
          </p>
        </div>
        <a className="btn" href="/screenshot-to-text">Open screenshot to text</a>
      </section>

      <section className="tool-hub" aria-labelledby="tools-pdf">
        <span className="tool-hub-icon" aria-hidden="true">♿</span>
        <div>
          <h2 id="tools-pdf">
            <a href="/pdf-accessibility-checker">PDF accessibility checker</a>
          </h2>
          <p>
            Check a PDF for the accessibility signals that live in the file: tags, structure tree,
            document language, title, readable fonts, alt text, labelled links and form fields. Every
            check passes, warns or fails with the fix beside it, and the PDF is parsed in your browser.
          </p>
        </div>
        <a className="btn" href="/pdf-accessibility-checker">Open the PDF checker</a>
      </section>

      <div className="tool-layout">
        <nav className="tool-nav" role="tablist" aria-label="Tools">
          <button type="button" role="tab" aria-selected="true" aria-controls="tool-case" id="tab-case">Case converter</button>
          <button type="button" role="tab" aria-selected="false" aria-controls="tool-count" id="tab-count">Word counter</button>
          <button type="button" role="tab" aria-selected="false" aria-controls="tool-reverse" id="tab-reverse">Reverse text</button>
          <button type="button" role="tab" aria-selected="false" aria-controls="tool-slug" id="tab-slug">Slug generator</button>
          <button type="button" role="tab" aria-selected="false" aria-controls="tool-replace" id="tab-replace">Find &amp; replace</button>
          <button type="button" role="tab" aria-selected="false" aria-controls="tool-lines" id="tab-lines">Line tools</button>
          <button type="button" role="tab" aria-selected="false" aria-controls="tool-clean" id="tab-clean">Clean text</button>
        </nav>

        <div className="tool-panel panel" id="tool-case" role="tabpanel" aria-labelledby="tab-case" data-tool="case">
          <label htmlFor="case-in">Text</label>
          <textarea id="case-in" data-tool-input placeholder="Paste text to change its case"></textarea>
          <div className="tool-options">
            {CASES.map(([v, label]) => <button type="button" key={v} data-case={v}>{label}</button>)}
          </div>
          <div className="tool-out" data-tool-out aria-live="polite"></div>
          <div className="gen-tools"><button type="button" className="btn" data-tool-copy hidden>Copy result</button></div>
        </div>

        <div className="tool-panel panel" id="tool-count" role="tabpanel" aria-labelledby="tab-count" data-tool="count" hidden>
          <label htmlFor="count-in">Text</label>
          <textarea id="count-in" data-tool-input placeholder="Paste text to count"></textarea>
          <div className="tool-out" data-tool-out aria-live="polite"></div>
        </div>

        <div className="tool-panel panel" id="tool-reverse" role="tabpanel" aria-labelledby="tab-reverse" data-tool="reverse" hidden>
          <label htmlFor="reverse-in">Text</label>
          <textarea id="reverse-in" data-tool-input placeholder="Type something backwards-worthy"></textarea>
          <div className="tool-options">
            {REVERSALS.map(([v, label]) => <button type="button" key={v} data-reverse={v}>{label}</button>)}
          </div>
          <div className="tool-out" data-tool-out aria-live="polite"></div>
          <div className="gen-tools"><button type="button" className="btn" data-tool-copy hidden>Copy result</button></div>
        </div>

        <div className="tool-panel panel" id="tool-slug" role="tabpanel" aria-labelledby="tab-slug" data-tool="slug" hidden>
          <label htmlFor="slug-in">Title or sentence</label>
          <textarea id="slug-in" data-tool-input placeholder="My Fancy New Post Title"></textarea>
          <div className="tool-out" data-tool-out aria-live="polite"></div>
          <div className="gen-tools"><button type="button" className="btn" data-tool-copy hidden>Copy slug</button></div>
        </div>

        <div className="tool-panel panel" id="tool-replace" role="tabpanel" aria-labelledby="tab-replace" data-tool="replace" hidden>
          <label htmlFor="replace-in">Text</label>
          <textarea id="replace-in" data-tool-input placeholder="The quick brown fox jumps over the lazy dog"></textarea>
          <div className="tool-options field-row">
            <label className="skip" htmlFor="replace-find">Find</label>
            <input id="replace-find" className="field-input" data-replace-find type="text" placeholder="Find…" />
            <label className="skip" htmlFor="replace-with">Replace with</label>
            <input id="replace-with" className="field-input" data-replace-with type="text" placeholder="Replace with…" />
            <button type="button" className="btn small" data-replace-go>Replace all</button>
            <button type="button" className="btn small subtle" data-replace-ci>Match case</button>
          </div>
          <div className="tool-out" data-tool-out aria-live="polite"></div>
          <div className="gen-tools"><button type="button" className="btn" data-tool-copy hidden>Copy result</button></div>
        </div>

        <div className="tool-panel panel" id="tool-lines" role="tabpanel" aria-labelledby="tab-lines" data-tool="lines" hidden>
          <label htmlFor="lines-in">One item per line</label>
          <textarea id="lines-in" data-tool-input placeholder={'banana\napple\ncherry'}></textarea>
          <div className="tool-options">
            {LINE_OPS.map(([v, label]) => <button type="button" key={v} data-lines={v}>{label}</button>)}
          </div>
          <div className="tool-out" data-tool-out aria-live="polite"></div>
          <div className="gen-tools"><button type="button" className="btn" data-tool-copy hidden>Copy result</button></div>
        </div>

        <div className="tool-panel panel" id="tool-clean" role="tabpanel" aria-labelledby="tab-clean" data-tool="clean" hidden>
          <label htmlFor="clean-in">Text</label>
          <textarea id="clean-in" data-tool-input placeholder="Text with   extra spaces, fancy dashes — and zero-width characters"></textarea>
          <div className="tool-options">
            {CLEAN_OPS.map(([v, label]) => <button type="button" key={v} data-clean={v}>{label}</button>)}
          </div>
          <div className="tool-out" data-tool-out aria-live="polite"></div>
          <div className="gen-tools"><button type="button" className="btn" data-tool-copy hidden>Copy result</button></div>
        </div>
      </div>

      {/* Answer-first copy. The tool panels above are the product; this is the
          text an assistant can quote when asked what this page does. */}
      <section className="quick-answer" aria-labelledby="tools-answer">
        <h2 id="tools-answer">{TOOLS_ANSWER.q}</h2>
        <p>{TOOLS_ANSWER.a}</p>
      </section>

      <RelatedSearches path="/tools" />

      <section className="prose" aria-labelledby="tools-what">
        <h2 id="tools-what">How to use these tools</h2>
        <p>
          Pick a tab, paste or type into the box, and the result appears underneath as you type.
          Use the copy button to take the result with you. Your input is never modified, so the
          same text can be run through several tools in a row.
        </p>

        <h3>Word and character counter</h3>
        <p>
          Counts words, characters with spaces, characters without spaces, sentences and reading
          time. Useful for anything with a length limit, such as a meta description or a meta
          title, where the limit is a character count rather than a word count.
        </p>

        <h3>Case converter</h3>
        <p>
          Converts between upper case, lower case, title case, sentence case, camelCase,
          snake_case and kebab-case. Title case capitalises each word; sentence case capitalises
          only the first. Kebab-case and snake_case are the two conventions used for URLs and
          filenames.
        </p>

        <h3>Reverse text</h3>
        <p>
          Reverses the characters, the words, or both. Reversing characters is the form used for
          decorative text; reversing word order is the form used for puzzles and for reading text
          upside down.
        </p>

        <h3>Slug generator</h3>
        <p>
          Turns a title into a URL-safe slug: lowercase, hyphen-separated, with spaces and
          punctuation removed. Use it when you need a matching URL segment for a page you are
          writing.
        </p>

        <h3>Find and replace</h3>
        <p>
          Replaces every instance of one string with another. The case-matching toggle decides
          whether a lowercase search also matches the capitalised form, which matters when
          cleaning up inconsistent text.
        </p>

        <h3>Line tools</h3>
        <p>
          Operates on one item per line. Sort alphabetically, sort by length, remove duplicate
          lines, trim trailing spaces from each line, drop empty lines, or shuffle the order.
          Useful for cleaning lists before pasting them somewhere.
        </p>

        <h3>Text cleaner</h3>
        <p>
          Removes extra spaces, converts fancy dashes to plain ones, and strips zero-width and
          other invisible characters that cause text to look identical but behave differently.
        </p>

        {/* These tools change the words, not the way they look. Saying so is the
            honest use of this space, and it is the one place on the page a reader
            can get from counting text to the tools that style it. */}
        <p>
          Everything above works on plain text and leaves the words alone. For a code you can print
          or put on a poster, the <a href="/qr-code-generator">QR code generator</a> builds one for a
          link, Wi-Fi network, contact card, map location or event entirely in the browser, and the{' '}
          <a href="/qr-code-reader">QR code reader</a> turns a picture of one back into its contents.
          For pictures rather than text, the <a href="/image-compression">image compressor</a> shrinks
          JPG, PNG and WebP files in your browser. To change how the words look, use the{' '}
          <a href="/">fancy text generator</a>, browse the{' '}
          <a href="/fonts">font styles by category</a>, or compare 25 words in 25 styles at once on
          the <a href="/styles">style guides</a>. A finished line of styled text can then be turned
          into an image with the <a href="/studio">font studio</a>.
        </p>
      </section>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading">Common questions</h2>
        {TOOLS_QA.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}