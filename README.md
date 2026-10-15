# Stylzo

Server-rendered text-styling site built on **Next.js (App Router)**. Pages are React Server
Components that stream complete HTML; interactivity is progressive enhancement from vanilla ES
modules in `public/js/`, with a React Three Fiber hero as the only client-rendered island.

Type text once, get 5,600+ Unicode styles you can paste anywhere — plus symbol, emoji and kaomoji
libraries, browser-based text tools, a QR code generator and a font studio for shareable images.

## Run it

```bash
npm install
cp .env.example .env     # optional, every feature degrades gracefully without it
npm run dev              # http://localhost:3000
npm test                 # 150 tests (builds first, then drives the production server)
```

Node 20+ required.

## Useful scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Syncs the browser engine copy, rebuilds the catalog cache and the keyword map, then starts the Next dev server |
| `npm run build` | Syncs the browser engine copy, rebuilds the catalog cache and the keyword map, then builds for production |
| `npm start` | Serves the production build |
| `npm run build:fonts` | Regenerates `data/fonts.json` (5,600+ styles) from the composition rules in `scripts/build-fonts.js` |
| `npm run build:catalog` | Rebuilds `data/.catalog-cache.json`, the derived-index artifact `services/catalog.js` loads at boot |
| `npm run build:keywords` | Rebuilds `data/keyword-map.json`, `data/keyword-report.json` and `data/keyword-audit.md` from `data/keywords.txt` |
| `npm run sync:engine` | Copies `services/unicode/*` to `public/js/engine/` so the browser runs the exact same engine |
| `npm test` | Builds, boots `next start`, and runs the unit + integration suites against it |

Run `npm test` after changing a mapping or a style rule — it fails when the browser copy of the
engine or the precomputed examples in the data go stale. Re-run `npm run build:fonts` whenever the
style data changes; `dev` and `build` rebuild the cache automatically.

## Performance

The catalog is 5,616 styles and `data/fonts.json` is 3 MB, so the server never derives anything from
it on a request:

- `scripts/build-catalog.js` writes `data/.catalog-cache.json` — a projection of `fonts.json` holding
  the slug map, per-category lists, counts and indexable/popular ordering as *positions* into the
  style array. `data/fonts.json` stays the source of truth; the artifact is gitignored and regenerated
  by `dev` and `build`.
- `services/catalog.js` loads that artifact once, before the first request, and re-links the positions
  into `Map`s. Previously it re-read and re-parsed 3 MB of JSON every five minutes, blocking the event
  loop for ~146 ms mid-request. It still falls back to reading `fonts.json` if the artifact is missing,
  and dev keeps the TTL so editing data shows up without a restart.
- The indexable styles are also resolved to records once, at boot, rather than rebuilt from the
  position list on every `/fonts/[slug]` request.
- `GET /api/styles` with no query returns the whole catalog and never varies, so the body is serialized
  once per process instead of mapping 5,616 objects and re-encoding 0.8 MB per hit.
- Filtering by category is a `Map` hit rather than a scan, and `relatedStyles` scans only the ~100
  indexable styles instead of all 5,616.

### Per-request work that used to be repeated

Everything below was recomputed on every hit even though the inputs cannot change while the process
runs. The rule applied: derive once per process what is constant, and compute once what is requested.

- **The meta builders run twice per request.** Every page calls its builder in `generateMetadata()`
  and again in the component. `toMetadata()` throws the JSON-LD away, so the first pass serialized
  blocks nobody read — 219 KB of string on `/emoji`. `buildMeta()` now leaves the blocks unserialized
  on `ld` and exposes `jsonLd` as a lazy getter (`attachJsonLd`), so nothing is stringified until
  something reads it. The getter is non-enumerable on purpose: spreading a meta object must not
  quietly materialize the blocks, which is what made the double build invisible in the first place.
- **The library pages rebuilt their own data three times per request.** `libraryGroups()` and
  `libraryMetadata()` are pure functions of a build artifact, and there are only three library keys,
  so both are memoised per key. On `/emoji` this removes ~12 ms per request (measured: building the
  ItemList costs 6.4 ms, and it was built twice).
- **ItemList URLs were resolved per item.** Every entry in a category's list points at that one
  section anchor, so `/emoji` built 1,923 URLs to use 9. The anchor is now resolved once per category.
- **`abs()` went through the URL parser for every canonical, breadcrumb and list entry.** Plain
  `/segment` and `/segment#fragment` paths concatenate against the already-normalised site URL, which
  is byte-identical to what the parser returns. Anything that can actually need normalising — a dot
  segment, a query string, a percent-encoded byte, a protocol-relative `//` — still falls through to
  `new URL`, so the canonical and `og:url` contract is unchanged.
- **The CSP was rebuilt per request.** Everything it branches on (production flag, AdSense, Firebase)
  is fixed for the life of the process, so `proxy.js` assembles the policy once and substitutes the
  nonce into a placeholder. The nonce is still fresh per request.
- `components/scripts.jsx` emits `<link rel="modulepreload">` for the page's modules, so the browser
  starts fetching them during the HTML parse instead of only after hydration finishes. The modules are
  still injected post-hydration, because several of them write to markup React owns (the nav toggle's
  `hidden`, the ad slots) and running them earlier would hydrate against a DOM they had already
  rewritten. Cost is ~300 bytes a page; the injected tag carries `crossorigin` so the browser actually
  reuses the preloaded module instead of fetching it twice.

Because `proxy.js` mints a per-request CSP nonce, every page is dynamically rendered and static HTML
caching stays off by design. The render work per page is small, so request cost is dominated by the
React render, not by the catalog. Profiling the production server confirms this: the remaining time is
React's own SSR runtime, gzip and the socket write, and the only remaining app-level cost worth
naming is the `/emoji` page, which renders 1,923 buttons into 1.6 MB of markup (~150 KB gzipped). That
is a content decision rather than a code one.

## How it fits together

- `app/` is the App Router. Every page is a Server Component; `generateMetadata` emits the
  title/description/canonical/robots/OpenGraph tags, and `components/json-ld.jsx` writes the
  JSON-LD blocks with the request nonce.
- `proxy.js` is the middleware: it mints a per-request nonce, sets the CSP (plus referrer,
  permissions, nosniff and HSTS headers), and Next.js copies that nonce onto its own script tags,
  so no `unsafe-inline` is needed in production.
- `services/unicode/` is the pure engine. `transform(text, pipeline)` runs ordered stages: case,
  map, combine, frame, flair, zalgo, fn. No I/O, so Node and the browser share it.
- `data/fonts.json` holds style records with resolved `pipeline`s — adding a style is data only.
  `services/catalog.js` is the data-access layer (catalog, categories, libraries) over that data,
  using `node:fs`, so pages and route handlers run on the Node runtime, not Edge.
- `components/scripts.jsx` is a small client component that injects the page's ES modules after
  hydration, which keeps the DOM contract with `public/js/*.js` intact.
- `app/api/**/route.js` are the JSON endpoints. `lib/api.js` holds the shared error mapping and the
  in-memory rate limiter.
- Feature flags are env-driven: without `AI_API_KEY` the AI stylist uses its rules engine, without
  `ADMIN_KEY` the dashboard stays closed.
- The 100 curated styles are indexable and in the sitemap. Composed combinations stay `noindex`
  and canonicalise to their parent.
- `/fancy-text-generator` is a 308 to `/`; uppercase `/fonts/Bold` and `/styles/Instagram`
  normalise to their lowercase routes.
- Only six pages exist under `/styles`: instagram, whatsapp, discord, gaming, languages and
  colours. Every other `/styles/<slug>` is a permanent 301 — to `/styles/instagram` for anything
  mentioning Instagram, to `/styles/languages` and `/styles/colours` for the keywords those two
  pages honestly answer, and to `/` for everything else. The catch-all in `next.config` is
  generated from `lib/styles-routing.js`, which is also the ad allowlist and the sitemap's source,
  so a slug invented tomorrow is a redirect rather than a thin page.
- Titles are budgeted to roughly 60 characters and descriptions to roughly 160, because
  anything longer is truncated in the results.
- `/studio` is indexable: it carries its own explainer rather than being an app shell.
- Every tool that produces a downloadable file has its own page and a panel on `/tools` pointing
  at it. `/tools` targets "word counter"; giving the QR generator its own URL is what stops two
  pages competing for one term.

## Routes

`/`, `/fancy-text-generator` (308 to `/`), `/fonts` (`?q=`), `/fonts/[slug]`,
`/styles` (the hub) and `/styles/[key]`, `/symbols`, `/emoji`, `/kaomoji`, `/tools`,
`/qr-code-generator`, `/image-compression`, `/studio`, `/admin` (`noindex`), `/admin/seo`
(`noindex`), `/about`, `/privacy`, `/terms`, `/contact`, `/robots.txt`, `/sitemap.xml`, plus
`GET /api/styles`, `/api/search`, `/api/ai/suggest`, `/api/health`, `/api/config`, `/api/beat`,
`POST /api/generate`.

## The QR code generator

`/qr-code-generator` is the one page whose job is producing a file rather than styling text, so it
has its own directory of browser modules:

- `public/js/qr.js` is a **QR Code Model 2 encoder** — byte mode, Reed-Solomon error correction
  over GF(256), all 40 versions at all four levels, mask selection by the standard's penalty
  rules, and an SVG writer that merges horizontal module runs so a symbol is a few kilobytes
  rather than 40 KB of `<rect>` elements.
- `public/js/qr-payloads.js` builds the text a scanner actually reads for the ten types, and
  validates each field before it can reach the encoder.
- `public/js/qr-code-generator.js` is the interface: tabs, live preview, colours with a measured
  contrast ratio, size, error correction, logo, and PNG/SVG/JPG download.

### Why the encoder is not a package

The obvious answer is `qrcode` or `qrjs`, and both are real, maintained libraries. Neither is
reachable from here. This project's client code is plain ES modules served out of `/public` under a
CSP of `script-src 'self'`: there is no bundler to pull a package through and no CDN the policy
allows, so the only options were a build step or the ~500-line algorithm. The same reasoning
applies to `zip.js` next door, and `image-compressor.js` uses platform APIs rather than a wrapper
around the platform's compressor. Nothing is generated at build time and nothing is fetched at run
time — the visitor's browser gets the same file the test suite runs against.

### Why it is trustworthy

A QR encoder that is confidently wrong produces a symbol that looks perfect, passes a round-trip
test against its own decoder, and is unreadable by any phone. Three of those failure modes are
real and all three bit during development:

- **The mask formulas** for the alignment pattern centres. Version 32 and 40 are where a rounded
  ratio and the specified integer division disagree, and a mis-spaced alignment pattern is an
  unscannable symbol that still renders correctly.
- **The interleave order.** The final message is *all the data codewords across the blocks, then
  all the parity codewords across the blocks* — not each block's data and parity woven together.
  The wrong version still passes a Reed-Solomon syndrome check, because the blocks are the same
  blocks in a different order, and it still survives a round trip, because a decoder inverting the
  same wrong permutation reads the payload back perfectly. It only fails against a real scanner,
  and only for versions that have both short and long blocks.
- **The pad codewords.** Every generator fills the unused capacity with an alternating filler.
  Different implementations fill it differently, so two correct encoders produce different bytes
  for the same input. That difference is why an exact byte comparison against another library
  proves less here than it appears to.

So the encoder is verified three ways rather than one. `tests/unit/qr.test.js` writes its own
decoder from the standard — its own function-module map, its own zigzag walk, its own de-interleave
— and takes 215 symbols apart across every version and level, checking the payload survives.
Reed-Solomon syndromes are checked against the Galois field itself rather than against this
file's own opinion of it, including a deliberately corrupted code word, so the check is known to be
able to fail. And during development every symbol was decoded by **OpenCV's `QRCodeDetector`**, an
unrelated production decoder, for all ten payload types at all four levels, and cross-checked
module-for-module against **segno**. That last step needs Python and is not part of `npm test`; it
is the reason the portable assertions are shaped the way they are.

### Privacy

This page asks for Wi-Fi passwords, phone numbers and contact details, so its privacy claim is
structural rather than a promise: `public/js/qr.js` and `qr-payloads.js` touch nothing but the
DOM, and an integration test asserts the interface module never calls `fetch`,
`XMLHttpRequest`, `sendBeacon`, `WebSocket` or `EventSource`. There is no request that could carry
what a visitor typed, because there is no code that could make one.

### Keeping a customized code scannable

Three things break customized QR codes, and the tool measures all three rather than trusting the
visitor: contrast (the WCAG relative-luminance ratio, warned below 4.5:1), logo coverage (a share
of the symbol's *area*, which is the number error correction is quoted in — refused above 30% and
warned above 20%, with the level raised automatically), and the quiet zone (always the specified
four modules, never a setting). Modules are drawn at an integer pixel scale and the symbol is
centred rather than stretched, because a module edge landing on a half pixel is the most common
reason a code works on screen and fails in print.

## SEO keyword system

`data/keywords.txt` is the editable source keyword list. `npm run build:keywords` cleans it,
classifies it, maps every entry to a real route (or to an explicit skipped/planned status), and
writes three artifacts:

- `data/keyword-map.json` — one row per keyword with original, normalized, core modifier,
  classification, status, target route, reason and variation counts.
- `data/keyword-report.json` — every generated emoji-wrapped variation per landing page section,
  plus the removal and duplicate logs and the SEO validation results.
- `data/keyword-audit.md` — the same data as a readable report.

Rules the pipeline holds to:

- Competitor brands are recorded as **skipped** and never get a landing page.
- Unsupported features (GIF, ASCII art, image/video text) are recorded as **planned**, never as
  working generators.
- Non-Latin script keywords resolve to an honest script-compatibility page instead of a
  misleading alphabet generator; colour keywords resolve to a page explaining that plain Unicode
  cannot carry a font colour.
- Every mapped route is checked against the real route set; an unknown route fails the build.
- Emoji variations are generated from fixed per-section phrase rules, deduplicated, and capped.
  Sections that cannot reach the target (30 by default, configurable) report the shortfall instead
  of padding with meaningless emoji permutations.

`/admin/seo` is the review dashboard (needs `ADMIN_KEY`). It has a sticky left sidebar built from
the real keyword data, with category counts, search, status filters, sorting and per-keyword
mapping detail. It is a review tool — a keyword appearing there never publishes a page by itself.

## Deploying to Vercel

Push to Vercel and it detects Next.js automatically — no `vercel.json` or serverless entry point is
 needed any more. Set `SITE_URL` to your domain. The in-memory rate limiter and analytics counters
 are per instance; swap in a shared store before scaling beyond one instance.

## Privacy

No cookies, no analytics SDK. The beacon sends only a path and an event name. Typed text never
leaves the browser, and neither does an uploaded image: both are processed by the visitor's own
device. The QR generator asks for Wi-Fi passwords, phone numbers and contact details, and is held
to the same line — see "Privacy" under the QR code generator above.