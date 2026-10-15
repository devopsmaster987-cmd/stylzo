// The QR code generator's interface.
//
// Everything happens on the visitor's device. The encoder (qr.js) and the payload
// builders (qr-payloads.js) are imported from this folder and neither touches the
// network, so a Wi-Fi password, a phone number and a contact card are just
// strings until they reach the page and they stop there. There is no upload and
// no third-party QR service anywhere in this path, which is the point: a page
// that asks for a password is assumed to send it somewhere unless the code says
// otherwise, and this code says otherwise.

import { say } from './lib.js';
import { encodeQr, qrToSvg, contrastRatio, normaliseHex, byteCapacity } from './qr.js';
import { buildPayload, fieldsFor, TYPES } from './qr-payloads.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// The standard requires a quiet zone of four modules on every side. A QR code
// without one is unscannable on most phones, so it is not a setting.
const QUIET_ZONE = 4;

// Export sizes offered. Deliberately powers of two: every one of them divides
// evenly by a typical symbol, so no module edge lands on a half pixel.
const SIZES = [128, 256, 512, 1024];

const DEFAULTS = {
  foreground: '#1b1533',
  background: '#ffffff',
  size: 512,
  ecl: 'M',
  logoPercent: 12,
};

// The share of the symbol a logo may hide.
//
// These are fractions of the whole symbol's area, which is the number error
// correction is actually quoted in and the number the recovery figure is about —
// so they are also what the slider measures. Measuring the logo's side length
// instead would make "20%" mean two different things on the same page: a fifth
// of the width is a twenty-fifth of the area, and the visitor choosing between
// them is choosing between a safe logo and a broken one.
//
// High-level QR recovers about 30%, so 30% is the point past which nothing can
// be relied on to put the hidden modules back.
const MAX_LOGO_COVERAGE = 0.3;
const WARN_LOGO_COVERAGE = 0.2;

const zone = $('[data-qr-zone]');
if (!zone) throw new Error('qr-code-generator.js loaded on a page without the tool');

const canvas = $('[data-qr-canvas]');
const emptyEl = $('[data-qr-empty]');
const errorsEl = $('[data-qr-errors]');
const statusEl = $('[data-qr-status]');
const contrastEl = $('[data-qr-contrast]');
const payloadEl = $('[data-qr-payload]');
const logoNoteEl = $('[data-qr-logo-note]');
const logoRemoveBtn = $('[data-qr-logo-remove]');
const logoSizeInput = $('[data-qr-logo-size]');
const logoSizeOut = $('[data-qr-logo-size-out]');
const downloadSvgBtn = $('[data-qr-download-svg]');
const copyBtn = $('[data-qr-copy]');
const resetBtn = $('[data-qr-reset]');

const state = {
  type: 'url',
  foreground: DEFAULTS.foreground,
  background: DEFAULTS.background,
  size: DEFAULTS.size,
  ecl: DEFAULTS.ecl,
  logoPercent: DEFAULTS.logoPercent,
  logo: null,        // { image, dataUrl }
  logoAutoEcl: false, // true while this module chose the level for the visitor
};

// Every URL this module creates, so a leak cannot outlive the tab.
const urls = new Set();
const keep = (url) => { urls.add(url); return url; };
const drop = (url) => { if (url) { urls.delete(url); URL.revokeObjectURL(url); } };

/** The rendered symbol, kept so a download never re-encodes from a stale field. */
let current = null;
let renderTimer = 0;

// ---- Fields -----------------------------------------------------------------

/** Read the visible panel's fields into one object. */
function readFields() {
  const panel = $(`[data-qr-panel="${state.type}"]`);
  const values = {};
  if (!panel) return values;
  for (const input of $$('[data-qr-field]', panel)) {
    values[input.dataset.qrField] = input.type === 'checkbox' ? input.checked : input.value;
  }
  return values;
}

// ---- Rendering --------------------------------------------------------------

/**
 * The pixel size of one module at a given export size.
 *
 * Always an integer, and the symbol is centred in whatever is left over. A
 * half-pixel module edge is the single most common reason a generated QR code
 * will not scan on a second try: it renders, it looks right, and the finder
 * pattern's edge is blurred by half a pixel.
 */
function moduleScale(qr, size) {
  const total = qr.size + QUIET_ZONE * 2;
  return Math.max(1, Math.floor(size / total));
}

/**
 * Paint a symbol onto a canvas.
 *
 * The canvas is always allocated at the export size, so what is shown is exactly
 * what is downloaded rather than a separate low-resolution preview that might
 * differ at the edges.
 */
function paint(qr) {
  const size = state.size;
  const scale = moduleScale(qr, size);
  const drawn = (qr.size + QUIET_ZONE * 2) * scale;
  // Centre rather than stretch: stretching would put module edges on fractional
  // pixels, which is exactly what the integer scale above exists to avoid.
  const offset = Math.floor((size - drawn) / 2);

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = state.background;
  ctx.fillRect(0, 0, size, size);

  const quiet = QUIET_ZONE * scale;
  ctx.fillStyle = state.foreground;
  for (let y = 0; y < qr.size; y += 1) {
    for (let x = 0; x < qr.size; x += 1) {
      if (!qr.modules[y * qr.size + x]) continue;
      ctx.fillRect(
        offset + (x + QUIET_ZONE) * scale,
        offset + (y + QUIET_ZONE) * scale,
        scale,
        scale,
      );
    }
  }

  if (state.logo) {
    // The logo sits on a plate in the background color. Without it the logo's
    // own edges destroy the modules underneath it, which is a large share of
    // the symbol's error-correction budget spent for nothing.
    //
    // The plate is what actually covers the modules, so the plate is what is
    // measured: the coverage this page reports to the visitor is the plate's
    // share of the symbol, not the logo's share of the plate. Quoting a smaller
    // number than the damage would make the readout optimistic.
    const box = Math.round(qr.size * scale * Math.sqrt(logoCoverage()));
    const pad = Math.max(2, Math.round(box * 0.05));
    const side = Math.max(1, box - pad * 2);
    const x = offset + quiet + (drawn - quiet * 2 - box) / 2;
    const y = offset + quiet + (drawn - quiet * 2 - box) / 2;
    ctx.fillStyle = state.background;
    ctx.fillRect(x, y, box, box);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(state.logo.image, x + pad, y + pad, side, side);
    ctx.imageSmoothingEnabled = false;
  }
  return true;
}

// ---- Error correction -------------------------------------------------------

/** The levels from weakest to strongest, for comparison. */
const ECL_ORDER = { L: 0, M: 1, Q: 2, H: 3 };

/**
 * Raise the error-correction level to whatever a logo needs, once.
 *
 * Deliberately one-way per logo: the level is raised the first time a logo is
 * added and then left alone, so a visitor who deliberately chose level L is not
 * overridden again every time the logo size slider moves.
 */
function applyLogoEcc(coverage) {
  if (!state.logo) return;
  const needed = coverage > WARN_LOGO_COVERAGE ? 'H' : coverage > 0.08 ? 'Q' : null;
  if (!needed) return;
  if (ECL_ORDER[state.ecl] >= ECL_ORDER[needed]) return;
  state.ecl = needed;
  state.logoAutoEcl = true;
  for (const button of $$('[data-qr-ecl]')) {
    button.setAttribute('aria-pressed', String(button.dataset.qrEcl === needed));
  }
  say(`Error correction set to ${needed} so the logo stays readable`);
}

// ---- Warnings ---------------------------------------------------------------

function setContrastWarning() {
  if (!contrastEl) return;
  const ratio = contrastRatio(state.foreground, state.background);
  if (ratio === null) {
    contrastEl.textContent = '';
    contrastEl.hidden = true;
    return;
  }
  // The threshold is the WCAG AA figure for body text, and it is the right one
  // here for a different reason too: a phone camera needs at least this much
  // separation before it resolves the finder pattern, and low-contrast codes are
  // the first thing to fail on a screen in daylight.
  if (ratio < 2) {
    contrastEl.textContent = `Contrast ${ratio.toFixed(1)}:1 — this code is very unlikely to scan. Choose a much darker or lighter pair.`;
    contrastEl.dataset.level = 'bad';
  } else if (ratio < 4.5) {
    contrastEl.textContent = `Contrast ${ratio.toFixed(1)}:1 — below the 4.5:1 a scanner usually needs. A darker color would be safer.`;
    contrastEl.dataset.level = 'warn';
  } else {
    contrastEl.textContent = `Contrast ${ratio.toFixed(1)}:1 — good.`;
    contrastEl.dataset.level = 'ok';
  }
  contrastEl.hidden = false;
}

function setLogoWarning(coverage) {
  if (!logoNoteEl) return;
  if (!state.logo) {
    logoNoteEl.hidden = true;
    logoNoteEl.textContent = '';
    return;
  }
  const percent = Math.round(coverage * 100);
  if (coverage > MAX_LOGO_COVERAGE) {
    logoNoteEl.hidden = false;
    logoNoteEl.dataset.level = 'bad';
    logoNoteEl.textContent = `The logo covers ${percent}% of the code, which is more than a QR code can `
      + 'recover. Make it smaller, or remove it.';
    return;
  }
  logoNoteEl.hidden = false;
  logoNoteEl.dataset.level = coverage > WARN_LOGO_COVERAGE ? 'warn' : 'ok';
  logoNoteEl.textContent = `The logo covers ${percent}% of the code. `
    + (coverage > WARN_LOGO_COVERAGE
      ? 'Error correction is on high, which recovers about that much damage.'
      : 'This is a safe size at any error-correction level.');
}

// ---- Status -----------------------------------------------------------------

function showErrors(messages) {
  if (!errorsEl) return;
  errorsEl.textContent = '';
  for (const message of messages) {
    const p = document.createElement('p');
    p.textContent = message;
    errorsEl.appendChild(p);
  }
  errorsEl.hidden = messages.length === 0;
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

/** Fraction of the symbol's area hidden by the logo, or 0 when there is none. */
function logoCoverage() {
  return state.logo ? state.logoPercent / 100 : 0;
}

// ---- The main pass ----------------------------------------------------------

/**
 * Enable or disable everything that needs a code to exist.
 *
 * Downloads and copy are disabled rather than hidden, so the row does not jump
 * when the preview appears, and so a keyboard user finds one disabled control
 * with a name rather than a control that appears from nowhere.
 */
function setReady(ready) {
  for (const button of $$('[data-qr-download], [data-qr-copy], [data-qr-copy-payload]')) {
    button.disabled = !ready;
  }
}

/**
 * Build and draw.
 *
 * Every failure path leaves a usable page. An invalid field shows a message and
 * steps the preview back to its empty state, because a visitor halfway through
 * typing a URL should be able to see and correct what is wrong rather than
 * watching the preview blank and refresh on every keystroke.
 *
 * `initial` suppresses the error on first paint. An empty form is not a mistake
 * on arrival, and opening the page to a red "enter a web address" reads as a
 * broken tool rather than as an invitation.
 */
function generate({ initial = false } = {}) {
  const fields = readFields();
  const payload = buildPayload(state.type, fields);

  if (payload.error) {
    showErrors(initial ? [] : [payload.error]);
    current = null;
    setReady(false);
    canvas.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    if (contrastEl) contrastEl.hidden = true;
    if (logoNoteEl) logoNoteEl.hidden = true;
    if (payloadEl) {
      payloadEl.textContent = '';
      const details = payloadEl.closest('details');
      if (details) details.hidden = true;
    }
    setStatus('');
    return;
  }
  showErrors([]);

  let qr;
  try {
    qr = encodeQr(payload.text, { ecl: state.ecl });
  } catch (err) {
    showErrors([err && err.message ? err.message : 'This value could not be turned into a QR code.']);
    setStatus('');
    return;
  }

  applyLogoEcc(logoCoverage());
  // The level may have just been raised for the logo, so rebuild with it.
  if (qr.ecl !== state.ecl) {
    try {
      qr = encodeQr(payload.text, { ecl: state.ecl });
    } catch {
      /* already reported above; leave the preview as it is */
    }
  }

  const coverage = logoCoverage();
  if (coverage > MAX_LOGO_COVERAGE) {
    showErrors(['The logo is too large to be scannable. Reduce its size or remove it.']);
    setStatus('');
    return;
  }

  if (!paint(qr)) {
    showErrors(['Your browser could not draw the QR code.']);
    return;
  }

  current = { qr, payload: payload.text };
  setReady(true);
  canvas.hidden = false;
  if (emptyEl) emptyEl.hidden = true;

  setContrastWarning();
  setLogoWarning(coverage);

  if (payloadEl) {
    payloadEl.textContent = payload.text;
    const details = payloadEl.closest('details');
    if (details) details.hidden = false;
  }

  setStatus(
    `QR code ready — version ${qr.version}, ${qr.size} by ${qr.size} modules, `
    + `${state.size} by ${state.size} pixels, error correction ${qr.ecl}, `
    + `holds up to ${byteCapacity(qr.version, qr.ecl)} characters.`,
  );
}

/** Re-run after a change, coalescing the burst a slider produces. */
function scheduleGenerate() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(generate, 120);
}

/**
 * The Generate button.
 *
 * The preview is already live, so this is not "draw it now" for its own sake —
 * a button that only redrew what was already on screen would be decoration. It
 * does the two things a live preview cannot do:
 *
 * - It forces an immediate encode rather than waiting out a debounce someone may
 *   have just triggered by tabbing through the settings.
 * - It puts the finished code in front of the visitor. Below the 1000px
 *   breakpoint the layout stacks, so on a phone the code you just built is
 *   underneath a nine-field form, and "where did my code go" is the most common
 *   thing that happens to a generator that updates as you type.
 */
function generateOnDemand() {
  clearTimeout(renderTimer);
  renderTimer = 0;
  generate();

  const failed = errorsEl && !errorsEl.hidden;
  const target = failed ? errorsEl : canvas;
  if (!target || target.hidden) return;

  // Guarded rather than called directly: scrollIntoView is absent in some
  // embedded webviews, and a missing convenience API should not take down a
  // handler that has already successfully built the code.
  if (typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  }
  // Focus only moves when the visitor asked for it by pressing the button, which
  // is the one case where stealing focus is what they wanted.
  const focusTarget = failed ? $('[data-qr-field]', $(`[data-qr-panel="${state.type}"]`) || document) : downloadBtn;
  if (focusTarget && typeof focusTarget.focus === 'function') {
    focusTarget.focus({ preventScroll: true });
  }
}

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Tabs -------------------------------------------------------------------

function selectType(type, { focus = false, initial = false } = {}) {
  if (!fieldsFor(type).length) return;
  state.type = type;

  for (const button of $$('[data-qr-type]')) {
    const selected = button.dataset.qrType === type;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && focus) button.focus();
  }
  for (const panel of $$('[data-qr-panel]')) {
    panel.hidden = panel.dataset.qrPanel !== type;
  }
  generate({ initial });
}

/** Arrow keys move between tabs, which is what a tablist is expected to do. */
function onTabKeydown(event) {
  const order = TYPES.map((t) => t.id);
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
  if (step) {
    event.preventDefault();
    const next = (order.indexOf(state.type) + step + order.length) % order.length;
    selectType(order[next], { focus: true });
    return;
  }
  if (event.key === 'Home') {
    event.preventDefault();
    selectType(order[0], { focus: true });
  } else if (event.key === 'End') {
    event.preventDefault();
    selectType(order[order.length - 1], { focus: true });
  }
}

// ---- Downloads --------------------------------------------------------------

function triggerDownload(blob, filename) {
  const url = keep(URL.createObjectURL(blob));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Released on a delay: Safari cancels an in-flight download whose object URL
  // disappears the moment the click returns.
  setTimeout(() => drop(url), 10000);
}

/** A filename that says what the code is, not what the visitor called it. */
function fileStem() {
  const map = { url: 'stylzo-qr-website', text: 'stylzo-qr-text', wifi: 'stylzo-qr-wifi',
    email: 'stylzo-qr-email', phone: 'stylzo-qr-phone', sms: 'stylzo-qr-sms',
    whatsapp: 'stylzo-qr-whatsapp', vcard: 'stylzo-qr-contact', location: 'stylzo-qr-location',
    event: 'stylzo-qr-event' };
  return map[state.type] || 'stylzo-qr-code';
}

function downloadPng() {
  if (!current) return;
  canvas.toBlob((blob) => {
    if (!blob) { say('Your browser could not encode a PNG. Try the SVG instead.'); return; }
    triggerDownload(blob, `${fileStem()}-${state.size}.png`);
    say(`Saved a ${state.size} by ${state.size} PNG`);
  }, 'image/png');
}

function downloadJpg() {
  if (!current) return;
  // JPEG has no transparency, so the canvas is already opaque: it was filled with
  // the background colour before anything was drawn on it.
  canvas.toBlob((blob) => {
    if (!blob) { say('Your browser could not encode a JPG.'); return; }
    triggerDownload(blob, `${fileStem()}-${state.size}.jpg`);
    say(`Saved a ${state.size} by ${state.size} JPG`);
  }, 'image/jpeg', 0.92);
}

function downloadSvg() {
  if (!current) return;
  const svg = qrToSvg(current.qr, {
    foreground: state.foreground,
    background: state.background,
    size: state.size,
    quietZone: QUIET_ZONE,
    title: 'QR code generated by Stylzo',
  });

  let out = svg;
  if (state.logo) {
    // The logo is a raster image, so it is embedded rather than referenced: an
    // SVG pointing at a blob URL on this page is a broken file everywhere else,
    // which is every place anyone actually uses it. The geometry matches the
    // canvas exactly, in viewBox units: the plate is the measured area and the
    // logo sits inside it.
    const extent = current.qr.size + QUIET_ZONE * 2;
    const box = current.qr.size * Math.sqrt(logoCoverage());
    const pad = Math.max(2, box * 0.05);
    const side = Math.max(1, box - pad * 2);
    const offset = (extent - box) / 2;
    out = svg.replace('</svg>',
      `<rect x="${offset}" y="${offset}" width="${box}" height="${box}" `
      + `fill="${state.background}"/>`
      + `<image href="${state.logo.dataUrl}" x="${offset + pad}" y="${offset + pad}" `
      + `width="${side}" height="${side}" preserveAspectRatio="xMidYMid meet"/></svg>`);
  }
  triggerDownload(
    new Blob([out], { type: 'image/svg+xml;charset=utf-8' }),
    `${fileStem()}.svg`,
  );
  say('Saved a scalable SVG');
}

/**
 * Copy the code to the clipboard as a PNG.
 *
 * Clipboard images are not universally supported — Safari and Firefox both gate
 * this behind a permission and Firefox has no support at all — so the fallback
 * has to say what to do rather than appearing to have worked.
 */
async function copyImage() {
  if (!current) return;
  if (typeof window.ClipboardItem !== 'function' || !navigator.clipboard?.write) {
    say('This browser cannot copy images. Use Download PNG instead.');
    return;
  }
  try {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/png');
    });
    await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
    say('QR code copied to the clipboard');
  } catch {
    say('The clipboard refused the image. Use Download PNG instead.');
  }
}

// ---- Wiring -----------------------------------------------------------------

const panel = $('[data-qr-panels]');
if (panel) {
  panel.addEventListener('input', scheduleGenerate);
  panel.addEventListener('change', scheduleGenerate);
}

const tablist = $('[data-qr-tabs]');
if (tablist) {
  tablist.addEventListener('click', (event) => {
    const button = event.target.closest('[data-qr-type]');
    if (button) selectType(button.dataset.qrType);
  });
  tablist.addEventListener('keydown', onTabKeydown);
}

// Sizes.
const sizeInput = $('[data-qr-size]');
if (sizeInput) {
  sizeInput.addEventListener('change', () => {
    const value = Number(sizeInput.value);
    state.size = SIZES.includes(value) ? value : DEFAULTS.size;
    generate();
  });
}

// Error correction.
for (const button of $$('[data-qr-ecl]')) {
  button.addEventListener('click', () => {
    if (!/^[LMQH]$/.test(button.dataset.qrEcl)) return;
    state.ecl = button.dataset.qrEcl;
    state.logoAutoEcl = false; // the visitor has taken the decision back
    for (const other of $$('[data-qr-ecl]')) {
      other.setAttribute('aria-pressed', String(other === button));
    }
    generate();
  });
}

// Colours. The colour picker and the text box are the same value, so whichever
// one is used has to move the other, and an unparseable entry is ignored rather
// than turning the preview black.
function setColour(which, value) {
  const hex = normaliseHex(value);
  if (!hex) return;
  state[which] = hex;
  for (const input of $$(`[data-qr-${which}]`)) {
    if (input.value.toLowerCase() !== hex) input.value = hex;
  }
  // Debounced, not immediate: dragging a colour picker fires input continuously,
  // and re-encoding a 1024px symbol on each one makes the picker stutter instead
  // of the preview keeping up.
  scheduleGenerate();
}

for (const which of ['foreground', 'background']) {
  for (const input of $$(`[data-qr-${which}]`)) {
    input.addEventListener('input', () => setColour(which, input.value));
    input.addEventListener('change', () => setColour(which, input.value));
  }
}

for (const button of $$('[data-qr-swatch]')) {
  button.addEventListener('click', () => {
    // The reset chip carries a colour but no single channel, so it is handled
    // here rather than being read as a foreground swatch.
    if (button.hasAttribute('data-qr-reset-colors')) {
      setColour('foreground', DEFAULTS.foreground);
      setColour('background', DEFAULTS.background);
      return;
    }
    setColour(button.dataset.qrSwatch, button.dataset.colour);
  });
}

// Logo.
const logoInput = $('[data-qr-logo]');
if (logoInput) {
  logoInput.addEventListener('change', () => {
    const file = logoInput.files && logoInput.files[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(file.type)) {
      showErrors(['The logo must be a PNG, JPG, WebP or SVG image.']);
      logoInput.value = '';
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showErrors(['That logo is over 4 MB. Use a smaller image.']);
      logoInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        // Held as a data URL rather than an object URL: the SVG export embeds it,
        // and a blob URL would produce a file broken everywhere the page is not
        // open. Nothing to revoke, so nothing is registered.
        state.logo = { image, dataUrl: String(reader.result) };
        state.logoAutoEcl = false;
        if (logoRemoveBtn) logoRemoveBtn.hidden = false;
        showErrors([]);
        generate();
      };
      image.onerror = () => {
        showErrors(['That image could not be read.']);
        logoInput.value = '';
      };
      image.src = String(reader.result);
    };
    reader.onerror = () => {
      showErrors(['That image could not be read.']);
      logoInput.value = '';
    };
    reader.readAsDataURL(file);
  });
}

if (logoSizeInput) {
  logoSizeInput.addEventListener('input', () => {
    // 2 to 35 percent of the area. The top of the range is deliberately past
    // what any error-correction level can recover: the tool explains why rather
    // than quietly capping the slider and pretending the choice was smaller.
    state.logoPercent = Math.min(35, Math.max(2, Number(logoSizeInput.value) || DEFAULTS.logoPercent));
    if (logoSizeOut) logoSizeOut.textContent = `${state.logoPercent}%`;
    scheduleGenerate();
  });
}

if (logoRemoveBtn) {
  logoRemoveBtn.addEventListener('click', () => {
    state.logo = null;
    logoRemoveBtn.hidden = true;
    if (logoInput) logoInput.value = '';
    generate();
  });
}

const pngBtn = $('[data-qr-download-png]');
const jpgBtn = $('[data-qr-download-jpg]');
const downloadBtn = pngBtn;
const generateBtn = $('[data-qr-generate]');
if (pngBtn) pngBtn.addEventListener('click', downloadPng);
if (jpgBtn) jpgBtn.addEventListener('click', downloadJpg);
if (downloadSvgBtn) downloadSvgBtn.addEventListener('click', downloadSvg);
if (copyBtn) copyBtn.addEventListener('click', copyImage);
if (generateBtn) generateBtn.addEventListener('click', generateOnDemand);

const payloadCopyBtn = $('[data-qr-copy-payload]');
if (payloadCopyBtn) {
  payloadCopyBtn.addEventListener('click', async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.payload);
      say('Copied the text this code contains');
    } catch {
      say('Copy failed. Select the text and copy it manually.');
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    for (const input of $$('[data-qr-field]')) {
      if (input.type === 'checkbox') input.checked = false;
      else input.value = '';
    }
    state.logo = null;
    state.ecl = DEFAULTS.ecl;
    state.size = DEFAULTS.size;
    state.logoPercent = DEFAULTS.logoPercent;
    state.logoAutoEcl = false;
    setColourSilent(DEFAULTS.foreground, 'foreground');
    setColourSilent(DEFAULTS.background, 'background');
    if (sizeInput) sizeInput.value = String(DEFAULTS.size);
    if (logoSizeInput) logoSizeInput.value = String(DEFAULTS.logoPercent);
    if (logoSizeOut) logoSizeOut.textContent = `${DEFAULTS.logoPercent}%`;
    if (logoRemoveBtn) logoRemoveBtn.hidden = true;
    if (logoInput) logoInput.value = '';
    for (const button of $$('[data-qr-ecl]')) {
      button.setAttribute('aria-pressed', String(button.dataset.qrEcl === DEFAULTS.ecl));
    }
    current = null;
    canvas.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    if (payloadEl) {
      payloadEl.textContent = '';
      const details = payloadEl.closest('details');
      if (details) details.hidden = true;
    }
    if (contrastEl) contrastEl.hidden = true;
    if (logoNoteEl) logoNoteEl.hidden = true;
    showErrors([]);
    setStatus('');
    say('Reset');
  });
}

/** Set a colour without triggering a render, for the reset path. */
function setColourSilent(value, which) {
  state[which] = value;
  for (const input of $$(`[data-qr-${which}]`)) input.value = value;
}

// ---- Teardown ---------------------------------------------------------------

window.addEventListener('pagehide', () => {
  clearTimeout(renderTimer);
  for (const url of urls) URL.revokeObjectURL(url);
  urls.clear();
});

// ---- Start ------------------------------------------------------------------

if (logoSizeOut) logoSizeOut.textContent = `${state.logoPercent}%`;
for (const which of ['foreground', 'background']) {
  for (const input of $$(`[data-qr-${which}]`)) input.value = state[which];
}
canvas.hidden = true;
setReady(false);
// First paint shows the empty state rather than an error: nobody has typed
// anything yet, and an empty form is not a mistake.
selectType('url', { initial: true });
