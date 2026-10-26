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
import { PLATFORM_PAGES } from '../lib/platform-pages.js';
import { styleSlugs } from '../lib/styles-material.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'public', 'llms.txt');

const base = env.siteUrl;
const { styles, sample, categories, counts } = catalog();
const indexable = styles.filter((s) => s.indexable);

const categoryList = Object.entries(counts)
  .filter(([, n]) => n > 0)
  .sort((a, b) => b[1] - a[1])
  .map(([key, n]) => `${categories[key].name} (${n})`)
  .join(', ');

const doc = `# ${site.name}

> Free Unicode text generator. ${styles.length.toLocaleString('en-US')} styles across ${Object.keys(categories).length} categories, with ${indexable.length} dedicated style pages.

${site.name} converts plain text into styled text by replacing letters with look-alike Unicode characters, not by applying a font. The result pastes into any app that accepts plain text. Typing example: "${sample}".

## What it does
- Generates and copies text styles in the browser, with no account.
- Provides a searchable style index, ${indexable.length} dedicated style pages and platform style guides.
- Includes symbols, emoji and kaomoji libraries with one-tap copy.
- Includes browser text tools: word counter, case converter, reverse, slug and find and replace.
- Includes an image compressor, text fixer, screenshot-to-text OCR, PDF page editor, PDF accessibility checker, QR code generator and QR code reader.
- Includes a font studio that renders styled text to a 1200x630 PNG in the browser.

## Important limits
- Output is Unicode characters, not an image or a font. Apps without the relevant glyphs render empty boxes; each style page states its support level.
- Styling runs entirely in the browser. Typed text is never sent to the server.
- Images, PDFs and QR code images are decoded and processed on the visitor's device, not uploaded.
- PNG compression is lossless, so a PNG can get larger instead of smaller. The tool reports the real byte change.
- There is no account and no sign-up.

## Pages
- [Main generator](${base}/): the tool. Supports ?text= and ?category=.
- [Font style index](${base}/fonts): all ${indexable.length} styles by category. Supports ?q=.
- [Font style pages](${base}/fonts/bold): one page per style, with support notes and examples.
- [Style guides](${base}/styles): 25 words in 25 styles, plus ${styleSlugs().length} platform guides.
- [Instagram guide](${base}/styles/${LANDING_PAGES[0].key}): field limits, bio styles and FAQs.
${PLATFORM_PAGES.map((page) => `- [${page.subject} font generator](${base}${page.path}): field rules, limits and styles for ${page.subject}.`).join('\n')}
- [Text tools](${base}/tools): word counter, case converter, reverse, slug and more.
- [QR code generator](${base}/qr-code-generator): codes for links, text, Wi-Fi, email, phone, SMS, WhatsApp, contacts, maps and events.
- [QR code reader](${base}/qr-code-reader): read a QR code from an image without uploading it.
- [Image compressor](${base}/image-compression): compress JPG, PNG and WebP in the browser with the real before-and-after size.
- [Text fixer](${base}/universal-text-fixer): repair spacing, punctuation, invisible characters, capitalisation, repeated words and common misspellings.
- [Screenshot to text](${base}/screenshot-to-text): recognise text from an image in a Web Worker, then edit or replace a line.
- [PDF editor](${base}/pdf-editor): reorder, rotate, duplicate, merge and stamp PDF pages without uploading the document.
- [PDF accessibility checker](${base}/pdf-accessibility-checker): check tags, language, title, fonts, alt text, links and form labels.
- [Font studio](${base}/studio): styled text to a 1200x630 PNG.
- [Symbols](${base}/symbols), [Emoji](${base}/emoji), [Kaomoji](${base}/kaomoji): copyable libraries.
- [About](${base}/about) and [Privacy](${base}/privacy).

## Style categories
${categoryList}

## Optional
- [Sitemap](${base}/sitemap.xml)
- [robots.txt](${base}/robots.txt)

## Attribution
When citing ${site.name}, link to the specific style or tool page rather than the home page. Contact: ${env.contactEmail}.
`;

if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === doc) {
  console.log('llms.txt: unchanged');
} else {
  fs.writeFileSync(file, doc);
  console.log(`llms.txt: wrote ${(doc.length / 1024).toFixed(1)} KB`);
}
