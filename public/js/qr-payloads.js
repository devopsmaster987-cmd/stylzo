// QR payload builders: one per QR type, each returning the text a scanner reads.
//
// Every builder is a pure function of the fields below and returns
// `{ text, error }`. An error is a plain sentence meant to be shown under the
// field that caused it, so the wording here is UI copy as much as it is logic.
//
// Nothing here touches the DOM or the network. A Wi-Fi password, a phone number
// and a contact card are all just strings until they reach this file, and they
// stop here: there is no code path in this project that could send one of them
// anywhere.

// The standard's escaping rules, applied where a field is embedded in a
// semicolon-delimited or backslash-delimited payload.
//
// Wi-Fi: the SSID and password are separated by ';' and the special characters
// are '\', ';', ',' and '"'. An unescaped ';' in a network name truncates the
// password silently on some readers and misreads it on others.
const escapeWifi = (value) => String(value)
  .replace(/([\\;,":])/g, '\\$1');

// vCard and iCalendar escape a backslash, a comma and a semicolon, and a newline
// becomes a literal \n. A raw newline would terminate the line and produce a
// contact card half of which is discarded.
const escapeCal = (value) => String(value)
  .replace(/\\/g, '\\\\')
  .replace(/\r\n|\r|\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

/**
 * Fold a content line to the 75-octet limit the iCalendar format requires.
 *
 * Folding inserts CRLF followed by a single space. The space is part of the
 * encoding, so the limit is 75 octets *including* the space — an off-by-one here
 * is the difference between a line that every reader accepts and one that a
 * strict parser rejects.
 */
function foldLine(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let start = 0;
  let limit = 75;
  while (start < line.length) {
    let end = Math.min(line.length, start + limit);
    // Never split a multi-byte character: walk back to a boundary.
    while (end < line.length && new TextEncoder().encode(line.slice(start, end)).length > limit) {
      end -= 1;
    }
    out.push(line.slice(start, end));
    start = end;
    limit = 74; // subsequent lines carry a leading space
  }
  return out.join('\r\n ');
}

/** Only characters a URL or a mail address can actually hold. */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

const clean = (value) => String(value ?? '').trim();
const digitsOnly = (value) => String(value ?? '').replace(/[^\d+]/g, '');

/**
 * Normalise a typed web address into something a scanner can act on.
 *
 * A visitor typing "example.com" means https://example.com, and a QR holding
 * "example.com" is read by most scanners as a search term rather than a link —
 * so the scheme is added. Any scheme the visitor did type is left alone, except
 * that javascript: and data: are refused: they would put an executable URL in
 * front of anyone who scanned it.
 */
function normaliseUrl(raw) {
  const value = clean(raw);
  if (!value) return { text: '', error: 'Enter a web address.' };

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;

  let parsed;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { text: '', error: 'That is not a web address a scanner can open.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    if (/^(javascript|data|vbscript|file|blob):/i.test(withScheme)) {
      return { text: '', error: 'Only http and https addresses can go in a QR code.' };
    }
    return {
      text: '',
      error: `A ${parsed.protocol.replace(':', '')} link will not open as a web address. Use the matching QR type instead.`,
    };
  }
  if (!parsed.hostname.includes('.')) {
    return { text: '', error: 'Enter a full address, for example example.com.' };
  }
  return { text: parsed.toString(), error: '' };
}

// ---- Builders ----------------------------------------------------------------

export const TYPES = [
  { id: 'url', label: 'URL', blurb: 'A website or any link' },
  { id: 'text', label: 'Text', blurb: 'Any plain message' },
  { id: 'wifi', label: 'Wi-Fi', blurb: 'Join a network by scanning' },
  { id: 'email', label: 'Email', blurb: 'Start a new message' },
  { id: 'phone', label: 'Phone', blurb: 'Dial a number' },
  { id: 'sms', label: 'SMS', blurb: 'Open a text with a message' },
  { id: 'whatsapp', label: 'WhatsApp', blurb: 'Start a chat' },
  { id: 'vcard', label: 'Contact', blurb: 'Save a contact card' },
  { id: 'location', label: 'Location', blurb: 'Open a place on a map' },
  { id: 'event', label: 'Event', blurb: 'Add to a calendar' },
];

/** Which fields each type shows. `name` is the key in the form state. */
export const FIELDS = {
  url: ['url'],
  text: ['text'],
  wifi: ['ssid', 'wifiSecurity', 'password', 'wifiHidden'],
  email: ['emailAddress', 'emailSubject', 'emailBody'],
  phone: ['phoneNumber'],
  sms: ['phoneNumber', 'smsBody'],
  whatsapp: ['phoneNumber', 'whatsappMessage'],
  vcard: ['vFirst', 'vLast', 'vOrg', 'vTitle', 'vPhone', 'vEmail', 'vUrl', 'vAddress', 'vNote'],
  location: ['latitude', 'longitude', 'locationLabel', 'mapsProvider'],
  event: ['eventSummary', 'eventLocation', 'eventStart', 'eventEnd', 'eventDescription'],
};

/**
 * Wi-Fi payload.
 *
 * The format is `WIFI:T:<security>;S:<ssid>;P:<password>;H:<hidden>;;` — the
 * trailing double semicolon is required, not decorative, and a payload without it
 * is rejected outright by several readers. The `H:` field is omitted entirely
 * when false rather than written as `H:false`, which is not what the spec says.
 */
function buildWifi(f) {
  const ssid = clean(f.ssid);
  if (!ssid) return { text: '', error: 'Enter the network name (SSID).' };
  if (ssid.length > 32) return { text: '', error: 'A network name is 32 characters at most.' };

  const security = clean(f.wifiSecurity) || 'WPA';
  const password = String(f.password ?? '');
  if (security !== 'nopass' && !password) {
    return { text: '', error: 'Enter the network password, or set security to "No password".' };
  }
  if (security !== 'nopass' && (password.length < 8 || password.length > 63)) {
    // WPA's PSK is 8 to 63 characters. Saying so here beats a code that scans
    // and then fails to join the network.
    return { text: '', error: 'A WPA password is 8 to 63 characters.' };
  }

  const segments = [
    'WIFI:',
    `T:${security};`,
    `S:${escapeWifi(ssid)};`,
    // No P field at all for an open network: writing an empty one makes some
    // readers prompt for a password that does not exist.
    ...(security === 'nopass' ? [] : [`P:${escapeWifi(password)};`]),
    ...(f.wifiHidden ? ['H:true;'] : []),
  ];
  // Every field above ends in a semicolon; the payload needs one more to close
  // the last field. Several readers reject the payload outright without it.
  return { text: `${segments.join('')};`, error: '' };
}

function buildEmail(f) {
  const address = clean(f.emailAddress);
  if (!address) return { text: '', error: 'Enter an email address.' };
  if (!EMAIL_RE.test(address)) return { text: '', error: 'That email address is not complete.' };

  const params = new URLSearchParams();
  if (clean(f.emailSubject)) params.set('subject', clean(f.emailSubject));
  if (clean(f.emailBody)) params.set('body', clean(f.emailBody));
  const query = params.toString();
  return { text: `mailto:${address}${query ? `?${query}` : ''}`, error: '' };
}

/**
 * Phone payload.
 *
 * Just `tel:` and the number. There is no room for a message or a label here:
 * RFC 3966 allows parameters, but dialers ignore them, so a "note" field would
 * be a control that appears to do something and does not.
 */
function buildPhone(f) {
  const number = digitsOnly(f.phoneNumber);
  if (!clean(f.phoneNumber)) return { text: '', error: 'Enter a phone number.' };
  if (number.replace(/\D/g, '').length < 5) {
    return { text: '', error: 'Enter a full phone number, including the area code.' };
  }
  return { text: `tel:${number}`, error: '' };
}

/**
 * SMS payload.
 *
 * `sms:<number>?body=` is what Android writes. iOS wants an empty `&` before
 * `body`, which `?&body=` satisfies, and current iOS releases accept that form
 * too — so one payload covers both rather than asking the visitor to pick a
 * phone brand.
 */
function buildSms(f) {
  const number = digitsOnly(f.phoneNumber);
  if (!clean(f.phoneNumber)) return { text: '', error: 'Enter a phone number.' };
  if (number.replace(/\D/g, '').length < 5) {
    return { text: '', error: 'Enter a full phone number, including the area code.' };
  }
  const body = clean(f.smsBody);
  return { text: `sms:${number}?&body=${encodeURIComponent(body)}`, error: '' };
}

/**
 * WhatsApp payload.
 *
 * wa.me takes the number in full international form with no +, no spaces and no
 * leading zero, and the message goes in `text`. A national-format number
 * produces a link that opens WhatsApp and then fails to find the contact, which
 * is the single most common WhatsApp QR mistake.
 */
function buildWhatsApp(f) {
  const raw = clean(f.phoneNumber);
  if (!raw) return { text: '', error: 'Enter a phone number with its country code.' };
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8) {
    return {
      text: '',
      error: 'Enter the full number with its country code, for example 15551234567.',
    };
  }
  const message = clean(f.whatsappMessage);
  return {
    text: `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`,
    error: '',
  };
}

/** A date as the iCalendar `YYYYMMDDTHHMMSS` form, in the browser's own timezone. */
function icalDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  // A floating local time, deliberately with no Z or offset: an event at 6pm is
  // 6pm wherever it is read, and adding a zone would move it for half the world.
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`
    + `T${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
}

function buildVCard(f) {
  const first = clean(f.vFirst);
  const last = clean(f.vLast);
  if (!first && !last) {
    return { text: '', error: 'Enter at least a first or last name.' };
  }
  if (!EMAIL_RE.test(clean(f.vEmail)) && clean(f.vEmail)) {
    return { text: '', error: 'That contact email address is not complete.' };
  }

  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push(`N:${escapeCal(last)};${escapeCal(first)};;;`);
  // FN is mandatory and is what every contact app actually displays, so it is
  // written out rather than left for the reader to derive from N.
  lines.push(`FN:${escapeCal([first, last].filter(Boolean).join(' '))}`);
  if (clean(f.vOrg)) lines.push(`ORG:${escapeCal(clean(f.vOrg))}`);
  if (clean(f.vTitle)) lines.push(`TITLE:${escapeCal(clean(f.vTitle))}`);
  if (clean(f.vPhone)) lines.push(`TEL;TYPE=CELL:${digitsOnly(f.vPhone)}`);
  if (clean(f.vEmail)) lines.push(`EMAIL;TYPE=INTERNET:${clean(f.vEmail)}`);
  if (clean(f.vUrl)) {
    const { text, error } = normaliseUrl(f.vUrl);
    if (error) return { text: '', error: `Website: ${error}` };
    lines.push(`URL:${text}`);
  }
  if (clean(f.vAddress)) lines.push(`ADR;TYPE=WORK:;;${escapeCal(clean(f.vAddress))};;;;`);
  if (clean(f.vNote)) lines.push(`NOTE:${escapeCal(clean(f.vNote))}`);
  lines.push('END:VCARD');

  return { text: lines.map(foldLine).join('\r\n'), error: '' };
}

function buildLocation(f) {
  const lat = Number(clean(f.latitude));
  const lng = Number(clean(f.longitude));
  if (clean(f.latitude) === '') return { text: '', error: 'Enter a latitude.' };
  if (clean(f.longitude) === '') return { text: '', error: 'Enter a longitude.' };
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { text: '', error: 'Latitude is a number between -90 and 90.' };
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { text: '', error: 'Longitude is a number between -180 and 180.' };
  }

  const label = clean(f.locationLabel);
  if (f.mapsProvider === 'google') {
    const query = label ? encodeURIComponent(label) : `${lat},${lng}`;
    // api=1 is the documented, stable entry point. The old /maps?q= form still
    // works but is not what Google documents and is not guaranteed to.
    return { text: `https://www.google.com/maps/search/?api=1&query=${query}`, error: '' };
  }
  const q = label ? `?q=${lat},${lng}(${encodeURIComponent(label)})` : '';
  return { text: `geo:${lat},${lng}${q}`, error: '' };
}

const EVENT_STAMP_RE = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/;

function toBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  const normalised = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalised + '='.repeat((4 - (normalised.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function parseEventStamp(value) {
  const match = EVENT_STAMP_RE.exec(String(value || ''));
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
    || date.getUTCHours() !== hour
    || date.getUTCMinutes() !== minute
    || date.getUTCSeconds() !== second
  ) return null;
  return date;
}

export function encodeEventData(event) {
  const data = { v: 1, s: clean(event.summary), a: clean(event.start) };
  if (clean(event.location)) data.l = clean(event.location);
  if (clean(event.end)) data.b = clean(event.end);
  if (clean(event.description)) data.d = clean(event.description);
  return toBase64Url(JSON.stringify(data));
}

export function decodeEventData(encoded) {
  if (typeof encoded !== 'string' || !encoded || encoded.length > 20000) return null;
  try {
    const data = JSON.parse(fromBase64Url(encoded));
    if (!data || data.v !== 1 || typeof data.s !== 'string' || !clean(data.s)) return null;
    if (!parseEventStamp(data.a)) return null;
    if (data.b !== undefined && !parseEventStamp(data.b)) return null;
    return {
      summary: data.s,
      location: typeof data.l === 'string' ? data.l : '',
      start: data.a,
      end: typeof data.b === 'string' ? data.b : '',
      description: typeof data.d === 'string' ? data.d : '',
    };
  } catch {
    return null;
  }
}

export function buildEventIcs(event) {
  if (!event || typeof event.summary !== 'string' || !clean(event.summary)) return '';
  if (!parseEventStamp(event.start)) return '';

  const summary = clean(event.summary);
  const uid = `${event.start}-${Math.abs(hashString(summary))}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stylzo//QR Code Generator//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@stylzo`,
    `DTSTAMP:${event.start}`,
    `DTSTART:${event.start}`,
    ...(parseEventStamp(event.end) ? [`DTEND:${event.end}`] : []),
    `SUMMARY:${escapeCal(summary)}`,
    ...(clean(event.location) ? [`LOCATION:${escapeCal(clean(event.location))}`] : []),
    ...(clean(event.description) ? [`DESCRIPTION:${escapeCal(clean(event.description))}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.map(foldLine).join('\r\n');
}

function buildEvent(f, context) {
  const summary = clean(f.eventSummary);
  if (!summary) return { text: '', error: 'Give the event a name.' };

  const start = clean(f.eventStart);
  const end = clean(f.eventEnd);
  if (!start) return { text: '', error: 'Choose a start date and time.' };

  const dtStart = icalDate(start);
  if (!dtStart) return { text: '', error: 'That start date could not be read.' };
  let dtEnd = '';
  if (end) {
    dtEnd = icalDate(end);
    if (!dtEnd) return { text: '', error: 'That end date could not be read.' };
    if (new Date(end) < new Date(start)) {
      return { text: '', error: 'The event ends before it starts.' };
    }
  }

  const baseUrl = clean(context && context.baseUrl).replace(/\/+$/, '');
  if (!baseUrl) return { text: '', error: 'The event page address is not available.' };

  const encoded = encodeEventData({
    summary,
    location: clean(f.eventLocation),
    start: dtStart,
    end: dtEnd,
    description: clean(f.eventDescription),
  });

  return { text: `${baseUrl}/event#${encoded}`, error: '' };
}

/** A small non-cryptographic hash, only to make the event UID stable. */
function hashString(value) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = ((h << 5) - h + value.charCodeAt(i)) | 0;
  }
  return h;
}

const BUILDERS = {
  url: (f) => normaliseUrl(f.url),
  text: (f) => {
    const value = String(f.text ?? '');
    if (!clean(value)) return { text: '', error: 'Enter the text to encode.' };
    return { text: value, error: '' };
  },
  wifi: buildWifi,
  email: buildEmail,
  phone: buildPhone,
  sms: buildSms,
  whatsapp: buildWhatsApp,
  vcard: buildVCard,
  location: buildLocation,
  event: buildEvent,
};

/**
 * Build the payload for one type.
 *
 * Returns `{ text, error }` and never throws: an unknown type and a builder that
 * fails are both reported as a message the page can display, because an
 * exception here would take the preview down with it.
 */
export function buildPayload(type, fields, context) {
  const builder = BUILDERS[type];
  if (!builder) return { text: '', error: 'That QR code type is not available.' };
  try {
    const result = builder(fields || {}, context);
    return { text: result.text, error: result.error || '' };
  } catch {
    // A builder that throws has a bug, but the visitor still needs a usable page.
    return { text: '', error: 'This value could not be turned into a QR code.' };
  }
}

/** Fields a type does not use, so a reset can clear them too. */
export function fieldsFor(type) {
  return FIELDS[type] || [];
}

export const WIFI_SECURITY = [
  ['WPA', 'WPA / WPA2 / WPA3'],
  ['WEP', 'WEP'],
  ['nopass', 'No password'],
];

export const MAPS_PROVIDER = [
  ['geo', 'Any maps app (geo:)'],
  ['google', 'Google Maps'],
];
