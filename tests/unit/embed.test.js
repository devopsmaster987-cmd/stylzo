import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { get, startServer } from '../helpers/server.js';

// The widget and the npm package are the two things on this site that earn links
// from other people's pages, so both need to actually work rather than merely
// exist. These tests run the real code rather than pattern-matching the source.

const WIDGET = new URL('../../public/embed/stylzo-embed.js', import.meta.url);
const PKG_DIR = new URL('../../services/unicode/', import.meta.url);

describe('embeddable widget', () => {
  let server;
  before(async () => { server = await startServer(3241); });
  after(() => server?.stop());

  test('the widget is served with a JavaScript content type', async () => {
    const res = await get(server.base, '/embed/stylzo-embed.js');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /javascript/);
  });

  test('the widget is small enough to be worth embedding', async () => {
    const res = await (await get(server.base, '/embed/stylzo-embed.js')).text();
    const kb = Buffer.byteLength(res, 'utf8') / 1024;
    assert.ok(kb < 12, `the widget is ${kb.toFixed(1)} KB, over the 10 KB claim on /embed`);
  });

  test('it links back, and does not hide the link', async () => {
    const src = readFileSync(WIDGET, 'utf8');
    assert.match(src, /rel="nofollow noopener" target="_blank"/, 'the attribution link is missing');
    assert.match(src, /Powered by/, 'the attribution text is missing');
    // A link that is only in the HTML source, with nothing a visitor sees, is
    // not a link in the sense the embed terms rely on.
    assert.match(src, /class="foot"/, 'the attribution has no visible container');
  });

  test('it depends on nothing but its own origin', async () => {
    const src = readFileSync(WIDGET, 'utf8');
    const imports = [...src.matchAll(/^import .* from ['"]([^'"]+)['"]/gm)].map((m) => m[1]);
    assert.ok(imports.length > 0, 'expected the engine to be imported');
    for (const spec of imports) {
      assert.ok(
        spec.startsWith('/') || spec.startsWith('http'),
        `the widget imports "${spec}"; a bare specifier would not resolve on a host page`,
      );
    }
  });

  test('the origin it derives is the origin it was served from', async () => {
    // Read via the same mechanism the widget uses, so a broken fallback shows
    // up here rather than only in someone else's page.
    const res = await (await get(server.base, '/embed/stylzo-embed.js')).text();
    const m = res.match(/const ORIGIN = \(\(\) => \{[\s\S]*?\}\)\(\);/);
    assert.ok(m, 'ORIGIN block not found');
    assert.match(m[0], /import\.meta\.url/, 'ORIGIN is hardcoded instead of derived');
  });

  test('the styles it references exist in the engine', async () => {
    const src = readFileSync(WIDGET, 'utf8');
    const block = (src.match(/const STYLES = \[([\s\S]*?)\];/) || [])[1];
    assert.ok(block, 'the STYLES table was not found');
    const styles = [...block.matchAll(/\['([a-z0-9-]+)',\s*'[^']+'\]/g)].map((m) => m[1]);
    assert.ok(styles.length >= 10, `only ${styles.length} widget styles found, not the advertised dozen`);
    const { ALPHABETS } = await import('../../services/unicode/mappings.js');
    for (const name of styles) {
      assert.ok(ALPHABETS[name], `the widget offers "${name}", which is not an alphabet`);
    }
  });

  test('the embed page documents the snippet and the conditions', async () => {
    const html = await (await get(server.base, '/embed')).text();
    assert.match(html, /data-stylzo-embed/, 'the snippet is not shown');
    assert.match(html, /\/embed\/stylzo-embed\.js/, 'the script src is not shown');
    assert.match(html, /@stylzo\/unicode/, 'the npm package is not mentioned');
    assert.match(html, /<h1[^>]*>Embed the fancy text generator<\/h1>/);
  });

  test('the embed page is in the sitemap', async () => {
    const xml = await (await get(server.base, '/sitemap.xml')).text();
    assert.match(xml, /<loc>[^<]*\/embed<\/loc>/, '/embed is not in the sitemap');
  });
});

describe('npm package', () => {
  test('it declares the fields npm needs to publish', () => {
    const pkg = JSON.parse(readFileSync(new URL('package.json', PKG_DIR), 'utf8'));
    assert.equal(pkg.name, '@stylzo/unicode');
    assert.equal(pkg.license, 'MIT', 'no license blocks publishing entirely');
    assert.ok(pkg.version, 'no version');
    assert.ok(pkg.description?.length > 40, 'the description is too thin to be useful on npm');
    assert.ok(pkg.repository?.url, 'no repository link, which is what earns the stars');
    assert.ok(pkg.homepage, 'no homepage link back to the site');
    assert.ok(pkg.keywords.length >= 5, 'too few keywords to be findable');
  });

  test('its files field lists everything the entry points need', () => {
    const pkg = JSON.parse(readFileSync(new URL('package.json', PKG_DIR), 'utf8'));
    for (const entry of Object.values(pkg.exports)) {
      const file = entry.replace(/^\.\//, '');
      assert.ok(pkg.files.includes(file), `exports points at ${file}, which files omits`);
    }
  });

  test('it has a licence file and a readme', () => {
    assert.ok(readFileSync(new URL('LICENSE', PKG_DIR), 'utf8').includes('MIT'));
    const readme = readFileSync(new URL('README.md', PKG_DIR), 'utf8');
    assert.match(readme, /npm install @stylzo\/unicode/);
  });

  test('the readme links back to the site', () => {
    // The README is the thing people read on npm and GitHub. A link back is
    // the entire reason the package is worth publishing.
    const readme = readFileSync(new URL('README.md', PKG_DIR), 'utf8');
    assert.match(readme, /https:\/\/www\.abdulsamad\.shop/, 'the readme does not link to the site');
  });

  test('every javascript example in the readme actually runs', () => {
    // This exists because two of these examples were wrong when first written:
    // marks was documented as an options object, then as a mark name that does
    // not exist. Both produced literal text in the output instead of throwing.
    const readme = readFileSync(new URL('README.md', PKG_DIR), 'utf8');
    const dir = fileURLToPath(PKG_DIR);

    // Only real calls inside fenced ```js blocks. A plain regex over the whole
    // file also matches the `transform(text, pipeline, opts?)` signature in the
    // API heading, which is a signature and not something that runs.
    const blocks = [...readme.matchAll(/```js\n([\s\S]*?)```/g)].map((m) => m[1]);
    const calls = [];
    for (const block of blocks) {
      let from = 0;
      for (;;) {
        const start = block.indexOf('transform(', from);
        if (start === -1) break;
        // Walk to the matching close paren rather than trusting a regex, since
        // the arguments contain nested braces and brackets.
        let depth = 0;
        let end = start;
        for (; end < block.length; end += 1) {
          if (block[end] === '(') depth += 1;
          else if (block[end] === ')') {
            depth -= 1;
            if (depth === 0) break;
          }
        }
        calls.push(block.slice(start + 'transform('.length, end));
        from = end + 1;
      }
    }
    assert.ok(calls.length >= 3, `only found ${calls.length} runnable examples`);

    calls.forEach((call, i) => {
      // The scratch file is written inside the package so its relative imports
      // resolve against the real modules, rather than inlining their source and
      // duplicating every declaration.
      const tmp = join(dir, `.readme-check-${i}.mjs`);
      try {
        writeFileSync(tmp, [
          "import { transform } from './engine.js';",
          "import { COMBINING, zalgoMarks, seededRng } from './decorators.js';",
          `console.log(String(${call}));`,
        ].join('\n'));
        const out = execFileSync(process.execPath, [tmp], { encoding: 'utf8' });

        // An unknown mark name is inserted literally rather than rejected, so
        // this is the specific way a bad example shows up: the word itself
        // ends up in the styled output.
        assert.doesNotMatch(out, /\[object Object\]/, `readme example ${i + 1} emitted [object Object]: ${call}`);
        assert.doesNotMatch(out, /undefined/, `readme example ${i + 1} emitted undefined: ${call}`);
        assert.doesNotMatch(
          out, /\b(strikethrough|underline|overline)\b/,
          `readme example ${i + 1} leaked a mark name instead of the mark: ${out}`,
        );
        assert.ok(out.trim().length > 0, `readme example ${i + 1} produced nothing: ${call}`);
      } finally {
        rmSync(tmp, { force: true });
      }
    });
  });
});