// The embeddable widget.
//
// One script tag on someone else's page turns into a working fancy-text
// generator that links back. That link is the point: a widget people actually
// embed earns links that a directory submission never will, because it keeps
// working after the post that added it is forgotten.
//
// Constraints that shaped this file:
//   - No dependencies. A host page pulls this from a CDN and should not have to
//     resolve our build toolchain to use it.
//   - No build step. It has to stay readable and patchable in a text editor.
//   - No inline <style> or inline handlers, because a host page with a strict
//     CSP will block them. Styles are injected once, guarded, and scoped by a
//     prefix so nothing here can leak into the host's own elements.
//   - It reads its own script URL to find its origin, so the same file works on
//     a preview deployment, a staging host and production without a rebuild.
//
// The engine is the exact module the site itself uses, so the widget cannot
// drift from what stylzo actually produces.

import { transform } from '/js/engine/engine.js';
import { ALPHABETS } from '/js/engine/mappings.js';

// A small, representative set. The full 5,600 styles stay on the site — the
// widget is a doorway to it, not a replacement for it.
const STYLES = [
  ['bold', 'Bold'], ['italic', 'Italic'], ['script', 'Cursive'], ['fraktur', 'Gothic'],
  ['double-struck', 'Double-struck'], ['monospace', 'Monospace'], ['fullwidth', 'Fullwidth'],
  ['circled', 'Circled'], ['squared', 'Squared'], ['small-caps', 'Small caps'],
  ['negative-circled', 'Negative circled'], ['bold-fraktur', 'Bold gothic'],
];

const STYLE_ID = 'stylzo-embed';

// Where this file was served from. Derived rather than hardcoded so the widget
// works on any host without a rebuild.
const ORIGIN = (() => {
  try {
    const src = import.meta.url;
    return src.startsWith('http') ? new URL('/', src).origin : 'https://www.abdulsamad.shop';
  } catch {
    return 'https://www.abdulsamad.shop';
  }
})();

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.setAttribute('data-stylzo', '');
  style.textContent = `
#${STYLE_ID}{font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1b1533;
background:#fff;border:1px solid #e3dff5;border-radius:12px;padding:14px;max-width:420px}
#${STYLE_ID} .row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}
#${STYLE_ID} input,#${STYLE_ID} select{flex:1 1 140px;min-width:0;padding:8px 10px;font-size:14px;
border:1px solid #d8d2ee;border-radius:8px;background:#fff;color:inherit}
#${STYLE_ID} button{padding:8px 14px;font-size:14px;font-weight:600;color:#fff;background:#4b2fe0;
border:0;border-radius:8px;cursor:pointer}
#${STYLE_ID} button:hover{background:#3f26bd}
#${STYLE_ID} .out{padding:10px;min-height:44px;word-break:break-all;background:#f6f4ff;
border-radius:8px;font-size:16px}
#${STYLE_ID} .foot{margin-top:10px;font-size:12px}
#${STYLE_ID} .foot a{color:#4b2fe0}
#${STYLE_ID}[data-ready="0"] .out{opacity:.5}`;
  document.head.appendChild(style);
}

function build(doc, host) {
  injectStyles();

  const root = doc.createElement('div');
  root.id = STYLE_ID;
  root.setAttribute('data-ready', '0');

  const id = Math.random().toString(36).slice(2, 8);

  root.innerHTML = `
    <div class="row">
      <label class="skip" for="${id}-in" style="position:absolute;left:-9999px">Text to style</label>
      <input id="${id}-in" type="text" placeholder="Type something" maxlength="60" autocomplete="off">
    </div>
    <div class="row">
      <label class="skip" for="${id}-sel" style="position:absolute;left:-9999px">Style</label>
      <select id="${id}-sel">
        ${STYLES.filter(([name]) => ALPHABETS[name]).map(([name, label]) =>
    `<option value="${name}">${label}</option>`).join('')}
      </select>
      <button type="button" data-copy>Copy</button>
    </div>
    <div class="out" aria-live="polite">Your styled text appears here.</div>
    <div class="foot">
      Powered by <a href="${ORIGIN}/" rel="nofollow noopener" target="_blank">Stylzo</a> &middot;
      <a href="${ORIGIN}/fonts" rel="nofollow noopener" target="_blank">all styles</a>
    </div>`;

  const input = root.querySelector(`#${id}-in`);
  const select = root.querySelector(`#${id}-sel`);
  const out = root.querySelector('.out');
  const copy = root.querySelector('[data-copy]');

  const render = () => {
    const text = input.value.trim();
    if (!text) {
      out.textContent = 'Your styled text appears here.';
      return;
    }
    try {
      out.textContent = transform(text, [{ type: 'map', name: select.value }], { maxLength: 60 });
    } catch {
      out.textContent = 'That style is unavailable.';
    }
  };

  input.addEventListener('input', render);
  select.addEventListener('change', render);

  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(out.textContent);
      copy.textContent = 'Copied';
    } catch {
      copy.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => { copy.textContent = 'Copy'; }, 1400);
  });

  host.replaceWith(root);
  root.setAttribute('data-ready', '1');
  return root;
}

function init(doc = document) {
  const hosts = [...doc.querySelectorAll('[data-stylzo-embed]')];
  for (const host of hosts) {
    // Guard against a host page calling init() twice.
    if (host.dataset.stylzoMounted === '1') continue;
    host.dataset.stylzoMounted = '1';
    try {
      build(doc, host);
    } catch {
      // A host page with a hostile CSP can block the module outright. Fail
      // quietly rather than leaving a broken placeholder behind.
      host.dataset.stylzoMounted = '0';
    }
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
}

export { init, STYLES, ORIGIN };