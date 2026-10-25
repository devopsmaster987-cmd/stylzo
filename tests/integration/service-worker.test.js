import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { get, startServer } from '../helpers/server.js';

// The service worker is invisible to every other test in this suite: it only
// runs in a browser, and only after the first visit installs it. A bug here
// therefore passes the whole suite and then breaks a page for real visitors
// while every automated check stays green. These tests drive the worker's own
// routing rules against the URLs the image compressor actually produces.

const SW = new URL('../../public/sw.js', import.meta.url);

describe('service worker routing', () => {
  let server;
  before(async () => { server = await startServer(3262); });
  after(() => server?.stop());

  test('is served, and not cached', async () => {
    const res = await get(server.base, '/sw.js');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('cache-control') || '', /no-cache|must-revalidate|max-age=0/);
  });

  test('leaves blob: and data: URLs to the browser', () => {
    // The bug this guards: a blob: URL inherits the page origin, so the
    // same-origin check does not exclude it, and it has no file extension so it
    // misses the static branch. It reached fetch(), which a worker cannot do for
    // a blob, and the catch answered with the offline page — so every object
    // URL preview rendered as a broken image.
    const src = readFileSync(SW, 'utf8');
    assert.match(src, /url\.protocol === 'blob:'/, 'the worker does not exempt blob: URLs');
    assert.match(src, /url\.protocol === 'data:'/, 'the worker does not exempt data: URLs');

    // And the exemption has to come before the branches that would swallow it,
    // otherwise the line exists but never runs.
    const exempt = src.indexOf("url.protocol === 'blob:'");
    const staticBranch = src.indexOf('STATIC.test(url.pathname)');
    const navigateBranch = src.indexOf('request.mode === \'navigate\'');
    assert.ok(exempt < staticBranch, 'the blob: exemption is after the static branch');
    assert.ok(exempt < navigateBranch, 'the blob: exemption is after the navigation branch');
  });

  test('a blob: URL is exactly the shape that used to break', () => {
    // Asserted against the URL parser rather than from memory, because the whole
    // failure depends on two properties that are easy to misremember: a blob URL
    // IS same-origin, and its pathname has no extension.
    const url = new URL(`blob:${server.base}/9f8a-1e2f`);
    assert.equal(url.origin, new URL(server.base).origin, 'blob: is expected to be same-origin');
    assert.doesNotMatch(url.pathname, /\.(?:css|js|svg|png)$/, 'blob: pathnames carry no extension');
    assert.doesNotMatch(url.pathname, /^\/admin/, 'and are not private routes');
  });

  test('still caches its own assets and still serves the offline page', async () => {
    const src = readFileSync(SW, 'utf8');
    assert.match(src, /\/css\/main\.css/, 'the stylesheet dropped out of the precache');
    assert.match(src, /\/js\/image-compressor\.js/, 'the compressor dropped out of the precache');
    assert.match(src, /\/js\/zip\.js/, 'the zip writer dropped out of the precache');
    assert.match(src, /caches\.match\('\/offline\.html'\)/, 'the offline fallback is gone');

    // Precache entries have to exist, or install() rejects and there is no
    // worker at all — which would look like the exemptions above doing nothing.
    for (const asset of ['/css/main.css', '/js/image-compressor.js', '/js/zip.js', '/offline.html']) {
      assert.equal((await get(server.base, asset)).status, 200, `${asset} is precached but not served`);
    }
  });

  test('navigations bypass the HTTP cache and only fall back when offline', () => {
    const src = readFileSync(SW, 'utf8');
    assert.match(src, /fetch\(request, \{ cache: 'no-store' \}\)/, 'navigations can reuse a stale HTTP cache');
    assert.match(src, /navigator\.onLine === false/, 'an online failure can still return cached HTML');
  });

  test('admin and API routes are still never cached', () => {
    const src = readFileSync(SW, 'utf8');
    const privateRule = src.slice(src.indexOf('const PRIVATE'));
    assert.ok(privateRule.length > 0, 'the private-route rule was removed');
  });
});
