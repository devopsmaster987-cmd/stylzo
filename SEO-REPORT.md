# Stylzo SEO Program

## Phase 1 — Technical SEO (2026-10-26)

Status: complete.

## Phase 2 — Mobile SEO and Core Web Vitals (2026-10-26)

Status: complete. Phase 3 is complete pending review; Phase 4 not started.

### Audit scope and method

- Production build served locally with the real AdSense client and slot configured.
- Lighthouse 13.5.0, mobile form factor, Moto G Power emulation (412×823), default simulated throttling, separate run per URL. Three runs per URL with a reused Chrome profile; table below is the median.
- A cold Chrome profile on this machine adds 4–8 s to the first navigation (the server answers in ~30 ms). Early single runs therefore scored `/` at 49–51 even though a warm run of the same build scored 91–93. The medians below are the repeatable numbers; the cold-start figure is not a site metric.
- A separate CDP pass at 390×844 measured layout overflow, visible font sizes, tap-target boxes, sticky/fixed elements, the consent banner, tool position, ad slots, and CLS from `layout-shift` entries. A warm run of `/` at 4× CPU gave FCP = LCP = 0.84 s and CLS = 0.
- Mobile and desktop HTML were fetched with mobile and desktop user agents for all nine URLs and compared after normalising the per-request CSP nonce: byte-identical.
- INP cannot be measured in a lab without interactions; TBT is reported as the proxy.

### Results (median of 3 mobile Lighthouse runs)

| URL | Perf | FCP | LCP | CLS | TBT | Total | 1st-party JS | CSS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 91 | 1.24 s | 2.54 s | 0.000 | 332 ms | 491 KiB | 156 KiB | 24 KiB |
| `/fonts` | 91 | 1.14 s | 2.14 s | 0.000 | 305 ms | 476 KiB | 142 KiB | 24 KiB |
| `/fonts/category/lines` | 91 | 1.14 s | 2.49 s | 0.000 | 295 ms | 476 KiB | 142 KiB | 24 KiB |
| `/fonts/frag-line` | 89 | 1.07 s | 2.37 s | 0.003 | 386 ms | 472 KiB | 142 KiB | 24 KiB |
| `/fonts/overline` | 92 | 1.17 s | 1.73 s | 0.002 | 349 ms | 471 KiB | 142 KiB | 24 KiB |
| `/styles/instagram` | 91 | 1.15 s | 2.51 s | 0.000 | 308 ms | 478 KiB | 142 KiB | 24 KiB |
| `/tools` | 94 | 1.18 s | 1.72 s | 0.000 | 268 ms | 466 KiB | 145 KiB | 24 KiB |
| `/qr-code-generator` | 89 | 1.91 s | 2.55 s | 0.000 | 393 ms | 502 KiB | 145 KiB | 24 KiB |
| `/about` | 90 | 1.12 s | 2.35 s | 0.000 | 351 ms | 462 KiB | 142 KiB | 24 KiB |

- Accessibility: 100 on all nine pages after the heading-order follow-up.
- Best practices: 77 (was 73) after the CSP fix. The remaining failures are AdSense's third-party `test_cookie` and Chrome's cookie inspector issues, not site code.
- SEO: 100 on all nine pages.
- Third-party AdSense JavaScript is 252–254 KiB on every page. Total transfer is therefore roughly 460–500 KiB, of which about half is the ad tag's managed script.
- LCP element on `/` in Lighthouse is the consent banner paragraph, not the heading. With consent already answered (banner absent) the same pages reach FCP = LCP ≈ 1.0 s at 4× CPU. The banner is server-rendered and fixed, 15.2% of the screen at 390 px (17.8% at 320 px), under the 30% limit.
- CLS is 0.000–0.003 in Lighthouse and 0 in the CDP pass after the fixes below.

### Findings and fixes

1. The disabled 3D hero left a 260 px empty block above the heading on every phone.
   - Before: `Hero3D` was declined on mobile but still rendered its wrapper, so the h1 began at y≈369 (390×844) and the tool at y≈481.
   - Fix: hide `.hero-3d` in CSS below the desktop grid breakpoint (≤860 px) and align the JavaScript guard to the same width, so three.js is not fetched either.
   - Result: h1 at y≈114 and the generator input at y≈227, fully visible on the first screen. No horizontal overflow at 320, 360, 390 or 414 px.

2. The mobile menu button was revealed after hydration, making the header taller and shifting the whole page.
   - Before: CLS 0.019–0.031 with the shift attributed to `header`, `main`, `nav.chips`, the search box and the style rows.
   - Fix: reserve the button box in `.bar-actions` at ≤720 px and size the button itself to 44×44 (it was 38×38).
   - Result: header height no longer changes; CLS 0 in the CDP pass.

3. `Paste` and `Clear` were revealed after hydration, growing the generator tools row.
   - Fix: `.gen-tools` now reserves its 2.5 rem row height from the server render.
   - Result: no shift from the generator controls.

4. AdSense's traffic-quality endpoints were blocked by CSP, producing a console error on every page.
   - Fix: allow `https://ep1.adtrafficquality.google`, `https://ep2.adtrafficquality.google` and the `https://www.google.com` frame in `frame-src`/`connect-src` when ads are configured.
   - Result: zero console/CSP errors in post-fix runs; best-practices 73 → 77. Tests now assert these origins.

5. The example labels on font pages were 11.5 px.
   - Fix: `.example-label` raised from .72 rem to .78 rem.
   - Result: no visible text below 12 px on any audited page.

6. Mobile menu button was below the 44 px tap-target guidance. Now 44×44.

7. Style rows used `<h3>` inside the hero, before the page's first `<h2>`, so the outline jumped from `<h1>` to `<h3>` on `/` and the font pages (accessibility 98–99).
   - Fix: the row name is a label for one result, not a page section, so it is now `<p class="row-name">`. The anchor, text, class and styling are unchanged, and the same component is used everywhere.
   - Result: Lighthouse accessibility 100 on `/`, `/fonts/frag-line` and `/fonts/overline`; the other six pages were already 100 and do not use a heading there. A regression test now fails if a row name becomes a heading again.
   - This is the only protected-page markup change in Phase 2. It changes a tag, not the visible copy, title, description, H1, canonical or JSON-LD.

### Verified results

- No horizontal overflow at 320, 360, 390 or 414 px on `/`.
- The generator input is above the consent banner on `/` at every tested width; the h1 and tool are visible without scrolling.
- The consent banner is fixed, occupies 15.2% of a 390×844 screen (17.8% at 320×844), and causes no layout shift.
- Ad slots on `/`, `/styles/instagram` and `/qr-code-generator` are at y = 6050, 3653 and 1823 respectively, far below the generator. An ad cannot push the tool off screen.
- Mobile and desktop serve byte-identical HTML (nonce-normalised) for all nine audited URLs.
- The 3D scene still appears in its desktop column at 1280 px; it is hidden, not removed, at ≤860 px.

### Protected pages (49 URLs)

- Compared the current local build with live production: 47 of 49 pages have identical title, meta description, H1, canonical, JSON-LD and visible body text.
- `/` and `/about` still differ only in visible body text, exactly the two already-approved Phase 1 changes (home category chips; About key facts). No protected-page copy or metadata changed in Phase 2.
- The heading fix changes `<h3 class="row-name">` to `<p class="row-name">` on pages that render style rows. This is the one server-HTML tag change; the visible text, link targets, title, meta description, H1, canonical and JSON-LD are unchanged. The 49-URL body-text comparison still reports only the two Phase 1 exceptions.

### Files changed in Phase 2

- `components/hero-3d.jsx` (viewport guard 640 → 860)
- `components/style-row.jsx` (row name h3 → p)
- `public/css/main.css` (mobile 3D hide, header reservation, 44 px toggle, generator row reservation, example label size)
- `proxy.js` (AdSense CSP origins)
- `tests/integration/advertising.test.js`
- `tests/integration/ranking-signals.test.js`
- `tests/integration/home.test.js` (heading regression guard)
- `SEO-REPORT.md`
- `progress.md`

### Verification

- `npm run build`: passed.
- `npm test`: passed. 640 tests, 636 passed, 4 skipped, 0 failed.
- No commit or deployment.

### Decisions taken after review

1. AdSense while unapproved: keep the verification `<head>` tag and the consent banner as they are. Removing or consent-gating the tag now would risk the site review, and there is no ad revenue to protect yet. Revisit tag gating after approval; the main cost is ~253 KiB of third-party JS.
2. Heading order: fixed (see item 7). Protected-page tag change only; visible copy and metadata untouched.
3. Consent banner: keep it fixed at the bottom. Measured geometry shows a compact version cannot clear the textarea on `/styles/instagram` (the textarea spans y = 708–808 and the banner starts at y = 716); it can only cover less of it. The banner is dismissible, 15.2% of the viewport, and causes no layout shift. A layout change that moves the tool above the fold on those landing pages belongs to Phase 10.
4. Ad space: no hard reservation. The slots are below the tool and below the fold (y = 6050 on `/`, 3653 on `/styles/instagram`, 1823 on `/qr-code-generator`), so fill cannot move the generator. Reserving height would create blank gaps while AdSense is unapproved and for every declined or blocked visitor.
5. Tap targets: the menu button is 44×44. The remaining under-44 elements are mostly inline text links, which WCAG exempts; the full target-size pass belongs to Phase 10.
6. Phase 1 decisions still open: `/event` has no H1; sitemap `lastmod` is file-level; the 32 retired `/styles/<slug>` slugs redirect.

### Audit scope

- Production build crawled from `/` through every internal link: 158 URLs requested, 146 HTML pages returned 200, 10,470 internal link instances checked.
- `sitemap.xml` checked separately: 138 URLs, including 12 indexable category hubs.
- Protected set checked before and after: all 49 URLs in `indexed-urls.txt`.
- Raw HTML inspected for title, meta description, canonical, one H1, main content and JSON-LD.
- Delivery checked on the local production server and live `https://www.abdulsamad.shop`.

### Findings and fixes

1. Redirected category hubs were still linked internally.
   - Before: 40 internal link instances pointed at `/fonts/category/outline` or `/wide`, across `/fonts`, the 12 indexable hubs, the four noindex hubs, `/fonts/double-struck` and `/fonts/fullwidth`.
   - Fix: `categoryHref()` in `lib/category-routing.js` returns the final style page for redirected categories. Every internal category link now uses it.
   - Result: zero broken internal links, zero internal links to a redirecting hub.

2. `?category=outline` and `?category=wide` produced two redirects.
   - Before: `/?category=outline` → `/fonts/category/outline` → `/fonts/double-struck`.
   - Fix: `proxy.js` redirects the query URL directly to the final style page and preserves `?text=`.
   - Result: every tested redirect is one hop; no loops.

3. `robots.txt` blocked `/event` while the page relies on `noindex,follow`.
   - Fix: removed `/event` from `Disallow`; `/api/` and `/admin` remain blocked. CSS, JS, images and other render assets remain allowed.
   - Result: `/event` is crawlable and returns `noindex,follow`.

4. Unknown `/styles/<slug>` URLs were 301-redirected to `/`.
   - Before: a made-up style slug produced a redirect to the home page, which is a soft-404 pattern and hides the real 404.
   - Fix: only the 32 known retired keyword-board slugs redirect. The 17 whose closest destination is home are listed in `RETIRED_HOME_SLUGS`; every other unknown style slug reaches the real 404.
   - Result: `/styles/not-a-real-style-xyz` returns 404 with the custom error page and `noindex`.

5. Sitemap and canonical invariants were not fully covered by tests.
   - Added checks that every sitemap URL is 200, `index,follow`, self-canonical, has matching `og:url`, exactly one H1, a title, a meta description, server-rendered `<main>` content and no placeholder markers.
   - Added cache, HSTS, compression, real-404 and image-dimension checks.

### Verified results

- Sitemap: 138 URLs; all 200, indexable, self-canonical, matching `og:url`, one H1; no redirects, no noindex, no soft 404s.
- Category hubs: 12 indexable in the sitemap; four thin hubs noindex; Outline and Wide 301 in one hop.
- Crawl: 158 URLs, zero broken internal links, zero redirect chains over one hop, zero redirect loops, zero 200 soft 404s, zero sitemap orphans.
- Query variants: `?text=` pages are `noindex,follow` and canonicalise to the bare URL; `?utm_*` is canonicalised. Duplicate titles/descriptions/H1s exist only between a canonical page and its query variants.
- Raw HTML: title, meta description, canonical, H1, main content and JSON-LD are present in server HTML for all 138 sitemap pages. 632 JSON-LD blocks parsed with no errors.
- Robots: `/api/` and `/admin` blocked; `/event` crawlable; no CSS/JS/image blocks. AI crawlers remain allowed by name.
- HTTPS: live HTTP requests 308 to HTTPS; bare domain 308 to `https://www.abdulsamad.shop`. Live HTML sends HSTS. No insecure `src`/`href` references across 138 pages.
- Cache: HTML is `private, no-cache, no-store, max-age=0, must-revalidate`; hashed `/_next/static` files are `public, max-age=31536000, immutable`; `/public` CSS and JS revalidate.
- Compression: HTML, CSS and JS served with gzip locally; images are not compressed as text.
- 404: real 404 status, custom `Page not found` title/H1, `noindex`.
- Service worker: navigations use `fetch(request, { cache: 'no-store' })`; cached HTML is read only when `navigator.onLine === false`; admin/API are never cached.
- Images: no content `<img>` tags; SVG icons and canvas are used. `og-default.png` is 1200×630; icons are 192×192, 512×512 and 180×180.
- Placeholder scan: no `TODO`, `lorem ipsum` or `[name]` in the 138 sitemap pages.

### Protected pages (49 URLs)

Compared local built SEO fields with live production before and after this phase.

- 47 of 49 pages: title, meta description, H1, canonical, JSON-LD and visible body text unchanged.
- `/`: body text differs because the previously approved category-chip cleanup removed Outline and Wide. Title, meta description, H1, canonical and JSON-LD are unchanged.
- `/about`: body text differs because the previously approved Key facts fix replaced the stringified index list with `100`. Title, meta description, H1, canonical and JSON-LD are unchanged.
- No new protected-page copy was changed in Phase 1. Link targets were updated on protected pages where internal category links pointed at redirects; this is permitted internal linking.
- Live production still serves the pre-deploy build, so its Outline/Wide hubs and home chips remain until deployment.

### Files changed in Phase 1

- `app/robots.js`
- `app/fonts/page.jsx`
- `app/fonts/[slug]/page.jsx`
- `app/styles/[key]/page.jsx` (comment only)
- `components/category-page.jsx`
- `components/landing-page.jsx`
- `lib/category-routing.js`
- `lib/styles-routing.js`
- `next.config.mjs` (comment only for the revised catch-all)
- `proxy.js`
- `tests/unit/category-routing.test.js`
- `tests/integration/technical-seo.test.js`
- `tests/integration/styles-pages.test.js`
- `tests/integration/seo.test.js`
- `SEO-REPORT.md`
- `progress.md`

Pre-existing uncommitted files from the earlier approved category and About work were not newly edited in this phase: `app/page.jsx`, `app/sitemap.js`, `lib/facts.js`, `lib/semantic-keywords.js`, `tests/integration/category-pages.test.js`, `tests/integration/home.test.js`, `tests/unit/facts.test.js`.

### Verification

- `npm run build`: passed. 57 static pages generated; no build errors.
- `npm test`: passed. 639 tests, 635 passed, 4 skipped, 0 failed.
- Targeted Phase 1 suite: 149 tests, 149 passed.
- No commit or deployment.

### Open decisions for you

1. Confirm the new `/styles/<unknown>` behaviour: only the 32 retired slugs redirect; unknown slugs now 404.
2. Sitemap `lastmod` is inherited from each URL's producing source group, giving six distinct dates for 138 URLs. If you require a separate real date per font page, that needs per-page content provenance rather than file-level source stamps.
3. `/event` has no H1. It is a noindex utility page and is crawlable now so its noindex can be read. Decide whether to add an H1 in a later phase.
4. Phase 1 is ready for your review. Say "go" for Phase 2 (mobile SEO and Core Web Vitals).

## Phase 3 — On-page and search-intent match (2026-10-26)

Status: complete, pending review. No commit or deployment.

### Audit scope and method

- Crawled all 138 sitemap URLs from the local production build and parsed the rendered `<head>`, H1/H2/H3 outline, visible text, breadcrumb JSON-LD and internal links.
- Title and description lengths were counted after decoding HTML entities, which is what a search result displays.
- Click depth was measured from `/` through rendered internal links; every sitemap URL had to be reached in three clicks or fewer.
- Anchor text was extracted from rendered links and checked for empty, generic and keyword-free labels.
- The 25-query ownership check used the new `QUERY_OWNERS` table in `lib/seo-keywords.js`; a test fetches each owner and verifies the query's terms appear in its rendered text.

### Findings

1. Two titles were at or over 60 characters: `/qr-code-generator` (60) and `/pdf-accessibility-checker` (63).
2. Twenty-three descriptions were 160 characters or longer. Eighteen were on editable pages; five were on protected font pages.
3. `/screenshot-to-text` used “Replace text in the screenshot” as both an H2 and an H3 step.
4. Five category hubs competed with style pages for the same intent:
   - `/fonts/category/lines` used “Underline, Strike and More” and “Underline and line mark styles”, competing with `/fonts/underline` and `/fonts/strike`.
   - `/fonts/category/bubble` used “Bubble”, competing with `/fonts/circled`.
   - `/fonts/category/small` did not name “tiny” in its title or opening copy.
   - `/fonts/category/glitch` did not name “Zalgo” in its title or H1.
   - `/fonts/category/decorated` did not name “text decorator”.
5. The category template also produced the ungrammatical headings “Lines styles you can copy” and “How lines text works” after the new line-mark positioning.

No duplicate titles, descriptions or H1s were found. Every non-home sitemap page had a self-referencing BreadcrumbList. No sitemap page was more than three clicks from home. No generic or empty anchor text was found. No “Text text” heading was found.

### Fixes

- Replaced 11 editable font meta descriptions through the new metadata-only file `lib/font-meta.js`: `overline-strike`, `short-slash`, `short-strike`, `slash`, `slash-under`, `strike-underline`, `tilde-under`, `triple-underline`, `underline`, `wavy-strike`, `wavy-under`. Visible body copy is unchanged.
- Shortened the seven editable tool/embed descriptions: `/embed`, `/image-compression`, `/pdf-accessibility-checker`, `/pdf-editor`, `/qr-code-generator`, `/qr-code-reader`, `/universal-text-fixer`.
- Shortened two titles: `/qr-code-generator` to `Free QR Code Generator — Create & Download` (51) and `/pdf-accessibility-checker` to `PDF Accessibility Checker — Test a PDF Free` (52).
- Changed `/screenshot-to-text` editor H2 to “Edit the recognised text”; the step H3 keeps “Replace text in the screenshot”.
- Repositioned five category hubs:
  - `/fonts/category/lines`: title `Line Mark Text Styles — Compare Every Mark`, H1 `Line mark text styles`; added a `styleLabel` so the generated headings read “Line mark styles you can copy” and “How line mark text works”.
  - `/fonts/category/bubble`: title `Circled and Boxed Text Styles — Copy and Paste`, H1 `Circled and boxed text styles`, opening paragraph starts “Circled and boxed styles…”.
  - `/fonts/category/small`: title `Small and Tiny Text Styles — Copy and Paste`, opening paragraph starts “Small and tiny text styles…”.
  - `/fonts/category/glitch`: title `Glitch and Zalgo Text Styles — Copy and Paste`, H1 `Glitch and Zalgo text styles`, opening paragraph starts “Glitch and Zalgo styles…”.
  - `/fonts/category/decorated`: title `Text Decorator — Decorated Text Styles`, H1 `Text decorator and decorated text styles`, opening paragraph starts “A text decorator…”.
- Added the 25-entry `QUERY_OWNERS` map. Fourteen style intents and eleven platform intents each name one owner page.

### Query ownership map

| Query intent | Owner |
| --- | --- |
| bold text | `/fonts/bold` |
| italic text | `/fonts/italic` |
| cursive text | `/fonts/script` |
| gothic or old english text | `/fonts/fraktur` |
| bubble text | `/fonts/circled` |
| strikethrough text | `/fonts/strike` |
| underline text | `/fonts/underline` |
| upside down text | `/fonts/upside-down` |
| small caps and tiny text | `/fonts/category/small` |
| wide or vaporwave text | `/fonts/fullwidth` |
| zalgo or glitch text | `/fonts/category/glitch` |
| aesthetic text | `/fonts/aesthetic-wide` |
| cute text | `/fonts/cute-bubble` |
| text decorator | `/fonts/category/decorated` |
| instagram fancy text | `/styles/instagram` |
| instagram bio fonts | `/styles/instagram` |
| instagram username fonts | `/styles/instagram` |
| instagram caption fonts | `/styles/instagram` |
| whatsapp fancy text | `/styles/whatsapp` |
| whatsapp status font | `/styles/whatsapp` |
| whatsapp display name font | `/styles/whatsapp` |
| discord fancy text | `/styles/discord` |
| discord nickname font | `/styles/discord` |
| discord server name font | `/styles/discord` |
| discord status font | `/styles/discord` |

Ownership here means the page that should answer the head intent. Variant pages such as light/heavy Zalgo, dotted/wavy strike, or cute/filled bubble keep their modifier queries; they are not counted as additional owners of the head term.

Protected owners (`/fonts/bold`, `/fonts/italic`, `/fonts/script`, `/fonts/circled`, and the three `/styles/*` pages) were not edited. Their current titles, H1s and body copy already contain the query terms; the integration test confirms it.

### Protected pages — proposals only

These five descriptions are exactly 160 characters after the existing `.slice(0, 160)` and end mid-word. They were not changed. Proposed one-line replacements, all under 160:

| URL | Proposed description | Length |
| --- | --- | --- |
| `/fonts/crossed-out` | Adds two crossing lines over every letter with Unicode combining marks. Copy the text and check it in the app where you will paste it. | 134 |
| `/fonts/overline` | Adds a line above every letter with Unicode combining marks. Copy the result and preview it in the app you plan to use. | 119 |
| `/fonts/script` | Flowing script capitals and lowercase from the Mathematical Script block, with a few Letterlike Symbols filling its gaps. Copy it and test your target app. | 155 |
| `/fonts/tilde-strike` | Adds a wavy line through every letter with Unicode combining marks. Copy the text and check that your app draws the line correctly. | 131 |
| `/fonts/wavy` | Adds a tilde above every letter with Unicode combining marks. Copy the result and test it in the app where it will appear. | 122 |

These need your approval because all five URLs are protected.

### Verified results

- Long titles (60+): 0.
- Long descriptions (160+): 5, all protected, all listed above.
- Duplicate titles: 0. Duplicate descriptions: 0. Duplicate H1s: 0.
- H1-count issues: 0. “Text text” headings: 0.
- Missing breadcrumb JSON-LD on non-home pages: 0. Breadcrumb without a self entry: 0.
- Sitemap pages deeper than three clicks: 0. Sitemap pages not reached: 0.
- Generic or empty anchors: 0.
- The 25-query integration check passed: every owner page is 200/indexable and mentions every term it claims.
- Editable title/description budget test passed for all 23 edited pages.
- Protected descriptions remain unchanged.

### Files changed in Phase 3

- `lib/font-meta.js` (new)
- `app/fonts/[slug]/page.jsx`
- `app/embed/page.jsx`
- `app/image-compression/page.jsx`
- `app/pdf-accessibility-checker/page.jsx`
- `app/pdf-editor/page.jsx`
- `app/qr-code-generator/page.jsx`
- `app/qr-code-reader/page.jsx`
- `app/screenshot-to-text/page.jsx`
- `app/universal-text-fixer/page.jsx`
- `components/category-page.jsx`
- `lib/category-content.js`
- `lib/seo-keywords.js`
- `tests/unit/font-page-content.test.js`
- `tests/unit/seo-keywords.test.js`
- `tests/integration/ranking-signals.test.js`
- `SEO-REPORT.md`
- `progress.md`

### Verification

- `npm run build`: passed.
- `npm test`: 644 tests, 640 passed, 4 skipped, 0 failed.
- Local crawl: 138 sitemap URLs, zero long titles, no duplicate metadata or H1s, no repeated heading, breadcrumbs complete, click depth within three.
- No commit or deployment.

### Open decisions for you

1. Approve or reject the five protected description replacements above. Until approved, they stay at 160 characters.
2. Confirm the five category-hub repositioning changes, especially `/fonts/category/lines`, which now reads as a comparison page rather than an underline page.
3. Phase 3 is ready for review. Say "go" for Phase 4.


## Phase 4 — Semantic and entity SEO (2026-10-26)

### What was wrong

- The site had one `Organization` node and, on some pages, a generic `SoftwareApplication` node. The tools did not have their own entities, so a PDF page could inherit the text generator's description.
- There was no `WebSite` or `WebPage` node and no stable graph joining a page to its publisher and owner.
- The About page did not state the relationship between the Stylzo brand and `abdulsamad.shop`.
- Topic clusters existed only as navigation; there was no declared owner page for each topic.

### Entity model

`config/site.js` is now the single source of truth:

- `Organization` — `https://www.abdulsamad.shop/#organization`
  - name `Stylzo`
  - `alternateName` `abdulsamad.shop`
  - founder `Person` — `https://www.abdulsamad.shop/#owner`
  - contact email from `env.contactEmail`
- `WebSite` — `https://www.abdulsamad.shop/#website`
- `WebPage` — one per canonical URL, `${canonical}#webpage`
- BreadcrumbList — `${canonical}#breadcrumb`
- `WebApplication` — one for the generator, one for `/tools`, one for each of the seven tools and one for `/studio`; all ids are `${path}#app` except the generator's `#generator`.

Every page emits `WebSite`, `WebPage` and the shared `Organization`; only the ten app pages emit `WebApplication`. App pages point `WebPage.mainEntity` at their app. Apps and pages point `publisher` at the Organization and `isPartOf` at the WebSite.

`SoftwareApplication` is no longer emitted. The old type made unrelated tools look like the same text generator; `WebApplication` is the accurate type for browser tools.

### Generator and tool separation

- `lib/facts.js` now returns only generator features. Counts still come from the real catalog.
- Each tool has its own description and a feature list of at least three real capabilities.
- `/embed` and the platform guides are not applications and no longer carry an app entity.
- Ten app pages have ten unique app ids, names and URLs.

### Brand and owner

- App names are all prefixed `Stylzo `.
- The Organization has `alternateName: abdulsamad.shop`.
- `/about` now says: “Stylzo is the brand name for the website at abdulsamad.shop, owned and run by Abdul Samad. It publishes Unicode text styles, copyable libraries, browser text tools and platform style guides.”
- `/contact` was left as generic owner copy so its protected body did not change.
- No `sameAs` values were added: no additional profile was verified.

### Topic clusters

`lib/topic-clusters.js` defines four clusters with one owner and explicit members:

| Cluster | Defining term | Owner | Members |
| --- | --- | --- | --- |
| Unicode text styles | Unicode text styles | `/about` | `/`, `/fonts`, `/styles` |
| Copyable libraries | copyable libraries | `/about` | `/symbols`, `/emoji`, `/kaomoji` |
| Browser text tools | text tools | `/tools` | the seven tool pages |
| Platform style guides | style guides | `/styles` | the platform guide pages |

The owner contains the defining term and links to every member; every member links back to the owner. This is enforced by integration tests, not just navigation.

### Verification

- `npm run build`: passed.
- `npm test`: 653 tests, 649 passed, 4 skipped, 0 failed.
- Entity audit of all 138 sitemap URLs: 0 issues, 0 pages with `SoftwareApplication`, 138 unique WebPage ids, 10 app pages and 10 unique app ids.
- Metadata crawl: 0 long titles; 5 long descriptions, all the known protected Phase 3 proposals; 0 duplicate titles, descriptions or H1s; 0 repeated headings; 0 breadcrumb or click-depth failures.
- Protected comparison against production:
  - titles, descriptions, canonicals and H1s: unchanged on all 49 URLs;
  - bodies: `/` differs by the previously approved category-chip change; `/about` differs by the Phase 4 brand/owner sentence and the previously approved key facts;
  - JSON-LD: changed on all 49 URLs by design, because every page now joins the shared Organization/WebSite/WebPage graph and app pages use WebApplication.
- `/contact` is byte-identical in body copy to production.

### Files changed in Phase 4

- `config/site.js`
- `lib/topic-clusters.js` (new)
- `services/seo.js`
- `lib/facts.js`
- `app/layout.jsx`
- `app/page.jsx`
- `app/tools/page.jsx`
- `app/qr-code-generator/page.jsx`
- `app/qr-code-reader/page.jsx`
- `app/image-compression/page.jsx`
- `app/universal-text-fixer/page.jsx`
- `app/screenshot-to-text/page.jsx`
- `app/pdf-editor/page.jsx`
- `app/pdf-accessibility-checker/page.jsx`
- `app/studio/page.jsx`
- `app/embed/page.jsx`
- `components/landing-page.jsx`
- `components/static-page.jsx`
- `tests/unit/site-entities.test.js` (new)
- `tests/unit/facts.test.js`
- `tests/integration/technical-seo.test.js`
- `SEO-REPORT.md`
- `progress.md`

### Open decisions for you

1. Confirm the owner's real name. `Abdul Samad` was inferred from the domain and public contact address; if it is not the name the owner wants published, change `site.ownerName` and re-run the tests.
2. Approve the protected-page exceptions: the About brand/owner sentence and the shared schema graph on all 49 protected URLs. The schema change is required by Phase 4; the About body change is the visible part.
3. Approve or reject the five protected description replacements from Phase 3. They are still unchanged and still 160 characters.
4. Confirm the four topic-cluster owner pages and the ten WebApplication names.
5. Say “go” for Phase 5.

## Phase 5 — Programmatic quality gates (2026-10-26)

### Audit method

Each template was checked at the content level, not by eye:

- sentence overlap: exact normalised sentences in the intersection divided by the smaller page's sentence count; limit 30%;
- main-text similarity: Jaccard similarity of the two pages' word sets; limit 40%;
- style-page floor: 250 words of page copy;
- examples: every rendered output compared with a direct `applyStyle` run.

The completed style pages, all category hubs and all six platform pages were checked. The remaining 70 style pages were inventoried separately because they still use the old generated template or do not yet have editable content.

### Gate results

| Template | Pages | Words | Worst sentence overlap | Worst main-text similarity | Result |
| --- | ---: | --- | ---: | ---: | --- |
| Completed style pages | 30 | 422–573 | 3.4% (`all-lowercase` / `backwards`) | 39.35% (`bar-under` / `bar-underline`) | pass |
| Category hubs | 18 | 221–254 | 6.7% (`bold` / `outline`) | 31.5% (`bold` / `outline`) | pass |
| Platform pages | 6 | 259–352 | 5.0% (`whatsapp` / `discord`) | 38.4% (`whatsapp` / `discord`) | pass |

All 100 style pages render three examples, and every output matches the converter exactly, including combining-mark pages. Hubs and platform pages already use the real converter, so no example was hand-typed.

The platform similarity limit is close to the ceiling on `whatsapp` / `discord` (38.4%). A new platform page must not copy either page's wording; the new test will fail if it does.

### Thin style pages — 70

These pages are below the 250-word floor. They were not deleted, merged, redirected or noindexed. The recommendation for every one is **enrich**, because each represents a distinct style result and removing it would lose a real long-tail page.

#### Protected list A — 30 pages, Phase 14 only

`bold` (143), `italic` (143), `bold-italic` (142), `script` (135), `bold-script` (143), `double-struck` (150), `sans-bold` (148), `sans-italic` (148), `monospace` (136), `circled` (135), `squared` (143), `small-caps` (144), `superscript` (142), `subscript` (143), `double-underline` (146), `overline` (136), `wavy` (138), `tilde-strike` (139), `crossed-out` (137), `zalgo-light` (121), `zalgo-medium` (129), `glitch-alternate` (122), `alternating-case` (128), `all-caps` (133), `symbol-guillemet` (119), `emoji-frame-heart` (121), `clan-tag` (120), `shout-caps` (130), `profile-stars` (123), `caption-underline` (129).

These are protected and cannot be rewritten without explicit approval. Phase 14 already covers them.

#### List B — 40 pages with no custom content

`sans` (146), `sans-bold-italic` (140), `negative-circled` (137), `negative-squared` (145), `parenthesized` (139), `underline` (143), `strike` (142), `slash` (144), `short-strike` (138), `short-slash` (137), `tilde-under` (135), `triple-underline` (134), `strike-underline` (143), `overline-underline` (145), `overline-strike` (132), `wavy-under` (134), `slash-under` (131), `wavy-strike` (137), `upside-down` (137), `upside-down-words` (141), `zalgo-heavy` (128), `zalgo-extreme` (122), `sparkle-sparkle` (131), `stars-frame` (120), `symbol-star` (116), `symbol-heart` (124), `symbol-bullet` (124), `symbol-sparkle` (115), `symbol-arrow` (122), `symbol-music` (123), `symbol-flower` (122), `symbol-join-spaced` (134), `kaomoji-flip` (122), `kaomoji-shrug` (124), `kaomoji-happy` (121), `kaomoji-cat` (122), `kaomoji-heart` (114), `respawn` (143), `story-title` (144), `soft-bio` (144).

Proposed order: four batches of ten, using the existing list-B rules and approval after each batch. Do not start until the ten unmarked entries below are confirmed.

The worst duplicates in this group are `kaomoji-flip` / `kaomoji-shrug` (92% word-set similarity) and the modifier pages within the lines group. Enrichment must make those pages genuinely distinct, not swap a noun.

### Unmarked content entries

`data/font-page-content.js` has 30 entries, while `progress.md` marks only batches 1 and 2 (20 pages) as approved. These ten entries are present and pass the gates but are not marked approved:

`emoji-frame-sparkles`, `emoji-frame-star`, `emoji-sparkle`, `flipped-letters`, `frag-line`, `fraktur`, `fullwidth`, `gg-frame`, `handle-wrap`, `health-bar`.

Treat them as proposed batch 3 until confirmed. If approved, the list-B work drops from 40 pages to 30.

### Tests added

`tests/unit/template-quality.test.js`:

- completed style pages: 250-word floor, 30% sentence limit, 40% main-text limit;
- category hubs: 30% sentence limit, 40% main-text limit;
- platform pages: 250-word floor, 30% sentence limit, 40% main-text limit;
- all 100 style pages: three examples and every output equal to a direct converter run;
- thin inventory guard: exactly 70 thin pages, 30 of them protected. The test must be updated when a batch is approved so the number cannot drift silently.

### Protected comparison

No production page source changed in Phase 5. The rebuilt output was compared again with production:

- 49 protected URLs checked, 0 errors;
- titles, descriptions, canonicals and H1s unchanged on all 49;
- body changes remain only on `/` (approved category chips) and `/about` (Phase 4 sentence plus approved key facts);
- JSON-LD remains changed on all 49 by the Phase 4 graph.

### Files changed in Phase 5

- `tests/unit/template-quality.test.js` (new)
- `SEO-REPORT.md`
- `progress.md`

### Open decisions for you

1. Confirm the ten unmarked content entries above as batch 3, or mark them unapproved and keep the pending list at 40.
2. Approve four enrichment batches of ten pages for the remaining list-B thin pages, with a review after each batch.
3. Approve Phase 14 later for the 30 protected old-template pages; do not change them yet.
4. Confirm that no thin page should be noindexed for now. The current recommendation is to enrich rather than remove.
5. Say “go” for Phase 6.

## Phase 6 — AEO, GEO and LLMO (2026-10-26)

### Audit method

Phase 6 was audited at the rendered-output level: key pages were fetched from the production build, the visible answer-first paragraph was extracted, and the text was counted after stripping markup. The schema blocks were parsed separately, so visible copy and structured data were checked against each other rather than assumed to match.

### Direct answer blocks

All 18 key pages now carry a 40–60 word direct answer:

| Page | Before | After |
| --- | ---: | ---: |
| `/` | 39 | 40 |
| `/about` | 39 | 40 |
| `/styles` | 68 | 55 |
| `/image-compression` | 77 | 51 |
| `/qr-code-generator` | 76 | 54 |
| `/qr-code-reader` | 66 | 56 |
| `/pdf-editor` | 66 | 53 |
| `/pdf-accessibility-checker` | 84 | 56 |
| `/screenshot-to-text` | 81 | 54 |
| `/universal-text-fixer` | 64 | 49 |
| `/terms` | 38 | 41 |

The other key pages already met the range: `/tools` 58, `/fonts` 56, `/privacy` 42, `/contact` 43, and `/symbols`, `/emoji`, `/kaomoji` 59 each.

The block remains before the long explanatory prose. On the home page it still follows the generator and its result list; moving it above the tool would change the protected page order and was not done without approval.

### Explanation quality

- The shared definition now reads: “Stylzo is a free online text generator that converts plain text into styled text by replacing each letter with a look-alike Unicode character, so the result can be pasted into any app that accepts plain text without installing a font.” It is 40 words.
- The shared failure explanation now names the actual mechanism: Unicode characters, the receiving app’s font, missing glyphs, an empty box or “tofu”, and why the same style can work in one app and fail in another. It is 59 words.
- `/about` now has a direct “How do fancy text generators work?” answer that explains the substitution table and why the style travels with the characters, plus the strengthened “Why does my fancy text show up as empty boxes?” answer.
- The new integration test confirms both explanations are present in the server-rendered HTML, not only in schema or client-side JavaScript.
- Existing numbered how-to steps and the studio comparison table remain visible and unchanged.

### Questions and structured data

- Every answer-first heading is a real question ending in `?`; the visible FAQ headings are also questions.
- `FAQPage` and `HowTo` JSON-LD are no longer emitted. This removes the schema types the brief says not to add for rich results.
- The visible FAQ and how-to sections were kept; they are still server-rendered and readable.
- The standalone `Question`/`Answer` node for the direct answer remains, because it describes visible content and is not a FAQPage rich-result request.
- Tests now fail if `FAQPage` or `HowTo` reappears on key pages, filtered `/fonts?q=` views, landing pages, category hubs or the studio.

### `llms.txt`

- Rewrote `scripts/build-llms-txt.js`; the file is still generated from `catalog()`, not hand-edited.
- Removed the top-eight category slice. The file now lists all 18 categories with real counts.
- Kept the real totals: 5,616 styles, 18 categories, 100 dedicated style pages, 6 platform guides.
- Tightened the page descriptions and limits; the file is about 3.9 KB.
- The integration test now checks that every category name is present, every required route is linked, and the privacy and limitation statements remain.

### AI crawler report

Current `app/robots.js` allows the wildcard and all named AI agents, and blocks only `/api/` and `/admin`. Search crawlers are never blocked. The production `robots.txt` still includes the sitemap and `Host`.

| Crawler | Purpose | Current | Recommendation |
| --- | --- | --- | --- |
| `Googlebot` | Google Search and AI Overviews | wildcard allow | Keep allowed; never block |
| `Bingbot` | Bing and Copilot | explicit allow | Keep allowed |
| `Applebot` | Apple search and Siri | wildcard allow | Keep allowed |
| `OAI-SearchBot` | OpenAI search index | explicit allow | Keep allowed |
| `ChatGPT-User` | User-initiated fetch | explicit allow | Keep allowed |
| `PerplexityBot` | Perplexity index | explicit allow | Keep allowed |
| `Perplexity-User` | User-initiated fetch | explicit allow | Keep allowed |
| `Claude-SearchBot` | Claude search | wildcard allow, not named | Add explicit allow; no functional change today |
| `Claude-User` | User-initiated fetch | wildcard allow, not named | Add explicit allow; no functional change today |
| `ClaudeBot` | Anthropic crawler | explicit allow | Decide; keep allowed while broad AI visibility is the goal |
| `anthropic-ai` | Legacy Anthropic crawler | explicit allow | Optional block if opting out of training |
| `GPTBot` | OpenAI training | explicit allow | Optional block; `OAI-SearchBot` and `ChatGPT-User` still cover search and user fetches |
| `Google-Extended` | Gemini training and grounding | explicit allow | Optional; blocking does not remove the site from Search or AI Overviews |
| `Applebot-Extended` | Apple Intelligence training | explicit allow | Optional block; `Applebot` still covers search |
| `CCBot` | Common Crawl datasets | explicit allow | Optional block; no direct referral path |
| `cohere-ai` | Cohere training | explicit allow | Optional block; no direct referral path |
| `meta-externalagent` | Meta AI training | explicit allow | Optional block; no direct referral path |

Recommended policy: keep every search and answer crawler allowed, add `Claude-SearchBot` and `Claude-User` by name, and decide separately whether to block training-only agents (`GPTBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `cohere-ai`, `meta-externalagent`, `anthropic-ai`). No robots change was made in Phase 6 because that is a business decision, not an SEO correctness fix.

### Verification

- `npm run build`: passed.
- `npm test`: 661 tests, 657 passed, 4 skipped, 0 failed.
- Protected comparison: 49 URLs, 0 errors.
- Titles, descriptions, canonicals and H1s: unchanged on all 49.
- Body changes: 7 URLs:
  - `/`: shared definition and box explanation, plus the previously reported category-chip changes.
  - `/styles`: shortened direct answer.
  - `/emoji`, `/kaomoji`, `/symbols`: shared box explanation.
  - `/about`: shared definition, Phase 4 owner sentence and key-facts correction, and the new generator/box answers.
  - `/terms`: one sentence extended from 38 to 41 words.
- JSON-LD: changed on all 49 URLs. This combines the Phase 4 entity graph with the Phase 6 removal of `FAQPage` and `HowTo`; on pages without a FAQ, the remaining change is the Phase 4 graph and app typing.
- No page titles, descriptions, canonicals or H1s changed in Phase 6.

### Files changed in Phase 6

- `lib/aeo.js`
- `services/seo.js`
- `components/static-page.jsx`
- `scripts/build-llms-txt.js`
- `public/llms.txt` (generated)
- `tests/integration/aeo.test.js`
- `tests/integration/seo.test.js`
- `tests/integration/category-pages.test.js`
- `tests/integration/home.test.js`
- `app/studio/page.jsx`, `app/qr-code-reader/page.jsx`, `app/image-compression/page.jsx`,
  `app/qr-code-generator/page.jsx`, `app/screenshot-to-text/page.jsx` (comments only)
- `SEO-REPORT.md`
- `progress.md`

### Open decisions for you

1. Approve or reject the five protected body changes above, especially `/` and `/about`.
2. Approve the removal of `FAQPage` and `HowTo` JSON-LD on all pages. Visible FAQs remain, but the rich-result markup is gone.
3. Choose the AI crawler policy: keep all current agents allowed, add the two named Claude search/user agents, or block training-only agents.
4. Confirm whether the home answer may move above the generator. The current placement is before the long prose but after the tool.
5. Approve or reject the five protected Phase 3 descriptions, the ten unmarked font-content entries, and the Phase 5 enrichment batches. These remain unchanged.
6. Say “go” for Phase 7.

## Phase 7 — Gap audit (2026-10-26)

### Scope and method

Phase 7 was a read-only audit. No page, component, route, sitemap or content file was changed. The only files written are this report and `progress.md`.

The audit compared page types, not individual keywords, so it does not create a new doorway for every phrase. It covered:

- all 138 sitemap URLs, plus the four noindex category hubs and two category redirects that are deliberately outside the sitemap;
- the 100 indexable style pages, 18 category hubs, six platform guides, three libraries, eight tool pages, `/studio` and the informational pages;
- the 199-line keyword source, of which 173 are unique and 157 already map to a live page;
- the Phase 9 candidate list, assessed against the same source/date quality gate the build will use.

A missing page type was marked `build` only when it could clear all four conditions:

1. a clear visitor task that is not already answered by an existing page;
2. at least 250 words of genuinely different, useful copy;
3. no unsourced limits or claimed platform behaviour;
4. converter-generated examples and a plain-text fallback where relevant.

Platform and game pages are `build` candidates only if every rendered field rule can be paired with a source and checked date. Anything that would only restate the generator was marked `skip`.

### Existing page-type coverage

| Search-intent page type | Live pages today | Coverage | Gap |
| --- | --- | --- | --- |
| Head generator | `/` | 1 page | Owns the head term; do not split |
| Style lookup | `/fonts/[slug]` | 100 indexable pages | Complete for the current catalog |
| Style browsing | `/fonts`, `/styles`, 18 category hubs (12 indexable, 4 noindex, 2 redirect) | Strong | No new style-generator pages needed |
| Platform guides | `/styles/instagram`, `/styles/whatsapp`, `/styles/discord`, `/styles/gaming`, `/styles/languages`, `/styles/colours` | 6 pages | No TikTok, Facebook, X, Telegram, YouTube or Snapchat field guide |
| Game-specific guides | None; `/styles/gaming` is a shared page | 0 dedicated pages | No game-specific field rules or rename flow |
| Symbol library | `/symbols` | 1 page, 14 sections | Category-level queries have no dedicated page |
| Emoji library | `/emoji` | 1 page, 9 sections | Category-level queries rely on anchors and filters |
| Kaomoji library | `/kaomoji` | 1 page, 13 sections | Category-level queries rely on anchors |
| Browser tools and apps | 8 tool pages plus `/studio`; 10 WebApplications including the generator | 9 tool/app URLs | No per-platform limit warnings; comparison content is split |
| Region and language | `/styles/languages` | 1 page | No regional page; correctly gated behind Phase 13 |
| Trust, embed and information | `/about`, `/privacy`, `/terms`, `/contact`, `/embed` | 5 pages | No gap for this phase |

The sitemap remains 138 URLs. The only library pages with enough material for a strong standalone page are the largest symbol categories; the smaller kaomoji categories would be thin, and the emoji categories have data but no distinct prose beyond a list.

### The 25 missing page types

Ranked by visitor need, available unique material and duplicate risk. `Build` means “candidate for Phase 9 or later”, not “publish without a further approval batch”.

| # | Missing page type | Closest page today | Visitor need | Unique content available | Duplicate risk | Decision |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | TikTok name, bio and comment styles | None; `/styles/instagram` is the nearest template | High | Official field limits, tested paste results, reliable-style ranking, plain fallback | Low | Build in Phase 9 |
| 2 | Facebook profile name vs bio/intro | None | High | Name-policy warning, bio/field differences, sourced limits, tested results | Low | Build in Phase 9 |
| 3 | Free Fire in-game name guide | `/styles/gaming` | High | Name limit/filter, rename flow, safe tags, tested examples | Low | Build in Phase 9 |
| 4 | PUBG Mobile and BGMI name guide | `/styles/gaming` | High | Rename-card flow, field rules, BGMI note, safe tags | Low | Build in Phase 9; one page for both |
| 5 | X/Twitter display name and bio guide | None | High | Name/bio limits, ASCII handle rule, style safety, fallback | Low | Build in Phase 9 |
| 6 | Roblox display name vs username guide | `/styles/gaming` | High | Display/username split, filter behaviour, fallback | Low | Build in Phase 9 |
| 7 | Call of Duty Mobile name guide | `/styles/gaming` | Medium-high | Rename-token flow, limit/filter, safe tags | Low | Build in Phase 9 |
| 8 | Telegram name, bio and channel guide | None; `/styles/whatsapp` is the nearest template | Medium-high | Name/bio limits, ASCII username rule, channel and group uses | Low | Build in Phase 9 |
| 9 | YouTube channel name and comment guide | None | Medium-high | Channel-name and handle rules, comment rendering, tests | Low | Build in Phase 9 |
| 10 | Fortnite display name guide | `/styles/gaming` | Medium-high | Display-name rules, filter notes, platform caveat, fallback | Low | Build in Phase 9 |
| 11 | Snapchat display name guide | None | Medium | Display-name limit, username restriction, fallback | Low | Build in Phase 9 |
| 12 | Mobile Legends name guide | `/styles/gaming` | Medium | Rename-card flow, regional notes, filter and safe styles | Low | Build in Phase 9 |
| 13 | Heart symbols copy-paste page | `/symbols#hearts` | High | 38 items, meanings, copy examples, rendering and accessibility notes | Low | Build after Phase 8 |
| 14 | Star and sparkle symbols page | `/symbols#stars` | High | 36 items, use cases, copy examples, width caveat | Low | Build after Phase 8 |
| 15 | Arrow symbols copy-paste page | `/symbols#arrows` | Medium-high | 39 items, separators and direction examples | Low | Build after Phase 8 |
| 16 | Text dividers and separators page | `/symbols#dividers` | Medium-high | 29 items, bio/list examples, alignment and character-count notes | Low | Build after Phase 8 |
| 17 | Emoji category pages | `/emoji` | High search volume | Data is present (85–390 per category), but the prose would repeat the library intro | Medium-high | Merge into `/emoji` with anchors and filters; no nine thin URLs |
| 18 | Kaomoji category pages | `/kaomoji` | Medium | Only 8–21 items per category; not enough for 250 genuinely different words | High | Merge into `/kaomoji` with category anchors |
| 19 | Platform field-limit comparison table | `/styles` and the six guides | Medium-high | The same rules would be repeated across six pages; a table is better than a seventh page | Medium | Merge into `/styles` and Phase 8 guide sections |
| 20 | Unicode character counter with per-platform warnings | `/tools` | High | The counter already exists; platform warnings are a feature, not a new intent | High | Merge into `/tools` in Phase 10 |
| 21 | “Why is my fancy text not showing?” troubleshooting | `/about` | Medium-high | `/about` already owns the box/fallback explanation; a second page would split the query | High | Merge into `/about` and the style-page compatibility notes |
| 22 | Instagram highlight-name styles | `/styles/instagram` | Medium | The Instagram guide can carry a highlight-name section; no separate field rules | Medium | Merge into `/styles/instagram` |
| 23 | WhatsApp group-name styles | `/styles/whatsapp` | Medium | The WhatsApp guide can carry a group-name section; same field and limit rules | Medium | Merge into `/styles/whatsapp` |
| 24 | Generic bio, username and nickname generators | `/` and the style pages | High search volume | No unique data; output would be AI-written lists rather than Unicode knowledge | High | Skip |
| 25 | Roman Urdu/Hindi bios and Pakistan tips | `/styles/languages` | Medium, unproven | Needs owner verification and Search Console demand; Phase 13 explicitly gates it | High | Skip until Phase 13 |

### Decision summary

- **Build:** 16 page types — 12 platform/game guides and four symbol-category pages.
- **Merge:** 7 page types into existing owners.
- **Skip:** 2 page types.
- **No new style-generator pages:** every “TikTok font generator”, “Facebook font generator”, “cool username generator” or similar idea only repeats the existing generator and competes with `/` or the style pages.
- **BGMI:** merged into the PUBG Mobile page rather than a separate near-duplicate.
- **Regional pages:** remain gated behind Phase 13 and Search Console evidence.
- **Games outside the Phase 9 list:** Minecraft, Agar.io, VRChat, Rise of Kingdoms and Whiteout Survival are not promoted in this table because they lack the same combination of demand, stable field information and a clear page need. They are not automatically fair targets.

### Source and quality gate for the build candidates

Each platform or game page must contain:

- an explicit source and checked date for every rendered field rule or limit;
- no number when no reliable source exists;
- a converter-generated example using the page’s own recommended styles;
- a plain-text fallback tip;
- three questions specific to that field;
- links to the related style pages and the relevant platform guide.

If a candidate cannot meet that gate, it drops to `merge` or `skip`. Phase 9 still proceeds in approval batches of five; this audit does not authorise publication by itself.

### Verification

- No page code changed.
- Sitemap: 138 URLs, unchanged. No URL added or removed.
- `npm run build`: passed.
- `npm test`: 661 tests, 657 passed, 4 skipped, 0 failed.
- Protected set: unchanged, because no rendered page changed.
- Files changed: `SEO-REPORT.md`, `progress.md`.

### Open decisions for you

1. Approve the 16 `build` page types, with Phase 9 taking the 12 platform/game guides in batches of five and the four symbol pages after Phase 8.
2. Confirm the 7 `merge` decisions, especially keeping `/tools` as the owner of character counting and `/about` as the owner of the “why it fails” explanation.
3. Confirm the 2 `skip` decisions: no generic idea generators and no regional cluster before Phase 13.
4. Confirm the source-plus-date rule: any platform or game page that cannot source a field rule must not ship.
5. Say “go” for Phase 8.

## Phase 8 — Home, `/fonts` and `/styles` depth (2026-10-26)

### Scope

Phase 8 added useful depth to three existing pages. It did not add, remove or redirect any URL, and the sitemap remains 138 URLs.

- `/`: field-first style guidance, the three support labels, a Unicode/search/screen-reader explanation, and owner/privacy assurance beside the tool.
- `/fonts`: a support-label guide with live counts and the difference between rendering and field validation.
- `/styles`: a field-by-field safety table, documented character limits with official sources and a checked date, and an accessibility note.

No new platform or game pages were built. The Phase 7 build list remains conditional on the later source-and-date gate and Phase 9 approval batches.

### Home page changes

Added `HOME_ASSURANCE` immediately below the generator:

> No account, no upload and no stored text. Styling runs in this browser. Privacy policy · About the owner

This keeps the privacy and owner routes visible near the tool rather than only in the footer. The owner’s name is not asserted in this new line.

Added three sections below the existing how-to content:

1. **How to choose a style for a bio, username or caption** — a five-row table covering bio, username, caption, display name and game tag, each with a best first choice, what to avoid and why.
2. **Which styles are safest where** — the three existing support labels expanded into typical styles, suitable fields and remaining failure modes, with a link to `/fonts`.
3. **What Unicode styling means for search and screen readers** — the effect on search and mentions, screen-reader pronunciation, and forms/passwords/contact details, ending with a plain-copy rule.

The home page now has **1,426 words** by `homeWordCount()` and **1,633 words** in the rendered content band from the quick answer to the destination cards. Both sit inside the required 1,200–1,800 range. The generator, results list and first mobile viewport were not moved. No third-party brand names were added to home copy; the existing brand-name test passes.

### `/fonts` changes

Added “Which font styles work almost everywhere?” with live counts from the catalogue:

| Label | Count |
| --- | ---: |
| Works almost everywhere | 35 |
| Works in most apps | 55 |
| Check your app first | 10 |

The section explains that the label estimates glyph coverage, not field acceptance, and gives separate fallback advice for a style that renders but is still rejected.

### `/styles` changes

Added three sections after the 25 styled rows:

- **Which style is safest for each field** — five rows for bio, username, caption, display name and game tag.
- **Character limits to check before styling a name or bio** — eight documented limits, each linked to an official help page, checked on **26 October 2026**.
- **Accessibility: keep a plain copy** — the screen-reader cost of substitution and the rule that names, handles, prices, dates and contact details need a plain version.

Published limits:

| Service | Field | Limit | Source |
| --- | --- | ---: | --- |
| Instagram | Bio | 150 characters | `https://help.instagram.com/728994388226960` |
| TikTok | Nickname | 30 characters | `https://support.tiktok.com/en/getting-started/setting-up-your-profile/changing-your-nickname` |
| TikTok | Bio | 80 characters | `https://www.tiktok.com/support/faq_detail?id=7096681482017692162` |
| X | Bio | 160 characters | `https://help.x.com/en/resources/glossary` |
| Discord | Display name | 32 characters | `https://support.discord.com/hc/en-us/articles/12620128861463-New-Usernames-Display-Names` |
| Discord | Username | 2–32 characters | `https://support.discord.com/hc/en-us/articles/12620128861463-New-Usernames-Display-Names` |
| Telegram | Username | 5–32 characters | `https://core.telegram.org/method/account.updateUsername` |
| WhatsApp | Profile name | 25 characters | `https://faq.whatsapp.com/859240711908360` |

No undocumented limit was added. The table explicitly says limits are reminders, not a validator, and that counters differ between services.

### Verification

- `npm run build`: passed. 57 static pages generated.
- `npm test`: 667 tests, 663 passed, 4 skipped, 0 failed.
- New tests cover the home word-count band, owner/privacy links, table row headers, `/fonts` support counts, official-source hosts for every published limit, and the rendered `/styles` field/limit/accessibility sections.
- Sitemap: 138 URLs, unchanged. No page added, merged or removed.
- Protected comparison: 49 URLs, 0 fetch errors.
  - Title, description, canonical and H1 unchanged on all 49.
  - Body changed on 8: `/`, `/fonts`, `/styles` from this phase; `/emoji`, `/kaomoji`, `/symbols`, `/about` and `/terms` from previously reported phases.
  - JSON-LD differs on all 49 from the Phase 6 removal of `FAQPage`/`HowTo`. No Phase 8 schema change was made.
  - No other protected URL received a Phase 8 body change.

### Files changed

- `lib/home-content.js` — assurance line, three new home sections and `homeWordCount()`.
- `app/page.jsx` — renders the assurance line and three new sections with accessible tables.
- `lib/fonts-content.js` — new support-label guide copy.
- `app/fonts/page.jsx` — live support counts and the `/fonts` support section.
- `lib/styles-material.js` — field guidance, sourced limits, accessibility copy and word-count inclusion.
- `components/styles-hub.jsx` — renders the three `/styles` sections and source links.
- `public/css/main.css` — table overflow wrapper, assurance line and plain-list styling.
- `tests/integration/home.test.js`, `tests/integration/font-copy.test.js`, `tests/integration/styles-pages.test.js` — Phase 8 coverage.
- `SEO-REPORT.md`, `progress.md` — phase report and summary.

### Facts awaiting your verification

1. The owner name remains `Abdul Samad` in `config/site.js` and was not re-verified this phase. The new home line only says “About the owner”.
2. Limits can change without notice. The eight rows are checked to 26 October 2026 and should be rechecked before Phase 11.
3. The Discord support page blocked a direct re-fetch with Cloudflare during the final check; the limit is from the official article text captured earlier.
4. The WhatsApp page is dynamically rendered; the 25-character profile-name limit comes from the official Help Center result, not from a plain static page.
5. Instagram usernames and X display names were deliberately omitted because no official limit was confirmed.
6. The source table currently covers only documented limits. Missing services are not evidence that styled text works there.

### Open decisions for you

1. Approve the Phase 8 body additions to `/`, `/fonts` and `/styles`, including the eight outbound source links.
2. Confirm the home word-count interpretation: 1,426 prose words versus 1,633 rendered content words, both inside 1,200–1,800.
3. Confirm the source-check date rule and that unverified services stay out of the table.
4. Approve Phase 9 batch 1 (five platform/game pages) or ask for a different first batch.
5. The earlier Phase 3–7 decisions and the five protected font descriptions remain open.

### Next three actions, by expected impact

1. Approve Phase 9 batch 1, starting with TikTok, Facebook, X, YouTube and Telegram, each behind the source-and-date gate.
2. Recheck the eight published limits before an AdSense or Search Console review, and add any newly documented limits rather than guessing.
3. Once approved, proceed to Phase 10’s per-platform character counter and side-by-side comparison in `/tools`, using this same source data.

### Search Console and AdSense checks

- Inspect `/`, `/fonts` and `/styles` after deploy for coverage and enhanced-measurement changes.
- Check that the three new sections are reachable in the rendered HTML and not blocked by reveal behaviour without JavaScript.
- Recheck that `/styles` still clears the ad word floor and that no ad sits beside the source table or copy controls.
- Recheck mobile first-screen position of the generator after deploy; no layout above the tool changed in this phase.

## Phase 9 — Platform font generators, batch 1 (2026-10-26)

### Scope

Phase 9 batch 1 adds five platform pages:

- `/tiktok-font-generator`
- `/facebook-font-generator`
- `/x-font-generator`
- `/youtube-font-generator`
- `/telegram-font-generator`

Each page is a real generator page, not a copy-only landing page. It renders converted output from the shared engine, explains which fields can accept styled text, lists only documented limits with a source and checked date, and gives a plain-text fallback when a field rejects the result.

The sitemap grew from **138 to 143 URLs**. No existing URL was removed, merged or redirected. No protected page received a Phase 9 body edit.

### Route decision

The pages were deliberately added at the top level rather than under `/styles/<key>`.

- `/styles` is protected and its copy describes “six guides”. Adding five more there would either require editing a protected page or make its existing description false.
- The top-level names match the query intent (“TikTok font generator”, not “TikTok style guide”).
- Existing `/styles/instagram` and `/styles/whatsapp` remain the owners of their existing intents. The new pages link to one another but do not claim those routes.
- No new style-generator pages were added. Each new page links to existing indexable style pages.

### Content and source rules

`lib/platform-pages.js` is the single data source. Every rendered field rule carries a source label, source URL and the shared checked date **2026-10-26**. A rule without a source is not rendered, and the unit test fails if a rule loses its source.

Published field rules:

| Service | Field | Limit | Verdict | Source |
| --- | --- | --- | --- | --- |
| TikTok | Nickname | 30 characters | Try | `https://support.tiktok.com/en/getting-started/setting-up-your-profile/changing-your-nickname` |
| TikTok | Bio | 80 characters | Try | `https://www.tiktok.com/support/faq_detail?id=7096681482017692162` |
| TikTok | Username | 2–24 characters | Plain | `https://support.tiktok.com/en/getting-started/setting-up-your-profile/changing-your-username` |
| Facebook | Profile name | No character limit checked | Plain | `https://www.facebook.com/help/229715077154790` |
| Facebook | Username | Minimum 5 characters | Plain | `https://www.facebook.com/help/105399436216001` |
| Facebook | Intro | No limit checked | Try | `https://www.facebook.com/help/1090724464274188` |
| X | Display name | 50 characters | Try | `https://help.x.com/en/managing-your-account/change-x-handle` |
| X | Username | More than 4 and up to 15 characters | Plain | `https://help.x.com/en/managing-your-account/change-x-handle` |
| X | Bio | 160 characters | Try | `https://help.x.com/en/resources/glossary` |
| YouTube | Handle | 3–30 characters | Plain | `https://support.google.com/youtube/answer/11585688` |
| YouTube | Video title | 100 characters | Try | `https://support.google.com/youtube/answer/57407` |
| YouTube | Description | 5,000 characters | Try | `https://support.google.com/youtube/answer/57407` |
| YouTube | Channel name | No limit checked | Try | `https://support.google.com/youtube/answer/2657964` |
| Telegram | First name | 1–64 characters | Try | `https://core.telegram.org/method/account.updateProfile` |
| Telegram | Last name | 0–64 characters | Try | `https://core.telegram.org/method/account.updateProfile` |
| Telegram | Bio | 0–70 characters | Try | `https://core.telegram.org/method/account.updateProfile` |
| Telegram | Username | 5–32 characters | Plain | `https://core.telegram.org/method/account.updateUsername` |

“No limit checked” is used where no official limit could be verified. It is not a guessed number and not a promise that any string will be accepted.

Each page also contains:

- one 40–60-word direct answer: actual range 40–42 words;
- three unique FAQs, scoped to that platform;
- a platform-specific fallback paragraph;
- two or three style sections, each using existing indexable style slugs;
- related generator links and three related searches;
- a plain-language note that the field, not the page, is the final validator.

Content size and duplication:

- body copy is **530–597 words** per page;
- maximum sentence overlap between any two new pages: **2.9%**;
- maximum word-token similarity: **37.1%**;
- all five pass the existing 250-word floor and the no-template-variant gates.

### SEO and discovery changes

- Metadata: unique title, description, H1 and self-referencing canonical for all five pages.
- Schema: breadcrumb plus the shared site/page graph. The pages do not claim `FAQPage`, `HowTo` or `WebApplication`.
- Indexing: `?text=` views remain `noindex,follow` with a canonical to the clean route.
- Sitemap: five entries added; total **143**.
- `llms.txt`: five links added; generated file is **4,554 bytes** with **26** absolute site links.
- Internal links: every target resolves; the test fetches every internal href rendered on the five pages.
- Keyword map: TikTok, Facebook, X, YouTube and Telegram queries now resolve to the new routes. Standalone `x` is treated as X, not as a style token.
- Keyword rebuild: **173** unique keywords from 199 source lines, **157** mapped, **10** skipped, **6** planned, **0** needing review; **192** variations generated and **0** SEO validation failures.
- Existing protected owners are unchanged. `/styles/instagram` and `/styles/whatsapp` still own their existing variants.

### Verification

- `npm run build`: passed.
- `npm test`: **691 tests, 687 passed, 4 skipped, 0 failed**.
- New unit coverage: five unique pages, three unique FAQs each, 40–60-word answers, source/date presence, resolvable styles and internal links, and cross-page sentence/token similarity.
- New integration coverage: status 200, single H1, exact title/description/canonical, indexability, breadcrumbs, no FAQPage/WebApplication, sourced field rows with dates, converter output, exactly three visible FAQs, `?text=` noindex, all internal links, sitemap and `llms.txt`.
- AEO integration coverage now includes the five new routes.
- Sitemap fetch from the local production build: **143 URLs**.
- All five new routes return **200** from the local production server.
- Protected comparison: 49 URLs, **0 errors**.
  - Title, description, canonical and H1 unchanged on all 49.
  - Body differences remain on the same eight URLs reported before this phase: `/`, `/fonts` and `/styles` from Phase 8; `/emoji`, `/kaomoji`, `/symbols`, `/about` and `/terms` from Phase 6.
  - JSON-LD differs on all 49 from the previously reported Phase 6 schema change.
  - No protected page received a Phase 9 body edit.

### Files changed

- `lib/platform-pages.js` — five page records, field rules, sources, FAQs, fallback copy and internal links.
- `components/platform-guide.jsx` — shared renderer and metadata builder.
- `app/tiktok-font-generator/page.jsx` — TikTok route.
- `app/facebook-font-generator/page.jsx` — Facebook route.
- `app/x-font-generator/page.jsx` — X route.
- `app/youtube-font-generator/page.jsx` — YouTube route.
- `app/telegram-font-generator/page.jsx` — Telegram route.
- `public/css/main.css` — verdict labels and source-date styling.
- `app/sitemap.js` — five new sitemap entries.
- `scripts/build-llms-txt.js` — five new `llms.txt` links.
- `lib/keywords.js` — platform detection, route mapping and `realRoutes()` coverage.
- `lib/seo-keywords.js` — five new primary/secondary keyword entries.
- `tests/unit/platform-pages.test.js` — content, source, uniqueness and template-quality gates.
- `tests/integration/platform-pages.test.js` — rendered SEO, links, sitemap and `llms.txt` coverage.
- `tests/integration/aeo.test.js` — new pages added to AEO checks.
- `tests/unit/seo-keywords.test.js` — new routes added to the allowlist.
- `SEO-REPORT.md`, `progress.md` — phase report and summary.

### Facts awaiting your verification

1. The X handle page was re-fetched in this session and confirms the display-name limit of **50** and the username rule “more than 4 and up to 15 characters”, letters/numbers/underscores only.
2. The TikTok username page returned only a shell page in this session. The 2–24-character limit and allowed character set come from the official support article captured earlier and should be rechecked before deployment.
3. Facebook help URLs returned HTTP 400 in this session. The profile-name policy and the minimum-five-character username rule come from the official help pages captured earlier and should be rechecked before deployment.
4. Telegram API pages timed out in this session. The 1–64 / 0–64 / 0–70 / 5–32 field lengths come from the official API documentation captured earlier and should be rechecked before deployment.
5. TikTok nickname and bio limits, YouTube handle/title/description limits and the X bio limit were not newly re-fetched in this final pass. They remain dated **2026-10-26** and should be rechecked before a Search Console or AdSense review.
6. Limits and renderer behaviour can change independently. A documented field limit does not guarantee that every device renders every glyph.
7. The owner name remains `Abdul Samad` in `config/site.js` and was not re-verified in this phase.

### Open decisions for you

1. Approve the five top-level routes and the sitemap increase from 138 to 143 URLs.
2. Approve the keyword routing and internal links from the new pages.
3. Confirm whether the blocked TikTok, Facebook and Telegram pages must be rechecked before deployment, or whether the current sourced rules are acceptable.
4. Choose the next Phase 9 batch. Remaining game/platform candidates are Free Fire, PUBG Mobile/BGMI, Roblox, Call of Duty Mobile, Fortnite, Snapchat and Mobile Legends. The four symbol pages remain a separate post-Phase 8 option.
5. The earlier Phase 3–7 decisions and the five protected font descriptions remain open.

### Next three actions, by expected impact

1. Recheck the three blocked official sources and change only the rows that differ from the published table.
2. After approval and deployment, inspect the five new URLs in Search Console, confirm the sitemap picked up 143 URLs, and check `llms.txt` is served with the five platform links.
3. Build the next Phase 9 batch of five using the same source-and-date contract, rather than adding the Phase 10 comparison tools before the field data is stable.

### Search Console and AdSense checks

- Request indexing for the five clean routes only; keep `?text=` variants out of indexing.
- Check that each route reports itself as canonical and that the sitemap contains exactly one entry per route.
- Confirm the source table is visible in rendered HTML without JavaScript.
- Keep ad slots away from copy controls, generated rows and the source table.
- Recheck mobile first-screen layout: the generator must remain the first useful element, not the field table or FAQ.
