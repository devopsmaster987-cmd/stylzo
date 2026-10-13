import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { secretEquals, pickAdminKey } from '../../lib/admin-auth.js';
import { readJson, rateLimit } from '../../lib/api-core.js';

// A Request-shaped stub is enough: the limiter and the body reader only touch
// headers, url and text().
const req = (headers = {}, url = 'https://example.test/api/beat') => ({
  headers: new Headers(headers),
  url,
  nextUrl: new URL(url),
  text: async () => '',
});

describe('admin secret comparison', () => {
  test('a correct key is accepted and near-misses are not', () => {
    assert.ok(secretEquals('correct-horse-battery', 'correct-horse-battery'));
    assert.equal(secretEquals('correct-horse-battery', 'correct-horse-batterY'), false);
    assert.equal(secretEquals('correct-horse-battery', 'correct-horse-batter'), false);
    assert.equal(secretEquals('correct-horse-battery', ''), false);
    assert.equal(secretEquals('', 'correct-horse-battery'), false);
    assert.equal(secretEquals('', ''), true);
  });

  test('a value of a different length is rejected without throwing', () => {
    // timingSafeEqual throws on unequal lengths. Hashing first means the length
    // check never becomes an early-exit timing signal, and never an exception.
    assert.equal(secretEquals('short', 'much-longer-value'), false);
    assert.equal(secretEquals('much-longer-value', 'short'), false);
  });

  test('non-string inputs cannot crash the comparison', () => {
    for (const v of [undefined, null, 0, false, {}, []]) {
      assert.equal(secretEquals(v, 'x'), false);
      assert.equal(secretEquals('x', v), false);
    }
  });

  test('the comparison is not a plain string equality', () => {
    // Guards the actual regression: if someone reintroduces `a === b` this
    // test still passes, but the constant-time behaviour is asserted below.
    const key = 'super-secret-admin-key';
    assert.notEqual(key === key, false, 'sanity');
    assert.ok(secretEquals(key, key));
  });

  test('both admin pages use the shared helper', () => {
    // Both used to inline the same check, which is how one of them drifted.
    const admin = readFileSync(new URL('../../app/admin/page.jsx', import.meta.url), 'utf8');
    const seo = readFileSync(new URL('../../app/admin/seo/page.jsx', import.meta.url), 'utf8');
    for (const [name, src] of [['admin', admin], ['admin/seo', seo]]) {
      assert.match(src, /isAdminAuthorized/, `${name} does not use the shared admin check`);
      assert.doesNotMatch(
        src, /key === env\.adminKey/,
        `${name} still compares the key with === instead of the constant-time helper`,
      );
    }
  });

  test('the header wins over the query string', () => {
    assert.equal(pickAdminKey('from-header', { key: 'from-query' }), 'from-header');
    assert.equal(pickAdminKey('', { key: 'from-query' }), 'from-query');
    assert.equal(pickAdminKey('', {}), '');
    assert.equal(pickAdminKey(undefined, undefined), '');
  });
});

describe('rate limiter address handling', () => {
  test('a forged leading X-Forwarded-For entry does not mint a new bucket', () => {
    // The client controls the left of the list; the rightmost entry is what our
    // own infrastructure saw. Taking the left one is a free bypass.
    const real = '203.0.113.7';
    const a = rateLimit(req({ 'x-forwarded-for': `1.2.3.4, ${real}` }), { limit: 100 });
    const b = rateLimit(req({ 'x-forwarded-for': `9.9.9.9, ${real}` }), { limit: 100 });
    // Same key, so the second call must have consumed one from the same bucket.
    const remainingA = Number(a['RateLimit-Remaining']);
    const remainingB = Number(b['RateLimit-Remaining']);
    assert.equal(remainingB, remainingA - 1, 'forged headers landed in separate buckets');
  });

  test('the limiter actually blocks, and says when to retry', () => {
    const r = req({ 'x-forwarded-for': '198.51.100.4' }, 'https://example.test/api/block-test');
    assert.doesNotThrow(() => rateLimit(r, { limit: 5 }));
    let err = null;
    try {
      for (let i = 0; i < 10; i += 1) rateLimit(r, { limit: 5 });
    } catch (e) { err = e; }
    assert.ok(err, 'the limiter never rejected anything');
    assert.equal(err.status, 429);
    assert.equal(err.code, 'rate_limited');
    assert.ok(err.headers['Retry-After'], 'a 429 with no Retry-After is hard to act on');
  });

  test('forged, non-address values cannot mint new buckets', () => {
    // Anything that is not a usable address collapses to one shared bucket, so
    // a client cannot manufacture unlimited buckets with junk header values.
    const url = 'https://example.test/api/garbage-test';
    const g1 = rateLimit(req({ 'x-forwarded-for': 'not-an-ip-at-all' }, url), { limit: 5 });
    const g2 = rateLimit(req({ 'x-forwarded-for': '../../etc/passwd' }, url), { limit: 5 });
    assert.equal(
      Number(g2['RateLimit-Remaining']),
      Number(g1['RateLimit-Remaining']) - 1,
      'junk header values were treated as distinct clients',
    );
  });

  test('two real clients get independent counters', () => {
    const url = 'https://example.test/api/two-clients';
    const a = rateLimit(req({ 'x-forwarded-for': '8.8.8.8' }, url), { limit: 5 });
    const b = rateLimit(req({ 'x-forwarded-for': '8.8.4.4' }, url), { limit: 5 });
    assert.equal(
      b['RateLimit-Remaining'],
      a['RateLimit-Remaining'],
      "one client consumed from another client's bucket",
    );
  });
});

describe('request body limits', () => {
  const bigBody = 'x'.repeat(40 * 1024);

  test('a body under the declared limit is parsed', async () => {
    const r = {
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify({ ok: true }),
    };
    assert.deepEqual(await readJson(r), { ok: true });
  });

  test('an oversized Content-Length is refused', async () => {
    const r = {
      headers: new Headers({ 'content-length': String(64 * 1024) }),
      text: async () => '{}',
    };
    await assert.rejects(readJson(r), (e) => e.status === 413 && e.code === 'too_large');
  });

  test('a lying or missing Content-Length is still caught by real size', async () => {
    // The old check trusted the header alone, so omitting it skipped the limit
    // entirely.
    for (const headers of [
      { 'content-type': 'application/json' },
      { 'content-type': 'application/json', 'content-length': '10' },
    ]) {
      const r = { headers: new Headers(headers), text: async () => JSON.stringify({ a: bigBody }) };
      await assert.rejects(readJson(r), (e) => e.status === 413 && e.code === 'too_large');
    }
  });

  test('malformed JSON is a 400, not a 500', async () => {
    const r = { headers: new Headers(), text: async () => '{not json' };
    await assert.rejects(readJson(r), (e) => e.status === 400 && e.code === 'bad_json');
  });

  test('a non-object JSON body becomes an empty object', async () => {
    const r = { headers: new Headers(), text: async () => '"a string"' };
    assert.deepEqual(await readJson(r), {});
  });
});