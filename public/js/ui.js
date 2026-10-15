// Header behaviour + global copy buttons. Runs on every page.
import { say } from './lib.js';

const toggle = document.getElementById('nav-toggle');
const panel = document.getElementById('mobile-nav');
if (toggle && panel) {
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
}

// Copy buttons work on every page (generator, font pages, fonts index, home).
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const row = btn.closest('[data-style-id]');
  if (!row) return;
  const name = row.querySelector('.row-name').textContent.trim();
  const out = row.querySelector('[data-output]');
  // A row may carry an explicit string to copy. The keyword board shows the plain
  // styled word but copies the full emoji-decorated line, so the button holds the
  // exact characters rather than the preview being the source of truth.
  const text = btn.getAttribute('data-copy-text') || (out && out.textContent) || '';
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch { /* fallback */ }
  if (!ok) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
  }
  if (!ok) {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(out);
    sel.removeAllRanges();
    sel.addRange(range);
    say('Copy failed — the result is now selected, press Ctrl+C / Cmd+C.');
    return;
  }
  say(`Copied ${name}`);
  btn.classList.add('done'); btn.textContent = 'Copied';
  setTimeout(() => { btn.classList.remove('done'); btn.textContent = 'Copy'; }, 1500);
});

// The 3D hero is a Next.js client component; nothing to lazy-load here.

// M8 - offline support.
//
// Not on http://localhost or 127.0.0.1. This used to register there too, on the
// reasoning that "it works fine there as well" — which was true and useless. A
// worker on the machine you are editing the site from caches the very files you
// are changing and then serves the old ones, behind a hard-reload the developer
// has to know to perform. That is the worst possible environment for it: the one
// where you most need the newest CSS and JS, and the one where the cache is
// hardest to reason about. It also fights HMR. Production is where offline
// support matters, and that is the only place it is registered.
if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.__STYLZO_SW__) {
  window.addEventListener('load', () => {
    // Not swallowed silently. install() rejects atomically if any precache entry
    // fails, and a worker that never activates leaves the previous one in
    // charge — a state that is invisible from the page and very hard to debug.
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker not registered:', err && err.message);
    });
  }, { once: true });
}

// Retire a worker that was installed while this page did register on localhost.
// Stopping new registrations is not enough on its own: an already-installed
// worker keeps controlling the origin and keeps answering from its own cache, so
// the page still shows the old CSS with no visible reason why. Clearing it here
// means a developer never has to know this rule exists.
//
// Only over http, only our own `stylix-` caches, and only the worker's
// registrations — nothing outside this origin is touched.
if ('serviceWorker' in navigator && location.protocol !== 'https:' && !window.__STYLZO_SW__) {
  navigator.serviceWorker.getRegistrations()
    .then((found) => Promise.all(found.map((r) => r.unregister())))
    .then(() => (self.caches ? self.caches.keys() : []))
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('stylix-')).map((k) => self.caches.delete(k))))
    .catch(() => { /* nothing to clean up */ });
}
