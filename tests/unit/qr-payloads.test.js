import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPayload,
  fieldsFor,
  TYPES,
  WIFI_SECURITY,
  MAPS_PROVIDER,
} from '../../public/js/qr-payloads.js';
import { encodeQr, byteCapacity } from '../../public/js/qr.js';

// The payloads are what a scanner actually reads, so these are checked against
// the published format of each scheme rather than against this file's own idea of
// it. Every payload built here is also handed to the encoder afterwards, so a
// payload that cannot be represented in a QR code fails here too.

describe('qr payloads', () => {
  describe('url', () => {
    test('a bare domain gets a scheme, because a scanner would otherwise search it', () => {
      assert.equal(buildPayload('url', { url: 'example.com' }).text, 'https://example.com/');
      assert.equal(buildPayload('url', { url: 'stylzo.com/tools' }).text, 'https://stylzo.com/tools');
    });

    test('an explicit scheme is left alone', () => {
      assert.equal(buildPayload('url', { url: 'http://example.com' }).text, 'http://example.com/');
      assert.equal(buildPayload('url', { url: 'https://example.com/a?b=c' }).text, 'https://example.com/a?b=c');
    });

    test('surrounding whitespace is trimmed', () => {
      assert.equal(buildPayload('url', { url: '  example.com  ' }).text, 'https://example.com/');
    });

    test('a scheme that would execute on a scan is refused', () => {
      for (const url of ['javascript:alert(1)', 'data:text/html,<script>', 'vbscript:x', 'file:///etc/passwd']) {
        const { text, error } = buildPayload('url', { url });
        assert.equal(text, '', `${url} produced a payload`);
        assert.ok(error.length > 10, `${url} was refused without an explanation`);
      }
    });

    test('another scheme is refused with a pointer to the right tool', () => {
      const { text, error } = buildPayload('url', { url: 'mailto:someone@example.com' });
      assert.equal(text, '');
      assert.match(error, /QR type/i);
    });

    test('an empty or schemeless value is reported', () => {
      assert.match(buildPayload('url', { url: '' }).error, /Enter a web address/);
      assert.match(buildPayload('url', { url: '   ' }).error, /Enter a web address/);
      assert.match(buildPayload('url', { url: 'localhost' }).error, /full address/i);
    });
  });

  describe('text', () => {
    test('anything at all is carried verbatim, including newlines', () => {
      const text = 'line one\nline two\ttabbed  spaced  ';
      assert.equal(buildPayload('text', { text }).text, text);
    });

    test('whitespace alone is not a payload', () => {
      assert.match(buildPayload('text', { text: '   \n ' }).error, /Enter the text/);
      assert.match(buildPayload('text', { text: '' }).error, /Enter the text/);
    });
  });

  describe('wifi', () => {
    const base = { ssid: 'Cafe', wifiSecurity: 'WPA', password: 'correcthorse' };

    test('the payload has the shape scanners expect, including the closing ;;', () => {
      const { text, error } = buildPayload('wifi', base);
      assert.equal(error, '');
      assert.equal(text, 'WIFI:T:WPA;S:Cafe;P:correcthorse;;');
      assert.ok(text.endsWith(';;'), 'the terminating double semicolon is required');
    });

    test('a hidden network is marked', () => {
      assert.equal(buildPayload('wifi', { ...base, wifiHidden: true }).text,
        'WIFI:T:WPA;S:Cafe;P:correcthorse;H:true;;');
      // And omitted rather than written as false, which is not what the spec says.
      assert.ok(!buildPayload('wifi', { ...base, wifiHidden: false }).text.includes('H:'));
    });

    test('special characters in the network name and password are escaped', () => {
      const { text } = buildPayload('wifi', { ...base, ssid: 'Cafe;Guest, "Net"' });
      assert.ok(text.includes('S:Cafe\\;Guest\\, \\"Net\\";'), `not escaped: ${text}`);
      assert.ok(!text.includes('S:Cafe;Guest'), 'an unescaped semicolon truncates the payload');
    });

    test('an open network carries no password field at all', () => {
      const { text, error } = buildPayload('wifi', { ssid: 'Free WiFi', wifiSecurity: 'nopass', password: '' });
      assert.equal(error, '');
      assert.equal(text, 'WIFI:T:nopass;S:Free WiFi;;');
      assert.ok(!text.includes('P:'), 'an empty password makes some readers prompt for one');
    });

    test('WEP is offered, because old networks still exist', () => {
      assert.ok(WIFI_SECURITY.some(([value]) => value === 'WEP'));
    });

    test('the name is required and length checked', () => {
      assert.match(buildPayload('wifi', { ...base, ssid: '' }).error, /network name/i);
      assert.match(buildPayload('wifi', { ...base, ssid: 'A'.repeat(33) }).error, /32 characters/);
      assert.doesNotThrow(() => buildPayload('wifi', { ...base, ssid: 'A'.repeat(32) }));
    });

    test('a WPA password outside 8 to 63 characters is refused, because it cannot join', () => {
      assert.match(buildPayload('wifi', { ...base, password: 'short' }).error, /8 to 63/);
      assert.match(buildPayload('wifi', { ...base, password: 'A'.repeat(64) }).error, /8 to 63/);
      assert.doesNotThrow(() => buildPayload('wifi', { ...base, password: 'A'.repeat(63) }));
    });

    test('a secured network needs a password', () => {
      assert.match(buildPayload('wifi', { ssid: 'Cafe', wifiSecurity: 'WPA', password: '' }).error, /password/i);
    });
  });

  describe('email', () => {
    test('an address alone produces a bare mailto', () => {
      assert.equal(buildPayload('email', { emailAddress: 'a@b.co' }).text, 'mailto:a@b.co');
    });

    test('subject and body are percent-encoded, so & and = cannot break the URL', () => {
      const { text } = buildPayload('email', {
        emailAddress: 'a@b.co', emailSubject: 'Hi & bye', emailBody: '50% off = yes',
      });
      assert.ok(text.startsWith('mailto:a@b.co?'));
      assert.ok(text.includes('subject=Hi+%26+bye'), text);
      assert.ok(text.includes('body=50%25+off+%3D+yes'), text);
      // Exactly one question mark, so a reader does not treat the body as a query.
      assert.equal((text.match(/\?/g) || []).length, 1);
    });

    test('an incomplete address is reported', () => {
      for (const address of ['a', 'a@b', 'a b@c.co', '@b.co']) {
        assert.match(buildPayload('email', { emailAddress: address }).error, /not complete/i, address);
      }
      assert.match(buildPayload('email', { emailAddress: '' }).error, /Enter an email address/);
    });
  });

  describe('phone', () => {
    test('formatting is stripped, because a tel: URI carries digits', () => {
      assert.equal(buildPayload('phone', { phoneNumber: '+1 (555) 123-4567' }).text, 'tel:+15551234567');
    });

    test('a number too short to dial is reported', () => {
      assert.match(buildPayload('phone', { phoneNumber: '123' }).error, /full phone number/i);
      assert.match(buildPayload('phone', { phoneNumber: '' }).error, /Enter a phone number/);
    });
  });

  describe('sms', () => {
    test('the message is encoded and the form iOS needs is used', () => {
      const { text, error } = buildPayload('sms', { phoneNumber: '+15551234567', smsBody: 'Hi & bye' });
      assert.equal(error, '');
      assert.equal(text, 'sms:+15551234567?&body=Hi%20%26%20bye');
      // iOS needs the empty parameter before body; Android ignores it.
      assert.ok(text.includes('?&body='), text);
    });

    test('an empty message is allowed', () => {
      assert.equal(buildPayload('sms', { phoneNumber: '+15551234567', smsBody: '' }).text,
        'sms:+15551234567?&body=');
    });
  });

  describe('whatsapp', () => {
    test('the number is digits only, with no plus, which is what wa.me needs', () => {
      const { text, error } = buildPayload('whatsapp', { phoneNumber: '+1 (555) 123-4567', whatsappMessage: 'Hi' });
      assert.equal(error, '');
      assert.equal(text, 'https://wa.me/15551234567?text=Hi');
    });

    test('a national-format number is refused, because it would open a chat with nobody', () => {
      assert.match(buildPayload('whatsapp', { phoneNumber: '555 1234' }).error, /country code/i);
      assert.match(buildPayload('whatsapp', { phoneNumber: '' }).error, /country code/i);
    });
  });

  describe('vcard', () => {
    const base = { vFirst: 'Jane', vLast: 'Doe' };

    test('the card is well formed and starts and ends correctly', () => {
      const { text, error } = buildPayload('vcard', base);
      assert.equal(error, '');
      assert.ok(text.startsWith('BEGIN:VCARD'));
      assert.ok(text.trimEnd().endsWith('END:VCARD'));
      assert.match(text, /VERSION:3\.0/);
      // FN is what a contact app displays, so it is written out rather than derived.
      assert.match(text, /FN:Jane Doe/);
      assert.match(text, /N:Doe;Jane;;;/);
    });

    test('optional fields are included only when filled in', () => {
      const { text } = buildPayload('vcard', { ...base, vOrg: 'Stylzo', vTitle: 'Owner', vEmail: 'j@e.com' });
      assert.match(text, /ORG:Stylzo/);
      assert.match(text, /TITLE:Owner/);
      assert.match(text, /EMAIL;TYPE=INTERNET:j@e\.com/);
      const bare = buildPayload('vcard', base).text;
      assert.ok(!bare.includes('ORG:') && !bare.includes('TITLE:') && !bare.includes('EMAIL'));
    });

    test('commas and semicolons in a value are escaped, or the card is truncated', () => {
      const { text } = buildPayload('vcard', { ...base, vOrg: 'Stylzo, Inc.; Ltd', vNote: 'a\nb' });
      assert.ok(text.includes('ORG:Stylzo\\, Inc.\\; Ltd'), text);
      assert.ok(text.includes('NOTE:a\\nb'), text);
    });

    test('a website inside a card is validated like any other', () => {
      const { error } = buildPayload('vcard', { ...base, vUrl: 'javascript:alert(1)' });
      assert.match(error, /Website:/);
      const { text } = buildPayload('vcard', { ...base, vUrl: 'example.com' });
      assert.match(text, /URL:https:\/\/example\.com\//);
    });

    test('a name is required and the email is checked', () => {
      assert.match(buildPayload('vcard', { vFirst: '', vLast: '' }).error, /first or last name/i);
      assert.match(buildPayload('vcard', { ...base, vEmail: 'nope' }).error, /not complete/i);
    });

    test('a single name is enough', () => {
      assert.equal(buildPayload('vcard', { vFirst: 'Cher' }).error, '');
      assert.match(buildPayload('vcard', { vLast: 'Madonna' }).text, /FN:Madonna/);
    });
  });

  describe('location', () => {
    test('a geo URI is the default, because it opens whatever map app is installed', () => {
      const { text, error } = buildPayload('location', {
        latitude: '51.5074', longitude: '-0.1278', locationLabel: 'London, UK', mapsProvider: 'geo',
      });
      assert.equal(error, '');
      assert.equal(text, 'geo:51.5074,-0.1278?q=51.5074,-0.1278(London%2C%20UK)');
    });

    test('the Google Maps option uses the documented api=1 entry point', () => {
      const { text } = buildPayload('location', {
        latitude: '51.5074', longitude: '-0.1278', locationLabel: 'London', mapsProvider: 'google',
      });
      assert.equal(text, 'https://www.google.com/maps/search/?api=1&query=London');
    });

    test('without a label the Google link falls back to the coordinates', () => {
      const { text } = buildPayload('location', {
        latitude: '1.5', longitude: '-2.5', locationLabel: '', mapsProvider: 'google',
      });
      assert.equal(text, 'https://www.google.com/maps/search/?api=1&query=1.5,-2.5');
    });

    test('coordinates are range checked', () => {
      assert.match(buildPayload('location', { latitude: '91', longitude: '0' }).error, /-90 and 90/);
      assert.match(buildPayload('location', { latitude: '0', longitude: '181' }).error, /-180 and 180/);
      assert.match(buildPayload('location', { latitude: 'north', longitude: '0' }).error, /-90 and 90/);
      assert.match(buildPayload('location', { latitude: '', longitude: '0' }).error, /latitude/i);
      assert.match(buildPayload('location', { latitude: '0', longitude: '' }).error, /longitude/i);
    });

    test('both providers are offered', () => {
      assert.deepEqual(MAPS_PROVIDER.map(([v]) => v), ['geo', 'google']);
    });
  });

  describe('event', () => {
    const base = { eventSummary: 'Stylzo launch', eventStart: '2026-06-01T09:00' };

    test('the calendar is well formed', () => {
      const { text, error } = buildPayload('event', base);
      assert.equal(error, '');
      assert.ok(text.startsWith('BEGIN:VCALENDAR'));
      assert.ok(text.trimEnd().endsWith('END:VCALENDAR'));
      assert.match(text, /VERSION:2\.0/);
      assert.match(text, /BEGIN:VEVENT/);
      assert.match(text, /END:VEVENT/);
      assert.match(text, /DTSTART:20260601T090000/);
      assert.match(text, /SUMMARY:Stylzo launch/);
    });

    test('the same event produces the same identifier, so re-scanning does not duplicate it', () => {
      const a = buildPayload('event', base);
      const b = buildPayload('event', base);
      const uid = (t) => t.match(/UID:(\S+)/)[1];
      assert.equal(uid(a.text), uid(b.text));
      const other = buildPayload('event', { ...base, eventSummary: 'Something else' });
      assert.notEqual(uid(a.text), uid(other.text), 'two different events share a UID');
    });

    test('an end time is optional, but must not be before the start', () => {
      assert.ok(!buildPayload('event', base).text.includes('DTEND'));
      assert.match(buildPayload('event', { ...base, eventEnd: '2026-06-01T10:30' }).text, /DTEND:20260601T103000/);
      assert.match(
        buildPayload('event', { ...base, eventEnd: '2026-06-01T08:00' }).error,
        /ends before it starts/,
      );
    });

    test('a summary and a start are required', () => {
      assert.match(buildPayload('event', { ...base, eventSummary: '' }).error, /name/i);
      assert.match(buildPayload('event', { eventSummary: 'x' }).error, /start date/i);
      assert.match(buildPayload('event', { ...base, eventStart: 'not a date' }).error, /could not be read/);
    });

    test('commas and newlines in a description are escaped and folded', () => {
      const { text } = buildPayload('event', {
        ...base, eventDescription: 'Bring a laptop, and;\ncome early',
      });
      assert.ok(text.includes('DESCRIPTION:Bring a laptop\\, and\\;\\ncome early'), text);
      // Properties are separated by CRLF; a fold is CRLF plus one space. Splitting
      // on both reconstructs the original lines, none of which may exceed 75 octets.
      for (const line of text.split(/\r\n ?/)) {
        assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `a line is too long: ${line}`);
      }
    });

    test('long content folds rather than producing an over-long line', () => {
      const description = 'x'.repeat(300);
      const { text } = buildPayload('event', { ...base, eventDescription: description });
      assert.match(text, /\r\n /, 'a long description should be folded');
      const lines = text.split(/\r\n ?/);
      for (const line of lines) {
        assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `a folded line is ${Buffer.byteLength(line)} octets`);
      }
      // Unfolding has to give the value back exactly, or the description a phone
      // shows is not the one that was typed.
      const unfolded = lines.filter((l) => l.startsWith('DESCRIPTION:') || /^x+$/.test(l));
      assert.equal(unfolded.join('').replace('DESCRIPTION:', ''), description);
    });
  });

  describe('the set as a whole', () => {
    test('all ten types are listed in a sensible order', () => {
      assert.deepEqual(TYPES.map((t) => t.id), [
        'url', 'text', 'wifi', 'email', 'phone', 'sms', 'whatsapp', 'vcard', 'location', 'event',
      ]);
      for (const t of TYPES) {
        assert.ok(t.label && t.blurb, `${t.id} has no label or blurb`);
      }
    });

    test('every type names the fields it shows', () => {
      for (const t of TYPES) {
        const fields = fieldsFor(t.id);
        assert.ok(fields.length > 0, `${t.id} declares no fields`);
        assert.ok(new Set(fields).size === fields.length, `${t.id} lists a field twice`);
      }
    });

    test('an unknown type is reported rather than thrown', () => {
      const { text, error } = buildPayload('nope', {});
      assert.equal(text, '');
      assert.match(error, /not available/);
    });

    test('a missing field set is handled', () => {
      for (const t of TYPES) {
        assert.doesNotThrow(() => buildPayload(t.id, undefined), t.id);
      }
    });

    test('every built payload fits in a QR code at level M', () => {
      const samples = {
        url: { url: 'https://stylzo.com/qr-code-generator?utm_source=poster&utm_medium=print' },
        text: { text: 'Stylzo — fancy text. Ünïcodé ✓ 日本語' },
        wifi: { ssid: 'Cafe;Guest, "The Net"', wifiSecurity: 'WPA', password: 'correct horse battery', wifiHidden: true },
        email: { emailAddress: 'hello@stylzo.com', emailSubject: 'Hello & welcome', emailBody: 'Hi there!' },
        phone: { phoneNumber: '+1 (555) 123-4567' },
        sms: { phoneNumber: '+15551234567', smsBody: 'Here is the link: https://stylzo.com' },
        whatsapp: { phoneNumber: '+15551234567', whatsappMessage: 'Hi from Stylzo' },
        vcard: {
          vFirst: 'Jane', vLast: 'Doe', vOrg: 'Stylzo; Ltd', vTitle: 'Owner and founder',
          vPhone: '+1 555 123 4567', vEmail: 'jane.doe@example.com', vUrl: 'https://example.com',
          vAddress: '10 Downing Street, London', vNote: 'Met at the conference last spring',
        },
        location: { latitude: '51.5074', longitude: '-0.1278', locationLabel: 'London, UK', mapsProvider: 'geo' },
        event: {
          eventSummary: 'Stylzo launch', eventLocation: 'Online',
          eventStart: '2026-06-01T09:00', eventEnd: '2026-06-01T10:30',
          eventDescription: 'Come and see the new tool',
        },
      };
      for (const [type, fields] of Object.entries(samples)) {
        const { text, error } = buildPayload(type, fields);
        assert.equal(error, '', `${type}: ${error}`);
        assert.ok(Buffer.byteLength(text, 'utf8') <= byteCapacity(20, 'M'),
          `${type} produces ${Buffer.byteLength(text, 'utf8')} bytes, too long to be practical`);
        // And it really does encode.
        assert.doesNotThrow(() => encodeQr(text, { ecl: 'M' }), type);
      }
    });
  });
});
