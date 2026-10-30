// Renders the raster social/PWA images that a vector favicon cannot cover:
//   public/og-default.png   1200x630  og:image / twitter:image
//   public/apple-touch-icon.png  180x180  iOS share sheet + home screen
//   public/icon-192.png / public/icon-512.png   manifest + install prompt
//
// Run via `npm run build:icons`. Output is deterministic and committed, so the
// build itself does not depend on this script or on sharp being installed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (name) => path.join(root, 'public', name);

const BRAND = '#4b2fe0';
const ACCENT = '#ffd84d';

// The mark, matching public/favicon.svg.
const mark = (size) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">` +
  `<rect width="64" height="64" rx="14" fill="${BRAND}"/>` +
  `<path d="M20 46V18h24v7H28v4h13v7H28v10z" fill="${ACCENT}"/></svg>`,
);

/** Square app icon: the mark on a solid brand background. */
const icon = (size) => sharp({
  create: { width: size, height: size, channels: 4, background: BRAND },
})
  .composite([{ input: mark(size), top: 0, left: 0 }])
  .png({ compressionLevel: 9 })
  .toBuffer();

// A real preview of the product: the styled sample text is what the tool makes.
const SAMPLE = '𝒮𝓉𝓎𝓁𝔃𝑜';

function ogImage() {
  const size = 1200;
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="630">` +
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="#4b2fe0"/><stop offset="100%" stop-color="#7a4ff0"/>` +
    `</linearGradient>` +
    `<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0%" stop-color="#ffd84d"/><stop offset="100%" stop-color="#ff9d5c"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="${size}" height="630" fill="url(#bg)"/>` +
    `<rect x="0" y="560" width="${size}" height="70" fill="url(#bar)"/>` +
    // The logo tile is composited from the same mark() used for the app icons,
    // rather than inlined with a transform: that keeps one source of truth and
    // sidesteps the SVG transform-order ambiguity around translate/scale.
    `<rect x="80" y="80" width="104" height="104" rx="22" fill="#ffffff" fill-opacity="0.14"/>` +
    `<text x="80" y="290" font-family="Georgia, 'Times New Roman', serif" font-size="86" fill="#ffffff">${SAMPLE}</text>` +
    `<text x="80" y="382" font-family="Georgia, 'Times New Roman', serif" font-size="82" font-weight="700" fill="#ffffff">Stylzo</text>` +
    `<text x="80" y="446" font-family="system-ui, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="38" fill="#ffffff" fill-opacity="0.9">Fancy text generator — 5,578 Unicode styles</text>` +
    `<text x="80" y="500" font-family="system-ui, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="32" fill="#ffffff" fill-opacity="0.72">Real Unicode characters. Free, no sign-up.</text>` +
    `</svg>`,
  );

  return sharp(svg)
    .composite([{ input: mark(104), top: 80, left: 80 }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const jobs = [
  ['og-default.png', await ogImage()],
  ['apple-touch-icon.png', await icon(180)],
  ['icon-192.png', await icon(192)],
  ['icon-512.png', await icon(512)],
];

for (const [name, buf] of jobs) {
  const file = out(name);
  if (fs.existsSync(file) && fs.readFileSync(file).equals(buf)) {
    console.log(`unchanged ${name}`);
    continue;
  }
  fs.writeFileSync(file, buf);
  console.log(`wrote ${name} (${(buf.length / 1024).toFixed(1)} KB)`);
}