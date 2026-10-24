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

  const MAX_BYTES = 25 * 1024 * 1024;
  const ACCEPTED = new Set(['image/png', 'image/jpeg', 'image/webp']);
  const VENDOR = '/vendor/tesseract';
  const STATUS_TEXT = {
    'loading tesseract core': 'Loading the OCR engine',
    'initializing tesseract': 'Starting the OCR engine',
    'loading language traineddata': 'Loading the English language model',
    'initializing api': 'Preparing the recogniser',
    'recognizing text': 'Reading the text',
  };

  const items = [];
  let worker = null;
  let workerLang = null;
  let running = false;
  let nextId = 1;
  let allText = '';

  const visible = (el, on) => { if (el) el.hidden = !on; };
  const sizeText = (bytes) => (bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

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
      li.remove();
      refreshAll();
    });
    tools.append(copy, remove);

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
      item.text = (result && result.data && result.data.text ? result.data.text : '').replace(/\n{3,}/g, '\n\n').trim();
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
    setStatus('', null);
    showError([]);
    refreshAll();
  });

  if (langSelect) langSelect.addEventListener('change', () => { workerLang = null; });

  refreshAll();
}
