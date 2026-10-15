import { catalog } from '@/services/catalog.js';
import { STUDIO_QA } from '@/lib/aeo.js';
import { pageMeta, toMetadata, composerStyles } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

// The steps below are the same four the page's own how-to section shows, in the
// same order, so the HowTo schema cannot describe steps the page does not have.
const HOW_TO = {
  name: 'How to make a text image',
  description: 'Turn styled text into a 1200 by 630 PNG you can download, using a style, '
    + 'colours and a background you choose.',
  steps: [
    { name: 'Type your text', text: 'Enter up to 120 characters. Shorter phrases read better at image sizes.' },
    { name: 'Pick a style', text: 'Search the style list or browse it. Each style shows the support warning the generator uses, so you can tell in advance whether it will survive being pasted elsewhere.' },
    { name: 'Set the colours', text: 'Choose a text colour and a background. The background options include gradients rather than flat fills, which usually separates better from a busy feed.' },
    { name: 'Download the PNG', text: 'The image is drawn locally, so the download is immediate. If you only want the characters rather than the picture, use the copy button instead.' },
  ],
};

function studioMeta() {
  return pageMeta({
    title: 'Fancy Text Image Generator — Make a PNG',
    description: 'Turn styled text into a 1200x630 image. Pick a Unicode style, colours and background, then download a watermark-free PNG drawn entirely in your browser.',
    path: '/studio',
    // This page was noindex while being linked from the main nav, the footer and
    // the home page, which spent three of the site's strongest internal links on
    // a page that could not rank. With the explainer below it has real content
    // to index, so the link is worth keeping.
    noindex: false,
    app: true,
    faq: STUDIO_QA,
    howTo: HOW_TO,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Studio', path: '/studio' }],
  });
}

export function generateMetadata() {
  return toMetadata(studioMeta());
}

const FG = [
  ['#ffffff', 'White', true], ['#ffd84d', 'Yellow', false], ['#1b1533', 'Ink', false],
  ['#ff8ad8', 'Pink', false], ['#7ef0c0', 'Mint', false], ['#a99bff', 'Violet', false],
];

const BG = [
  ['midnight', 'Midnight', true], ['violet', 'Violet', false], ['sunset', 'Sunset', false],
  ['paper', 'Paper', false], ['mint', 'Mint', false],
];

export default function StudioPage() {
  const meta = studioMeta();
  const text = catalog().sample;
  const styleOptions = composerStyles();

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="studio" scripts={['/js/studio.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">Studio</span>
      </nav>

      <section className="hero">
        <h1>Make a text image</h1>
      </section>

      <div className="studio-layout">
        <div className="studio-stage">
          <canvas id="studio-canvas" width="1200" height="630" aria-label="Preview of your text image"></canvas>
          <div className="gen-tools">
            <span className="count">1200 × 630 PNG · drawn locally</span>
            <button type="button" className="btn grad" data-studio-download>Download PNG</button>
            <button type="button" className="btn ghost" data-studio-copy>Copy styled text</button>
          </div>
        </div>

        <div className="studio-controls">
          <div className="panel">
            <label htmlFor="studio-text">Text</label>
            <input id="studio-text" type="text" data-studio-text defaultValue={text} maxLength="120" />
          </div>

          <div className="panel">
            <label htmlFor="studio-style-search">Style</label>
            <input
              id="studio-style-search"
              type="search"
              data-studio-style-search
              placeholder="Search styles…"
              autoComplete="off"
              className="field-input"
            />
            <select id="studio-style" className="studio-style-select" data-studio-style size="8" defaultValue={styleOptions[0]?.id}>
              {styleOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="panel">
            <label htmlFor="studio-size">Size <span className="muted" data-studio-size-label>72</span></label>
            <input id="studio-size" type="range" min="24" max="160" defaultValue="72" data-studio-size />
            <label htmlFor="studio-tracking">Letter spacing <span className="muted" data-studio-track-label>0</span></label>
            <input id="studio-tracking" type="range" min="-6" max="24" defaultValue="0" data-studio-tracking />
            <label htmlFor="studio-align">Alignment</label>
            <select id="studio-align" data-studio-align defaultValue="center">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
            <label htmlFor="studio-font">Typeface</label>
            <select id="studio-font" data-studio-font defaultValue="system-ui, sans-serif">
              <option value="system-ui, sans-serif">Sans</option>
              <option value="Georgia, serif">Serif</option>
              <option value="ui-monospace, Menlo, Consolas, monospace">Mono</option>
              <option value='"Segoe UI Symbol", "Noto Sans Symbols 2", system-ui'>Symbol stack</option>
            </select>
          </div>

          <div className="panel">
            <label>Text colour</label>
            <div className="swatches" data-studio-fg role="group" aria-label="Text colour">
              {FG.map(([color, label, pressed]) => (
                <button
                  type="button"
                  key={color}
                  data-color={color}
                  aria-pressed={pressed ? 'true' : 'false'}
                  className="swatch"
                  aria-label={label}
                />
              ))}
            </div>
            <label>Background</label>
            <div className="swatches" data-studio-bg role="group" aria-label="Background">
              {BG.map(([bg, label, pressed]) => (
                <button
                  type="button"
                  key={bg}
                  data-bg={bg}
                  aria-pressed={pressed ? 'true' : 'false'}
                  className="swatch"
                  aria-label={label}
                />
              ))}
            </div>
          </div>

          <p className="studio-note">Everything runs on this device. Downloaded PNGs are yours — no watermark, no upload.</p>
        </div>
      </div>

      <section className="prose" aria-labelledby="studio-about">
        <h2 id="studio-about">What the font studio does</h2>
        <p>
          The generator on the home page turns your text into Unicode characters, which means
          it can be pasted into any app that accepts plain text. The studio solves the other
          half of the problem: turning styled text into an actual image. Choose a style, a
          foreground colour and a background, set the letter spacing, and the preview above
          redraws as you type.
        </p>
        <p>
          The result is a 1200 by 630 PNG, the size most social platforms crop to, generated
          on your own device by a canvas the browser draws directly. Nothing is uploaded and
          nothing is watermarked, so the image is yours to use wherever you need it.
        </p>

        <h3>How to make a text image</h3>
        <ol className="how-steps">
          <li>
            <h3>Type your text</h3>
            <p>Up to 120 characters. Shorter phrases read better at image sizes.</p>
          </li>
          <li>
            <h3>Pick a style</h3>
            <p>
              Search the style list or browse it. Each style shows the same support warning
              the generator uses, so you can tell in advance whether it will survive being
              pasted elsewhere.
            </p>
          </li>
          <li>
            <h3>Set the colours</h3>
            <p>
              Pick a text colour and a background. The background options include gradients
              rather than flat fills, which usually separates better from a busy feed.
            </p>
          </li>
          <li>
            <h3>Download the PNG</h3>
            <p>
              The image is drawn locally, so the download is immediate. If you only want the
              characters rather than the picture, use the copy button instead.
            </p>
          </li>
        </ol>

        <h3>When to use an image instead of styled text</h3>
        {/* A real table with real headers. Generative engines are markedly
            better at extracting a comparison from a table than from prose, and
            this is the page's main "which should I use" decision. */}
        <table className="table">
          <caption>
            Styled text against a text image: which one to use, and when.
          </caption>
          <thead>
            <tr>
              <th scope="col">Use this</th>
              <th scope="col">Choose it when</th>
              <th scope="col">You give up</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Styled text</th>
              <td>
                The destination accepts plain text, so the characters survive being pasted.
              </td>
              <td>
                Nothing much: the text stays editable, selectable and searchable.
              </td>
            </tr>
            <tr>
              <th scope="row">Text image</th>
              <td>
                The destination strips or flattens unusual characters, which is common in
                image-based messaging, some profile fields and most comment sections.
              </td>
              <td>
                Selectability and accessibility: the words are pixels, so they cannot be
                read aloud or searched.
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          Styled text is the better choice when the destination accepts plain text, because it
          stays editable and searchable. An image is better when the destination flattens or
          strips unusual characters, which is common in image-based messaging, some profile
          fields and most comment sections.
        </p>
        <p>
          If you need the characters themselves, start with the{' '}
          <a href="/">main text generator</a>, browse the <a href="/fonts">full list of font
          styles</a>, or compare <a href="/styles">25 words in 25 styles at once</a>.
        </p>
        <p>
          Working the other way round — you already have a picture and need it smaller — the{' '}
          <a href="/image-compression">image compressor</a> shrinks JPG, PNG and WebP files on your
          own device, and the <a href="/tools">text tools</a> handle the caption that goes with it.
        </p>
      </section>

      <section className="prose" aria-labelledby="studio-faq">
        <h2 id="studio-faq">Common questions</h2>
        {STUDIO_QA.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}