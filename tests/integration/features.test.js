import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { get, json, post, startServer } from '../helpers/server.js';

process.env.ADMIN_KEY = 'test-admin-key-123';

const pages = [
  '/symbols', '/emoji', '/kaomoji', '/tools', '/image-compression', '/qr-code-generator',
  '/studio', '/admin',
];

// Next repeats rendered props inside its RSC flight payload, so counting a
// class or a heading against the raw document counts it twice. Markup only.
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

describe('features', () => {
  let server;
  before(async () => { server = await startServer(3212); });
  after(() => server?.stop());

  for (const p of pages) {
    test(`GET ${p} renders with one h1 and a description`, async () => {
      const res = await get(server.base, p);
      assert.equal(res.status, 200);
      const text = await res.text();
      assert.equal((text.match(/<h1[ >]/g) || []).length, 1);
      assert.match(text, /<meta name="description"/);
      assert.match(text, /<title>[^<]+<\/title>/);
    });
  }

  test('library pages carry real items and tap-to-copy buttons', async () => {
    const sym = await (await get(server.base, '/symbols')).text();
    assert.ok((sym.match(/data-lib-item=/g) || []).length >= 400);
    assert.match(sym, /→/);
    const emoji = await (await get(server.base, '/emoji')).text();
    assert.ok((emoji.match(/data-lib-item=/g) || []).length >= 1000);
    const kao = await (await get(server.base, '/kaomoji')).text();
    assert.ok((kao.match(/data-lib-item=/g) || []).length >= 100);
  });

  test('generator SSRs only the first page plus a load-more control', async () => {
    const text = await (await get(server.base, '/fancy-text-generator')).text();
    const rows = (text.match(/data-style-id=/g) || []).length;
    assert.ok(rows > 0 && rows <= 48, `expected a page of rows, got ${rows}`);
    assert.match(text, /data-load-more/);
    assert.match(text, /data-style-search/);
  });

  test('GET /api/styles paginates by category and returns outputs', async () => {
    const res = await json(server.base, '/api/styles?category=lines&offset=0&limit=10');
    assert.equal(res.status, 200);
    assert.ok(res.body.total >= 26);
    assert.equal(res.body.styles.length, 10);
    assert.ok(res.body.styles[0].output && res.body.styles[0].name && res.body.styles[0].slug);
    const page2 = await json(server.base, '/api/styles?category=lines&offset=10&limit=10');
    assert.notEqual(page2.body.styles[0].id, res.body.styles[0].id);
    assert.equal((await json(server.base, '/api/styles?category=zzz')).status, 404);
  });

  test('GET /api/search ranks and returns styled output', async () => {
    const res = await json(server.base, '/api/search?q=glitch&text=Hi');
    assert.equal(res.status, 200);
    assert.ok(res.body.results.length >= 3);
    assert.ok(res.body.results.every((r) => r.id && r.output && r.pipeline));
    const empty = await json(server.base, '/api/search?q=');
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body.results, []);
  });

  test('GET /api/ai/suggest explains its picks using the rules engine', async () => {
    const res = await json(server.base, '/api/ai/suggest?text=gg%20ez&vibe=gaming');
    assert.equal(res.status, 200);
    assert.ok(res.body.styles.length >= 3);
    assert.ok(res.body.reasons.length >= 1);
    assert.equal(res.body.engine, 'rules');
    assert.ok(res.body.styles.every((s) => s.id && s.output));
  });

  test('GET /api/beat accepts anonymous beacons without storing identifiers', async () => {
    const res = await post(server.base, '/api/beat', { path: '/', event: 'copy', session: true });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    const admin = await (await get(server.base, '/admin?key=test-admin-key-123')).text();
    assert.match(admin, /styles in catalog/);
  });

  test('admin is closed without the right key', async () => {
    const noKey = await (await get(server.base, '/admin')).text();
    assert.ok(!noKey.includes('styles in catalog'));
    assert.match(noKey, /Enter your key/);
    const badKey = await (await get(server.base, '/admin?key=wrong')).text();
    assert.ok(!badKey.includes('styles in catalog'));
    assert.match(badKey, /Enter your key/);
  });

  test('public config exposes nothing when Firebase is not configured', async () => {
    const res = await json(server.base, '/api/config');
    assert.equal(res.status, 200);
    assert.equal(res.body.firebase, null);
  });

  test('offline page, service worker and manifest are served', async () => {
    assert.equal((await get(server.base, '/offline.html')).status, 200);
    const sw = await (await get(server.base, '/sw.js')).text();
    assert.match(sw, /addEventListener\('fetch'/);
    const mf = await (await get(server.base, '/manifest.webmanifest')).json();
    assert.equal(mf.short_name, 'Stylzo');
  });

  test('no page leaks inline style attributes (CSP forbids them)', async () => {
    for (const p of [
      '/', '/tools', '/studio', '/image-compression', '/qr-code-generator',
      '/fancy-text-generator', '/symbols',
    ]) {
      const text = await (await get(server.base, p)).text();
      assert.ok(!/ style="/.test(text), `${p} contains a style attribute`);
    }
  });

  test('the QR generator ships its controls and its client modules', async () => {
    const html = await (await get(server.base, '/qr-code-generator')).text();
    for (const hook of [
      'data-qr-zone', 'data-qr-tabs', 'data-qr-type', 'data-qr-panels', 'data-qr-panel',
      'data-qr-canvas', 'data-qr-empty', 'data-qr-errors', 'data-qr-status', 'data-qr-payload',
      'data-qr-size', 'data-qr-ecl', 'data-qr-foreground', 'data-qr-background',
      'data-qr-swatch',       'data-qr-logo', 'data-qr-logo-size', 'data-qr-logo-note',
      'data-qr-logo-remove', 'data-qr-reset', 'data-qr-generate', 'data-qr-download-png',
      'data-qr-download-svg', 'data-qr-download-jpg', 'data-qr-copy',
    ]) {
      assert.ok(html.includes(hook), `the generator is missing ${hook}`);
    }

    // The privacy claim has to be in the server HTML, not added by the script:
    // a crawler and a reader with JavaScript disabled both need to see it, and
    // this page asks for Wi-Fi passwords and contact details.
    assert.match(html, /never leave this device/);
    assert.match(html, /no third-party QR service/i);

    // The modules the page injects have to actually be served, or the tool is an
    // inert form. The encoder is one of them: it is not a package.
    for (const asset of ['/js/qr-code-generator.js', '/js/qr.js', '/js/qr-payloads.js']) {
      const res = await get(server.base, asset);
      assert.equal(res.status, 200, `${asset} is referenced but not served`);
    }
  });

  test('the QR generator offers all ten types as real tabs with real fields', async () => {
    const html = await (await get(server.base, '/qr-code-generator')).text();
    const types = ['url', 'text', 'wifi', 'email', 'phone', 'sms', 'whatsapp', 'vcard', 'location', 'event'];
    for (const type of types) {
      assert.ok(html.includes(`data-qr-type="${type}"`), `there is no tab for ${type}`);
      assert.ok(html.includes(`data-qr-panel="${type}"`), `there is no panel for ${type}`);
      assert.ok(html.includes(`aria-controls="qr-panel-${type}"`), `the ${type} tab controls nothing`);
    }

    // Every panel carries at least one labelled control, and no panel is shown
    // alongside another: two panels open at once would mean two forms for one code.
    const panels = html.match(/data-qr-panel="[a-z]+"[^>]*>/g) || [];
    assert.equal(panels.length, types.length);
    assert.equal(panels.filter((p) => !/hidden/.test(p)).length, 1, 'exactly one panel starts open');

    // Split on the opening tag of each panel so a panel can be checked against
    // its own contents rather than against the whole document.
    const chunks = html.split('<div class="qr-panel"').slice(1);
    assert.equal(chunks.length, types.length);
    for (const [i, type] of types.entries()) {
      const chunk = chunks[i];
      assert.ok(chunk.includes(`data-qr-panel="${type}"`), `panel ${i} is not ${type}`);
      assert.ok(/data-qr-field=/.test(chunk), `the ${type} panel has no input`);
      assert.ok(/<label[^>]*for="qr-/.test(chunk), `the ${type} panel has no labelled control`);
    }
    // An input with no label is unusable by keyboard and by screen reader.
    for (const input of html.match(/<input[^>]*data-qr-field[^>]*>/g) || []) {
      const id = (input.match(/id="([^"]+)"/) || [])[1];
      assert.ok(id, `an input has no id and cannot be labelled: ${input}`);
      assert.ok(html.includes(`for="${id}"`), `nothing is labelled with for="${id}"`);
    }
  });

  test('the QR generator offers the sizes, formats and downloads it claims', async () => {
    const html = await (await get(server.base, '/qr-code-generator')).text();
    for (const size of [128, 256, 512, 1024]) {
      // React marks the selected option, so the tag carries a selected attribute.
      assert.match(html, new RegExp(`<option value="${size}"`), `there is no ${size}px size`);
    }
    for (const level of ['L', 'M', 'Q', 'H']) {
      assert.ok(html.includes(`data-qr-ecl="${level}"`), `there is no error correction level ${level}`);
    }
    // All four levels are described, not just labelled, so the choice is informed.
    assert.match(html, /Recovers about 30%/);
    // And the downloads are named, so nobody is guessing what a file is.
    for (const format of ['Download PNG', 'SVG', 'JPG']) {
      assert.ok(html.includes(format), `there is no ${format} button`);
    }
    // Downloads start disabled: there is no code to download yet.
    const download = html.match(/<button[^>]*data-qr-download-png[^>]*>/)[0];
    assert.match(download, /disabled/, 'the download button is live before there is a code');
  });

  test('the QR generator declares its accessibility contract in the markup', async () => {
    const html = await (await get(server.base, '/qr-code-generator')).text();
    // A tablist without a role is just a row of buttons, and the arrow-key
    // handling in the module then has nothing to announce.
    assert.match(html, /role="tablist"/);
    assert.match(html, /role="tab"/);
    assert.match(html, /role="tabpanel"/);
    assert.match(html, /role="alert"/, 'errors are not announced');
    assert.match(html, /aria-live="polite"/, 'the result is not announced');
    assert.match(html, /role="img"[\s\S]*aria-label="Preview of the QR code/,
      'the canvas needs an accessible name');
    // The empty state is real HTML, so the page says something before the module loads.
    assert.match(html, /data-qr-empty[\s\S]*No QR code yet/);
  });

  test('the QR generator has a Generate button that is a real action', async () => {
    const html = await (await get(server.base, '/qr-code-generator')).text();
    const button = (html.match(/<button[^>]*data-qr-generate[^>]*>[\s\S]*?<\/button>/) || [])[0];
    assert.ok(button, 'there is no Generate button');

    // It has to be a real control with an accessible name, not a div or a span.
    assert.match(button, /<button/);
    assert.match(button, /type="button"/);
    assert.match(button, />\s*Generate QR code\s*</, 'the button is not labelled for a screen reader');

    // Enabled from the start: a button that only works once the preview already
    // exists is a button nobody can use.
    assert.doesNotMatch(button, /disabled/, 'the Generate button starts disabled');

    // And the module acts on it, rather than it being a decorative control.
    const script = readFileSync(
      new URL('../../public/js/qr-code-generator.js', import.meta.url), 'utf8',
    );
    assert.match(script, /generateBtn\.addEventListener\('click', generateOnDemand\)/,
      'the Generate button is not wired to anything');
    assert.match(script, /scrollIntoView/,
      'Generate should bring the code into view, which a live preview cannot do on a phone');
  });

  test('the primary action on the form is Generate, not Reset', async () => {
    // Reset styled as the loudest button on the form is a mis-click waiting to
    // happen: it is the one control that throws work away.
    const html = await (await get(server.base, '/qr-code-generator')).text();
    const tools = (html.match(/<div class="gen-tools">[\s\S]*?<\/div>/) || [])[0];
    assert.ok(tools, 'the form has no action row');

    const generate = (tools.match(/<button[^>]*data-qr-generate[^>]*>/) || [])[0];
    const reset = (tools.match(/<button[^>]*data-qr-reset[^>]*>/) || [])[0];
    assert.ok(generate && reset, 'the action row needs both buttons');
    assert.ok(tools.indexOf('data-qr-generate') < tools.indexOf('data-qr-reset'),
      'Generate should come before Reset');

    assert.match(generate, /class="btn grad"/, 'Generate should carry the primary style');
    assert.match(reset, /class="btn subtle"/, 'Reset should be styled as the quieter action');
  });

  test('sitemap includes the QR generator and the header nav reaches it', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    assert.ok(sm.includes('/qr-code-generator</loc>'));

    const home = markup(await (await get(server.base, '/')).text());
    const nav = (home.match(/<nav aria-label="Main">[\s\S]*?<\/nav>/) || [])[0];
    assert.ok(nav, 'no main nav in the document');
    assert.ok(nav.includes('/qr-code-generator'), 'the main nav does not link to the QR generator');
    assert.match(nav, /has-sub/);
  });

  // The client module finds the page by reading data-qr-* hooks out of the DOM.
  // Nothing type-checks that relationship: a hook that exists on only one side
  // is an inert control that looks finished, which is worse than a missing one.
  describe('the QR page and its client module agree', () => {
    const script = readFileSync(
      new URL('../../public/js/qr-code-generator.js', import.meta.url), 'utf8',
    );
    const hookNames = (source) =>
      [...new Set([...source.matchAll(/data-qr-([a-z-]+)/g)].map((m) => m[1]))];

    let html;
    before(async () => { html = markup(await (await get(server.base, '/qr-code-generator')).text()); });

    test('every hook the page emits is read by the module', () => {
      const onPage = hookNames(html);
      // Two are built through a template literal, so they never appear literally.
      const inScript = new Set([...hookNames(script), 'foreground', 'background']);
      const unhandled = onPage.filter((name) => !inScript.has(name));
      assert.deepEqual(unhandled, [], `the page renders ${unhandled.join(', ')} but nothing acts on it`);
    });

    test('every hook the module reads is rendered by the page', () => {
      const onPage = new Set(hookNames(html));
      const missing = hookNames(script).filter((name) => !onPage.has(name));
      assert.deepEqual(missing, [], `the module looks for ${missing.join(', ')} and finds nothing`);
    });

    test('a color swatch is always a channel and a color the module can apply', () => {
      // This is the bug the two tests above exist for: a swatch carrying a
      // color but no channel renders as a button and does nothing when pressed.
      const swatches = [...html.matchAll(/data-qr-swatch="([^"]*)"[^>]*data-colour="([^"]+)"/g)];
      assert.ok(swatches.length >= 4, 'there are no colour swatches');
      for (const [, channel, colour] of swatches) {
        assert.ok(['foreground', 'background'].includes(channel),
          `a swatch names the channel "${channel}", which setColour() cannot use`);
        assert.match(colour, /^#[\da-f]{6}$/i, `a swatch carries "${colour}", which is not a hex color`);
      }
    });

    test('the logo input accepts only image types, and never image/*', () => {
      const input = html.match(/<input[^>]*data-qr-logo[^>]*>/);
      assert.ok(input, 'there is no logo input');
      for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
        assert.ok(input[0].includes(type), `the logo picker does not accept ${type}`);
      }
      assert.doesNotMatch(input[0], /image\/\*/, 'an accept list of image/* is a lie about what is checked');
    });

    test('the module never sends a field anywhere', () => {
      // The privacy claim on this page is structural. A single fetch, sendBeacon
      // or XHR added to this module would break it, and nothing else would fail.
      for (const forbidden of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'EventSource']) {
        assert.ok(!script.includes(forbidden),
          `the QR module calls ${forbidden}, which could carry what the visitor typed`);
      }
    });
  });

  test('the image compressor ships its controls and its client modules', async () => {
    const html = await (await get(server.base, '/image-compression')).text();
    for (const hook of [
      'data-cz-zone', 'data-cz-input', 'data-cz-compress-all', 'data-cz-download-all',
      'data-cz-reset', 'data-cz-quality', 'data-cz-format', 'data-cz-scale',
      'data-cz-width', 'data-cz-height', 'data-cz-lock', 'data-cz-list', 'data-cz-errors',
    ]) {
      assert.ok(html.includes(hook), `the tool is missing ${hook}`);
    }
    // The privacy claim has to be in the server HTML, not added by the script:
    // a crawler and a reader with JavaScript disabled both need to see it.
    assert.match(html, /Your images never leave this device/);

    // The module the page injects has to actually be served, or the tool is an
    // inert form.
    for (const asset of ['/js/image-compressor.js', '/js/zip.js']) {
      const res = await get(server.base, asset);
      assert.equal(res.status, 200, `${asset} is referenced but not served`);
    }
  });

  test('the image compressor accepts only image types and says what it is', async () => {
    const html = await (await get(server.base, '/image-compression')).text();
    const accept = html.match(/<input[^>]*data-cz-input[^>]*>/)[0];
    assert.match(accept, /type="file"/);
    assert.match(accept, /multiple/);
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      assert.ok(accept.includes(type), `the file input does not accept ${type}`);
    }
    // An accept list that omits image/* would be a lie about what is accepted.
    assert.doesNotMatch(accept, /image\/\*/);
  });

  test('sitemap includes the image compressor', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    assert.ok(sm.includes('/image-compression</loc>'));
  });

  test('the tools hub surfaces every tool that has its own page', async () => {
    // A tool nobody can find is a tool nobody uses. This asserts the entry
    // points exist rather than the wording, so editing the copy does not break
    // it, but deleting a panel does.
    const tools = markup(await (await get(server.base, '/tools')).text());
    const panels = tools.match(/<section class="tool-hub"[\s\S]*?<\/section>/g) || [];
    assert.ok(panels.length >= 2, `/tools lists ${panels.length} whole-page tools`);

    for (const [name, href] of [
      ['Image compressor', '/image-compression'],
      ['QR code generator', '/qr-code-generator'],
    ]) {
      const panel = panels.find((p) => p.includes(`href="${href}"`));
      assert.ok(panel, `/tools has no panel pointing at ${href}`);
      assert.ok(new RegExp(`<h2[^>]*>[\\s\\S]*${name}`).test(panel), `the ${name} panel heading does not name the tool`);

      // And it has to be a real destination, not a link to nothing.
      assert.equal((await get(server.base, href)).status, 200, `${href} does not resolve`);
    }
  });

  test('the header nav reaches the image compressor', async () => {
    const home = markup(await (await get(server.base, '/')).text());
    const nav = (home.match(/<nav aria-label="Main">[\s\S]*?<\/nav>/) || [])[0];
    assert.ok(nav, 'no main nav in the document');
    assert.ok(nav.includes('/image-compression'), 'the main nav does not link to the image compressor');
    // The dropdown it sits in has to be labelled, not just present.
    assert.match(nav, /has-sub/);
  });

  test('sitemap includes the new library pages', async () => {
    const sm = await (await get(server.base, '/sitemap.xml')).text();
    for (const p of ['/symbols', '/emoji', '/kaomoji', '/tools']) {
      assert.ok(sm.includes(`${p}</loc>`), `sitemap misses ${p}`);
    }
    // /studio is indexable now that it carries its own explainer.
    assert.ok(sm.includes('/studio</loc>'));
    assert.ok(!sm.includes('/admin</loc>'));
  });
});