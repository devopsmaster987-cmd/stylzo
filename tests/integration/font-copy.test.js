import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { get, startServer } from '../helpers/server.js';
import { catalog } from '../../services/catalog.js';
import { FONTS_SUPPORT } from '../../lib/fonts-content.js';

const indexable = catalog().styles.filter((style) => style.indexable);
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

describe('font page copy', () => {
  let server;
  before(async () => { server = await startServer(3263); });
  after(() => server?.stop());

  test('no indexable font page repeats "Text text" or "Text generator generator"', async () => {
    for (const style of indexable) {
      const res = await get(server.base, `/fonts/${style.slug}`);
      assert.equal(res.status, 200, `${style.slug} returned ${res.status}`);
      const html = await res.text();
      assert.ok(!html.includes('Text text'), `${style.slug} contains "Text text"`);
      assert.ok(
        !html.includes('Text generator generator'),
        `${style.slug} contains "Text generator generator"`,
      );
    }
  });

  test('overline styles use "an overline", not "a overline"', async () => {
    for (const slug of ['overline', 'overline-underline', 'overline-strike']) {
      const html = await (await get(server.base, `/fonts/${slug}`)).text();
      assert.ok(html.includes('an overline'), `${slug} does not use "an overline"`);
      assert.ok(!html.includes('a overline'), `${slug} still contains "a overline"`);
    }
  });

  test('/fonts explains the support labels with counts and field limits', async () => {
    const doc = markup(await (await get(server.base, '/fonts')).text()).replace(/<!--.*?-->/g, '');
    assert.ok(doc.includes('id="fonts-support"'), 'support guide missing');
    assert.ok(doc.includes(FONTS_SUPPORT.h2));
    for (const label of ['Works almost everywhere', 'Works in most apps', 'Check your app first']) {
      assert.ok(doc.includes(label), `support label missing: ${label}`);
    }
    const counts = { safe: 0, good: 0, limited: 0 };
    for (const style of indexable) counts[style.support] += 1;
    for (const key of ['safe', 'good', 'limited']) {
      assert.ok(doc.includes(`(${counts[key]})`), `count missing for ${key}`);
    }
    assert.ok(doc.includes(FONTS_SUPPORT.fieldBody), 'field-validation explanation missing');
    assert.ok(doc.includes(FONTS_SUPPORT.fallbackBody), 'fallback guidance missing');
  });
});
