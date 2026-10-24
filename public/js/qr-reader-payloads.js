// Turn the text inside a QR code into the details a person actually wants:
// a phone number, an email address, a Wi-Fi login, a contact card, a link, a
// location or an event.
//
// The decoder (jsQR) only returns the raw payload. Everything that makes the
// result useful lives here. Kept free of DOM and network access so the same file
// can run under `node --test` and in the browser.
//
// Payload formats are read from their published specs rather than guessed:
// vCard 3.0/4.0, MECARD, the WIFI: scheme, mailto:, tel:, SMS, geo: and iCalendar
// VEVENT. Anything unrecognised is returned as plain text, never dropped.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d][\d\s().-]{5,}$/;
const URL_SCHEME = /^(https?|ftp):\/\//i;

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function decodeQuotedPrintable(value) {
  const withoutBreaks = String(value).replace(/=\r?\n/g, '');
  const bytes = [];
  for (let i = 0; i < withoutBreaks.length; i += 1) {
    const ch = withoutBreaks[i];
    const hex = withoutBreaks.slice(i + 1, i + 3);
    if (ch === '=' && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      const code = ch.codePointAt(0);
      if (code < 0x80) {
        bytes.push(code);
      } else {
        for (const byte of new TextEncoder().encode(ch)) bytes.push(byte);
      }
    }
  }
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
  } catch {
    return withoutBreaks;
  }
}

function unescapeText(value) {
  return String(value)
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** Split a vCard/iCalendar property line at the first unquoted colon. */
function splitProperty(line) {
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') quoted = !quoted;
    else if (ch === ':' && !quoted) return [line.slice(0, i), line.slice(i + 1)];
  }
  return [line, ''];
}

/** Unfold a vCard/iCalendar body: soft quoted-printable breaks, then folded lines. */
function unfold(text) {
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/=\n/g, '')
    .replace(/\n[ \t]/g, '');
}

function lineProperties(text) {
  const out = [];
  for (const line of unfold(text).split('\n')) {
    if (!line.trim()) continue;
    const [head, rawValue] = splitProperty(line);
    const parts = head.split(';');
    const key = parts[0].toUpperCase();
    const params = {};
    for (const part of parts.slice(1)) {
      const eq = part.indexOf('=');
      if (eq > 0) {
        params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, '');
      }
    }
    let value = rawValue;
    if ((params.ENCODING || '').toUpperCase() === 'QUOTED-PRINTABLE') value = decodeQuotedPrintable(value);
    out.push([key, unescapeText(value), params]);
  }
  return out;
}

/** Parse a WIFI:/MECARD: style body into unescaped key/value pairs. */
function delimitedPairs(body, pairSep = ':', itemSep = ';') {
  const pairs = [];
  let key = '';
  let value = '';
  let inValue = false;
  let escaped = false;

  const push = () => {
    if (key || value) pairs.push([key.trim().toUpperCase(), value]);
    key = '';
    value = '';
    inValue = false;
  };

  for (const ch of body) {
    if (escaped) {
      if (inValue) value += ch;
      else key += ch;
      escaped = false;
    } else if (ch === '\\') {
      escaped = true;
    } else if (!inValue && ch === pairSep) {
      inValue = true;
    } else if (ch === itemSep) {
      push();
    } else if (inValue) {
      value += ch;
    } else {
      key += ch;
    }
  }
  push();
  return pairs;
}

function personName(value) {
  const parts = String(value).split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts.slice(1).join(' ')} ${parts[0]}`.trim();
  return value.trim();
}

function address(value) {
  const parts = String(value).split(';').map((s) => s.trim()).filter(Boolean);
  return parts.join(', ');
}

function addField(fields, label, value, href) {
  const text = String(value || '').trim();
  if (!text) return;
  if (fields.some((f) => f.label === label && f.value === text)) return;
  fields.push(href ? { label, value: text, href } : { label, value: text });
}

function parseVCard(text) {
  const fields = [];
  const lines = lineProperties(text);

  const names = [];
  const org = [];
  const titles = [];
  const phones = [];
  const emails = [];
  const urls = [];
  const addresses = [];
  const notes = [];
  const birthdays = [];

  for (const [key, value] of lines) {
    const bare = key.split('.').pop();
    if (bare === 'FN') names.unshift(value);
    else if (bare === 'N') names.push(personName(value.replace(/;/g, ',')));
    else if (bare === 'ORG') org.push(value.replace(/;/g, ' '));
    else if (bare === 'TITLE') titles.push(value);
    else if (bare === 'TEL') phones.push({ value, params: {} });
    else if (bare === 'EMAIL') emails.push(value);
    else if (bare === 'URL') urls.push(value);
    else if (bare === 'ADR') addresses.push(address(value));
    else if (bare === 'NOTE') notes.push(value);
    else if (bare === 'BDAY') birthdays.push(value);
  }

  // Re-read phones with their TYPE so a mobile can be labelled as one.
  for (const [key, value, params] of lines) {
    if (key.split('.').pop() !== 'TEL') continue;
    const slot = phones.find((p) => p.value === value);
    if (slot) slot.params = params;
  }

  if (names.length) addField(fields, 'Name', names[0]);
  for (const value of org) addField(fields, 'Organisation', value);
  for (const value of titles) addField(fields, 'Job title', value);
  for (const phone of phones) {
    const type = (phone.params.TYPE || '').toUpperCase();
    addField(fields, /CELL|MOBILE/.test(type) ? 'Mobile' : /FAX/.test(type) ? 'Fax' : 'Phone', phone.value);
  }
  for (const value of emails) addField(fields, 'Email', value);
  for (const value of urls) addField(fields, 'Website', value, safeHref(value));
  for (const value of addresses) addField(fields, 'Address', value);
  for (const value of birthdays) addField(fields, 'Birthday', value);
  for (const value of notes) addField(fields, 'Note', value);

  return finish('vcard', 'Contact card', fields, text);
}

function parseMecard(text) {
  const fields = [];
  const body = text.slice(text.indexOf(':') + 1).trim();
  for (const [key, value] of delimitedPairs(body)) {
    if (key === 'N') addField(fields, 'Name', personName(value));
    else if (key === 'TEL' || key.startsWith('TEL')) addField(fields, 'Phone', value);
    else if (key === 'EMAIL') addField(fields, 'Email', value);
    else if (key === 'URL') addField(fields, 'Website', value, safeHref(value));
    else if (key === 'ADR') addField(fields, 'Address', address(value));
    else if (key === 'ORG') addField(fields, 'Organisation', value);
    else if (key === 'NOTE') addField(fields, 'Note', value);
    else if (key === 'BDAY') addField(fields, 'Birthday', value);
  }
  return finish('mecard', 'Contact card', fields, text);
}

function parseWifi(text) {
  const fields = [];
  const body = text.slice(text.indexOf(':') + 1);
  let security = '';
  let password = '';
  let hidden = false;

  for (const [key, value] of delimitedPairs(body)) {
    if (key === 'S') addField(fields, 'Network name', value);
    else if (key === 'P') password = value;
    else if (key === 'T') security = value;
    else if (key === 'H') hidden = /^(true|1|yes)$/i.test(value);
  }

  if (security) addField(fields, 'Security', /^nopass$/i.test(security) ? 'Open — no password' : security);
  addField(fields, 'Password', password);
  if (hidden) addField(fields, 'Hidden network', 'Yes');

  return finish('wifi', 'Wi-Fi network', fields, text);
}

function parseMailto(text) {
  const fields = [];
  const rest = text.slice(text.indexOf(':') + 1);
  const question = rest.indexOf('?');
  const addressPart = question >= 0 ? rest.slice(0, question) : rest;
  const query = question >= 0 ? rest.slice(question + 1) : '';
  const params = new URLSearchParams(query);

  const recipients = safeDecode(addressPart).split(',').map((s) => s.trim()).filter(Boolean);
  addField(fields, 'Email address', recipients.join(', '));
  addField(fields, 'Subject', params.get('subject'));
  addField(fields, 'Message', params.get('body'));
  addField(fields, 'CC', params.get('cc'));
  addField(fields, 'BCC', params.get('bcc'));

  return finish('email', 'Email address', fields, text);
}

function parseTel(text) {
  const fields = [];
  const rest = text.slice(text.indexOf(':') + 1).split('?')[0];
  addField(fields, 'Phone number', safeDecode(rest));
  return finish('phone', 'Phone number', fields, text);
}

function parseSms(text) {
  const fields = [];
  const lower = text.toLowerCase();
  let rest;
  let message = '';

  if (lower.startsWith('smsto:')) {
    rest = text.slice(6);
    const colon = rest.indexOf(':');
    if (colon >= 0) {
      message = rest.slice(colon + 1);
      rest = rest.slice(0, colon);
    }
  } else {
    rest = text.slice(4);
    const question = rest.indexOf('?');
    if (question >= 0) {
      message = new URLSearchParams(rest.slice(question + 1)).get('body') || '';
      rest = rest.slice(0, question);
    } else {
      const colon = rest.indexOf(':');
      if (colon >= 0) {
        message = rest.slice(colon + 1);
        rest = rest.slice(0, colon);
      }
    }
  }

  addField(fields, 'Phone number', safeDecode(rest));
  addField(fields, 'Message', safeDecode(message));
  return finish('sms', 'SMS message', fields, text);
}

function parseGeo(text) {
  const fields = [];
  const rest = text.slice(4);
  const question = rest.indexOf('?');
  const coords = question >= 0 ? rest.slice(0, question) : rest;
  const params = new URLSearchParams(question >= 0 ? rest.slice(question + 1) : '');
  const [lat, lng] = coords.split(',').map((s) => s.trim());

  const place = params.get('q') || params.get('ll') || '';
  const label = params.get('z') ? `Zoom ${params.get('z')}` : '';

  if (place) {
    addField(fields, 'Place', place);
  }
  if (lat && lng && !(lat === '0' && lng === '0')) {
    addField(fields, 'Latitude', lat);
    addField(fields, 'Longitude', lng);
  }
  addField(fields, 'Map view', label);

  const query = place || (lat && lng ? `${lat},${lng}` : '');
  if (query) {
    fields.push({
      label: 'Open in maps',
      value: query,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    });
  }

  return finish('geo', 'Map location', fields, text);
}

function parseIcalDate(value) {
  const match = String(value).match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?(Z)?$/);
  if (!match) return value;
  const [, year, month, day, hour, minute, second, utc] = match;
  if (!hour) return `${year}-${month}-${day}`;
  return `${year}-${month}-${day} ${hour}:${minute}:${second}${utc ? ' UTC' : ''}`;
}

function parseVEvent(text) {
  const fields = [];
  const values = new Map();
  for (const [key, value] of lineProperties(text)) {
    if (!values.has(key)) values.set(key, value);
  }

  addField(fields, 'Event', values.get('SUMMARY'));
  addField(fields, 'Location', values.get('LOCATION'));
  addField(fields, 'Starts', parseIcalDate(values.get('DTSTART') || ''));
  addField(fields, 'Ends', parseIcalDate(values.get('DTEND') || ''));
  addField(fields, 'Organiser', values.get('ORGANIZER'));
  addField(fields, 'Description', values.get('DESCRIPTION'));
  addField(fields, 'Website', values.get('URL'), safeHref(values.get('URL') || ''));

  return finish('event', 'Calendar event', fields, text);
}

function safeHref(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const candidate = /^www\./i.test(text) ? `https://${text}` : text;
  if (!/^(https?|ftp):\/\//i.test(candidate)) return '';
  try {
    new URL(candidate);
    return candidate;
  } catch {
    return '';
  }
}

function isUrl(value) {
  return URL_SCHEME.test(value) || /^www\.[^\s]+\.[^\s]+$/i.test(value);
}

function finish(type, label, fields, raw) {
  return { type, label, fields, raw: String(raw) };
}

/**
 * Read any QR payload into a labelled set of fields.
 *
 * @param {string} raw the exact text the decoder returned
 * @returns {{type: string, label: string, fields: {label: string, value: string, href?: string}[], raw: string}}
 */
export function parseQrPayload(raw) {
  const text = String(raw == null ? '' : raw).trim();
  if (!text) return finish('empty', 'Empty code', [], text);

  const upper = text.toUpperCase();
  if (upper.startsWith('BEGIN:VCARD')) return parseVCard(text);
  if (upper.startsWith('MECARD:')) return parseMecard(text);
  if (upper.startsWith('BEGIN:VEVENT')) return parseVEvent(text);
  if (upper.startsWith('WIFI:')) return parseWifi(text);
  if (upper.startsWith('MAILTO:')) return parseMailto(text);
  if (upper.startsWith('TEL:')) return parseTel(text);
  if (upper.startsWith('SMSTO:') || upper.startsWith('SMS:')) return parseSms(text);
  if (upper.startsWith('GEO:')) return parseGeo(text);

  if (isUrl(text)) {
    const href = safeHref(text);
    return finish('url', 'Website link', [{ label: 'Website', value: text, href }], text);
  }

  if (EMAIL.test(text)) {
    return finish('email', 'Email address', [{ label: 'Email address', value: text }], text);
  }

  const digits = text.replace(/\D/g, '');
  if (PHONE.test(text) && digits.length >= 6) {
    return finish('phone', 'Phone number', [{ label: 'Phone number', value: text }], text);
  }

  return finish('text', 'Plain text', [{ label: 'Text', value: text }], text);
}

/** The text a "copy everything" button should produce for one code. */
export function formatQrDetails(result) {
  if (!result) return '';
  if (result.type === 'text') return result.raw;
  if (!result.fields.length) return result.raw;
  return result.fields.map((field) => `${field.label}: ${field.value}`).join('\n');
}
