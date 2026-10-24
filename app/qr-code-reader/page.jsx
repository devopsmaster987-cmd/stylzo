import { QR_READER_ANSWER, QR_READER_QA } from '@/lib/aeo.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { RelatedSearches } from '@/components/related-searches.jsx';
import { Scripts } from '@/components/scripts.jsx';

// The same steps the page's how-to section renders, so the HowTo schema cannot
// describe a procedure the page does not show.
const HOW_TO = {
  name: 'How to read a QR code from an image',
  description: 'Decode a QR code picture in your browser and extract the phone number, email address, '
    + 'Wi-Fi login, contact card, link, location or event it contains.',
  steps: [
    {
      name: 'Add the QR code image',
      text: 'Drop a PNG, JPG, WebP, GIF or BMP onto the area above, use the file picker, or paste a '
        + 'screenshot straight from the clipboard. Several images can be added at once, up to 20 MB each.',
    },
    {
      name: 'Let your browser decode it',
      text: 'The decoder is served with this page and runs on your own device. It looks for the code at '
        + 'several sizes and tries both a dark-on-light and a light-on-dark code before giving up.',
    },
    {
      name: 'Read the extracted details',
      text: 'The contents appear as labelled fields — phone number, email address, Wi-Fi login, contact '
        + 'details, link or event. Copy one field, copy all of them, or open the decoded text to see '
        + 'exactly what was inside the code.',
    },
  ],
};

function qrReaderMeta() {
  return pageMeta({
    title: 'QR Code Reader — Extract Phone, Email & Text Free',
    description: 'Read a QR code from a screenshot or photo and extract the phone number, email address, '
      + 'Wi-Fi login, contact card, link, location or text inside it. Decoding happens in your browser, '
      + 'so the image is never uploaded.',
    path: '/qr-code-reader',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'QR code reader', path: '/qr-code-reader' },
    ],
    faq: QR_READER_QA,
    quickAnswer: QR_READER_ANSWER,
    howTo: HOW_TO,
    app: true,
  });
}

export function generateMetadata() {
  return toMetadata(qrReaderMeta());
}

const TYPES = [
  ['Phone number', 'tel:', 'The number, ready to copy or dial.'],
  ['SMS', 'smsto:', 'The number plus any message the sender prefilled.'],
  ['Email address', 'mailto:', 'The address, and the subject and body when they are included.'],
  ['Wi-Fi', 'WIFI:', 'Network name, security type and password, so a guest can join without typing.'],
  ['Contact card', 'vCard or MECARD', 'Name, phone numbers, email addresses, organisation, website and address.'],
  ['Website link', 'https:', 'The address, shown as a link you can open.'],
  ['Map location', 'geo:', 'Latitude and longitude, or a place name, with a link to open it in maps.'],
  ['Calendar event', 'VEVENT', 'Event name, location, start, end and description.'],
  ['Plain text', 'any other text', 'The text exactly as it was encoded, with nothing guessed.'],
];

export default function QrCodeReaderPage() {
  const meta = qrReaderMeta();

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="qr-code-reader" scripts={['/js/qr-code-reader.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/tools">Tools</a>{' '}
        / <span aria-current="page">QR code reader</span>
      </nav>

      <section className="hero">
        <h1>QR code reader</h1>
        <p className="lede">
          Drop in a picture of a QR code and get the contents back as something you can read and copy:
          a phone number, an email address, a Wi-Fi login, a contact card, a link, a location or an
          event. The image is decoded by your own browser, so it is never uploaded.
        </p>
      </section>

      <section className="quick-answer" aria-labelledby="qr-reader-answer">
        <h2 id="qr-reader-answer">{QR_READER_ANSWER.q}</h2>
        <p>{QR_READER_ANSWER.a}</p>
      </section>

      <div className="tp-layout" data-qr-reader>
        <div className="tp-main">
          <div className="panel">
            <label className="tp-dropzone" htmlFor="qr-reader-input" data-qr-zone>
              <span className="visually-hidden">Choose QR code images to read</span>
              <input
                id="qr-reader-input"
                className="visually-hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp"
                multiple
                data-qr-input
              />
              <svg className="tp-drop-icon" viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm11 0h2v2h-2v-2Zm4 0h1v4h-3v2h-2v-4h4v-2Zm-5 4h2v2h-2v-2Z"
                />
              </svg>
              <h2>Drop a QR code image here</h2>
              <p>
                or <span className="tp-browse">choose a file</span> — or just paste with Ctrl+V. PNG, JPG,
                WebP, GIF and BMP, several at a time, up to 20 MB each.
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
                <b>Your image never leaves this device.</b> The decoder is served from this site and reads
                the pixels on your own machine. No image is sent to a QR service, no request carries one,
                and closing the tab discards everything.
              </span>
            </p>
          </div>

          <div className="tp-errors" role="alert" data-qr-errors hidden />

          <div className="tp-toolbar">
            <button type="button" className="btn grad" data-qr-copy-all disabled>Copy all details</button>
            <button type="button" className="btn subtle" data-qr-reset>Clear all</button>
            <p className="tp-status" role="status" aria-live="polite" data-qr-status />
          </div>

          <p className="tp-empty" data-qr-empty>
            <span className="visually-hidden">Empty state. </span>
            <b>No QR code yet</b>
            Add an image above, paste one from the clipboard, and the contents will appear here.
          </p>

          <ul className="tp-list" data-qr-list aria-label="Decoded QR codes" />
        </div>

        <div className="tp-controls">
          <div className="panel">
            <div className="tp-field">
              <h2 className="tp-field-title">What it pulls out</h2>
              <ul className="tp-tips">
                <li><b>Phone and SMS</b> — the number and any prefilled message.</li>
                <li><b>Email</b> — address, subject and body.</li>
                <li><b>Wi-Fi</b> — network name, security and password.</li>
                <li><b>Contact card</b> — name, phone, email, organisation and address.</li>
                <li><b>Links and maps</b> — the website, coordinates or place name.</li>
                <li><b>Calendar events</b> — title, place, start and end.</li>
                <li><b>Plain text</b> — anything else, exactly as encoded.</li>
              </ul>
            </div>
          </div>

          <div className="panel">
            <div className="tp-field">
              <h2 className="tp-field-title">Getting a clean read</h2>
              <ul className="tp-tips">
                <li>Use the original picture rather than a thumbnail.</li>
                <li>Crop to the code but leave its white border visible.</li>
                <li>Fill most of the frame and keep the code straight.</li>
                <li>A dark code on a light background is easiest; inverted codes are tried too.</li>
                <li>If the picture is blurred, retake it rather than enlarging it.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section className="prose" aria-labelledby="qr-reader-how">
        <h2 id="qr-reader-how">How to read a QR code from an image</h2>
        <ol className="how-steps">
          {HOW_TO.steps.map((step) => (
            <li key={step.name}>
              <h3>{step.name}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>

        <h3>What is actually inside a QR code</h3>
        <p>
          A QR code is not a file and it does not hold a picture. It holds a short piece of text, and the
          first few characters of that text tell a phone what to do with it. That is why the same square
          can open a website, dial a number or join a network: the payload is written in a known scheme.
        </p>

        <table className="table">
          <caption>QR code payloads this reader recognises and the details it extracts from each.</caption>
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Starts with</th>
              <th scope="col">What you get</th>
            </tr>
          </thead>
          <tbody>
            {TYPES.map(([type, prefix, result]) => (
              <tr key={type}>
                <th scope="row">{type}</th>
                <td><code>{prefix}</code></td>
                <td>{result}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Why the image never leaves the browser</h3>
        <p>
          Most online QR readers upload the picture to a server, decode it there and send the text back.
          This page does the opposite. The decoder is a small JavaScript library served from this site,
          and it receives pixels read from a canvas on your own device. There is no upload and no
          third-party service, which matters because a QR code can contain a Wi-Fi password, a phone
          number or a contact card.
        </p>

        <p>
          If you need to make a code rather than read one, the{' '}
          <a href="/qr-code-generator">QR code generator</a> builds links, Wi-Fi logins, contact cards
          and events in the same way. To read the words out of a screenshot instead of a code, use{' '}
          <a href="/screenshot-to-text">screenshot to text</a>. The{' '}
          <a href="/universal-text-fixer">text fixer</a> cleans up pasted text, and the{' '}
          <a href="/tools">text tools</a> count and convert it.
        </p>
      </section>

      <RelatedSearches path="/qr-code-reader" />

      <section className="prose" aria-labelledby="qr-reader-faq">
        <h2 id="qr-reader-faq">Common questions</h2>
        {QR_READER_QA.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}
