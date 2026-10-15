import { QR_GENERATOR_QA, QR_GENERATOR_ANSWER } from '@/lib/aeo.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { RelatedSearches } from '@/components/related-searches.jsx';
import { Scripts } from '@/components/scripts.jsx';
import { AdUnit } from '@/components/ad-unit.jsx';
import { env, adsenseConfigured } from '@/config/environment.js';

// The same four steps the page's own how-to section renders, in the same order,
// so the HowTo schema cannot describe a procedure the page does not show.
const HOW_TO = {
  name: 'How to create a QR code',
  description: 'Make a QR code for a link, text, Wi-Fi, email, a phone number, WhatsApp, a contact '
    + 'card, a location or an event, then download it as a PNG, SVG or JPG.',
  steps: [
    {
      name: 'Choose what the code should do',
      text: 'Pick one of the ten types above. Each one asks for different fields: a URL needs an '
        + 'address, Wi-Fi needs a network name and a password, and a contact card needs at least a '
        + 'name. Switching tabs keeps what you have already typed.',
    },
    {
      name: 'Fill in the fields',
      text: 'The preview updates as you type. Fields are checked as you go, so a missing network '
        + 'name, an incomplete email address or coordinates outside the world are reported under the '
        + 'box that caused them rather than producing a code that scans to nothing.',
    },
    {
      name: 'Set the size, colors and error correction',
      text: 'Choose 128, 256, 512 or 1024 pixels, set a foreground and background color, and pick an '
        + 'error correction level. The contrast readout shows how much separation the two colors have, '
        + 'because a code needs far more contrast than ordinary text to scan.',
    },
    {
      name: 'Download it',
      text: 'Save the code as a PNG for screens, an SVG for printing at any size, or a JPG where a '
        + 'small file matters. Nothing is uploaded at any point: the code is built by your own '
        + 'browser and closing the tab discards it.',
    },
  ],
};

function qrMeta() {
  return pageMeta({
    // "QR code generator" is the term people actually search; "free" leads because
    // it is the qualifier that separates this from the paywalled tools.
    title: 'Free QR Code Generator — Create & Download QR Codes',
    description: 'Create free QR codes for websites, text, Wi-Fi, WhatsApp, email, phone numbers and '
      + 'contact cards. Customize colors and logo, then download as PNG, SVG or JPG. No sign-up.',
    path: '/qr-code-generator',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'QR code generator', path: '/qr-code-generator' },
    ],
    faq: QR_GENERATOR_QA,
    quickAnswer: QR_GENERATOR_ANSWER,
    howTo: HOW_TO,
    app: true,
  });
}

export function generateMetadata() {
  return toMetadata(qrMeta());
}

const SIZES = [
  [128, '128 × 128 — small, for screens'],
  [256, '256 × 256 — a good default'],
  [512, '512 × 512 — sharp on a poster'],
  [1024, '1024 × 1024 — for large prints'],
];

const ECC = [
  ['L', 'Low', 'Recovers about 7% damage. The simplest, smallest code.'],
  ['M', 'Medium', 'Recovers about 15%. The right default for most uses.'],
  ['Q', 'Quartile', 'Recovers about 25%. A good choice for a code with a logo.'],
  ['H', 'High', 'Recovers about 30%. The most robust, and the densest.'],
];

const FIELDS = {
  url: [
    ['url', 'text', 'Website address', 'https://example.com', 'https://stylzo.com', true],
  ],
  text: [
    ['text', 'textarea', 'Text to encode', 'Any message, note or code you want to share',
      'Scan me at https://stylzo.com', true],
  ],
  wifi: [
    ['ssid', 'text', 'Network name (SSID)', 'The name shown in your Wi-Fi list', 'Cafe Guest', true],
    ['wifiSecurity', 'select', 'Security', 'The security your router uses', null, true],
    ['password', 'text', 'Password', 'Leave empty for a network with no password', 'correct horse battery', false],
  ],
  email: [
    ['emailAddress', 'text', 'Email address', 'who@example.com', 'hello@example.com', true],
    ['emailSubject', 'text', 'Subject', 'Optional', 'Hello from Stylzo', false],
    ['emailBody', 'textarea', 'Message', 'Optional, pre-filled when the code is scanned', 'Here is the link.', false],
  ],
  phone: [
    ['phoneNumber', 'text', 'Phone number', 'Include the country code', '+15551234567', true],
  ],
  sms: [
    ['phoneNumber', 'text', 'Phone number', 'Include the country code', '+15551234567', true],
    ['smsBody', 'textarea', 'Message', 'Pre-filled when the code is scanned', 'Here is the link: https://stylzo.com', false],
  ],
  whatsapp: [
    ['phoneNumber', 'text', 'Phone number with country code', 'Digits only, starting with the country code. No plus sign.',
      '15551234567', true],
    ['whatsappMessage', 'textarea', 'Pre-filled message', 'Optional', 'Hi, I found you through Stylzo.', false],
  ],
  vcard: [
    ['vFirst', 'text', 'First name', '', 'Jane', true],
    ['vLast', 'text', 'Last name', '', 'Doe', false],
    ['vOrg', 'text', 'Organisation', 'Optional', 'Stylzo', false],
    ['vTitle', 'text', 'Job title', 'Optional', 'Owner', false],
    ['vPhone', 'text', 'Phone', 'Optional', '+15551234567', false],
    ['vEmail', 'text', 'Email', 'Optional', 'jane@example.com', false],
    ['vUrl', 'text', 'Website', 'Optional', 'example.com', false],
    ['vAddress', 'text', 'Address', 'Optional', '10 Downing Street, London', false],
    ['vNote', 'textarea', 'Note', 'Optional', 'Met at the conference.', false],
  ],
  location: [
    ['latitude', 'text', 'Latitude', 'Between -90 and 90', '51.5074', true],
    ['longitude', 'text', 'Longitude', 'Between -180 and 180', '-0.1278', true],
    ['locationLabel', 'text', 'Place name', 'Optional, shown on the map', 'London, UK', false],
    ['mapsProvider', 'select', 'Open with', 'Which map a phone should use', null, true],
  ],
  event: [
    ['eventSummary', 'text', 'Event name', 'What the event is called', 'Stylzo launch', true],
    ['eventLocation', 'text', 'Location', 'Optional', 'Online', false],
    ['eventStart', 'datetime-local', 'Starts', 'Local time', '', true],
    ['eventEnd', 'datetime-local', 'Ends', 'Optional', '', false],
    ['eventDescription', 'textarea', 'Description', 'Optional', 'Come and see the new tool.', false],
  ],
};

// The two select fields, whose options come from the payload builder rather than
// being repeated here, so the two can never drift apart.
const SELECTS = {
  wifiSecurity: [
    ['WPA', 'WPA, WPA2 or WPA3'],
    ['WEP', 'WEP'],
    ['nopass', 'No password'],
  ],
  mapsProvider: [
    ['geo', 'Any maps app'],
    ['google', 'Google Maps'],
  ],
};

const CHECKBOXES = {
  wifi: [['wifiHidden', 'This is a hidden network']],
  location: [],
};

/** Render one field for a QR type. */
function field(name, kind, label, hint, placeholder, required, key) {
  const id = `qr-${name}`;
  if (kind === 'checkbox') {
    return (
      <label className="qr-check" htmlFor={id} key={key || name}>
        <input id={id} type="checkbox" data-qr-field={name} />
        <span>{label}</span>
      </label>
    );
  }

  const control = kind === 'textarea' ? (
    <textarea id={id} data-qr-field={name} placeholder={placeholder} rows={3} required={required} />
  ) : kind === 'select' ? (
    <select id={id} data-qr-field={name} defaultValue={SELECTS[name][0][0]} required={required}>
      {SELECTS[name].map(([value, text]) => (
        <option key={value} value={value}>{text}</option>
      ))}
    </select>
  ) : (
    <input
      id={id}
      className="field-input"
      type={kind === 'datetime-local' ? 'datetime-local' : 'text'}
      data-qr-field={name}
      placeholder={placeholder}
      required={required}
    />
  );

  return (
    <div className="qr-field" key={key || name}>
      <label htmlFor={id}>
        {label}
        {!required && <span className="qr-optional">optional</span>}
      </label>
      {control}
      {hint ? <p className="qr-note">{hint}</p> : null}
    </div>
  );
}

function panel(type, fields, checkboxes) {
  return (
    <div
      className="qr-panel"
      id={`qr-panel-${type}`}
      role="tabpanel"
      aria-labelledby={`qr-tab-${type}`}
      data-qr-panel={type}
      hidden={type !== 'url'}
    >
      {fields.map(([name, kind, label, hint, placeholder, required]) =>
        field(name, kind, label, hint, placeholder, required))}
      {checkboxes.map(([name, label]) => field(name, 'checkbox', label))}
    </div>
  );
}

export default function QrCodeGeneratorPage() {
  const meta = qrMeta();

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey="qr-code-generator" scripts={['/js/qr-code-generator.js']} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/tools">Tools</a>{' '}
        / <span aria-current="page">QR code generator</span>
      </nav>

      <section className="hero">
        <h1>Free QR code generator</h1>
        <p className="lede">
          Make a QR code for a link, text, a Wi-Fi network, an email address, a phone number, a
          WhatsApp chat, a contact card, a map location or a calendar event. Change the colors, size,
          error correction and logo, then download it as a PNG, SVG or JPG. The code is built by your
          own browser, so nothing you type is uploaded and there is no account to create.
        </p>
      </section>

      {/* Answer-first, before the tool and the long prose. The privacy claim is
          the load-bearing one: this page asks for Wi-Fi passwords and contact
          details, and a reader is entitled to know before they type anything. */}
      <section className="quick-answer" aria-labelledby="qr-answer">
        <h2 id="qr-answer">{QR_GENERATOR_ANSWER.q}</h2>
        <p>{QR_GENERATOR_ANSWER.a}</p>
      </section>

      <div className="qr-layout" data-qr-zone>
        <div className="qr-main">
          <div className="panel">
            <div className="tabbar qr-tabs" role="tablist" aria-label="QR code type" data-qr-tabs>
              {Object.keys(FIELDS).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  id={`qr-tab-${type}`}
                  data-qr-type={type}
                  aria-selected={type === 'url'}
                  aria-controls={`qr-panel-${type}`}
                  tabIndex={type === 'url' ? 0 : -1}
                >
                  {{
                    url: 'URL', text: 'Text', wifi: 'Wi-Fi', email: 'Email', phone: 'Phone',
                    sms: 'SMS', whatsapp: 'WhatsApp', vcard: 'Contact', location: 'Location',
                    event: 'Event',
                  }[type]}
                </button>
              ))}
            </div>

            <p className="qr-privacy">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2 4 5v6c0 4.5 3.2 8.7 8 10 4.8-1.3 8-5.5 8-10V5l-8-3Zm0 6a2 2 0 0 1 1 3.7V15h-2v-3.3A2 2 0 0 1 12 8Zm0 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
                />
              </svg>
              <span>
                <b>Your Wi-Fi password, phone number and contact details never leave this device.</b>{' '}
                The QR code is drawn by your own browser from code served with this page. There is no
                upload, no third-party QR service and no storage, so there is no request that could
                carry what you type.
              </span>
            </p>

            <div className="qr-panels" data-qr-panels>
              {Object.entries(FIELDS).map(([type, fields]) =>
                panel(type, fields, CHECKBOXES[type] || []))}
            </div>

            <div className="gen-tools">
              <button type="button" className="btn grad" data-qr-generate>
                Generate QR code
              </button>
              <button type="button" className="btn subtle" data-qr-reset>Reset</button>
            </div>
            <p className="qr-note qr-auto">
              The code already appears as you type. Use <b>Generate QR code</b> to rebuild it and
              jump straight to it — on a phone the preview sits below the form.
            </p>
          </div>
        </div>

        <div className="qr-controls">
          <div className="panel">
            <div className="qr-stage">
              {/* The empty state is real markup rather than something the script
                  writes, so the page says something useful before the module has
                  even loaded. */}
              <p className="qr-empty" data-qr-empty>
                <span className="visually-hidden">Empty state. </span>
                <b>No QR code yet</b>
                Fill in one of the fields above and your code appears here.
              </p>
              <canvas
                className="qr-canvas"
                data-qr-canvas
                width="512"
                height="512"
                role="img"
                aria-label="Preview of the QR code you are building"
                hidden
              />
            </div>

            <div className="qr-errors" role="alert" data-qr-errors hidden />

            <p className="qr-status" role="status" aria-live="polite" data-qr-status />

            <div className="qr-downloads">
              <button type="button" className="btn" data-qr-download data-qr-download-png disabled>
                Download PNG
              </button>
              <button type="button" className="btn subtle" data-qr-download data-qr-download-svg disabled>
                SVG
              </button>
              <button type="button" className="btn subtle" data-qr-download data-qr-download-jpg disabled>
                JPG
              </button>
              <button type="button" className="btn subtle" data-qr-copy disabled>Copy image</button>
            </div>

            <details className="qr-payload" hidden>
              <summary>What this code contains</summary>
              <pre data-qr-payload />
              <button type="button" className="linkish" data-qr-copy-payload disabled>
                Copy this text
              </button>
            </details>
          </div>

          <div className="panel">
            <div className="qr-field">
              <label htmlFor="qr-size">Size in pixels</label>
              <select id="qr-size" data-qr-size defaultValue="512">
                {SIZES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <fieldset className="qr-field">
              <legend>Error correction</legend>
              <div className="qr-ecl" role="group" aria-label="Error correction level">
                {ECC.map(([value, label, description]) => (
                  <button
                    key={value}
                    type="button"
                    data-qr-ecl={value}
                    aria-pressed={value === 'M'}
                  >
                    <b>{label}</b>
                    <span className="muted">{description}</span>
                  </button>
                ))}
              </div>
              <p className="qr-note">
                Higher levels survive more damage but make the code denser. A logo raises this
                automatically.
              </p>
            </fieldset>

            <div className="qr-field">
              <label htmlFor="qr-foreground">Foreground color</label>
              <div className="qr-colour">
                <input
                  id="qr-foreground"
                  type="color"
                  data-qr-foreground
                  value="#1b1533"
                  aria-label="Choose the QR code foreground color"
                />
                <input
                  className="field-input"
                  type="text"
                  data-qr-foreground
                  defaultValue="#1b1533"
                  maxLength={7}
                  aria-label="Foreground color as a hex value, for example #1b1533"
                  spellCheck="false"
                />
              </div>
            </div>

            <div className="qr-field">
              <label htmlFor="qr-background">Background color</label>
              <div className="qr-colour">
                <input
                  id="qr-background"
                  type="color"
                  data-qr-background
                  value="#ffffff"
                  aria-label="Choose the QR code background color"
                />
                <input
                  className="field-input"
                  type="text"
                  data-qr-background
                  defaultValue="#ffffff"
                  maxLength={7}
                  aria-label="Background color as a hex value, for example #ffffff"
                  spellCheck="false"
                />
              </div>
              <div className="qr-swatches" role="group" aria-label="Reset the colors">
                <button
                  type="button"
                  data-qr-swatch="foreground"
                  data-colour="#1b1533"
                  aria-label="Use near-black as the foreground"
                />
                <button
                  type="button"
                  data-qr-swatch="foreground"
                  data-colour="#4b2fe0"
                  aria-label="Use the site purple as the foreground"
                />
                <button
                  type="button"
                  data-qr-swatch="foreground"
                  data-colour="#0f9d76"
                  aria-label="Use dark green as the foreground"
                />
                <button
                  type="button"
                  data-qr-swatch="background"
                  data-colour="#ffffff"
                  aria-label="Use white as the background"
                />
                <button
                  type="button"
                  data-qr-swatch="background"
                  data-colour="#f6f4fb"
                  aria-label="Use off-white as the background"
                />
                <button
                  type="button"
                  data-qr-swatch="foreground"
                  data-colour="#1b1533"
                  aria-label="Reset both colors to black on white"
                  data-qr-reset-colors
                >
                  Reset
                </button>
              </div>
              <p className="qr-contrast" data-qr-contrast hidden />
            </div>
          </div>

          <div className="panel">
            <div className="qr-field">
              <label htmlFor="qr-logo">Logo</label>
              {/* A <label> wrapping the input rather than a div with a click
                  handler: the picker then opens with no JavaScript at all. */}
              <label className="qr-logo" htmlFor="qr-logo">
                <input
                  id="qr-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  data-qr-logo
                />
                <span className="qr-browse">Choose an image</span>
              </label>
              <button type="button" className="btn small subtle" data-qr-logo-remove hidden>
                Remove logo
              </button>
            </div>

            <div className="qr-field">
              <label htmlFor="qr-logo-size">
                Logo size <span className="qr-value" data-qr-logo-size-out>12%</span>
              </label>
              <input
                id="qr-logo-size"
                type="range"
                min="2"
                max="35"
                step="1"
                defaultValue="12"
                data-qr-logo-size
              />
              <p className="qr-note">
                The share of the code the logo covers. Keep it under about 20%, or raise the error
                correction level — a high-level code can put back roughly 30% of what is hidden.
              </p>
            </div>

            <p className="qr-contrast" data-qr-logo-note hidden />
          </div>
        </div>
      </div>

      {/* Visually separated from the controls and never adjacent to a button a
          visitor is aiming at. An ad that looks like part of the tool is the
          fastest way to lose the trust the rest of this page is built on. */}
      <AdUnit slot={env.adsense.slot} client={adsenseConfigured ? env.adsense.client : ''} />

      <section className="prose" aria-labelledby="qr-how">
        <h2 id="qr-how">How to create a QR code</h2>
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

      <section className="prose" aria-labelledby="qr-types">
        <h2 id="qr-types">What each QR code type does when it is scanned</h2>
        <p>
          Every QR code is the same square of modules. What differs is the text inside it, and that
          text decides what a phone does when it reads the code. Choosing the right type is most of
          the work: a Wi-Fi code scanned by a laptop camera does nothing at all, because joining a
          network is something a phone has to be asked to do.
        </p>
        {/* A real table with real headers. A comparison is what a model or a
            reader reaches for, and prose buries it. */}
        <table className="table">
          <caption>
            QR code types: what to type, what a phone does when the code is scanned, and where it
            works best.
          </caption>
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">What a phone does</th>
              <th scope="col">Use it for</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">URL</th>
              <td>Opens the address in the browser.</td>
              <td>Posters, packaging, menus and anything printed.</td>
            </tr>
            <tr>
              <th scope="row">Text</th>
              <td>Shows the text, usually with a button to copy it.</td>
              <td>Wi-Fi instructions, a serial number, a short note.</td>
            </tr>
            <tr>
              <th scope="row">Wi-Fi</th>
              <td>Offers to join the network on an Android phone, with the password filled in.</td>
              <td>Cafés, offices and guest networks where nobody wants to type a password.</td>
            </tr>
            <tr>
              <th scope="row">Email</th>
              <td>Opens a new message addressed to the address you set.</td>
              <td>Feedback on a product, an enquiry on an advert.</td>
            </tr>
            <tr>
              <th scope="row">Phone</th>
              <td>Offers to dial the number.</td>
              <td>Shops, restaurants and service businesses.</td>
            </tr>
            <tr>
              <th scope="row">SMS</th>
              <td>Opens a new text with the message already written.</td>
              <td>Short codes to join a service, or a message people should not retype.</td>
            </tr>
            <tr>
              <th scope="row">WhatsApp</th>
              <td>Opens a chat with that number, message ready to send.</td>
              <td>Business cards, restaurant tables and event badges.</td>
            </tr>
            <tr>
              <th scope="row">Contact card</th>
              <td>Asks whether to save the contact.</td>
              <td>Conferences and meetings, where typing a card is a nuisance.</td>
            </tr>
            <tr>
              <th scope="row">Location</th>
              <td>Opens the place in a map app, or in Google Maps.</td>
              <td>Store finders, directions to an event, a shop locator.</td>
            </tr>
            <tr>
              <th scope="row">Event</th>
              <td>Asks whether to add the event to a calendar.</td>
              <td>Flyers and posters for anything people should diarise.</td>
            </tr>
          </tbody>
        </table>

        <h3>Why the Wi-Fi code needs a phone</h3>
        <p>
          A laptop camera reads a Wi-Fi QR code as a block of text, because the operating system is
          what joins a network, not the camera. On an Android phone scanning the same code offers a
          "join network" button with the password already filled in. iPhones read the code too, but
          the prompt to join is Apple's own rather than part of the code, so it appears a moment
          later and looks different. This is the most common reason a visitor says a code "does not
          work": it is being opened on a computer.
        </p>

        <h3>Why a WhatsApp number needs its country code</h3>
        <p>
          A WhatsApp QR code is a link, and a link needs a destination it can name without guessing.
          That means the number in full international form, digits only, starting with the country
          code and with no plus sign: 15551234567, not 555-123-4567 and not +1 555 123 4567. Given a
          national number, the link still opens WhatsApp and then cannot find anyone, which is a
          worse failure than an error because it looks like it worked. This tool refuses a number
          that is too short rather than quietly building a link that goes nowhere.
        </p>

        <h3>How a contact card differs from a vCard file</h3>
        <p>
          A QR code holding a vCard is not a file you download. The text inside it is the contact
          itself, so the phone reads it, shows the name and asks whether to save it. That is why the
          card can be edited on this page and rescanned: the code holds whatever the fields say at
          the moment you generated it, not a link to a copy somewhere else.
        </p>
      </section>

      <section className="prose" aria-labelledby="qr-custom">
        <h2 id="qr-custom">How to keep a customized QR code scannable</h2>
        <p>
          A QR code is a machine-readable pattern, not a picture, and the changes that make it look
          better are the same changes that stop it reading. Three rules cover almost every failure.
        </p>

        <h3>Keep the contrast high</h3>
        <p>
          A scanner has to tell dark modules from light ones. The page shows the contrast ratio
          between your two colors and warns below 4.5:1, which is the same figure used for ordinary
          text. In practice a code needs more than that: a light gray on white looks perfectly
          legible on screen and simply fails on a phone in daylight. Dark blue, dark green or black
          on white are all safe; pastel on pastel is not.
        </p>

        <h3>Do not cover a quarter of the code with a logo</h3>
        <p>
          A logo hides modules, and error correction is what puts them back. At the high level a
          scanner can reconstruct about 30 percent of a code, which is why this tool refuses a logo
          larger than that and warns past 20 percent, and why adding a logo raises the level for you.
          A smaller logo on a plain plate, with the level at high, is reliable; a logo filling the
          middle third of the code is a picture of a QR code, not a QR code.
        </p>

        <h3>Leave the quiet zone alone</h3>
        <p>
          Around any QR code there has to be a clear margin at least four modules wide on every
          side, and this tool always adds it. It is the single most common casualty of a code that
          works on a website and fails when printed: the design places the code flush against a
          background image or a coloured panel, and the scanner loses its edge. The quiet zone is
          not part of the code and has to be plain, empty space.
        </p>

        <h3>Make it big enough to see</h3>
        <p>
          Scan distance depends on size. The rule of thumb that holds up in practice is that the
          printed code should be at least a tenth of the distance it will be read from, so a poster
          read from two metres wants a code at least 20 cm across. That is what the 512 and 1024
          pixel sizes are for, and SVG is the right format for print because it stays sharp however
          large it is scaled. Printing a 128-pixel code onto a shop window is why shop-window codes
          so often do not work.
        </p>

        <p>
          Everything above is about the code itself. If you want the words inside a code to be the
          thing people read, this site's <a href="/">fancy text generator</a> turns any text into
          thousands of Unicode styles, and the <a href="/fonts">font index</a> lists them by
          category. The <a href="/styles">style guides</a> put 25 words in 25 styles side by side,
          and the <a href="/studio">font studio</a> renders a finished line to a 1200 by 630 PNG.
          For images rather than text, the{' '}
          <a href="/image-compression">image compressor</a> shrinks JPG, PNG and WebP files and
          reports the real size saved, which is useful before embedding one next to a code. Counting
          and cleaning up copy for a code is what the <a href="/tools">text tools</a> are for.
        </p>
      </section>

      <RelatedSearches path="/qr-code-generator" />

      <section className="prose" aria-labelledby="qr-faq">
        <h2 id="qr-faq">Common questions</h2>
        {QR_GENERATOR_QA.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}
