import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { get, startServer } from '../helpers/server.js';

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
        'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bingbot',
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
      for (const path of ['/fonts', '/tools', '/studio', '/about', '/privacy', '/symbols']) {
        assert.ok(body.includes(`](https://www.abdulsamad.shop${path}`), `llms.txt omits ${path}`);
      }
      assert.match(body, /## Important limits/, 'llms.txt should state what the tool cannot do');
      assert.match(body, /never sent to the server/, 'llms.txt should state the privacy position');
    });

    test('llms.txt is generated, so it cannot drift from the catalog', () => {
      const build = readFileSync(new URL('../../scripts/build-llms-txt.js', import.meta.url), 'utf8');
      assert.match(build, /catalog\(\)/);
      assert.match(build, /boardSlugs\(\)/);
    });
  });

  describe('answer-first content', () => {
    const PAGES = ['/', '/tools', '/about', '/privacy', '/terms', '/contact', '/symbols', '/emoji', '/kaomoji'];

    test('every page answers its core question before the long prose', async () => {
      for (const path of PAGES) {
        const doc = markup(await (await get(server.base, path)).text());
        assert.ok(doc.includes('class="quick-answer"'), `${path} has no answer-first block`);
        assert.match(doc, /class="quick-answer"[\s\S]*?<h2[^>]*>[^<]*\?<\/h2>/, `${path} answer block has no question`);
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

    test('every FAQ question in schema is also a visible heading', async () => {
      // Schema the page does not show is a manual-action risk, and it is the
      // most common way structured data goes wrong.
      for (const path of ['/tools', '/about', '/symbols']) {
        const html = await (await get(server.base, path)).text();
        const faq = jsonLd(html, 'FAQPage');
        assert.ok(faq, `${path} has no FAQPage`);
        const visible = new Set(questionText(html));
        for (const q of faq.mainEntity) {
          assert.ok(visible.has(q.name), `${path} claims an invisible FAQ: "${q.name}"`);
          assert.ok(q.acceptedAnswer.text.length > 40, `${path} has a thin answer for "${q.name}"`);
        }
      }
    });

    test('answers are phrased the way a person would ask', async () => {
      // Assistant queries are questions, not keywords.
      for (const path of ['/tools', '/about']) {
        const faq = jsonLd(await (await get(server.base, path)).text(), 'FAQPage');
        for (const q of faq.mainEntity) {
          assert.ok(q.name.includes('?'), `"${q.name}" is not a question`);
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

    test('a personalised render does not claim answers it is not showing', async () => {
      // ?text= renders someone else's text. Claiming the page's own answers and
      // FAQ for it would misrepresent what the page contains.
      const html = await (await get(server.base, '/fonts/bold?text=Ali')).text();
      const questions = ldBlocks(html).filter((b) => b['@type'] === 'Question');
      assert.equal(questions.length, 0, 'a noindex render must not carry Question nodes');
    });

    test('no page emits JSON-LD that is not valid JSON', async () => {
      for (const path of ['/', '/tools', '/about', '/fonts/bold', '/symbols', '/styles/instagram']) {
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