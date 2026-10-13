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