// /styles: live typing.
//
// Each row is a word rendered in a different style, wrapped in 6 to 8 colour emoji.
// Typing in the box re-styles whatever is typed in every row at once and keeps the
// emoji, because the emoji are read back off the row rather than recomputed here.
// Clearing the box restores that row's own sample word.
//
// The page is already fully server-rendered, so without this script the 25 styled
// words still show and the copy buttons still work.

import { transform } from './engine/engine.js';
import { say } from './lib.js';

const input = document.querySelector('[data-input]');
let rows = Array.from(document.querySelectorAll('[data-style-id]'));
const count = document.querySelector('[data-count]');
const pipelines = new Map();

// Re-query rather than caching the list: anything that replaces the rows
// wholesale has to be able to hand the live typing back a fresh node list.
document.addEventListener('stylix:rows-changed', () => {
  rows = Array.from(document.querySelectorAll('[data-style-id]'));
  render();
});

const clearBtn = document.querySelector('[data-clear]');
const pasteBtn = document.querySelector('[data-paste]');

/** `before + styled + after`, preserving the emoji the server rendered. */
function decorate(row, text) {
  const pipeline = pipelines.get(row.dataset.styleId);
  if (!pipeline) return null;
  // The emoji split lives on the output element, not the row itself.
  const out = row.querySelector('[data-output]');
  const before = out?.dataset.emojiBefore || row.dataset.emojiBefore;
  const after = out?.dataset.emojiAfter || row.dataset.emojiAfter;
  const styled = transform(text, pipeline);
  return `${before ? `${before} ` : ''}${styled}${after ? ` ${after}` : ''}`;
}

function render() {
  if (!input) return;
  if (count) count.textContent = Array.from(input.value).length;
  // An empty box restores the sample word the page shipped with.
  const typed = input.value.trim();
  for (const row of rows) {
    const line = decorate(row, typed || (row.dataset.word || ''));
    if (line === null) continue;
    row.querySelector('[data-output]').textContent = line;
    const btn = row.querySelector('[data-copy]');
    if (btn) btn.setAttribute('data-copy-text', line);
  }
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(() => { frame = 0; render(); });
}
let frame = 0;

// The board shares the catalog's pipeline endpoint: it returns the engine pipeline
// for the 25 styles already on the page, so nothing new is fetched per keystroke.
fetch(`/api/styles?ids=${encodeURIComponent(rows.map((r) => r.dataset.styleId).join(','))}`)
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
  .then((data) => {
    for (const s of data.styles) pipelines.set(s.id, s.pipeline);
    render();
  })
  .catch(() => say('Live typing is unavailable right now. The words below still copy fine.'));

if (input) {
  input.addEventListener('input', schedule);
  if (clearBtn) {
    clearBtn.hidden = false;
    clearBtn.addEventListener('click', () => { input.value = ''; input.focus(); schedule(); });
  }
  if (pasteBtn && navigator.clipboard && navigator.clipboard.readText) {
    pasteBtn.hidden = false;
    pasteBtn.addEventListener('click', async () => {
      try {
        input.value = (await navigator.clipboard.readText()).slice(0, input.maxLength);
        schedule();
        input.focus();
      } catch {
        say('Your browser blocked paste. Press Ctrl+V or Cmd+V in the box.');
      }
    });
  }
  // The form is only a no-JS fallback; the server renders ?text= for search engines.
  input.closest('form')?.addEventListener('submit', (e) => e.preventDefault());
}
