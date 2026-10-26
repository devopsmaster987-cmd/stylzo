import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { get, startServer } from '../helpers/server.js';
import { catalog } from '../../services/catalog.js';
import { WHY_BOXES, WHAT_IT_IS } from '../../lib/aeo.js';

const jsonLd = (html, type) => {
  const re = new RegExp(
    `<script type="application/ld\\+json"[^>]*>(\\{"@context":"https://schema\\.org","@type":"${type}".*?\\})</script>`,
  );
  const m = html.match(re);
  return m ? JSON.parse(m[1]) : null;
};

const ldBlocks = (html) => [...html.matchAll(
  /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/g,
)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&')));

const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');
const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ');
const text = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const questionText = (html) => [...markup(html).matchAll(/<h3>([^<]*\?)<\/h3>/g)].map((m) => m[1]);

describe('answer engine optimisation', () => {
  let server;
  before(async () => { server = await startServer(3291); });
  after(() => server?.stop());

  describe('crawler access', () => {
    test('AI answer engines are allowed, and allowed by name', async () => {
      const rb = await (await get(server.base, '/robots.txt')).text();
      for (const agent of [
        'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai',
        'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bingbot',
        'cohere-ai', 'meta-externalagent',
      ]) {
        assert.ok(rb.includes(`User-Agent: ${agent}`), `robots.txt does not mention ${agent}`);
      }
      // Being named is not enough; the rule has to actually allow the crawl.
      for (const agent of ['GPTBot', 'ClaudeBot', 'PerplexityBot']) {
        const block = rb.split(`User-Agent: ${agent}`)[1]?.split('User-Agent:')[0] || '';
        assert.match(block, /Allow: \//, `${agent} is named but not allowed`);
      }
    });

    test('the admin area stays closed to every crawler, including AI ones', async () => {
      const rb = await (await get(server.base, '/robots.txt')).text();
      const block = rb.split('User-Agent: GPTBot')[1].split('User-Agent:')[0];
      assert.match(block, /Disallow: \/admin/);
      assert.match(block, /Disallow: \/api\//);
    });

    test('llms.txt is served as markdown and describes the real site', async () => {
      const res = await get(server.base, '/llms.txt');
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type'), /text\/markdown/);

      const body = await res.text();
      assert.match(body, /^# Stylzo/);
      // It has to point at pages that exist, or it is worse than nothing.
      for (const path of ['/fonts', '/tools', '/studio', '/image-compression', '/about', '/privacy', '/symbols',
        '/universal-text-fixer', '/screenshot-to-text', '/pdf-editor', '/pdf-accessibility-checker', '/qr-code-reader',
        '/tiktok-font-generator', '/facebook-font-generator', '/x-font-generator', '/youtube-font-generator', '/telegram-font-generator']) {
        assert.ok(body.includes(`](https://www.abdulsamad.shop${path}`), `llms.txt omits ${path}`);
      }
      assert.match(body, /## Important limits/, 'llms.txt should state what the tool cannot do');
      assert.match(body, /never sent to the server/, 'llms.txt should state the privacy position');
      for (const category of Object.values(catalog().categories)) {
        assert.ok(body.includes(category.name), `llms.txt omits the ${category.name} category`);
      }
    });

    test('llms.txt is generated, so it cannot drift from the catalog', () => {
      const build = readFileSync(new URL('../../scripts/build-llms-txt.js', import.meta.url), 'utf8');
      assert.match(build, /catalog\(\)/);
      assert.match(build, /styleSlugs\(\)/);
    });
  });

  describe('answer-first content', () => {
    const PAGES = ['/', '/tools', '/image-compression', '/qr-code-generator', '/qr-code-reader', '/about', '/privacy', '/terms', '/contact', '/symbols', '/emoji', '/kaomoji', '/fonts', '/styles', '/universal-text-fixer', '/screenshot-to-text', '/pdf-editor', '/pdf-accessibility-checker', '/tiktok-font-generator', '/facebook-font-generator', '/x-font-generator', '/youtube-font-generator', '/telegram-font-generator'];

    test('every page answers its core question before the long prose', async () => {
      for (const path of PAGES) {
        const doc = markup(await (await get(server.base, path)).text());
        assert.ok(doc.includes('class="quick-answer"'), `${path} has no answer-first block`);
        assert.match(doc, /class="quick-answer"[\s\S]*?<h2[^>]*>[^<]*\?<\/h2>/, `${path} answer block has no question`);
      }
    });

    test('each answer-first paragraph is 40 to 60 words', async () => {
      for (const path of PAGES) {
        const doc = markup(await (await get(server.base, path)).text());
        const block = doc.slice(doc.indexOf('class="quick-answer"'));
        const paragraph = (block.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || '';
        const count = text(paragraph).split(' ').filter(Boolean).length;
        assert.ok(
          count >= 40 && count <= 60,
          `${path} answer is ${count} words, outside 40-60`,
        );
      }
    });

    test('the answer-first block is also emitted as a Question node', async () => {
      // The visible block and the schema node are generated from the same
      // constant, so neither can drift from the other. Without this the block
      // renders but nothing tells an assistant the page answers anything.
      for (const path of PAGES) {
        const html = await (await get(server.base, path)).text();
        const doc = markup(html);
        const heading = (doc.match(/class="quick-answer"[\s\S]*?<h2[^>]*>([^<]+)<\/h2>/) || [])[1];
        assert.ok(heading, `${path} has no answer-first heading`);
        const questions = ldBlocks(html).filter((b) => b['@type'] === 'Question');
        assert.ok(
          questions.some((q) => q.name === heading.trim()),
          `${path} shows "${heading.trim()}" but emits no Question node for it`,
        );
      }
    });

    test('the answer comes before the supporting prose in document order', async () => {
      const html = await (await get(server.base, '/')).text();
      const answerAt = html.indexOf('class="quick-answer"');
      const howAt = html.indexOf('id="how-heading"');
      assert.ok(answerAt > 0 && howAt > answerAt, 'the answer must appear before the long sections');
    });

    test('answers are self-contained: they do not depend on the page around them', async () => {
      for (const path of ['/', '/about', '/terms']) {
        const doc = markup(await (await get(server.base, path)).text());
        const answer = doc.slice(doc.indexOf('class="quick-answer"'), doc.indexOf('class="quick-answer"') + 700);
        const paragraph = (answer.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || '';
        assert.ok(paragraph.length > 60, `${path} answer is too thin to quote`);
        assert.ok(/[.!?]$/.test(paragraph.trim()), `${path} answer is not a complete statement`);
      }
    });
  });

  describe('structured data matches visible content', () => {
    test('the home page emits a WebSite node with a publisher', async () => {
      const site = jsonLd(await (await get(server.base, '/')).text(), 'WebSite');
      assert.ok(site);
      assert.equal(site.name, 'Stylzo');
      assert.ok(site.publisher?.['@id'], 'WebSite should reference its publisher');
    });

    test('visible FAQ questions remain, without FAQPage rich-result markup', async () => {
      for (const path of ['/tools', '/image-compression', '/qr-code-generator', '/qr-code-reader', '/about', '/symbols', '/studio', '/fonts', '/styles',
        '/universal-text-fixer', '/screenshot-to-text', '/pdf-editor', '/pdf-accessibility-checker']) {
        const html = await (await get(server.base, path)).text();
        const doc = markup(html);
        assert.ok(doc.includes('Common questions') || doc.includes('Frequently asked questions'), `${path} lost its visible FAQ`);
        assert.ok(questionText(html).length > 0, `${path} has no visible FAQ questions`);
        assert.equal(jsonLd(html, 'FAQPage'), null, `${path} still emits FAQPage`);
      }
    });

    test('FAQ headings are phrased the way a person would ask', async () => {
      for (const path of ['/tools', '/about']) {
        const html = await (await get(server.base, path)).text();
        for (const question of questionText(html)) {
          assert.ok(question.includes('?'), `"${question}" is not a question`);
        }
      }
    });

    test('the font pages answer what they are and whether they will work', async () => {
      for (const slug of ['bold', 'fraktur', 'zalgo-light']) {
        const html = await (await get(server.base, `/fonts/${slug}`)).text();
        const doc = markup(html);
        assert.ok(doc.includes('class="quick-answer"'), `/fonts/${slug} has no answer-first block`);
        assert.match(doc, /empty boxes/, `/fonts/${slug} does not explain the support failure mode`);

        const answers = ldBlocks(html).filter((b) => b['@type'] === 'Question');
        assert.ok(answers.length > 0, `/fonts/${slug} emits no Question node`);
        assert.ok(answers.every((q) => q.name.includes('?')), 'Question nodes must be questions');
      }
    });

    test('the studio describes real steps without HowTo rich-result markup', async () => {
      const html = await (await get(server.base, '/studio')).text();
      const doc = markup(html);
      const list = (doc.match(/<ol class="how-steps">([\s\S]*?)<\/ol>/) || [])[1] || '';
      const steps = [...list.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
      assert.ok(steps.length >= 3, '/studio shows fewer than 3 how-to steps');
      assert.equal(ldBlocks(html).some((b) => b['@type'] === 'HowTo'), false, '/studio still emits HowTo');
      for (const step of steps) {
        assert.ok(step.length > 3, `thin step name: "${step}"`);
      }
    });

    test('a filtered /fonts view does not claim the unfiltered page questions', async () => {
      // ?q= is noindex and canonicalises to /fonts. Repeating /fonts's own FAQ
      // for a filtered render would describe a page that does not contain it.
      const html = await (await get(server.base, '/fonts?q=bold')).text();
      const questions = ldBlocks(html).filter((b) => b['@type'] === 'Question');
      assert.equal(questions.length, 0, 'a filtered render must not carry Question nodes');
      assert.equal(ldBlocks(html).some((b) => b['@type'] === 'FAQPage'), false, 'and no FAQPage');
      assert.equal(ldBlocks(html).some((b) => b['@type'] === 'HowTo'), false, 'and no HowTo');
    });

    test('rich-result schema types are not emitted on key pages', async () => {
      for (const path of ['/', '/tools', '/about', '/fonts', '/styles', '/studio', '/fonts/bold',
        '/fonts/category/italic', '/styles/instagram', '/image-compression', '/qr-code-generator',
        '/tiktok-font-generator', '/facebook-font-generator', '/x-font-generator', '/youtube-font-generator', '/telegram-font-generator']) {
        const blocks = ldBlocks(await (await get(server.base, path)).text());
        assert.equal(blocks.some((b) => b['@type'] === 'FAQPage'), false, `${path} emits FAQPage`);
        assert.equal(blocks.some((b) => b['@type'] === 'HowTo'), false, `${path} emits HowTo`);
      }
    });

    test('the shared definition and box explanation are server-rendered', async () => {
      for (const path of ['/', '/about']) {
        const doc = text(markup(await (await get(server.base, path)).text()));
        assert.ok(doc.includes(WHAT_IT_IS), `${path} does not render the shared definition`);
      }
      const about = text(markup(await (await get(server.base, '/about')).text()));
      assert.ok(about.includes('How do fancy text generators work?'), '/about has no generator explanation');
      assert.ok(about.includes('Why does my fancy text show up as empty boxes?'), '/about has no box explanation');
      assert.ok(about.includes(WHY_BOXES), '/about does not render the shared box explanation');
    });

    test('the about page states every quotable figure, and only real ones', async () => {
      // These are the numbers a generated answer is most likely to repeat, so
      // they have to be visible, and they have to match the catalog.
      const doc = markup(await (await get(server.base, '/about')).text());
      assert.match(doc, /<h2[^>]*>Key facts<\/h2>/, '/about has no key-facts block');

      const total = catalog().styles.length.toLocaleString('en-US');
      assert.ok(doc.includes(total), `/about never states the real style total (${total})`);
      assert.ok(
        doc.includes(String(Object.keys(catalog().categories).length)),
        '/about never states the real category count',
      );

      // Every <dt> must be paired with a value on the page: a label with no
      // figure beside it is a heading, not a fact.
      const terms = [...doc.matchAll(/<dt>([^<]+)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)];
      assert.ok(terms.length >= 5, `/about states only ${terms.length} facts`);
      for (const [, label, value] of terms) {
        assert.ok(
          value.replace(/<[^>]+>/g, '').trim().length > 20,
          `"${label}" is stated without enough detail to quote`,
        );
      }
    });

    test('the studio comparison is a real table with real headers', async () => {
      // Models extract comparisons from tables far more reliably than from
      // prose, but only when the headers are marked up as headers.
      const doc = markup(await (await get(server.base, '/studio')).text());
      assert.match(doc, /<table[\s\S]*?<caption>[\s\S]*?<\/caption>/, '/studio has no captioned table');
      assert.ok(
        (doc.match(/scope="col"/g) || []).length >= 2,
        'the comparison table has no column headers',
      );
      assert.ok(
        (doc.match(/scope="row"/g) || []).length >= 2,
        'the comparison table has no row headers',
      );
    });

    test('a personalised render does not claim answers it is not showing', async () => {
      // ?text= renders someone else's text. Claiming the page's own answers and
      // FAQ for it would misrepresent what the page contains.
      const html = await (await get(server.base, '/fonts/bold?text=Ali')).text();
      const questions = ldBlocks(html).filter((b) => b['@type'] === 'Question');
      assert.equal(questions.length, 0, 'a noindex render must not carry Question nodes');
    });

    test('no page emits JSON-LD that is not valid JSON', async () => {
      for (const path of ['/', '/tools', '/about', '/fonts/bold', '/symbols', '/styles/instagram', '/image-compression', '/qr-code-generator',
        '/qr-code-reader',
        '/universal-text-fixer', '/screenshot-to-text', '/pdf-editor', '/pdf-accessibility-checker']) {
        const html = await (await get(server.base, path)).text();
        // ldBlocks() JSON.parses every block; reaching here without a throw is
        // the assertion.
        const blocks = ldBlocks(html);
        assert.ok(blocks.length > 0, `${path} emitted no structured data`);
        for (const b of blocks) {
          assert.equal(b['@context'], 'https://schema.org', `${path} has a block with the wrong @context`);
          assert.ok(b['@type'], `${path} has a block with no @type`);
        }
      }
    });
  });
});