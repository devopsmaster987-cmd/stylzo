// Renders the featured/OG images for written guides: public/guides/<slug>.png
// at the 1200×630 social ratio. Output is deterministic and committed, so the
// site build does not depend on this script or on sharp being installed.
//
// Run via `node scripts/build-guide-images.js` after adding or changing a
// guide's `image` field in lib/guides.js.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'guides');
const W = 1200;
const H = 630;

const BRAND = '#4b2fe0';
const ACCENT = '#ffd84d';

/** Each entry mirrors guide.image in lib/guides.js (src under /guides/). */
const COVERS = [
  {
    file: 'fancy-text-for-whatsapp.png',
    kicker: 'WhatsApp styles',
    title: 'Fancy text for\nWhatsApp',
    // Real Unicode output of the styles the article recommends.
    sample: '𝓌𝒽𝒶𝓉𝓈𝒶𝓅𝓅',
    sample2: 'Quiet weekend',
    alt: 'Fancy text for WhatsApp: bold and cursive styles ready to paste into a status or display name',
  },
  {
    file: 'tiny-and-small-text.png',
    kicker: 'Superscript & small caps',
    title: 'Tiny and\nsmall text',
    sample: 'ᵗⁱⁿʸ ˡⁱⁿᵉ',
    sample2: 'QUIET LINE',
    alt: 'Tiny text examples: superscript and small-caps styles that look smaller without changing font size',
  },
  {
    file: 'how-to-make-fancy-text.png',
    kicker: 'Five-step workflow',
    title: 'How to make\nfancy text',
    sample: '𝒮𝓉𝓎𝓁 𝒿𝑜',
    sample2: 'plain → styled → paste',
    alt: 'How to make fancy text: type plain words, pick a Unicode style, copy and paste the result',
  },
  {
    file: 'fancy-numbers.png',
    kicker: 'Styled digits',
    title: 'Fancy\nnumbers',
    sample: '②⓪②⑥',
    sample2: 'circled · squared · raised',
    alt: 'Fancy numbers: circled, squared and superscript digits styled with Unicode and ready to paste',
  },
];

const esc = (s) => s
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function cover({ kicker, title, sample, sample2 }) {
  const titleLines = title.split('\n');
  const titleSpans = titleLines.map((line, i) =>
    `<tspan x="72" dy="${i === 0 ? 0 : 78}">${esc(line)}</tspan>`).join('');

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${BRAND}"/><stop offset="100%" stop-color="#7a4ff0"/>` +
    `</linearGradient>` +
    `<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0%" stop-color="${ACCENT}"/><stop offset="100%" stop-color="#ff9d5c"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    // Soft sample panel on the right — a real product preview, not a mockup.
    `<rect x="640" y="72" width="488" height="360" rx="20" fill="#ffffff" fill-opacity="0.12" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>` +
    `<text x="680" y="168" font-family="Georgia, 'Times New Roman', serif" font-size="56" fill="#ffffff">${esc(sample)}</text>` +
    `<text x="680" y="248" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="700" fill="${ACCENT}">${esc(sample2)}</text>` +
    `<text x="680" y="320" font-family="system-ui, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="26" fill="#ffffff" fill-opacity="0.85">Copy · paste · works as plain text</text>` +
    `<text x="680" y="372" font-family="system-ui, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="24" fill="#ffffff" fill-opacity="0.65">No install on either device</text>` +
    // Left column: kicker, title, brand.
    `<rect x="72" y="72" width="14" height="14" rx="3" fill="${ACCENT}"/>` +
    `<text x="100" y="86" font-family="system-ui, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="24" font-weight="600" letter-spacing="2" fill="#ffffff" fill-opacity="0.9">${esc(kicker.toUpperCase())}</text>` +
    `<text x="72" y="200" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="700" fill="#ffffff">${titleSpans}</text>` +
    `<text x="72" y="430" font-family="system-ui, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="30" fill="#ffffff" fill-opacity="0.88">Unicode characters · free · works in any app</text>` +
    // Brand bar.
    `<rect x="0" y="560" width="${W}" height="70" fill="url(#bar)"/>` +
    `<text x="72" y="606" font-family="Georgia, 'Times New Roman', serif" font-size="36" font-weight="700" fill="#1a1230">Stylzo</text>` +
    `<text x="${W - 72}" y="606" text-anchor="end" font-family="system-ui, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="24" fill="#1a1230" fill-opacity="0.8">fancy text guides</text>` +
    `</svg>`,
  );
}

fs.mkdirSync(outDir, { recursive: true });

for (const entry of COVERS) {
  const svg = cover(entry);
  const buf = await sharp(svg).png({ compressionLevel: 9 }).toBuffer();
  const file = path.join(outDir, entry.file);
  if (fs.existsSync(file) && fs.readFileSync(file).equals(buf)) {
    console.log(`unchanged ${entry.file}`);
    continue;
  }
  fs.writeFileSync(file, buf);
  console.log(`wrote ${entry.file} (${(buf.length / 1024).toFixed(1)} KB)`);
}
