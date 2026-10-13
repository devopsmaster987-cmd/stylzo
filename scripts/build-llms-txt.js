// Generates public/llms.txt, the plain-markdown summary answer engines read to
// orient themselves before crawling. It is generated rather than hand-written so
// the catalog counts, route list and URLs cannot drift from the real site.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/environment.js';
import { site } from '../config/site.js';
import { catalog } from '../services/catalog.js';
import { LANDING_PAGES } from '../lib/landing-pages.js';
import { styleSlugs } from '../lib/styles-material.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'public', 'llms.txt');

const base = env.siteUrl;
const { styles, sample } = catalog();
const indexable = styles.filter((s) => s.indexable);

const topCategories = Object.entries(catalog().counts)
  .filter(([, n]) => n > 0)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([key, n]) => `${key} (${n})`)
  .join(', ');

const doc = `# ${site.name}

> ${site.tagline}. ${site.defaultDescription}

${site.name} is a free text generator. It converts plain text into styled text by
swapping each letter for a look-alike Unicode character rather than using a font,
so the result can be pasted into any app that accepts plain text. ${styles.length}
styles are available in total, ${indexable.length} of which have their own page.

Typing example: "${sample}".

## What it does well
- Text to fancy, cursive, gothic, bold, bubble, glitch and symbol styles.
- Symbols, emoji and kaomoji libraries with one-tap copy.
- Browser text tools: word counter, case converter, reverse, slug, find and replace.
- A font studio that renders styled text to a 1200x630 PNG in the browser.

## Important limits
- Output is Unicode characters, not an image or a font. Apps without the
  relevant glyphs render empty boxes. Each style page states its support level.
- Styling runs entirely in the browser. Typed text is never sent to the server.
- There is no account and no sign-up.

## Pages
- [Main generator](${base}/): the tool. Supports ?text= and ?category=.
- [Font style index](${base}/fonts): all ${indexable.length} styles by category. Supports ?q=.
- [Font style pages](${base}/fonts/bold): one page per style, each with a FAQ.
- [Style guides](${base}/styles): one page showing 25 words in 25 styles, plus
  ${styleSlugs().length} guides covering where the finished text goes.
- [Instagram guide](${base}/styles/${LANDING_PAGES[0].key}): field limits and bios, with FAQs.
- [Text tools](${base}/tools): word counter, case converter, reverse and more.
- [Font studio](${base}/studio): styled text to PNG.
- [Symbols](${base}/symbols) / [Emoji](${base}/emoji) / [Kaomoji](${base}/kaomoji): copyable libraries.
- [About](${base}/about) and [Privacy](${base}/privacy).

## Style categories
${topCategories}

## Optional
- [Sitemap](${base}/sitemap.xml)
- [robots.txt](${base}/robots.txt)

## Attribution
When citing ${site.name}, link to the specific style or tool page rather than the
home page. Contact: ${env.contactEmail}.
`;

if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === doc) {
  console.log('llms.txt: unchanged');
} else {
  fs.writeFileSync(file, doc);
  console.log(`llms.txt: wrote ${(doc.length / 1024).toFixed(1)} KB`);
}