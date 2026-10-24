import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQrPayload, formatQrDetails } from '../../public/js/qr-reader-payloads.js';

// A QR code is text plus a scheme. These tests read each scheme the way its
// published format defines it, so a change to the parser cannot quietly make a
// Wi-Fi password or a phone number come out wrong.

function valueOf(result, label) {
  const field = result.fields.find((f) => f.label === label);
  return field ? field.value : undefined;
}

describe('qr reader payloads', () => {
  test('plain text is returned as text, not guessed at', () => {
    const result = parseQrPayload('Meet me at the station at six.');
    assert.equal(result.type, 'text');
    assert.equal(valueOf(result, 'Text'), 'Meet me at the station at six.');
  });

  test('a website link keeps its address and becomes an href', () => {
    const result = parseQrPayload('https://example.com/path?q=1');
    assert.equal(result.type, 'url');
    assert.equal(valueOf(result, 'Website'), 'https://example.com/path?q=1');
    assert.equal(result.fields[0].href, 'https://example.com/path?q=1');
  });

  test('a bare www address gets a scheme for the link only', () => {
    const result = parseQrPayload('www.example.com');
    assert.equal(result.type, 'url');
    assert.equal(valueOf(result, 'Website'), 'www.example.com');
    assert.equal(result.fields[0].href, 'https://www.example.com');
  });

  test('a javascript: URL is never turned into a clickable href', () => {
    const result = parseQrPayload('javascript:alert(1)');
    assert.equal(result.type, 'text');
    assert.equal(result.fields[0].href, undefined);
  });

  test('a phone number is recognised and keeps its formatting', () => {
    const result = parseQrPayload('+1 (555) 123-4567');
    assert.equal(result.type, 'phone');
    assert.equal(valueOf(result, 'Phone number'), '+1 (555) 123-4567');
  });

  test('tel: is decoded', () => {
    const result = parseQrPayload('tel:+15551234567');
    assert.equal(result.type, 'phone');
    assert.equal(valueOf(result, 'Phone number'), '+15551234567');
  });

  test('an email address is recognised on its own', () => {
    const result = parseQrPayload('hello@example.com');
    assert.equal(result.type, 'email');
    assert.equal(valueOf(result, 'Email address'), 'hello@example.com');
  });

  test('mailto: keeps the address and decodes subject and body', () => {
    const result = parseQrPayload('mailto:hello@example.com?subject=Hello%20there&body=Say%20hi');
    assert.equal(result.type, 'email');
    assert.equal(valueOf(result, 'Email address'), 'hello@example.com');
    assert.equal(valueOf(result, 'Subject'), 'Hello there');
    assert.equal(valueOf(result, 'Message'), 'Say hi');
  });

  test('a plus-addressed mailto is not mangled into a space', () => {
    const result = parseQrPayload('mailto:me+tag@example.com');
    assert.equal(valueOf(result, 'Email address'), 'me+tag@example.com');
  });

  test('smsto: splits the number from the message', () => {
    const result = parseQrPayload('smsto:+15551234567:See you at 6');
    assert.equal(result.type, 'sms');
    assert.equal(valueOf(result, 'Phone number'), '+15551234567');
    assert.equal(valueOf(result, 'Message'), 'See you at 6');
  });

  test('sms: reads the body from the query string', () => {
    const result = parseQrPayload('sms:+15551234567?body=Hello');
    assert.equal(valueOf(result, 'Phone number'), '+15551234567');
    assert.equal(valueOf(result, 'Message'), 'Hello');
  });

  test('a Wi-Fi payload extracts the network, security and password', () => {
    const result = parseQrPayload('WIFI:T:WPA;S:Cafe Guest;P:correct horse;H:false;;');
    assert.equal(result.type, 'wifi');
    assert.equal(valueOf(result, 'Network name'), 'Cafe Guest');
    assert.equal(valueOf(result, 'Security'), 'WPA');
    assert.equal(valueOf(result, 'Password'), 'correct horse');
    assert.equal(valueOf(result, 'Hidden network'), undefined);
  });

  test('escaped semicolons in a Wi-Fi name stay in the name', () => {
    const result = parseQrPayload(String.raw`WIFI:T:WPA;S:Cafe\;Guest;P:pass;;`);
    assert.equal(valueOf(result, 'Network name'), 'Cafe;Guest');
  });

  test('an open Wi-Fi network says so and writes no password', () => {
    const result = parseQrPayload('WIFI:T:nopass;S:Guest;;');
    assert.equal(valueOf(result, 'Security'), 'Open — no password');
    assert.equal(valueOf(result, 'Password'), undefined);
  });

  test('a vCard extracts the name, phone, email and website', () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Jane Doe',
      'ORG:Example Ltd',
      'TITLE:Owner',
      'TEL;TYPE=CELL:+15551234567',
      'EMAIL:jane@example.com',
      'ADR:;;10 Downing Street;London;;SW1A 2AA;UK',
      'URL:https://example.com',
      'END:VCARD',
    ].join('\n');
    const result = parseQrPayload(vcard);
    assert.equal(result.type, 'vcard');
    assert.equal(valueOf(result, 'Name'), 'Jane Doe');
    assert.equal(valueOf(result, 'Organisation'), 'Example Ltd');
    assert.equal(valueOf(result, 'Job title'), 'Owner');
    assert.equal(valueOf(result, 'Mobile'), '+15551234567');
    assert.equal(valueOf(result, 'Email'), 'jane@example.com');
    assert.equal(valueOf(result, 'Address'), '10 Downing Street, London, SW1A 2AA, UK');
    assert.equal(result.fields.find((f) => f.label === 'Website').href, 'https://example.com');
  });

  test('a folded vCard line is unfolded', () => {
    const vcard = 'BEGIN:VCARD\nFN:Jane\nNOTE:A long note that is\n  folded here\nEND:VCARD';
    const result = parseQrPayload(vcard);
    assert.equal(valueOf(result, 'Note'), 'A long note that is folded here');
  });

  test('a quoted-printable vCard note is decoded', () => {
    const vcard = 'BEGIN:VCARD\nFN:Jane\nNOTE;ENCODING=QUOTED-PRINTABLE:Caf=C3=A9\nEND:VCARD';
    const result = parseQrPayload(vcard);
    assert.equal(valueOf(result, 'Note'), 'Café');
  });

  test('a MECARD extracts the name, phone and email', () => {
    const result = parseQrPayload('MECARD:N:Doe,Jane;TEL:+15551234567;EMAIL:jane@example.com;;');
    assert.equal(result.type, 'mecard');
    assert.equal(valueOf(result, 'Name'), 'Jane Doe');
    assert.equal(valueOf(result, 'Phone'), '+15551234567');
    assert.equal(valueOf(result, 'Email'), 'jane@example.com');
  });

  test('a geo payload extracts coordinates and a place name', () => {
    const result = parseQrPayload('geo:51.5074,-0.1278?q=London');
    assert.equal(result.type, 'geo');
    assert.equal(valueOf(result, 'Latitude'), '51.5074');
    assert.equal(valueOf(result, 'Longitude'), '-0.1278');
    assert.equal(valueOf(result, 'Place'), 'London');
    assert.ok(result.fields.find((f) => f.label === 'Open in maps').href.startsWith('https://www.google.com/maps'));
  });

  test('a calendar event extracts its summary, place and dates', () => {
    const event = [
      'BEGIN:VEVENT',
      'SUMMARY:Launch night',
      'LOCATION:Online',
      'DTSTART:20261023T180000Z',
      'DTEND:20261023T190000Z',
      'DESCRIPTION:Come and see.',
      'END:VEVENT',
    ].join('\n');
    const result = parseQrPayload(event);
    assert.equal(result.type, 'event');
    assert.equal(valueOf(result, 'Event'), 'Launch night');
    assert.equal(valueOf(result, 'Location'), 'Online');
    assert.equal(valueOf(result, 'Starts'), '2026-10-23 18:00:00 UTC');
    assert.equal(valueOf(result, 'Ends'), '2026-10-23 19:00:00 UTC');
    assert.equal(valueOf(result, 'Description'), 'Come and see.');
  });

  test('empty input is reported as empty rather than as text', () => {
    const result = parseQrPayload('   ');
    assert.equal(result.type, 'empty');
    assert.deepEqual(result.fields, []);
  });

  test('copying details produces one labelled line per field', () => {
    const result = parseQrPayload('mailto:a@example.com?subject=Hi');
    assert.equal(formatQrDetails(result), 'Email address: a@example.com\nSubject: Hi');
  });
});
