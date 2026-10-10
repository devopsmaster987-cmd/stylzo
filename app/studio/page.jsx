import { catalog } from '@/services/catalog.js';
import { pageMeta, toMetadata, composerStyles } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

function studioMeta() {
  return pageMeta({
    title: 'Font Studio',
    description: 'Design a styled text image in your browser: pick a style, colours, spacing and background, then export a PNG or copy the text.',
    path: '/studio',
    noindex: true,
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
    </>
  );
}