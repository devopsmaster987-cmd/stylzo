import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { get, startServer } from '../helpers/server.js';
import { fontPageContent } from '../../data/font-page-content.js';
import { getStyle } from '../../services/catalog.js';
import { applyStyle } from '../../services/unicode/engine.js';
import { styleKind } from '../../lib/style-content.js';

const BASE_STYLE = { slug: 'bold', name: 'Bold', pipeline: [{ type: 'map', name: 'bold' }] };

function converterOutput(style, input) {
  const kind = styleKind(style).kind;
  const base = kind === 'combine' ? applyStyle(input, BASE_STYLE, { maxLength: 300 }) : input;
  return applyStyle(base, style, { maxLength: 300 });
}

function decodeHtml(value) {
  return value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

describe('rendered font examples', () => {
  let server;
  before(async () => { server = await startServer(3231); });
  after(() => server?.stop());

  test('every rendered example matches the page converter', async () => {
    for (const [slug, entry] of Object.entries(fontPageContent)) {
      const style = getStyle(slug);
      assert.ok(style, `${slug} is not a catalog style`);

      const res = await get(server.base, `/fonts/${slug}`);
      assert.equal(res.status, 200, `${slug} returned ${res.status}`);
      const html = await res.text();

      const outputs = [...html.matchAll(/<p class="example-out" data-output="true">([\s\S]*?)<\/p>/g)]
        .map((match) => decodeHtml(match[1]));
      const inputs = [...html.matchAll(/<span class="example-plain">typed as: ([\s\S]*?)<\/span>/g)]
        .map((match) => decodeHtml(match[1]));

      assert.deepEqual(inputs, entry.examples, `${slug} rendered the wrong example inputs`);
      assert.deepEqual(
        outputs,
        entry.examples.map((input) => converterOutput(style, input)),
        `${slug} rendered an example that differs from the converter`,
      );
    }
  });
});
