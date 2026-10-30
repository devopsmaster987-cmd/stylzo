import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PRIVACY_SHORT } from '../../lib/facts.js';

// The site has two real features that send a snippet of typed text to the
// server (the style-name search and the AI suggestions), so any page that still
// claims "nothing you type is ever sent anywhere" is simply false. These tests
// fail if a copy surface drifts back to an absolute claim, and fail if the one
// canonical statement stops being the statement every surface uses.

const ROOT = join(import.meta.dirname, '..', '..');

/** Source surfaces that render privacy copy about the text generator. */
const COPY_SURFACES = [
  ['lib/pages.js', '.js'],
  ['lib/guides.js', '.js'],
  ['lib/landing-pages.js', '.js'],
  ['lib/home-content.js', '.js'],
  ['lib/aeo.js', '.js'],
  ['lib/facts.js', '.js'],
  ['components/static-page.jsx', '.jsx'],
  ['components/site-footer.jsx', '.jsx'],
  ['data/pages.json', '.json'],
  ['scripts/build-llms-txt.js', '.js'],
];

function walk(dir, ext, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, ext, out);
    else if (name.endsWith(ext)) out.push(p);
  }
  return out;
}

// Absolute phrase -> why it must not appear on generator-copy surfaces while
// the search and AI helpers exist. Each entry documents the honest replacement.
const FORBIDDEN = [
  'never leaves your browser',
  'your text never leaves',
  'nothing you type is sent',
  'never sent to the server',
  'not sent to our server',
  'never sent to our server',
  'never transmitted or stored',
  'never uploads it.',
];

describe('privacy statement consistency', () => {
  test('the canonical statement mentions both helpers and the provider', () => {
    assert.match(PRIVACY_SHORT, /style-name search/, 'must name the search helper');
    assert.match(PRIVACY_SHORT, /AI suggestions/, 'must name the AI helper');
    assert.match(PRIVACY_SHORT, /120 characters/, 'must limit the forwarded snippet');
    assert.match(PRIVACY_SHORT, /external AI provider/, 'must name the provider forwarding');
  });

  test('no generator copy surface keeps an absolute "nothing is sent" claim', () => {
    for (const [rel] of COPY_SURFACES) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      for (const phrase of FORBIDDEN) {
        assert.ok(
          !src.toLowerCase().includes(phrase.toLowerCase()),
          `${rel} still claims "${phrase}"; use PRIVACY_SHORT from lib/facts.js instead`,
        );
      }
    }
  });

  test('no page copy anywhere uses the forbidden absolutes verbatim', () => {
    for (const dir of ['app', 'lib', 'components', 'public/js']) {
      for (const file of walk(join(ROOT, dir), '.jsx').concat(walk(join(ROOT, dir), '.js'))) {
        const rel = file.slice(ROOT.length + 1).replaceAll('\\\\', '/');
        const src = readFileSync(file, 'utf8');
        for (const phrase of FORBIDDEN) {
          assert.ok(
            !src.toLowerCase().includes(phrase.toLowerCase()),
            `${rel} claims "${phrase}"`,
          );
        }
      }
    }
  });

  test('data/pages.json carries the canonical statement word for word', () => {
    const json = readFileSync(join(ROOT, 'data/pages.json'), 'utf8');
    const pages = JSON.parse(json);
    const strings = [];
    const gather = (v) => {
      if (typeof v === 'string') strings.push(v);
      else if (Array.isArray(v)) v.forEach(gather);
      else if (v && typeof v === 'object') Object.values(v).forEach(gather);
    };
    gather(pages);
    for (const key of ['about', 'terms', 'privacy']) {
      assert.ok(
        gather && JSON.stringify(pages[key]).toLowerCase().includes('nothing about the text is stored'),
        `${key} page no longer carries the canonical statement`,
      );
    }
    assert.ok(
      strings.some((s) => s.includes(PRIVACY_SHORT)),
      'the canonical PRIVACY_SHORT text must appear verbatim in data/pages.json',
    );
  });

  test('the 120-character AI snippet limit matches engine code', () => {
    const ai = readFileSync(join(ROOT, 'services/ai.js'), 'utf8');
    assert.match(ai, /slice\(0, 120\)/, 'services/ai.js must cap the forwarded snippet at 120 chars');
  });
});
