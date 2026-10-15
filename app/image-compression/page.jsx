import { IMAGE_COMPRESSOR_QA, IMAGE_COMPRESSOR_ANSWER } from '@/lib/aeo.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { RelatedSearches } from '@/components/related-searches.jsx';
import { Scripts } from '@/components/scripts.jsx';

// The same four steps the page's own how-to section renders, in the same order,
// so the HowTo schema cannot describe a procedure the page does not show.
const HOW_TO = {
  name: 'How to compress an image',
  description: 'Reduce the file size of a JPG, PNG or WebP image in your browser, with a real '
    + 'before-and-after size shown for every file.',
  steps: [
    {
      name: 'Add your images',
      text: 'Drop one or more images onto the area above, or use the file picker to choose them. '
        + 'JPG, PNG and WebP are accepted, up to 20 images at a time and 25 MB each.',
    },
    {
      name: 'Pick a quality level or a preset',
      text: 'Drag the quality slider between 10% and 100%, or use Low size, Balanced or High quality '
        + 'to set a sensible starting point. This setting controls JPEG and WebP output.',
    },
    {
      name: 'Resize or change the format',
      text: 'Enter a percentage, or a maximum width and height, to scale the image while keeping its '
        + 'aspect ratio. Choose an output format to convert between JPG, PNG and WebP.',
    },
    {
      name: 'Download the results',
      text: 'Download each compressed image on its own, or download the whole batch as one ZIP. '
        + 'Every image is processed on your own device and is never uploaded.',
    },
  ],
};

function imageCompressionMeta() {
  return pageMeta({
    // "image compressor" is the term people actually search; it leads, and the
    // supported formats sit behind it where they still get read.
    title: 'Image Compressor — Compress JPG, PNG and WebP Free',
    description: 'Compress JPG, PNG and WebP images in your browser and see the real file size before '
      + 'and after. Batch compress, resize, convert format and download as a ZIP. Free, no upload, no sign-up.',
    path: '/image-compression',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'Image compressor', path: '/image-compression' },
    ],
    faq: IMAGE_COMPRESSOR_QA,
    quickAnswer: IMAGE_COMPRESSOR_ANSWER,
    howTo: HOW_TO,
    app: true,
  });
}

export function generateMetadata() {
  return toMetadata(imageCompressionMeta());
}

const FORMATS = [
  ['auto', 'Keep original format'],
  ['image/jpeg', 'JPEG — best for photographs'],
  ['image/png', 'PNG — lossless, keeps transparency'],
  ['image/webp', 'WebP — smallest, keeps transparency'],
];

const PRESETS = [
  ['low', 'Low size', '45%'],
  ['balanced', 'Balanced', '80%'],
  ['high', 'High quality', '92%'],
];

export default function ImageCompressionPage() {
  const meta = imageCompressionMeta();

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="image-compression" scripts={['/js/image-compressor.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/tools">Tools</a>{' '}
        / <span aria-current="page">Image compressor</span>
      </nav>

      <section className="hero">
        <h1>Image compression tool</h1>
        <p className="lede">
          Shrink JPG, PNG and WebP images and see the exact size you saved. Add a whole batch,
          set a quality level, resize, convert the format, then download one at a time or as a
          ZIP. Your images are decoded and re-encoded by your own browser, so nothing is uploaded
          and nothing is stored.
        </p>
      </section>

      {/* Answer-first, before the tool and the long prose. The privacy claim is
          the one that has to come early and unambiguously: a page that asks for
          image files is assumed to upload them until it says otherwise. */}
      <section className="quick-answer" aria-labelledby="image-compression-answer">
        <h2 id="image-compression-answer">{IMAGE_COMPRESSOR_ANSWER.q}</h2>
        <p>{IMAGE_COMPRESSOR_ANSWER.a}</p>
      </section>

      <div className="cz-layout">
        <div className="cz-main">
          <div className="panel">
            {/* A <label> wrapping the input rather than a <div> with a click
                handler: the picker then opens with no JavaScript at all, the
                control is reachable by keyboard, and drag-and-drop layers on
                top without duplicating either. */}
            <label className="cz-dropzone" htmlFor="cz-input" data-cz-zone>
              <span className="visually-hidden">Choose JPG, PNG or WebP images to compress</span>
              <input
                id="cz-input"
                className="visually-hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                data-cz-input
              />
              <svg
                className="cz-drop-icon"
                viewBox="0 0 24 24"
                width="44"
                height="44"
                aria-hidden="true"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v2.5A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V15"
                />
              </svg>
              <h2>Drop your images here</h2>
              <p>
                or <span className="cz-browse">choose files</span> from your device. JPG, PNG and
                WebP, up to 20 images at a time and 25 MB each.
              </p>
            </label>

            <p className="cz-privacy">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2 4 5v6c0 4.5 3.2 8.7 8 10 4.8-1.3 8-5.5 8-10V5l-8-3Zm0 6a2 2 0 0 1 1 3.7V15h-2v-3.3A2 2 0 0 1 12 8Zm0 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
                />
              </svg>
              <span>
                <b>Your images never leave this device.</b> They are decoded and re-encoded by
                your own browser using a canvas. No image is uploaded, no image is sent to a third
                party, and nothing is stored on a server. Closing the tab discards everything.
              </span>
            </p>
          </div>

          <div className="cz-errors" role="alert" data-cz-errors hidden />

          <div className="cz-toolbar">
            <button type="button" className="btn" data-cz-compress-all disabled>
              Compress all
            </button>
            <button type="button" className="btn grad" data-cz-download-all hidden>
              Download all as ZIP
            </button>
            <button type="button" className="btn subtle" data-cz-reset disabled>Clear all</button>
            <p className="cz-summary" role="status" aria-live="polite" data-cz-summary />
          </div>

          <div className="cz-progress" data-cz-progress hidden>
            <span className="cz-progress-track">
              <span className="cz-progress-fill" data-cz-bar />
            </span>
            <p data-cz-progress-text />
          </div>

          <p className="cz-empty" data-cz-empty>
            <span className="visually-hidden">Empty state. </span>
            <b>No images yet</b>
            Add one above and it will be compressed automatically.
          </p>

          <ul className="cz-list" data-cz-list hidden aria-label="Compressed images" />
        </div>

        <div className="cz-controls">
          <div className="panel">
            <div className="cz-field">
              <label id="cz-preset-label">Preset</label>
              <div className="cz-presets" role="group" aria-labelledby="cz-preset-label">
                {PRESETS.map(([id, label, quality]) => (
                  <button key={id} type="button" data-cz-preset={id} aria-pressed="false">
                    {label} <span className="muted">{quality}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="cz-field">
              <label htmlFor="cz-quality">
                Compression quality <span className="cz-value" data-cz-quality-out>80%</span>
              </label>
              <input
                id="cz-quality"
                type="range"
                min="10"
                max="100"
                step="1"
                defaultValue="80"
                data-cz-quality
              />
              <p className="cz-note" data-cz-quality-note>
                Quality applies to JPEG and WebP output. Keep the original format unless you have a
                reason to change it.
              </p>
            </div>

            <div className="cz-field">
              <label htmlFor="cz-format">Output format</label>
              <select id="cz-format" data-cz-format defaultValue="auto">
                {FORMATS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <p className="cz-note">
                JPEG and WebP take a quality setting. PNG is lossless, so the quality slider does
                nothing to it — a PNG gets smaller by being resized or converted to WebP.
                Converting a transparent image to JPEG flattens the transparency onto white.
              </p>
            </div>
          </div>

          <div className="panel">
            <div className="cz-field">
              <label htmlFor="cz-scale">Resize percentage</label>
              <input
                id="cz-scale"
                className="field-input"
                type="number"
                min="1"
                max="100"
                step="1"
                placeholder="e.g. 50"
                data-cz-scale
              />
              <p className="cz-note">Percentage of the original size. Leave empty for no change.</p>
            </div>

            <div className="cz-field">
              <label htmlFor="cz-width">Maximum width</label>
              <input
                id="cz-width"
                className="field-input"
                type="number"
                min="1"
                step="1"
                placeholder="px"
                data-cz-width
              />
            </div>

            <div className="cz-field">
              <label htmlFor="cz-height">Maximum height</label>
              <input
                id="cz-height"
                className="field-input"
                type="number"
                min="1"
                step="1"
                placeholder="px"
                data-cz-height
              />
            </div>

            <div className="cz-field">
              <button type="button" className="cz-lock" data-cz-lock aria-pressed="true">
                Aspect ratio locked
              </button>
              <button type="button" className="linkish cz-note" data-cz-clear-size>
                Clear size
              </button>
              <p className="cz-note">
                Percentage first, then width or height. With the lock on, the other dimension is
                worked out for you. Images are never enlarged.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="prose" aria-labelledby="cz-how">
        <h2 id="cz-how">How to compress an image</h2>
        <ol className="how-steps">
          <li>
            <h3>{HOW_TO.steps[0].name}</h3>
            <p>{HOW_TO.steps[0].text}</p>
          </li>
          <li>
            <h3>{HOW_TO.steps[1].name}</h3>
            <p>{HOW_TO.steps[1].text}</p>
          </li>
          <li>
            <h3>{HOW_TO.steps[2].name}</h3>
            <p>{HOW_TO.steps[2].text}</p>
          </li>
          <li>
            <h3>{HOW_TO.steps[3].name}</h3>
            <p>{HOW_TO.steps[3].text}</p>
          </li>
        </ol>
      </section>

      <section className="prose" aria-labelledby="cz-what">
        <h2 id="cz-what">How the compression works</h2>
        <p>
          Your browser can already decode an image and encode it again, so the tool does exactly
          that and nothing else. Each file is read into an image bitmap, drawn onto a canvas at the
          size and quality you chose, and encoded back out as a JPG, PNG or WebP by the image
          encoder built into your browser. No image is sent to a server, because there is no server
          involved.
        </p>
        <p>
          That is also why the reported numbers are trustworthy. The percentage is calculated from
          the bytes the browser actually produced against the bytes of the file you added, not
          estimated from the quality slider. And when compression makes a file larger — which
          happens, most often with an already-optimised PNG — the tool says so plainly and offers
          you the original back instead of reporting a saving that did not happen.
        </p>

        <h3>Which format should you choose?</h3>
        {/* A real table with real headers. Models extract a comparison from a
            table far more reliably than from prose, and "which format" is the
            decision this page exists to inform. */}
        <table className="table">
          <caption>
            Image formats compared: what each one keeps, what it costs, and when to use it.
          </caption>
          <thead>
            <tr>
              <th scope="col">Format</th>
              <th scope="col">How it compresses</th>
              <th scope="col">Transparency</th>
              <th scope="col">Use it for</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">JPEG</th>
              <td>Lossy, with an adjustable quality from 10% to 100%.</td>
              <td>Not supported. Transparency is flattened onto white.</td>
              <td>Photographs and anything with lots of continuous tone.</td>
            </tr>
            <tr>
              <th scope="row">PNG</th>
              <td>Lossless. The quality slider has no effect on it.</td>
              <td>Supported, including partial transparency.</td>
              <td>Logos, icons, screenshots and anything with sharp edges or text.</td>
            </tr>
            <tr>
              <th scope="row">WebP</th>
              <td>Lossy with an adjustable quality, and usually smaller than JPEG.</td>
              <td>Supported.</td>
              <td>The web in general, when you control where the image is served.</td>
            </tr>
          </tbody>
        </table>
        <p>
          WebP is normally the best default for the web: at the same perceived quality it is often
          25 to 35 per cent smaller than JPEG. The catch is support — it is universal in current
          browsers, but an old app or an email client may not render it, and a logo with
          transparency should stay PNG unless you know every destination supports WebP.
        </p>

        <h3>How much can an image actually be compressed?</h3>
        <p>
          It depends on the source. A photograph that has already been through a compressor
          usually saves 30 to 70 per cent at 80% quality. A PNG screenshot is already lossless, so
          it saves almost nothing unless you resize it or convert it. The honest summary is that a
          large saving means a visible quality cost, which is why this tool shows you the real
          before and after size for every file instead of a number it cannot substantiate.
        </p>

        <h3>Resizing versus re-encoding</h3>
        <p>
          If an image is far larger than it needs to be, resizing does more than any quality
          setting. Halving both dimensions removes three quarters of the pixels before the encoder
          sees them, and the result usually looks identical at the size it will be displayed. This
          tool never enlarges an image, because inventing pixels that carry no detail makes the
          file bigger without adding information.
        </p>

        {/* The rest of this site works on text rather than images. Say so, and
            point at the tools that do the next job: a QR code to put the
            compressed image in front of people, and the styling tools for the
            words on it. */}
        <p>
          The rest of this site works on text rather than images. To put a picture in front of
          people, the <a href="/qr-code-generator">QR code generator</a> builds a code you can print
          beside it. Count and convert words on the{' '}
          <a href="/tools">text tools page</a>, turn styled text into a{' '}
          <a href="/studio">1200 by 630 PNG in the font studio</a>, or change how text looks with
          the <a href="/">fancy text generator</a>. If you want to see a lot of styles side by side
          before picking one, the <a href="/styles">style guides</a> put 25 words in 25 styles on
          one page, and the <a href="/fonts">font index</a> lists every style by category.
        </p>
      </section>

      <RelatedSearches path="/image-compression" />

      <section className="prose" aria-labelledby="cz-faq">
        <h2 id="cz-faq">Common questions</h2>
        {IMAGE_COMPRESSOR_QA.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}
