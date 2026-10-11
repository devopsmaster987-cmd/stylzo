// Keyword dashboard: sticky vertical board + in-page material panel.
//
// Clicking a keyword fetches its 25 styled words from /api/board and swaps them
// into the panel on the same page — no navigation. The real href stays on every
// link, so without this script (or with a middle-click / open-in-new-tab) the
// standalone /styles/<slug> page still works.
import { say } from './lib.js';

const dash = document.querySelector('[data-kw-dashboard]');
const links = Array.from(document.querySelectorAll('[data-kw-link]'));
const panel = document.querySelector('[data-kw-panel]');
const headingEl = panel?.querySelector('[data-kw-heading]');
const introEl = panel?.querySelector('[data-kw-intro]');
const eyebrowEl = panel?.querySelector('[data-kw-eyebrow]');
const rowsEl = panel?.querySelector('[data-kw-rows]');
const form = panel?.querySelector('form.gen');
const input = panel?.querySelector('[data-input]');
const search = dash?.querySelector('[data-kw-search]');
const empty = dash?.querySelector('[data-kw-empty]');
const progressLabel = dash?.querySelector('[data-kw-progress-label]');
const progressFill = dash?.querySelector('[data-kw-progress-fill]');

const bySlug = new Map(links.map((a) => [a.dataset.kwSlug, a]));
const cache = new Map();
let currentSlug = links.find((a) => a.getAttribute('aria-current') === 'page')?.dataset.kwSlug || links[0]?.dataset.kwSlug;

const pad = (n) => String(n).padStart(2, '0');

/** One row, built from nodes so styled text is never parsed as HTML. */
function buildRow(r, i) {
  const li = document.createElement('li');
  li.className = 'row';
  li.dataset.styleId = r.id;
  li.dataset.word = r.word;
  li.style.setProperty('--i', i);

  const meta = document.createElement('div');
  meta.className = 'row-meta';
  const name = document.createElement('h3');
  name.className = 'row-name';
  const nameLink = document.createElement('a');
  nameLink.href = `/fonts/${r.slug}`;
  nameLink.textContent = r.name;
  name.append(nameLink);
  const support = document.createElement('p');
  support.className = 'row-support';
  support.dataset.support = r.support;
  support.textContent = r.supportLabel || '';
  meta.append(name, support);

  const out = document.createElement('p');
  out.className = 'out';
  out.dataset.output = '';
  if (r.emojiBefore) out.dataset.emojiBefore = r.emojiBefore;
  if (r.emojiAfter) out.dataset.emojiAfter = r.emojiAfter;
  out.textContent = r.copyText;

  const actions = document.createElement('div');
  actions.className = 'row-actions';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn';
  btn.dataset.copy = '';
  btn.dataset.copyText = r.copyText;
  btn.setAttribute('aria-label', `Copy ${r.name}`);
  btn.textContent = 'Copy';
  actions.append(btn);

  li.append(meta, out, actions);
  return li;
}

function renderPanel(data) {
  if (headingEl) headingEl.textContent = data.heading;
  if (introEl) introEl.textContent = data.intro;
  if (eyebrowEl) eyebrowEl.textContent = `Keyword ${pad(data.position)} of ${data.total}`;
  if (form) form.setAttribute('action', `/styles/${data.slug}`);
  if (rowsEl) {
    rowsEl.replaceChildren(...data.rows.map((r, i) => buildRow(r, i)));
    // keyword-board.js re-queries the rows so live typing keeps working.
    document.dispatchEvent(new CustomEvent('stylix:rows-changed'));
  }
  if (progressLabel) progressLabel.textContent = `Keyword ${pad(data.position)} / ${data.total}`;
  if (progressFill) progressFill.style.width = `${(data.position / data.total) * 100}%`;
  // Must stay in step with the title built in lib/keyword-board.js, which drops
  // the tail when it would push the title past 60 characters. The in-page panel
  // has no <title> of its own, so it is rewritten to match the standalone page
  // it is standing in for.
  const site = document.title.split(' | ').at(-1);
  const tail = `${data.heading} — 25 Styled Words | ${site}`;
  document.title = (tail.length <= 60 ? tail : `${data.heading} | ${site}`);
  // The canonical is deliberately NOT rewritten here. Swapping /styles for
  // /styles/<slug> would make the canonical depend on whether JS ran, so the
  // same URL would report two different canonical targets to crawlers. The
  // in-panel links are real hrefs to the standalone pages, which is where the
  // crawl equity should flow.
}

function setActive(slug) {
  for (const a of links) {
    if (a.dataset.kwSlug === slug) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

async function load(slug, { push = true } = {}) {
  const entry = bySlug.get(slug);
  if (!entry || slug === currentSlug) return;
  currentSlug = slug;
  setActive(slug);
  if (panel) {
    panel.classList.add('is-loading');
    panel.setAttribute('aria-busy', 'true');
  }
  try {
    let data = cache.get(slug);
    if (!data) {
      const url = new URL('/api/board', location.origin);
      url.searchParams.set('key', slug);
      if (input && input.value.trim()) url.searchParams.set('text', input.value.trim());
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      data = await res.json();
      cache.set(slug, data);
    }
    renderPanel(data);
    if (push) history.pushState({ slug }, '', `/styles/${slug}`);
    panel?.classList.remove('is-loading');
    panel?.setAttribute('aria-busy', 'false');
    // Replay the enter animation on the new rows.
    if (rowsEl) {
      rowsEl.classList.remove('kw-swap');
      void rowsEl.offsetWidth;
      rowsEl.classList.add('kw-swap');
    }
    // On narrow screens the panel sits below the dashboard; bring it into view.
    if (matchMedia('(max-width: 900px)').matches) {
      panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    entry.scrollIntoView({ block: 'nearest' });
  } catch {
    say('That keyword could not be loaded. The link still opens its own page.');
    const fallback = bySlug.get(slug);
    location.assign(fallback ? fallback.getAttribute('href') : '/styles');
  }
}

for (const a of links) {
  a.addEventListener('click', (e) => {
    // Only plain left-clicks; anything else falls through to the real link.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    load(a.dataset.kwSlug);
  });
}

window.addEventListener('popstate', (e) => {
  const slug = e.state?.slug || location.pathname.split('/').pop() || links[0]?.dataset.kwSlug;
  const prev = currentSlug;
  currentSlug = null; // force the reload even though the sidebar already highlights it
  if (slug && slug !== prev) load(slug, { push: false });
});

if (search) {
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const a of links) {
      const hit = !q || a.dataset.kwSlug.includes(q) || a.dataset.kwHeadingText.toLowerCase().includes(q);
      a.parentElement.hidden = !hit;
      if (hit) shown += 1;
    }
    if (empty) empty.hidden = shown > 0;
  });
}

// Mark the document so CSS knows JS is running (staggered sidebar entrance),
// and give each keyword its delay index for the stagger.
document.documentElement.classList.add('js-motion');
for (const [i, a] of links.entries()) a.parentElement.style.setProperty('--i', i);
