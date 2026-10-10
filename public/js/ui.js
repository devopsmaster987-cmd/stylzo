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

// M8 - offline support (never on http://localhost dev? it works fine there too).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); }, { once: true });
}
