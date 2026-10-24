// QR code reader: decode a QR code from an image in the browser, then hand the
// contents back as labelled details.
//
// The decoder is jsQR, vendored under /vendor/jsqr because the site's CSP allows
// no CDN. It receives pixels from a canvas, so the image never becomes part of a
// request. Payload parsing lives in ./qr-reader-payloads.js.

import { copyText, say } from './lib.js';
import { formatQrDetails, parseQrPayload } from './qr-reader-payloads.js';

const root = document.querySelector('[data-qr-reader]');
if (root) {
  const zone = root.querySelector('[data-qr-zone]');
  const input = root.querySelector('[data-qr-input]');
  const listEl = root.querySelector('[data-qr-list]');
  const emptyEl = root.querySelector('[data-qr-empty]');
  const errorsEl = root.querySelector('[data-qr-errors]');
  const statusEl = root.querySelector('[data-qr-status]');
  const copyAllBtn = root.querySelector('[data-qr-copy-all]');
  const resetBtn = root.querySelector('[data-qr-reset]');

  const MAX_BYTES = 20 * 1024 * 1024;
  const ACCEPTED = /^image\/(png|jpeg|webp|gif|bmp)$/i;
  const SIZES = [1600, 1200, 900, 600];

  const items = [];
  let nextId = 1;
  let decoderPromise = null;
  let running = false;

  const visible = (el, on) => { if (el) el.hidden = !on; };
  const sizeText = (bytes) => (bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

  function showError(messages) {
    if (!errorsEl) return;
    errorsEl.replaceChildren(...messages.map((message) => {
      const p = document.createElement('p');
      p.textContent = message;
      return p;
    }));
    visible(errorsEl, messages.length > 0);
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || '';
  }

  function loadDecoder() {
    if (!decoderPromise) {
      decoderPromise = import('/vendor/jsqr/jsqr.js').then(() => {
        const decode = globalThis.jsQR;
        if (typeof decode !== 'function') throw new Error('The QR decoder did not load.');
        return decode;
      });
    }
    return decoderPromise;
  }

  function loadSource(file) {
    if (typeof createImageBitmap === 'function') {
      return createImageBitmap(file).then((bitmap) => ({
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => { if (typeof bitmap.close === 'function') bitmap.close(); },
      }));
    }

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        resolve({
          source: image,
          width: image.naturalWidth,
          height: image.naturalHeight,
          close: () => URL.revokeObjectURL(url),
        });
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('The image could not be opened.'));
      };
      image.src = url;
    });
  }

  async function decodeFile(file) {
    const decode = await loadDecoder();
    const source = await loadSource(file);
    const longest = Math.max(source.width, source.height);
    if (!longest) {
      source.close();
      return '';
    }

    const targets = new Set();
    for (const size of SIZES) if (size < longest) targets.add(size);
    targets.add(Math.min(longest, 1600));
    if (longest < 600) targets.add(600);

    try {
      for (const target of [...targets].sort((a, b) => b - a)) {
        const scale = target / longest;
        const width = Math.max(1, Math.round(source.width * scale));
        const height = Math.max(1, Math.round(source.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) continue;
        context.imageSmoothingEnabled = scale < 1;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(source.source, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height);
        const result = decode(pixels.data, width, height, { inversionAttempts: 'attemptBoth' });
        if (result && typeof result.data === 'string' && result.data.trim()) {
          return result.data;
        }
      }
      return '';
    } finally {
      source.close();
    }
  }

  function chip(text) {
    const span = document.createElement('span');
    span.className = 'tp-chip';
    span.textContent = text;
    return span;
  }

  function copyButton(label, getText) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn small subtle';
    button.textContent = label;
    button.addEventListener('click', async () => {
      const ok = await copyText(getText());
      say(ok ? 'Copied' : 'Copy failed. Select the text and copy it manually.');
    });
    return button;
  }

  function fieldRow(field) {
    const row = document.createElement('div');
    row.className = 'qr-readout-row';

    const term = document.createElement('dt');
    term.textContent = field.label;

    const detail = document.createElement('dd');
    const value = field.href ? document.createElement('a') : document.createElement('span');
    value.className = 'qr-readout-value';
    value.textContent = field.value;
    if (field.href) {
      value.href = field.href;
      value.target = '_blank';
      value.rel = 'noopener noreferrer';
    }
    detail.append(value, copyButton('Copy', () => field.value));

    row.append(term, detail);
    return row;
  }

  function renderCard(item) {
    const li = document.createElement('li');
    li.className = 'tp-card';
    li.dataset.qrId = String(item.id);

    const head = document.createElement('div');
    head.className = 'tp-card-head';
    const name = document.createElement('p');
    name.className = 'tp-card-name';
    name.textContent = item.file.name;
    head.append(name, chip(sizeText(item.file.size)));
    if (item.parsed && item.parsed.type !== 'text' && item.parsed.type !== 'empty') {
      head.append(chip(item.parsed.label));
    }

    const preview = document.createElement('img');
    preview.className = 'qr-source';
    preview.src = item.url;
    preview.alt = `The QR code image ${item.file.name}`;

    li.append(head, preview);

    if (item.status === 'queued' || item.status === 'decoding') {
      const loading = document.createElement('p');
      loading.className = 'qr-reader-loading';
      loading.textContent = item.status === 'queued' ? 'Waiting to be read…' : 'Looking for a QR code…';
      li.append(loading);
    } else if (item.status === 'error') {
      const error = document.createElement('p');
      error.className = 'qr-reader-error';
      error.textContent = item.error;
      li.append(error);
    } else if (item.parsed) {
      const details = document.createElement('dl');
      details.className = 'qr-readout';
      for (const field of item.parsed.fields) details.append(fieldRow(field));
      li.append(details);

      const raw = document.createElement('details');
      raw.className = 'qr-raw';
      const summary = document.createElement('summary');
      summary.textContent = 'Decoded text';
      const pre = document.createElement('pre');
      pre.textContent = item.parsed.raw;
      raw.append(summary, pre, copyButton('Copy decoded text', () => item.parsed.raw));
      li.append(raw);
    }

    const tools = document.createElement('div');
    tools.className = 'gen-tools';
    if (item.parsed) {
      tools.append(copyButton('Copy details', () => formatQrDetails(item.parsed)));
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn small subtle';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      const index = items.findIndex((x) => x.id === item.id);
      if (index >= 0) {
        URL.revokeObjectURL(items[index].url);
        items.splice(index, 1);
      }
      render();
      updateStatus();
    });
    tools.append(remove);
    li.append(tools);

    return li;
  }

  function render() {
    if (!listEl) return;
    listEl.replaceChildren(...items.map(renderCard));
    if (emptyEl) visible(emptyEl, items.length === 0);
  }

  function updateStatus() {
    const done = items.filter((item) => item.parsed).length;
    if (copyAllBtn) copyAllBtn.disabled = done === 0;
    if (!done) {
      setStatus('');
      return;
    }
    setStatus(`Read ${done} QR code${done === 1 ? '' : 's'}. Copy a single detail or everything at once.`);
  }

  function addFile(file) {
    const problems = [];
    if (!ACCEPTED.test(file.type) && !/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) {
      problems.push(`${file.name} is not a supported image. Use a PNG, JPG, WebP, GIF or BMP.`);
    }
    if (file.size > MAX_BYTES) {
      problems.push(`${file.name} is ${sizeText(file.size)}; the limit is 20 MB per image.`);
    }
    if (problems.length) {
      showError(problems);
      return null;
    }

    showError([]);
    const item = {
      id: nextId++,
      file,
      url: URL.createObjectURL(file),
      status: 'queued',
      parsed: null,
      error: '',
    };
    items.push(item);
    return item;
  }

  async function processItem(item) {
    item.status = 'decoding';
    render();
    try {
      const text = await decodeFile(item.file);
      if (!text) {
        item.status = 'error';
        item.error = `No QR code was found in ${item.file.name}. Try a sharper, larger picture where the code fills the frame.`;
      } else {
        item.parsed = parseQrPayload(text);
        item.status = 'done';
      }
    } catch (error) {
      item.status = 'error';
      item.error = `Could not read ${item.file.name}. ${error && error.message ? error.message : 'Try another image.'}`;
    }
    render();
    updateStatus();
  }

  async function drain() {
    if (running) return;
    running = true;
    try {
      for (const item of items) {
        if (item.status !== 'queued') continue;
        await processItem(item);
      }
    } finally {
      running = false;
    }
  }

  function accept(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    for (const file of list) addFile(file);
    render();
    updateStatus();
    drain();
  }

  input.addEventListener('change', () => {
    accept(input.files);
    input.value = '';
  });

  for (const event of ['dragenter', 'dragover']) {
    zone.addEventListener(event, (e) => {
      e.preventDefault();
      zone.classList.add('is-over');
    });
  }
  for (const event of ['dragleave', 'drop']) {
    zone.addEventListener(event, (e) => {
      e.preventDefault();
      zone.classList.remove('is-over');
    });
  }
  zone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files) accept(e.dataTransfer.files);
  });

  document.addEventListener('paste', (e) => {
    if (!root.isConnected) return;
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    const files = Array.from(e.clipboardData ? e.clipboardData.files : []).filter((f) => f.type.startsWith('image/'));
    if (files.length) {
      e.preventDefault();
      accept(files);
    }
  });

  copyAllBtn.addEventListener('click', async () => {
    const text = items
      .filter((item) => item.parsed)
      .map((item) => formatQrDetails(item.parsed))
      .filter(Boolean)
      .join('\n\n---\n\n');
    if (!text) return;
    const ok = await copyText(text);
    say(ok ? 'Copied every decoded detail' : 'Copy failed. Select the text and copy it manually.');
  });

  resetBtn.addEventListener('click', () => {
    for (const item of items) URL.revokeObjectURL(item.url);
    items.length = 0;
    showError([]);
    render();
    updateStatus();
    setStatus('');
  });

  render();
  updateStatus();
}
