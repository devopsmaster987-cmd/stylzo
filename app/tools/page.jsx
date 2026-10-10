import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

function toolsMeta() {
  return pageMeta({
    title: 'Text Tools',
    description: 'Free browser-based text tools: case converter, word counter, reverse text, slug generator, find and replace, line sorter and more.',
    path: '/tools',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }],
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
        <h1>Text tools</h1>
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
    </>
  );
}