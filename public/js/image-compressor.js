// Image compressor. Everything happens on the visitor's device.
//
// There is no upload here and there is no fetch of the image: each file is read
// with createImageBitmap, drawn onto a canvas, and re-encoded with
// canvas.toBlob(). That is a deliberate constraint rather than a missing
// feature. A tool that accepts image files is assumed to send them somewhere
// unless the code says otherwise, and "we never upload" is only a claim a
// reader can check if the page really does not.
//
// On the library question. The usual suggestion is `browser-image-compression`
// or similar. Neither can be used here: this project's browser code is plain ES
// modules served from /public, with a CSP of `script-src 'self'` and no bundler,
// so a package in node_modules is unreachable and a CDN is blocked. More to the
// point, the work those libraries do is a wrapper around exactly the two APIs
// used below. `createImageBitmap` decodes, `canvas.toBlob` hands the pixels to
// the browser's own image encoder — libjpeg-turbo, libpng and libwebp compiled
// into the browser and maintained by the browser vendors. Adding a wrapper
// around the platform's compressor would add a dependency and a download to get
// the platform's compressor. The ZIP writer next door is the same argument, at
// about a hundred lines instead of a package.

import { say } from './lib.js';
import { createZip } from './zip.js';

// ---- Limits -----------------------------------------------------------------
// Every one of these is configurable here and nowhere else. They exist to stop
// one enormous file exhausting the memory of a phone, not to ration normal use,
// so each sits far above what a page normally serves.
const LIMITS = {
  maxBytes: 25 * 1024 * 1024,   // per file
  maxFiles: 20,                 // per batch
  maxEdge: 16000,               // per side, on the way in
  maxPixels: 40e6,              // total pixels per image, either direction
  maxOutputEdge: 12000,         // per side, on the way out (canvas limits)
};

// Presets set the quality slider only. They deliberately do not touch the output
// format: a preset that silently rewrote a visitor's choice from JPEG to WebP
// would produce a file they did not ask for under a name that hides it.
const PRESETS = [
  { id: 'low', quality: 45 },
  { id: 'balanced', quality: 80 },
  { id: 'high', quality: 92 },
];

const ACCEPTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ACCEPTED_EXT = /\.(jpe?g|png|webp)$/i;
const EXTENSION = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const FORMAT_LABEL = { 'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WebP' };
const QUALITY_STEP = 0.01;

const $ = (sel, root = document) => root.querySelector(sel);

const zone = $('[data-cz-zone]');
if (!zone) throw new Error('image-compressor.js loaded on a page without the tool');

const input = $('[data-cz-input]');
const listEl = $('[data-cz-list]');
const summaryEl = $('[data-cz-summary]');
const errorsEl = $('[data-cz-errors]');
const progressEl = $('[data-cz-progress]');
const progressBar = $('[data-cz-bar]');
const progressText = $('[data-cz-progress-text]');
const qualityInput = $('[data-cz-quality]');
const qualityOut = $('[data-cz-quality-out]');
const qualityNote = $('[data-cz-quality-note]');
const formatSelect = $('[data-cz-format]');
const widthInput = $('[data-cz-width]');
const heightInput = $('[data-cz-height]');
const scaleInput = $('[data-cz-scale]');
const lockBtn = $('[data-cz-lock]');
const compressAllBtn = $('[data-cz-compress-all]');
const downloadAllBtn = $('[data-cz-download-all]');
const resetBtn = $('[data-cz-reset]');
const emptyEl = $('[data-cz-empty]');

/** Batch state. Nothing here is ever sent anywhere. */
let items = [];
let token = 0;      // invalidates an in-flight run when settings change again
let rerunTimer = 0;

const settings = {
  quality: 80,
  format: 'auto',
  width: '',
  height: '',
  scale: '',
  lock: true,
};

// ---- Object URL bookkeeping -------------------------------------------------
// Every URL this module creates is registered, so a card that is re-rendered
// five times while a slider is dragged cannot leak five blobs. A leaked object
// URL pins its blob in memory for the life of the tab, which on a phone is the
// difference between a tool that works and one that crashes the tab.
const urls = new Set();
const keep = (url) => { urls.add(url); return url; };
const drop = (url) => { if (url) { urls.delete(url); URL.revokeObjectURL(url); } };

// ---- Capability probe -------------------------------------------------------
// A canvas silently falls back to PNG for a format it cannot encode, so support
// has to be asked rather than assumed. Offering a WebP option on a browser that
// cannot encode it would produce a "WebP" that is a PNG wearing the wrong
// extension.
const canEncode = (mime) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(mime).startsWith(`data:${mime}`);
  } catch {
    return false;
  }
};

const webpOk = canEncode('image/webp');

// ---- Formatting -------------------------------------------------------------
function size(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Signed change in per cent, rounded to one decimal. */
function saving(original, output) {
  if (!original) return 0;
  return ((original - output) / original) * 100;
}

function savingText(pct) {
  if (pct > 0.05) return `${pct.toFixed(1)}% smaller`;
  if (pct < -0.05) return `${Math.abs(pct).toFixed(1)}% larger`;
  return 'no change';
}

// ---- Filenames --------------------------------------------------------------
/**
 * A safe download name whose extension matches the bytes actually produced.
 *
 * Two jobs. Strip anything that could become a path separator, because browsers
 * treat the download attribute as a path even though it is only a label here.
 * And replace the extension outright, so `photo.jpg` re-encoded to WebP is
 * `photo.webp` rather than `photo.webp.jpg` or `photo.jpg` holding WebP bytes.
 */
function safeName(name, mime) {
  const base = String(name || 'image')
    .replace(/[/\\]/g, '-')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'image';
  const stem = base.replace(/\.[a-z0-9]{1,5}$/i, '').replace(/[.\s]+$/, '') || 'image';
  return `${stem}.${EXTENSION[mime] || 'png'}`;
}

/** The MIME implied by a filename extension, for files the browser typed as blank. */
function mimeFromName(name) {
  if (/\.png$/i.test(name)) return 'image/png';
  if (/\.webp$/i.test(name)) return 'image/webp';
  if (/\.jpe?g$/i.test(name)) return 'image/jpeg';
  return null;
}

// ---- Decoding ---------------------------------------------------------------
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    // imageOrientation honours the EXIF rotation a phone camera writes, so a
    // portrait photo is not laid on its side.
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Safari rejects the options bag on some builds. Retry bare before
      // giving up on the fast path.
      try {
        return await createImageBitmap(file);
      } catch {
        /* fall through to the <img> path */
      }
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    if (typeof img.decode === 'function') {
      await img.decode();
    } else {
      await new Promise((resolve, reject) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', () => reject(new Error('decode failed')), { once: true });
      });
    }
    return img;
  } finally {
    // The pixels are decoded now, so the URL can go immediately rather than
    // leaking for the life of the tab.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

const release = (source) => {
  if (source && typeof source.close === 'function') source.close();
};

/**
 * Whether the image actually contains a transparent pixel.
 *
 * Measured rather than assumed, because the file extension is not evidence: a
 * PNG can be fully opaque and a JPEG can never be transparent at all. The image
 * is drawn at most 64px on its long edge and sampled, which is a few thousand
 * pixels and costs nothing next to the decode that already happened.
 */
function detectAlpha(source, width, height) {
  try {
    const scale = Math.min(1, 64 / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(source, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true;
    return false;
  } catch {
    // A canvas that refuses to be read (tainted, or a locked-down context) is
    // not a reason to reject the file. Report "no alpha" and let the JPEG
    // warning be over-cautious rather than under-cautious.
    return false;
  }
}

// ---- Output format ----------------------------------------------------------
/**
 * The MIME actually encoded as.
 *
 * The visitor's choice is honoured, with one exception: WebP on a browser that
 * cannot encode it falls back to PNG. Nothing else is substituted. The previous
 * draft silently upgraded a transparent PNG to WebP when JPEG was chosen; that
 * is dishonest, because the downloaded file then is not the format the visitor
 * picked and the name they see does not say what happened. Flattening is
 * surfaced as a warning instead.
 */
function resolveFormat(item) {
  const target = settings.format === 'auto' ? item.mime : settings.format;
  if (target === 'image/webp' && !webpOk) return 'image/png';
  return target;
}

const flattensAlpha = (item) => resolveFormat(item) === 'image/jpeg' && item.hasAlpha;

// ---- Sizing -----------------------------------------------------------------
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Output dimensions.
 *
 * Percentage first, because it is the unambiguous one; width/height are a cap
 * for when a visitor knows the exact size they need.
 *
 * Never upscales. A canvas given more pixels than the source invents pixels
 * that carry no detail, and the result is a bigger file with less information
 * in it, so an oversized request is reduced to the source rather than honoured.
 *
 * The two ceilings are applied last, on every path, because a canvas is
 * allocated at full size before the encoder sees it: a 16000-by-16000 canvas is
 * a gigabyte of RGBA, and a per-side limit on its own does not stop that.
 */
function targetSize(item) {
  const scale = num(settings.scale);
  const maxW = num(settings.width);
  const maxH = num(settings.height);

  let width = item.width;
  let height = item.height;

  if (scale) {
    const pct = Math.min(100, scale) / 100;
    width *= pct;
    height *= pct;
  } else if (maxW && maxH && !settings.lock) {
    // Both fields filled with the lock off is an explicit stretch. Clamped per
    // axis so a stretched image is still never larger than the source.
    width = Math.min(maxW, item.width);
    height = Math.min(maxH, item.height);
  } else if (maxW) {
    width = Math.min(maxW, item.width);
    height = (width * item.height) / item.width;
  } else if (maxH) {
    height = Math.min(maxH, item.height);
    width = (height * item.width) / item.height;
  }

  const cap = Math.min(
    1,
    LIMITS.maxOutputEdge / width,
    LIMITS.maxOutputEdge / height,
    Math.sqrt(LIMITS.maxPixels / (width * height)),
  );

  return {
    width: Math.max(1, Math.round(width * cap)),
    height: Math.max(1, Math.round(height * cap)),
  };
}

// ---- Compression ------------------------------------------------------------
async function compress(item) {
  const mime = resolveFormat(item);
  const { width, height } = targetSize(item);
  const source = await decode(item.file);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  // A canvas starts fully transparent. Without this, an image converted to a
  // format with no alpha comes out with black edges where the alpha used to be.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  release(source);

  // PNG is lossless, so `quality` has no meaning for it — the specification says
  // the encoder ignores it. Passing a made-up number would imply the slider does
  // something to a PNG, so it is omitted rather than sent and discarded.
  const blob = mime === 'image/png'
    ? await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Your browser could not encode this image.'))), mime);
    })
    : await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Your browser could not encode this image.'))), mime, settings.quality * QUALITY_STEP);
    });

  if (!blob || !blob.size) throw new Error('Your browser could not encode this image. Try a different format.');

  drop(item.outputUrl);
  drop(item.originalUrl);
  item.blob = blob;
  item.outMime = mime;
  item.outWidth = width;
  item.outHeight = height;
  item.outName = safeName(item.name, mime);
  item.outputUrl = keep(URL.createObjectURL(blob));
  item.saving = saving(item.size, blob.size);
  item.originalUrl = null;
  item.useOriginal = false;
  item.error = null;
  item.state = 'done';
}

/**
 * What the download button hands over: the re-encode, or the untouched file.
 *
 * The original's URL is created once when the visitor asks for the original and
 * kept on the item, rather than minted inside the render pass. Creating it
 * during render would leak one blob every time the card re-rendered, and the
 * quality slider re-renders the list on every input.
 */
function setUseOriginal(item, on) {
  item.useOriginal = Boolean(on);
  if (item.useOriginal && !item.originalUrl) item.originalUrl = keep(URL.createObjectURL(item.file));
  if (!item.useOriginal) {
    drop(item.originalUrl);
    item.originalUrl = null;
  }
}

const downloadName = (item) => (item.useOriginal ? safeName(item.name, item.mime) : item.outName);
const downloadUrl = (item) => (item.useOriginal ? item.originalUrl : item.outputUrl);

// ---- DOM helpers ------------------------------------------------------------
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Every visitor-supplied string reaches the DOM as textContent, never as
 * markup. A file called `<img src=x onerror=alert(1)>.png` is a perfectly legal
 * filename on disk, and an innerHTML anywhere in this render path would turn it
 * into script.
 */
function button(label, className, onClick) {
  const b = el('button', className, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

// ---- Rendering --------------------------------------------------------------
/**
 * A frame caption: a short label over the detail, rather than one run of text.
 * "Original · 1600 × 900 · 2.4 MB" is a single string that reads as a caption;
 * split, it reads as a heading and a fact, which is what it is.
 */
function caption(label, detail) {
  const fig = el('figcaption');
  fig.appendChild(el('b', null, label));
  fig.appendChild(el('span', null, detail));
  return fig;
}

function renderCard(item) {
  const li = el('li', 'cz-card');

  const head = el('div', 'cz-card-head');
  const title = el('p', 'cz-card-name', item.name);
  title.title = item.name;
  head.appendChild(title);
  head.appendChild(el('span', 'badge', FORMAT_LABEL[item.mime] || 'Image'));
  // The number the visitor actually came for, on the card itself rather than
  // buried in the stats table. Colour carries the same meaning as the table
  // below, so a glance across a batch of twenty reads correctly.
  if (item.blob && !item.error) {
    const chip = el('span', `cz-chip ${item.saving > 0.05 ? 'is-good' : item.saving < -0.05 ? 'is-bad' : ''}`);
    chip.appendChild(el('b', null, savingText(item.saving)));
    chip.appendChild(el('span', null, `${size(item.size)} → ${size(item.blob.size)}`));
    head.appendChild(chip);
  }
  li.appendChild(head);

  const frames = el('div', 'cz-frames');
  const working = item.state === 'working';

  // The "before" frame is the uploaded file, re-shown next to the result so the
  // two are directly comparable rather than described in text.
  const before = el('figure', 'cz-frame');
  if (item.hasAlpha) before.classList.add('has-alpha');
  const beforeImg = el('img');
  beforeImg.src = item.previewUrl;
  beforeImg.alt = `Original ${item.name}, ${item.width} by ${item.height} pixels, ${size(item.size)}`;
  // Deliberately not loading="lazy". These point at blob: URLs of bytes already
  // in memory, so there is no network cost to defer — and a lazy image inside a
  // container that starts display:none is a well-known way to end up with a
  // frame that never populates once the container is shown.
  before.appendChild(beforeImg);
  before.appendChild(caption('Original', `${item.width} × ${item.height} · ${size(item.size)}`));
  frames.appendChild(before);

  const after = el('figure', 'cz-frame');
  if (item.blob && item.hasAlpha && resolveFormat(item) !== 'image/jpeg') after.classList.add('has-alpha');
  if (item.blob) {
    const afterImg = el('img');
    afterImg.src = item.outputUrl;
    afterImg.alt = `Compressed ${item.outName}, ${item.outWidth} by ${item.outHeight} pixels, ${size(item.blob.size)}`;
    after.appendChild(afterImg);
    after.appendChild(caption(
      FORMAT_LABEL[item.outMime] || 'Image',
      `${item.outWidth} × ${item.outHeight} · ${size(item.blob.size)}`,
    ));
  } else {
    after.classList.add('is-empty');
    after.appendChild(el('p', 'cz-frame-note', working ? 'Compressing…' : 'Not compressed yet'));
  }
  frames.appendChild(after);
  li.appendChild(frames);

  if (item.error) {
    li.appendChild(el('p', 'cz-card-error', item.error));
  } else {
    // Transparency is worth flagging both before the encode (so the choice is
    // informed) and after it (so a flattened background is not discovered on
    // another machine, where it shows up as a black or white rectangle).
    const flattened = item.blob ? item.outMime === 'image/jpeg' && item.hasAlpha : flattensAlpha(item);
    if (flattened) {
      li.appendChild(el('p', 'cz-warn', 'This image has a transparent background. JPEG cannot store transparency, so it has been flattened onto white. Choose PNG or WebP to keep it.'));
    }

    if (item.blob) {
      const pct = item.saving;
      const stats = el('dl', 'cz-stats');
      const stat = (label, value, cls) => {
        stats.appendChild(el('dt', null, label));
        stats.appendChild(el('dd', cls, value));
      };
      stat('Original', size(item.size));
      stat('Compressed', size(item.blob.size));
      const diff = item.size - item.blob.size;
      stat('Space saved', `${diff >= 0 ? '' : '+'}${size(Math.abs(diff))}`, diff > 0 ? 'is-good' : diff < 0 ? 'is-bad' : null);
      stat('Change', savingText(pct), pct > 0.05 ? 'is-good' : pct < -0.05 ? 'is-bad' : null);
      li.appendChild(stats);

      // The honest case. A re-encode can be larger than its input — a PNG that
      // was already optimised, a quality setting above the source's own — and a
      // tool that hid that behind a green badge would be lying. Say so, and hand
      // back the original so the visitor is not worse off than when they started.
      if (pct < -0.05) {
        // Name the actual cause. Blaming the quality slider on a PNG re-encode,
        // where the slider played no part at all, would send the visitor off to
        // adjust a control that cannot help them.
        const why = item.outMime === 'image/png'
          ? 'PNG is lossless, so re-encoding only added overhead'
          : item.outMime !== item.mime
            ? `Converting ${FORMAT_LABEL[item.mime]} to ${FORMAT_LABEL[item.outMime]} at ${settings.quality}% quality added bytes rather than removing them`
            : `Re-encoding at ${settings.quality}% quality added bytes rather than removing them`;
        const note = el('p', 'cz-warn');
        note.appendChild(document.createTextNode(`This re-encode is ${size(Math.abs(diff))} larger than the file you added. ${why}. `));
        note.appendChild(button(
          item.useOriginal ? 'Downloading the original file' : 'Use the original file instead',
          'linkish',
          () => {
            setUseOriginal(item, !item.useOriginal);
            render();
          },
        ));
        li.appendChild(note);
      }
    }
  }

  const actions = el('div', 'cz-card-actions');

  if (item.blob) {
    const a = el('a', 'btn small', 'Download');
    a.href = downloadUrl(item);
    a.download = downloadName(item);
    a.addEventListener('click', () => say(`Saved ${a.download}`));
    actions.appendChild(a);
  } else if (!item.error) {
    actions.appendChild(button('Compress', 'btn small', () => run([item])));
  }

  if (item.error) actions.appendChild(button('Retry', 'btn small', () => retryItem(item)));
  actions.appendChild(button('Remove', 'btn small subtle', () => removeItem(item.id)));
  li.appendChild(actions);

  return li;
}

function render() {
  listEl.textContent = '';
  for (const item of items) listEl.appendChild(renderCard(item));

  const done = items.filter((i) => i.blob).length;
  const failed = items.filter((i) => i.error).length;
  const originalBytes = items.reduce((n, i) => n + i.size, 0);
  const outBytes = items.reduce((n, i) => n + (i.blob ? i.blob.size : 0), 0);

  const parts = [];
  if (items.length) {
    parts.push(`${done} of ${items.length} compressed`);
    if (failed) parts.push(`${failed} failed`);
    if (outBytes > 0) {
      parts.push(`${size(originalBytes)} → ${size(outBytes)}`);
      parts.push(`${saving(originalBytes, outBytes).toFixed(1)}% smaller overall`);
    }
  }
  summaryEl.textContent = parts.join(' · ');

  listEl.hidden = items.length === 0;
  // The empty state is in the server HTML rather than created here, so the page
  // says something useful before the module has even loaded.
  if (emptyEl) emptyEl.hidden = items.length > 0;
  downloadAllBtn.hidden = done === 0;
  compressAllBtn.disabled = items.length === 0 || items.every((i) => i.blob);
  resetBtn.disabled = items.length === 0;
}

// ---- Batch ------------------------------------------------------------------
async function run(only) {
  const pending = (only || items).filter((i) => !i.error && !i.blob);
  if (!pending.length) return;

  const mine = ++token;
  progressEl.hidden = false;
  let finished = 0;

  for (const item of pending) {
    if (mine !== token) return;
    item.state = 'working';
    progressText.textContent = `Compressing ${finished + 1} of ${pending.length}…`;
    progressBar.style.width = `${Math.round((finished / pending.length) * 100)}%`;
    render();
    try {
      await compress(item);
    } catch (err) {
      item.blob = null;
      item.outputUrl = null;
      item.error = err && err.message ? err.message : 'This image could not be compressed.';
      item.state = 'error';
    }
    finished += 1;
    render();
    // Yield to the event loop so the progress bar paints between images. A batch
    // of twenty encodes is long enough that a frozen page is a real failure.
    await new Promise((r) => setTimeout(r, 0));
  }

  if (mine !== token) return;
  progressBar.style.width = '100%';
  const failed = pending.filter((i) => i.error).length;
  progressText.textContent = failed
    ? `Done — ${pending.length - failed} compressed, ${failed} could not be read.`
    : `Done — ${pending.length} image${pending.length === 1 ? '' : 's'} compressed.`;
  setTimeout(() => {
    if (mine === token) progressEl.hidden = true;
  }, 1200);
}

/** Stop an in-flight batch and take the progress bar down with it. */
function cancelRun() {
  token += 1;
  progressEl.hidden = true;
}

/**
 * Run one image again.
 *
 * The stored error has to be cleared first: run() skips anything carrying one,
 * so retrying without clearing it would find nothing to do and appear to hang.
 */
function retryItem(item) {
  item.error = null;
  item.state = 'queued';
  run([item]);
}

/** Drop every re-encode so the next run starts from the untouched file. */
function invalidate() {
  for (const i of items) {
    drop(i.outputUrl);
    drop(i.originalUrl);
    i.outputUrl = null;
    i.originalUrl = null;
    i.blob = null;
    i.useOriginal = false;
    i.state = 'queued';
  }
}

/** Settings changed: re-encode everything. */
function scheduleRerun() {
  if (!items.length) return;
  clearTimeout(rerunTimer);
  rerunTimer = setTimeout(() => {
    const stale = items.filter((i) => !i.error);
    invalidate();
    run(stale);
  }, 250);
}

// ---- Ingest -----------------------------------------------------------------
async function addFiles(fileList) {
  const incoming = Array.from(fileList || []);
  if (!incoming.length) return;

  const problems = [];
  const room = LIMITS.maxFiles - items.length;

  if (room <= 0) {
    showErrors([`You can compress ${LIMITS.maxFiles} images at a time. Remove one first to add another.`]);
    return;
  }

  let added = 0;
  for (const file of incoming) {
    if (added >= room) {
      problems.push(`Only the first ${room} image${room === 1 ? ' was' : 's were'} added — the batch limit is ${LIMITS.maxFiles}.`);
      break;
    }

    const named = file.name || 'that file';
    // Some browsers report an empty type for an unusual file, and some report a
    // type that disagrees with the extension. Accepting on either and then
    // decoding is the only check that actually proves the bytes are an image.
    const typeOk = ACCEPTED_MIME.has(file.type);
    const extOk = ACCEPTED_EXT.test(named);
    if (!typeOk && !extOk) {
      problems.push(`${named} is not a JPG, PNG or WebP image.`);
      continue;
    }
    if (file.size === 0) {
      problems.push(`${named} is empty.`);
      continue;
    }
    if (file.size > LIMITS.maxBytes) {
      problems.push(`${named} is ${size(file.size)}, over the ${size(LIMITS.maxBytes)} limit.`);
      continue;
    }

    let source;
    try {
      source = await decode(file);
    } catch {
      problems.push(`${named} could not be opened. It may be damaged, or not an image at all.`);
      continue;
    }

    const width = source.width || source.naturalWidth;
    const height = source.height || source.naturalHeight;
    const hasAlpha = detectAlpha(source, width, height);
    release(source);

    if (!width || !height) {
      problems.push(`${named} has no readable dimensions, so it cannot be an image.`);
      continue;
    }
    if (width > LIMITS.maxEdge || height > LIMITS.maxEdge) {
      problems.push(`${named} is ${width} × ${height}, over the ${LIMITS.maxEdge.toLocaleString('en-US')}-pixel limit per side.`);
      continue;
    }
    // A per-side limit alone does not bound memory: 16000 by 16000 is under the
    // edge limit and still a gigabyte of pixels. The total is what actually
    // decides whether a phone can hold it.
    if (width * height > LIMITS.maxPixels) {
      problems.push(
        `${named} is ${width} × ${height}, which is more than the `
        + `${Math.round(LIMITS.maxPixels / 1e6)} megapixels this tool will decode on one visit.`,
      );
      continue;
    }

    items.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      name: named,
      // The declared type wins when it is one we accept; otherwise the extension
      // decides. Either way the decode above has already proved it decodes.
      mime: ACCEPTED_MIME.has(file.type) ? file.type : mimeFromName(named) || 'image/png',
      size: file.size,
      width,
      height,
      hasAlpha,
      previewUrl: keep(URL.createObjectURL(file)),
      blob: null,
      outMime: null,
      outName: null,
      outWidth: 0,
      outHeight: 0,
      outputUrl: null,
      originalUrl: null,
      saving: 0,
      useOriginal: false,
      state: 'queued',
      error: null,
    });
    added += 1;
  }

  showErrors(problems);
  render();
  if (added) run();
}

function removeItem(id) {
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return;
  cancelRun();
  const [gone] = items.splice(index, 1);
  drop(gone.previewUrl);
  drop(gone.outputUrl);
  drop(gone.originalUrl);
  render();
}

function reset() {
  cancelRun();
  clearTimeout(rerunTimer);
  for (const item of items) {
    drop(item.previewUrl);
    drop(item.outputUrl);
    drop(item.originalUrl);
  }
  items = [];
  progressEl.hidden = true;
  progressBar.style.width = '0%';
  showErrors([]);
  render();
  say('Cleared');
}

function showErrors(messages) {
  errorsEl.textContent = '';
  for (const m of messages) errorsEl.appendChild(el('p', null, m));
  errorsEl.hidden = messages.length === 0;
}

// ---- Downloads --------------------------------------------------------------
function triggerDownload(url, name) {
  const a = el('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

downloadAllBtn.addEventListener('click', async () => {
  const ready = items.filter((i) => i.blob);
  if (!ready.length) return;
  downloadAllBtn.disabled = true;
  const original = downloadAllBtn.textContent;
  downloadAllBtn.textContent = 'Building ZIP…';
  try {
    const zip = await createZip(ready.map((i) => ({
      name: downloadName(i),
      blob: i.useOriginal ? i.file : i.blob,
    })));
    const url = URL.createObjectURL(zip);
    triggerDownload(url, `stylzo-compressed-${ready.length}-images.zip`);
    // The archive holds a copy of every byte, so it is worth releasing rather
    // than leaving pinned until the tab closes.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    say(`ZIP of ${ready.length} image${ready.length === 1 ? '' : 's'} downloaded`);
  } catch (err) {
    say(err && err.message ? err.message : 'Could not build the ZIP.');
  } finally {
    downloadAllBtn.textContent = original;
    downloadAllBtn.disabled = false;
  }
});

compressAllBtn.addEventListener('click', () => {
  // "Compress all" is also the retry: clearing the errors first means a file
  // that failed on the first attempt gets another go with the current settings.
  for (const i of items) i.error = null;
  invalidate();
  run(items);
});

resetBtn.addEventListener('click', reset);

// ---- Settings ---------------------------------------------------------------
function syncQualityNote() {
  const target = settings.format;
  // Nothing format-specific is claimed while the format is "keep original": the
  // batch can hold a mix, and a note about the first file's format would be
  // wrong for the rest of it.
  if (target === 'image/png') {
    qualityNote.textContent = 'PNG is lossless, so this setting has no effect on PNG output. A PNG gets smaller by being resized, or by being converted to WebP or JPEG.';
  } else if (target === 'image/jpeg') {
    qualityNote.textContent = 'JPEG is lossy: it discards detail the eye is least likely to miss. Below 50% expect visible banding across skies and smooth gradients.';
  } else if (target === 'image/webp') {
    qualityNote.textContent = 'WebP is lossy at this setting and usually beats JPEG by 25–35% at the same perceived quality.';
  } else {
    qualityNote.textContent = 'Quality applies to JPEG and WebP output. Keep the original format unless you have a reason to change it.';
  }
}

function setQuality(value) {
  settings.quality = Math.min(100, Math.max(10, Math.round(Number(value) || 80)));
  qualityInput.value = String(settings.quality);
  qualityOut.textContent = `${settings.quality}%`;
  for (const b of document.querySelectorAll('[data-cz-preset]')) {
    const preset = PRESETS.find((p) => p.id === b.dataset.czPreset);
    b.setAttribute('aria-pressed', String(Boolean(preset) && preset.quality === settings.quality));
  }
}

qualityInput.addEventListener('input', () => {
  setQuality(qualityInput.value);
  syncQualityNote();
  scheduleRerun();
});

for (const b of document.querySelectorAll('[data-cz-preset]')) {
  b.addEventListener('click', () => {
    const preset = PRESETS.find((p) => p.id === b.dataset.czPreset);
    if (!preset) return;
    setQuality(preset.quality);
    syncQualityNote();
    scheduleRerun();
  });
}

if (!webpOk) {
  // Saying so beats offering a choice that silently produces a PNG.
  const option = formatSelect.querySelector('option[value="image/webp"]');
  if (option) {
    option.disabled = true;
    option.textContent = 'WebP (not supported by this browser)';
  }
}

formatSelect.addEventListener('change', () => {
  settings.format = formatSelect.value;
  syncQualityNote();
  render();
  scheduleRerun();
});

/**
 * Mirror the aspect ratio into the other field.
 *
 * Derives from whichever box the visitor touched most recently, not from width
 * by default. Width-first looks equivalent and is not: with the lock on, the
 * width field usually holds a value this function itself wrote, so a visitor who
 * tabs into the height box and types a value would have it overwritten from that
 * stale width on every keystroke.
 *
 * The first image in the batch sets the ratio, since one batch can hold images
 * of different shapes and a single ratio has to be chosen.
 */
let lastSizeField = null;

function syncAspect() {
  if (!settings.lock || !items.length) return;
  const active = items[0];
  const w = num(widthInput.value);
  const h = num(heightInput.value);
  const fromWidth = () => Math.max(1, Math.round((w * active.height) / active.width));
  const fromHeight = () => Math.max(1, Math.round((h * active.width) / active.height));

  if (lastSizeField === widthInput) {
    if (w) heightInput.value = String(fromWidth());
    else if (h) widthInput.value = String(fromHeight());
  } else if (lastSizeField === heightInput) {
    if (h) widthInput.value = String(fromHeight());
    else if (w) heightInput.value = String(fromWidth());
  } else if (w) {
    heightInput.value = String(fromWidth());
  } else if (h) {
    widthInput.value = String(fromHeight());
  }
}

// Each field owns one key of `settings`, so nothing else has to remember which
// control maps to which value. Reading the inputs straight into targetSize()
// instead would work until a field was cleared, where "" and 0 would have to be
// told apart.
const SIZE_FIELDS = [
  [widthInput, 'width'],
  [heightInput, 'height'],
  [scaleInput, 'scale'],
];

/**
 * Settle the resize fields into `settings`.
 *
 * The order matters. syncAspect() derives one axis by *writing to the other
 * input*, and a programmatic write fires no `input` event, so the value it
 * computes has to be copied across here or it never reaches the encoder. Reading
 * the fields first and syncing afterwards would silently drop every derived
 * dimension, which is exactly what the aspect-ratio lock exists to produce.
 */
function readSizeSettings() {
  syncAspect();
  for (const [field, key] of SIZE_FIELDS) settings[key] = field.value.trim();
}

lockBtn.addEventListener('click', () => {
  settings.lock = !settings.lock;
  lockBtn.setAttribute('aria-pressed', String(settings.lock));
  lockBtn.textContent = settings.lock ? 'Aspect ratio locked' : 'Aspect ratio free';
  readSizeSettings();
  scheduleRerun();
});

for (const [field, key] of SIZE_FIELDS) {
  field.addEventListener('input', () => {
    if (key !== 'scale') lastSizeField = field;
    readSizeSettings();
    scheduleRerun();
  });
}

$('[data-cz-clear-size]').addEventListener('click', () => {
  for (const [field, key] of SIZE_FIELDS) {
    field.value = '';
    settings[key] = '';
  }
  lastSizeField = null;
  scheduleRerun();
});

// ---- Wiring -----------------------------------------------------------------
zone.addEventListener('dragenter', (e) => { e.preventDefault(); zone.classList.add('is-over'); });
zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('is-over'); });
zone.addEventListener('dragleave', (e) => {
  if (zone.contains(e.relatedTarget)) return;
  zone.classList.remove('is-over');
});
zone.addEventListener('drop', (e) => {
  e.preventDefault();
  zone.classList.remove('is-over');
  const dt = e.dataTransfer;
  if (dt && dt.files && dt.files.length) addFiles(dt.files);
});

// Without this a file dropped a few pixels outside the zone navigates the tab
// away and takes every image already added with it.
for (const type of ['dragover', 'drop']) {
  window.addEventListener(type, (e) => {
    if (e.target && zone.contains(e.target)) return;
    e.preventDefault();
  });
}

input.addEventListener('change', () => {
  addFiles(input.files);
  // Reset so picking the same file twice in a row still fires a change event.
  input.value = '';
});

// ---- Teardown ---------------------------------------------------------------
// The page owns these blobs for as long as it is open, and the browser cannot
// tell when a module-scoped Set has become garbage. Releasing on pagehide is the
// one hook that covers navigation, the back/forward cache and a closed tab.
window.addEventListener('pagehide', () => {
  token += 1;
  clearTimeout(rerunTimer);
  for (const url of urls) URL.revokeObjectURL(url);
  urls.clear();
});

setQuality(settings.quality);
syncQualityNote();
render();
