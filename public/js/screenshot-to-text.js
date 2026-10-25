import { copyText, say } from './lib.js';

const root = document.querySelector('[data-ocr-tool]');
if (root) {
  const zone = root.querySelector('[data-ocr-zone]');
  const input = root.querySelector('[data-ocr-input]');
  const langSelect = root.querySelector('[data-ocr-lang]');
  const psmSelect = root.querySelector('[data-ocr-psm]');
  const errorsEl = root.querySelector('[data-ocr-errors]');
  const statusEl = root.querySelector('[data-ocr-status]');
  const progressEl = root.querySelector('[data-ocr-progress]');
  const barEl = root.querySelector('[data-ocr-bar]');
  const listEl = root.querySelector('[data-ocr-list]');
  const emptyEl = root.querySelector('[data-ocr-empty]');
  const copyAllBtn = root.querySelector('[data-ocr-copy-all]');
  const downloadBtn = root.querySelector('[data-ocr-download]');
  const resetBtn = root.querySelector('[data-ocr-reset]');

  const editorEl = document.querySelector('[data-ocr-editor]');
  const editorNoteEl = document.querySelector('[data-ocr-editor-note]');
  const editorCloseBtn = document.querySelector('[data-ocr-editor-close]');
  const editorCanvas = document.querySelector('[data-ocr-canvas]');
  const editorBoxesEl = document.querySelector('[data-ocr-boxes]');
  const editorShowBoxesEl = document.querySelector('[data-ocr-show-boxes]');
  const editorEditCountEl = document.querySelector('[data-ocr-edit-count]');
  const editorSelectionEl = document.querySelector('[data-ocr-selection]');
  const editorText = document.querySelector('[data-ocr-replace-text]');
  const editorFamily = document.querySelector('[data-ocr-font]');
  const editorWeight = document.querySelector('[data-ocr-weight]');
  const editorStyle = document.querySelector('[data-ocr-style]');
  const editorSize = document.querySelector('[data-ocr-size]');
  const editorColor = document.querySelector('[data-ocr-colour]');
  const editorBackground = document.querySelector('[data-ocr-background]');
  const editorMatchBackgroundBtn = document.querySelector('[data-ocr-match-background]');
  const editorApplyBtn = document.querySelector('[data-ocr-apply]');
  const editorUndoBtn = document.querySelector('[data-ocr-undo]');
  const editorResetBtn = document.querySelector('[data-ocr-reset-image]');
  const editorDownloadBtn = document.querySelector('[data-ocr-download-image]');
  const editorStatusEl = document.querySelector('[data-ocr-editor-status]');

  const MAX_BYTES = 25 * 1024 * 1024;
  const MAX_EDIT_LINES = 600;
  const ACCEPTED = new Set(['image/png', 'image/jpeg', 'image/webp']);
  const VENDOR = '/vendor/tesseract';
  const STATUS_TEXT = {
    'loading tesseract core': 'Loading the OCR engine',
    'initializing tesseract': 'Starting the OCR engine',
    'loading language traineddata': 'Loading the English language model',
    'initializing api': 'Preparing the recogniser',
    'recognizing text': 'Reading the text',
  };

  const FALLBACK_FONTS = {
    sans: 'system-ui, "Segoe UI", Arial, Helvetica, sans-serif',
    serif: 'Georgia, "Times New Roman", Times, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  };

  const SPECIFIC_FONTS = [
    'Segoe UI',
    'Arial',
    'Roboto',
    'Inter',
    'Helvetica Neue',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Georgia',
    'Times New Roman',
    'Consolas',
    'Courier New',
  ];
  const MASK_WIDTH = 360;
  const MATCH_THRESHOLD = 0.3;

  const items = [];
  let worker = null;
  let workerLang = null;
  let running = false;
  let nextId = 1;
  let allText = '';

  const editor = {
    item: null,
    base: null,
    baseCtx: null,
    work: null,
    workCtx: null,
    display: null,
    displayCtx: null,
    lines: [],
    patches: [],
    selected: -1,
    sampleBackground: '#ffffff',
    fontCache: new Map(),
    token: 0,
  };

  const visible = (el, on) => { if (el) el.hidden = !on; };
  const sizeText = (bytes) => (bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const hex = (value) => `#${value.toString(16).padStart(2, '0')}`;
  const rgbToHex = (c) => `${hex(clamp(Math.round(c.r), 0, 255))}${hex(clamp(Math.round(c.g), 0, 255))}${hex(clamp(Math.round(c.b), 0, 255))}`;
  const percent = (value, total) => `${(value / total) * 100}%`;

  function showError(messages) {
    if (!errorsEl) return;
    errorsEl.replaceChildren(...messages.map((m) => {
      const p = document.createElement('p');
      p.textContent = m;
      return p;
    }));
    visible(errorsEl, messages.length > 0);
  }

  function setStatus(text, progress) {
    if (statusEl) statusEl.textContent = text || '';
    if (progressEl) {
      visible(progressEl, progress !== undefined && progress !== null);
      if (barEl && progress !== undefined) barEl.style.width = `${Math.round(progress * 100)}%`;
    }
  }

  async function getWorker() {
    const lang = langSelect ? langSelect.value : 'eng';
    if (worker && workerLang === lang) return worker;
    if (worker) {
      await worker.terminate();
      worker = null;
    }
    setStatus('Loading the OCR engine', 0);
    const Tesseract = (await import(`${VENDOR}/tesseract.esm.min.js`)).default;
    worker = await Tesseract.createWorker(lang, Tesseract.OEM.LSTM_ONLY, {
      workerPath: `${VENDOR}/worker.min.js`,
      corePath: `${VENDOR}/tesseract-core-lstm.wasm.js`,
      langPath: VENDOR,
      gzip: true,
      workerBlobURL: false,
      logger: (m) => {
        if (!m || !m.status) return;
        setStatus(STATUS_TEXT[m.status] || m.status, typeof m.progress === 'number' ? m.progress : undefined);
      },
    });
    workerLang = lang;
    return worker;
  }

  function rectOf(box) {
    if (!box) return null;
    if (typeof box.w === 'number' && typeof box.h === 'number') {
      return { x: box.x, y: box.y, w: box.w, h: box.h };
    }
    const x = Math.min(box.x0, box.x1);
    const y = Math.min(box.y0, box.y1);
    return { x, y, w: Math.abs(box.x1 - box.x0), h: Math.abs(box.y1 - box.y0) };
  }

  function unionRect(rects) {
    if (!rects.length) return null;
    const left = Math.min(...rects.map((r) => r.x));
    const top = Math.min(...rects.map((r) => r.y));
    const right = Math.max(...rects.map((r) => r.x + r.w));
    const bottom = Math.max(...rects.map((r) => r.y + r.h));
    return { x: left, y: top, w: right - left, h: bottom - top };
  }

  function collectLines(data) {
    const lines = [];
    const blocks = data && Array.isArray(data.blocks) ? data.blocks : [];
    for (const block of blocks) {
      for (const paragraph of block.paragraphs || []) {
        for (const line of paragraph.lines || []) {
          const words = (line.words || []).filter((w) => w && w.bbox);
          const text = (line.text || words.map((w) => w.text || '').join(' ')).replace(/\s+/g, ' ').trim();
          const bbox = rectOf(line.bbox) || unionRect(words.map((w) => rectOf(w.bbox)).filter(Boolean));
          if (!text || !bbox || bbox.w <= 0 || bbox.h <= 0) continue;
          const source = words.find((w) => w.is_bold) || words[0] || {};
          const baseline = line.baseline && line.baseline.has_baseline
            ? line.baseline.y0
            : Math.round(bbox.y + bbox.h * 0.8);
          lines.push({
            text,
            bbox,
            baseline,
            bold: Boolean(source.is_bold),
            italic: Boolean(source.is_italic),
            serif: Boolean(source.is_serif),
            mono: Boolean(source.is_monospace),
            fontName: typeof source.font_name === 'string' ? source.font_name : '',
          });
        }
      }
    }
    return lines;
  }

  function renderCard(item) {
    const li = document.createElement('li');
    li.className = 'tp-card';
    li.dataset.ocrId = String(item.id);

    const head = document.createElement('div');
    head.className = 'tp-card-head';
    const name = document.createElement('p');
    name.className = 'tp-card-name';
    name.textContent = item.file.name;
    const meta = document.createElement('span');
    meta.className = 'tp-chip';
    meta.textContent = sizeText(item.file.size);
    head.append(name, meta);

    const preview = document.createElement('img');
    preview.className = 'ocr-thumb';
    preview.src = item.url;
    preview.alt = `Preview of ${item.file.name}`;

    const label = document.createElement('label');
    label.className = 'skip';
    label.htmlFor = `ocr-out-${item.id}`;
    label.textContent = 'Recognised text';

    const out = document.createElement('textarea');
    out.id = `ocr-out-${item.id}`;
    out.className = 'ocr-out';
    out.dataset.ocrText = '';
    out.value = item.text;
    out.placeholder = 'Recognition is running…';
    out.addEventListener('input', () => { item.text = out.value; refreshAll(); });

    const tools = document.createElement('div');
    tools.className = 'gen-tools';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'btn small';
    copy.dataset.ocrCopy = '';
    copy.disabled = !item.text;
    copy.textContent = 'Copy text';
    copy.addEventListener('click', async () => {
      const ok = await copyText(out.value);
      say(ok ? 'Copied the recognised text' : 'Copy failed. Select the text and copy it manually.');
    });
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn small';
    edit.dataset.ocrEdit = '';
    edit.disabled = !item.text;
    edit.textContent = 'Edit text in image';
    edit.addEventListener('click', () => openEditor(item));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn small subtle';
    remove.dataset.ocrRemove = '';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      const i = items.findIndex((x) => x.id === item.id);
      if (i >= 0) {
        if (items[i].url) URL.revokeObjectURL(items[i].url);
        items.splice(i, 1);
      }
      if (editor.item === item) closeEditor();
      li.remove();
      refreshAll();
    });
    tools.append(copy, edit, remove);

    li.append(head, preview, label, out, tools);
    return li;
  }

  function refreshAll() {
    const done = items.filter((i) => i.text).map((i) => i.text.trim()).filter(Boolean);
    allText = done.join('\n\n---\n\n');
    if (copyAllBtn) copyAllBtn.disabled = !allText;
    if (downloadBtn) downloadBtn.disabled = !allText;
    if (emptyEl) visible(emptyEl, items.length === 0);
    for (const button of listEl.querySelectorAll('[data-ocr-copy]')) {
      const card = button.closest('[data-ocr-id]');
      const item = items.find((i) => String(i.id) === card.dataset.ocrId);
      button.disabled = !item || !item.text;
    }
    for (const button of listEl.querySelectorAll('[data-ocr-edit]')) {
      const card = button.closest('[data-ocr-id]');
      const item = items.find((i) => String(i.id) === card.dataset.ocrId);
      button.disabled = !item || !item.text;
    }
  }

  function addFile(file) {
    const problems = [];
    if (!ACCEPTED.has(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      problems.push(`${file.name} is not a PNG, JPG or WebP image.`);
    }
    if (file.size > MAX_BYTES) {
      problems.push(`${file.name} is ${sizeText(file.size)}; the limit is 25 MB per image.`);
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
      text: '',
      lines: [],
      status: 'queued',
    };
    items.push(item);
    listEl.appendChild(renderCard(item));
    refreshAll();
    return item;
  }

  async function processItem(item) {
    const card = listEl.querySelector(`[data-ocr-id="${item.id}"]`);
    const out = card ? card.querySelector('[data-ocr-text]') : null;
    try {
      const rec = await getWorker();
      const psm = psmSelect ? psmSelect.value : '3';
      await rec.setParameters({ tessedit_pageseg_mode: psm });
      setStatus(`Reading ${item.file.name}`, 0);
      const result = await rec.recognize(item.file);
      const data = result && result.data ? result.data : {};
      item.lines = collectLines(data);
      item.text = (data.text || '').replace(/\n{3,}/g, '\n\n').trim();
      item.status = 'done';
      if (out) {
        out.value = item.text;
        out.placeholder = 'No text was found in this image.';
      }
    } catch (error) {
      item.status = 'error';
      showError([`Could not read ${item.file.name}. ${error && error.message ? error.message : 'Try a smaller, sharper image.'}`]);
    } finally {
      refreshAll();
    }
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
      setStatus(allText ? 'Done. Edit the text, then copy or download it.' : '', null);
    }
  }

  function accept(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    for (const file of list) addFile(file);
    drain();
  }

  function setEditorStatus(text) {
    if (editorStatusEl) editorStatusEl.textContent = text || '';
  }

  function currentLine() {
    return editor.lines[editor.selected] || null;
  }

  let measureCtx = null;

  function lineSize(line) {
    const height = line.bbox.h;
    const min = Math.max(6, Math.round(height * 0.55));
    const max = Math.max(min + 1, Math.round(height * 2.2));
    if (!line.text) return Math.max(6, Math.round(height * 0.82));
    if (!measureCtx) {
      const canvas = document.createElement('canvas');
      measureCtx = canvas.getContext('2d');
    }
    if (!measureCtx) return Math.max(6, Math.round(height * 0.82));
    const probe = 100;
    const weight = line.bold ? '700' : '400';
    const style = line.italic ? 'italic' : 'normal';
    measureCtx.font = fontString(line, probe, 'auto', weight, style);
    const width = measureCtx.measureText(line.text).width;
    if (!width) return Math.max(6, Math.round(height * 0.82));
    return clamp(Math.round(probe * (line.bbox.w * 0.98) / width), min, max);
  }

  function fallbackFont(line) {
    if (line.mono) return FALLBACK_FONTS.mono;
    if (line.serif) return FALLBACK_FONTS.serif;
    return FALLBACK_FONTS.sans;
  }

  function resolvedFamily(line, value) {
    const fallback = fallbackFont(line);
    if (value === 'sans') return FALLBACK_FONTS.sans;
    if (value === 'serif') return FALLBACK_FONTS.serif;
    if (value === 'mono') return FALLBACK_FONTS.mono;
    if (value && value.startsWith('name:')) {
      const name = value.slice(5).replace(/["\\]/g, '');
      return name ? `"${name}", ${fallback}` : fallback;
    }
    if (line.fontName) {
      const name = line.fontName.replace(/["\\]/g, '');
      if (name) return `"${name}", ${fallback}`;
    }
    return fallback;
  }

  function sampleLine(line) {
    const ctx = editor.baseCtx;
    if (!ctx) return { background: '#ffffff', color: '#111111', coverage: 0 };
    const width = editor.base.width;
    const height = editor.base.height;
    const padX = Math.max(1, Math.round(line.bbox.w * 0.04));
    const padY = Math.max(1, Math.round(line.bbox.h * 0.08));
    const x = clamp(Math.floor(line.bbox.x - padX), 0, width - 1);
    const y = clamp(Math.floor(line.bbox.y - padY), 0, height - 1);
    const w = clamp(Math.ceil(line.bbox.w + padX * 2), 1, width - x);
    const h = clamp(Math.ceil(line.bbox.h + padY * 2), 1, height - y);
    const bins = new Map();
    let total = 0;
    let data;
    try {
      data = ctx.getImageData(x, y, w, h).data;
    } catch {
      return { background: '#ffffff', color: '#111111', coverage: 0 };
    }
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      if (data[i + 3] < 16) { r = 255; g = 255; b = 255; }
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      let bin = bins.get(key);
      if (!bin) {
        bin = { r: 0, g: 0, b: 0, count: 0 };
        bins.set(key, bin);
      }
      bin.r += r;
      bin.g += g;
      bin.b += b;
      bin.count += 1;
      total += 1;
    }
    const list = Array.from(bins.values())
      .map((bin) => ({ r: bin.r / bin.count, g: bin.g / bin.count, b: bin.b / bin.count, count: bin.count }))
      .sort((a, b) => b.count - a.count);
    const dominant = list[0] || { r: 255, g: 255, b: 255, count: 1 };
    const threshold = Math.max(2, total * 0.004);
    let ink = dominant;
    let best = -1;
    for (const bin of list) {
      if (bin.count < threshold) continue;
      const distance = Math.abs(bin.r - dominant.r) + Math.abs(bin.g - dominant.g) + Math.abs(bin.b - dominant.b);
      if (distance > best) { best = distance; ink = bin; }
    }
    if (best < 60) {
      const luminance = 0.2126 * dominant.r + 0.7152 * dominant.g + 0.0722 * dominant.b;
      ink = luminance < 128 ? { r: 250, g: 250, b: 250 } : { r: 18, g: 18, b: 18 };
    }
    let covered = 0;
    for (let i = 0; i < data.length; i += 4) {
      const distance = Math.abs(data[i] - dominant.r) + Math.abs(data[i + 1] - dominant.g) + Math.abs(data[i + 2] - dominant.b);
      if (distance > 90) covered += 1;
    }
    return {
      background: rgbToHex(dominant),
      color: rgbToHex(ink),
      coverage: total ? covered / total : 0,
    };
  }

  function fontString(line, size, family, weight, style) {
    return `${style === 'italic' ? 'italic ' : ''}${weight} ${size}px ${resolvedFamily(line, family)}`;
  }

  function parseHex(value) {
    const match = /^#?([0-9a-f]{6})$/i.exec(String(value || ''));
    if (!match) return null;
    const n = parseInt(match[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  let fontProbeCtx = null;
  const installedCache = new Map();

  function fontInstalled(name) {
    if (installedCache.has(name)) return installedCache.get(name);
    if (!fontProbeCtx) {
      const canvas = document.createElement('canvas');
      fontProbeCtx = canvas.getContext('2d');
    }
    let installed = true;
    if (fontProbeCtx) {
      const sample = 'mmmmmmmmmmlliWWQ@#';
      fontProbeCtx.font = '72px monospace';
      const base = fontProbeCtx.measureText(sample).width;
      fontProbeCtx.font = `72px "${name}", monospace`;
      installed = Math.abs(fontProbeCtx.measureText(sample).width - base) > 0.5;
    }
    installedCache.set(name, installed);
    return installed;
  }

  function maskStats(mask, width, height) {
    let count = 0;
    let x0 = width;
    let y0 = height;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < height; y += 1) {
      const row = y * width;
      for (let x = 0; x < width; x += 1) {
        if (!mask[row + x]) continue;
        count += 1;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    if (!count) return { count: 0, w: 0, h: 0 };
    return { count, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  function buildOriginalMask(line, sample) {
    if (!editor.base) return null;
    const padX = Math.max(2, Math.round(line.bbox.h * 0.15));
    const padTop = Math.max(2, Math.round(line.bbox.h * 0.3));
    const padBottom = Math.max(2, Math.round(line.bbox.h * 0.35));
    const x = clamp(Math.floor(line.bbox.x - padX), 0, editor.base.width - 1);
    const y = clamp(Math.floor(line.bbox.y - padTop), 0, editor.base.height - 1);
    const right = clamp(Math.ceil(line.bbox.x + line.bbox.w + padX), x + 1, editor.base.width);
    const bottom = clamp(Math.ceil(line.bbox.y + line.bbox.h + padBottom), y + 1, editor.base.height);
    const cropW = right - x;
    const cropH = bottom - y;
    if (cropW < 4 || cropH < 4) return null;
    const scale = Math.min(1, MASK_WIDTH / cropW);
    const width = Math.max(4, Math.round(cropW * scale));
    const height = Math.max(4, Math.round(cropH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(editor.base, x, y, cropW, cropH, 0, 0, width, height);
    let data;
    try {
      data = ctx.getImageData(0, 0, width, height).data;
    } catch {
      return null;
    }
    const background = parseHex(sample && sample.background) || { r: 255, g: 255, b: 255 };
    const mask = new Uint8Array(width * height);
    let ink = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      if (data[i + 3] < 24) continue;
      const distance = Math.abs(data[i] - background.r)
        + Math.abs(data[i + 1] - background.g)
        + Math.abs(data[i + 2] - background.b);
      if (distance > 80) {
        mask[p] = 1;
        ink += 1;
      }
    }
    if (ink < 8) return null;
    const stats = maskStats(mask, width, height);
    if (!stats.count) return null;
    return {
      width,
      height,
      mask,
      stats,
      scale,
      drawX: (line.bbox.x - x) * scale,
      baselineY: (line.baseline - y) * scale,
    };
  }

  function fontFamiliesFor(line) {
    const families = [
      { value: 'sans', label: 'sans-serif' },
      { value: 'serif', label: 'serif' },
      { value: 'mono', label: 'monospace' },
    ];
    const preferred = (name) => {
      const lower = name.toLowerCase();
      if (line.mono && /mono|consolas|courier/.test(lower)) return -1;
      if (line.serif && /georgia|times/.test(lower)) return -1;
      return 0;
    };
    const specific = SPECIFIC_FONTS.filter(fontInstalled).sort((a, b) => preferred(a) - preferred(b));
    for (const name of specific.slice(0, 6)) {
      families.push({ value: `name:${name}`, label: name });
    }
    return families;
  }

  function renderCandidateMask(ctx, line, family, weight, style, original) {
    const { width, height } = original;
    ctx.clearRect(0, 0, width, height);
    const probe = 100;
    ctx.font = fontString(line, probe, family, weight, style);
    const metrics = ctx.measureText(line.text);
    const inkHeight = (metrics.actualBoundingBoxAscent || 0) + (metrics.actualBoundingBoxDescent || 0);
    const size = inkHeight > 0
      ? clamp(probe * original.stats.h / inkHeight, 4, 900)
      : clamp(line.bbox.h * original.scale * 0.82, 4, 900);
    ctx.font = fontString(line, size, family, weight, style);
    const fitted = ctx.measureText(line.text);
    const drawX = original.drawX + (fitted.actualBoundingBoxLeft || 0);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(line.text, drawX, original.baselineY);
    let data;
    try {
      data = ctx.getImageData(0, 0, width, height).data;
    } catch {
      return null;
    }
    const mask = new Uint8Array(width * height);
    let count = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      if (data[i + 3] > 96) {
        mask[p] = 1;
        count += 1;
      }
    }
    if (!count) return null;
    return { mask, stats: maskStats(mask, width, height), size };
  }

  function compareMasks(original, candidate) {
    const { width, height, mask } = original;
    let bestIou = 0;
    for (const dy of [0, -1, 1, -2, 2]) {
      let inter = 0;
      for (let y = 0; y < height; y += 1) {
        const cy = y + dy;
        if (cy < 0 || cy >= height) continue;
        const row = y * width;
        const candidateRow = cy * width;
        for (let x = 0; x < width; x += 1) {
          if (mask[row + x] && candidate.mask[candidateRow + x]) inter += 1;
        }
      }
      const union = original.stats.count + candidate.stats.count - inter;
      const iou = union > 0 ? inter / union : 0;
      if (iou > bestIou) bestIou = iou;
    }
    const widthScore = 1 - Math.abs(candidate.stats.w - original.stats.w) / Math.max(candidate.stats.w, original.stats.w, 1);
    const heightScore = 1 - Math.abs(candidate.stats.h - original.stats.h) / Math.max(candidate.stats.h, original.stats.h, 1);
    return bestIou * 0.7 + Math.max(0, widthScore) * 0.15 + Math.max(0, heightScore) * 0.15;
  }

  function detectFont(line, sample) {
    if (!editor.base) return null;
    const original = buildOriginalMask(line, sample);
    if (!original) return null;
    const canvas = document.createElement('canvas');
    canvas.width = original.width;
    canvas.height = original.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const families = fontFamiliesFor(line);
    const weights = ['400', '600', '700'];
    const styles = line.italic ? ['italic', 'normal'] : ['normal'];
    let best = null;
    for (const family of families) {
      for (const weight of weights) {
        for (const style of styles) {
          const candidate = renderCandidateMask(ctx, line, family.value, weight, style, original);
          if (!candidate) continue;
          let score = compareMasks(original, candidate);
          if (line.bold && weight !== '400') score += 0.02;
          if (line.italic && style === 'italic') score += 0.02;
          if (line.serif && family.value === 'serif') score += 0.01;
          if (line.mono && family.value === 'mono') score += 0.01;
          if (!best || score > best.score) {
            best = {
              value: family.value,
              label: family.label,
              weight,
              style,
              size: clamp(Math.round(candidate.size / original.scale), 4, 900),
              score,
            };
          }
        }
      }
    }
    if (!best) return null;
    best.confident = best.score >= MATCH_THRESHOLD;
    return best;
  }

  function applyDetectedFont(detected) {
    if (editorFamily) {
      let found = false;
      for (const option of editorFamily.options) {
        if (option.value === detected.value) {
          found = true;
          break;
        }
      }
      if (!found && detected.value.startsWith('name:')) {
        const option = document.createElement('option');
        option.value = detected.value;
        option.textContent = `Use ${detected.value.slice(5)}`;
        option.dataset.detected = '';
        editorFamily.appendChild(option);
      }
      editorFamily.value = detected.value;
    }
    if (editorWeight) editorWeight.value = detected.weight;
    if (editorStyle) editorStyle.value = detected.style;
    if (editorSize) editorSize.value = String(detected.size);
  }

  function paintPatch(ctx, patch) {
    const { rect, text } = patch;
    const pad = Math.min(3, Math.max(1, Math.round(rect.h * 0.04)));
    ctx.save();
    ctx.fillStyle = patch.background;
    ctx.fillRect(
      Math.floor(rect.x - pad),
      Math.floor(rect.y - pad),
      Math.ceil(rect.w + pad * 2),
      Math.ceil(rect.h + pad * 2),
    );
    if (text) {
      const baseline = Number.isFinite(patch.baseline) ? patch.baseline : rect.y + rect.h * 0.8;
      let size = patch.size;
      ctx.font = fontString(patch.line, size, patch.family, patch.weight, patch.style);
      const maxWidth = rect.w * 1.02;
      const measured = ctx.measureText(text).width;
      if (measured > maxWidth) {
        size = Math.max(6, Math.floor(size * (maxWidth / measured)));
        ctx.font = fontString(patch.line, size, patch.family, patch.weight, patch.style);
      }
      ctx.fillStyle = patch.color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(text, rect.x, baseline, maxWidth);
    }
    ctx.restore();
  }

  function redrawEditor() {
    if (!editor.workCtx || !editor.displayCtx || !editor.base) return;
    editor.workCtx.clearRect(0, 0, editor.work.width, editor.work.height);
    editor.workCtx.drawImage(editor.base, 0, 0);
    for (const patch of editor.patches) paintPatch(editor.workCtx, patch);
    editor.displayCtx.clearRect(0, 0, editor.display.width, editor.display.height);
    editor.displayCtx.drawImage(editor.work, 0, 0);
    const count = editor.patches.length;
    if (editorUndoBtn) editorUndoBtn.disabled = count === 0;
    if (editorResetBtn) editorResetBtn.disabled = count === 0;
    if (editorDownloadBtn) editorDownloadBtn.disabled = count === 0;
    if (editorEditCountEl) {
      editorEditCountEl.textContent = count === 0
        ? 'No replacements yet'
        : `${count} replacement${count === 1 ? '' : 's'} on the image`;
    }
  }

  function buildBoxes() {
    if (!editorBoxesEl) return;
    const fragment = document.createDocumentFragment();
    const width = editor.base ? editor.base.width : 1;
    const height = editor.base ? editor.base.height : 1;
    editor.lines.slice(0, MAX_EDIT_LINES).forEach((line, index) => {
      const b = line.bbox;
      if (!b || b.w <= 0 || b.h <= 0) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ocr-box';
      button.dataset.ocrLine = String(index);
      button.style.left = percent(b.x, width);
      button.style.top = percent(b.y, height);
      button.style.width = percent(b.w, width);
      button.style.height = percent(b.h, height);
      button.setAttribute('aria-label', `Edit line ${index + 1}: ${line.text}`);
      button.setAttribute('aria-pressed', 'false');
      button.title = line.text;
      fragment.appendChild(button);
    });
    editorBoxesEl.replaceChildren(fragment);
  }

  function setSelectionEnabled(on) {
    for (const control of [editorText, editorFamily, editorWeight, editorStyle, editorSize, editorColor, editorBackground, editorMatchBackgroundBtn, editorApplyBtn]) {
      if (control) control.disabled = !on;
    }
  }

  function clearSelection() {
    editor.selected = -1;
    if (editorBoxesEl) {
      for (const button of editorBoxesEl.querySelectorAll('[data-ocr-line]')) {
        button.classList.remove('is-selected');
        button.setAttribute('aria-pressed', 'false');
      }
    }
    if (editorText) {
      editorText.value = '';
      editorText.placeholder = 'Select a line first';
    }
    setSelectionEnabled(false);
    if (editorSelectionEl) editorSelectionEl.textContent = 'No line selected yet.';
  }

  function syncBoxVisibility() {
    if (!editorBoxesEl || !editorShowBoxesEl) return;
    editorBoxesEl.hidden = !editorShowBoxesEl.checked;
  }

  function selectLine(index) {
    const line = editor.lines[index];
    if (!line) return;
    editor.selected = index;
    for (const button of editorBoxesEl.querySelectorAll('[data-ocr-line]')) {
      const selected = Number(button.dataset.ocrLine) === index;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    const sample = sampleLine(line);
    let detected = editor.fontCache.get(index);
    if (detected === undefined) {
      try {
        detected = detectFont(line, sample);
      } catch {
        detected = null;
      }
      editor.fontCache.set(index, detected);
    }
    if (editorText) { editorText.value = line.text; }
    if (editorFamily) {
      for (const option of editorFamily.querySelectorAll('option[data-detected]')) option.remove();
      const autoOption = editorFamily.querySelector('option[value="auto"]');
      if (autoOption) {
        autoOption.textContent = line.fontName
          ? `Match the original (${line.fontName})`
          : 'Match the original';
      }
      if (line.fontName) {
        const option = document.createElement('option');
        option.value = `name:${line.fontName}`;
        option.textContent = `Use ${line.fontName}`;
        option.dataset.detected = '';
        editorFamily.appendChild(option);
      }
      editorFamily.value = 'auto';
    }
    if (detected && detected.confident) {
      applyDetectedFont(detected);
    } else {
      if (editorWeight) {
        const bold = line.bold || sample.coverage > 0.33;
        editorWeight.value = bold ? '700' : '400';
      }
      if (editorStyle) editorStyle.value = line.italic ? 'italic' : 'normal';
      if (editorSize) editorSize.value = String(lineSize(line));
    }
    editor.sampleBackground = sample.background;
    if (editorColor) editorColor.value = sample.color;
    if (editorBackground) editorBackground.value = '#ffffff';
    setSelectionEnabled(true);
    if (editorSelectionEl) editorSelectionEl.textContent = `Line ${index + 1}: "${line.text}"`;
    if (detected && detected.confident) {
      const weightLabel = detected.weight === '700' ? ', bold' : detected.weight === '600' ? ', semibold' : '';
      const detail = `${detected.label}${weightLabel}${detected.style === 'italic' ? ', italic' : ''}, ${detected.size}px`;
      setEditorStatus(`Auto-matched ${detail}. Change the text, then choose Replace text.`);
    } else {
      setEditorStatus('Font matched approximately. Change the text, then choose Replace text, or adjust the font above.');
    }
    if (editorText) {
      editorText.focus();
      editorText.select();
    }
  }

  async function openEditor(item) {
    if (!editorEl || !editorCanvas) return;
    const token = ++editor.token;
    if (!item.lines.length) {
      showError(['No editable text lines were found in this screenshot. Try a sharper image or a different page layout.']);
      return;
    }
    showError([]);
    setEditorStatus('Loading the screenshot…');
    editor.item = item;
    editor.lines = item.lines;
    editor.patches = [];
    editor.selected = -1;
    editor.fontCache.clear();
    editorEl.hidden = false;
    if (editorNoteEl) {
      const total = item.lines.length;
      const extra = total > MAX_EDIT_LINES ? ` The first ${MAX_EDIT_LINES} are selectable.` : '';
      editorNoteEl.textContent = `${item.file.name} — ${total} recognised line${total === 1 ? '' : 's'}.${extra} Select a line in the image to edit it.`;
    }
    if (editorSelectionEl) editorSelectionEl.textContent = 'No line selected yet.';
    setSelectionEnabled(false);
    if (editorShowBoxesEl) editorShowBoxesEl.checked = true;
    if (editorCanvas) { editorCanvas.width = 1; editorCanvas.height = 1; }
    if (editorBoxesEl) {
      editorBoxesEl.replaceChildren();
      editorBoxesEl.hidden = false;
    }
    editorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const image = new Image();
      image.decoding = 'async';
      image.src = item.url;
      if (image.decode) await image.decode();
      else await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
      if (token !== editor.token) return;
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      if (!width || !height) throw new Error('The image could not be decoded.');
      const base = document.createElement('canvas');
      base.width = width;
      base.height = height;
      const baseCtx = base.getContext('2d', { willReadFrequently: true });
      baseCtx.drawImage(image, 0, 0);
      const work = document.createElement('canvas');
      work.width = width;
      work.height = height;
      const workCtx = work.getContext('2d');
      const display = editorCanvas;
      display.width = width;
      display.height = height;
      const displayCtx = display.getContext('2d');
      editor.base = base;
      editor.baseCtx = baseCtx;
      editor.work = work;
      editor.workCtx = workCtx;
      editor.display = display;
      editor.displayCtx = displayCtx;
      buildBoxes();
      redrawEditor();
      setEditorStatus(`${item.lines.length} lines found. Select one to edit it.`);
    } catch (error) {
      setEditorStatus('');
      showError([`The screenshot could not be opened for editing. ${error && error.message ? error.message : ''}`.trim()]);
      closeEditor();
    }
  }

  function closeEditor() {
    editor.token += 1;
    if (editorEl) editorEl.hidden = true;
    editor.item = null;
    editor.base = null;
    editor.baseCtx = null;
    editor.work = null;
    editor.workCtx = null;
    editor.display = null;
    editor.displayCtx = null;
    editor.lines = [];
    editor.patches = [];
    editor.selected = -1;
    editor.fontCache.clear();
    if (editorCanvas) { editorCanvas.width = 1; editorCanvas.height = 1; }
    if (editorBoxesEl) editorBoxesEl.replaceChildren();
    if (editorShowBoxesEl) editorShowBoxesEl.checked = true;
    if (editorEditCountEl) editorEditCountEl.textContent = 'No replacements yet';
    if (editorSelectionEl) editorSelectionEl.textContent = 'No line selected yet.';
    setSelectionEnabled(false);
    setEditorStatus('');
  }

  function applyReplacement() {
    const line = currentLine();
    if (!line) return;
    const text = editorText ? editorText.value.trim() : '';
    const patch = {
      line,
      rect: { x: line.bbox.x, y: line.bbox.y, w: line.bbox.w, h: line.bbox.h },
      baseline: line.baseline,
      text,
      size: clamp(Number(editorSize ? editorSize.value : lineSize(line)) || lineSize(line), 4, 900),
      family: editorFamily ? editorFamily.value : 'auto',
      weight: editorWeight ? editorWeight.value : '400',
      style: editorStyle ? editorStyle.value : 'normal',
      color: editorColor ? editorColor.value : '#111111',
      background: editorBackground ? editorBackground.value : '#ffffff',
    };
    editor.patches.push(patch);
    redrawEditor();
    clearSelection();
    setEditorStatus(text
      ? `Replaced "${line.text}" with "${text}". Click another line, or download the PNG.`
      : `Removed "${line.text}" from the image. Click another line, or download the PNG.`);
    say('Screenshot updated. Download the PNG when you are done.');
  }

  function downloadEdited() {
    if (!editor.display || !editor.patches.length) return;
    editor.display.toBlob((blob) => {
      if (!blob) {
        setEditorStatus('Your browser could not encode the edited image.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const base = editor.item ? editor.item.file.name.replace(/\.[^.]+$/, '') : 'screenshot';
      a.href = url;
      a.download = `${base}-edited.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setEditorStatus(`Downloaded ${a.download}.`);
      say('Edited screenshot downloaded');
    }, 'image/png');
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
    const ok = await copyText(allText);
    say(ok ? 'Copied all recognised text' : 'Copy failed. Select the text and copy it manually.');
  });

  downloadBtn.addEventListener('click', () => {
    if (!allText) return;
    const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recognised-text.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  resetBtn.addEventListener('click', () => {
    for (const item of items) if (item.url) URL.revokeObjectURL(item.url);
    items.length = 0;
    allText = '';
    listEl.replaceChildren();
    closeEditor();
    setStatus('', null);
    showError([]);
    refreshAll();
  });

  if (langSelect) langSelect.addEventListener('change', () => { workerLang = null; });

  if (editorBoxesEl) {
    editorBoxesEl.addEventListener('click', (event) => {
      const button = event.target.closest('[data-ocr-line]');
      if (!button) return;
      selectLine(Number(button.dataset.ocrLine));
    });
  }
  if (editorShowBoxesEl) {
    editorShowBoxesEl.addEventListener('change', syncBoxVisibility);
  }
  if (editorCanvas) {
    editorCanvas.addEventListener('click', () => {
      if (editor.selected >= 0) clearSelection();
    });
  }

  if (editorMatchBackgroundBtn) {
    editorMatchBackgroundBtn.addEventListener('click', () => {
      if (editor.selected < 0) return;
      if (editorBackground) editorBackground.value = editor.sampleBackground;
      setEditorStatus('Background set to the colour sampled from this line.');
    });
  }
  if (editorApplyBtn) editorApplyBtn.addEventListener('click', applyReplacement);
  if (editorUndoBtn) {
    editorUndoBtn.addEventListener('click', () => {
      if (!editor.patches.length) return;
      editor.patches.pop();
      redrawEditor();
      setEditorStatus('Removed the last replacement.');
    });
  }
  if (editorResetBtn) {
    editorResetBtn.addEventListener('click', () => {
      editor.patches = [];
      redrawEditor();
      setEditorStatus('The image is back to the original screenshot.');
    });
  }
  if (editorDownloadBtn) editorDownloadBtn.addEventListener('click', downloadEdited);
  if (editorCloseBtn) editorCloseBtn.addEventListener('click', closeEditor);
  if (editorText) {
    editorText.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyReplacement();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        clearSelection();
      }
    });
  }

  refreshAll();
}
