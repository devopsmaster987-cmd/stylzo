// PDF editor. Everything happens on the visitor's device.
//
// The file is opened with pdf-lib, rendered for preview with PDF.js, and the
// edited document is written back by pdf-lib. Neither library talks to a
// server: the bytes never leave this module except through the download the
// visitor asks for. That is the same constraint every other file tool on this
// site works under, and it is the reason both libraries are vendored under
// /vendor rather than loaded from a CDN: the CSP is script-src 'self'.
//
// This is deliberately a page editor, not a word processor. Existing text is
// left in the content stream it arrived in; the tool arranges pages and draws
// new marks on top. An "editor" that quietly reflowed somebody's contract would
// be a worse tool than one that says what it does.

import { say } from './lib.js';

const root = document.querySelector('[data-pe-tool]');
if (root) {
  const $ = (sel) => root.querySelector(sel);

  const zone = $('[data-pe-zone]');
  const input = $('[data-pe-input]');
  const addBtn = $('[data-pe-add]');
  const resetBtn = $('[data-pe-reset]');
  const errorsEl = $('[data-pe-errors]');
  const statusEl = $('[data-pe-status]');
  const fileEl = $('[data-pe-file]');
  const emptyEl = $('[data-pe-empty]');
  const workspaceEl = $('[data-pe-workspace]');
  const pagesEl = $('[data-pe-pages]');
  const pageSummaryEl = $('[data-pe-page-summary]');
  const currentLabelEl = $('[data-pe-current-label]');
  const rotationEl = $('[data-pe-rotation]');
  const stageEl = $('[data-pe-stage]');
  const canvasWrapEl = $('[data-pe-canvas-wrap]');
  const canvas = $('[data-pe-canvas]');
  const previewStatus = $('[data-pe-preview-status]');
  const overlaysEl = $('[data-pe-overlays]');
  const overlaysListEl = $('[data-pe-overlays-list]');
  const prevBtn = $('[data-pe-prev]');
  const nextBtn = $('[data-pe-next]');
  const moveEarlierBtn = $('[data-pe-move-earlier]');
  const moveLaterBtn = $('[data-pe-move-later]');
  const rotateLeftBtn = $('[data-pe-rotate-left]');
  const rotateRightBtn = $('[data-pe-rotate-right]');
  const duplicateBtn = $('[data-pe-duplicate]');
  const blankBtn = $('[data-pe-blank]');
  const deleteBtn = $('[data-pe-delete]');
  const clearOverlaysBtn = $('[data-pe-clear-overlays]');
  const textInput = $('[data-pe-text]');
  const sizeInput = $('[data-pe-size]');
  const colourInput = $('[data-pe-colour]');
  const opacityInput = $('[data-pe-opacity]');
  const opacityOut = $('[data-pe-opacity-out]');
  const positionSelect = $('[data-pe-position]');
  const applySelect = $('[data-pe-apply]');
  const addTextBtn = $('[data-pe-add-text]');
  const numberFormat = $('[data-pe-number-format]');
  const numberPosition = $('[data-pe-number-position]');
  const numberStart = $('[data-pe-number-start]');
  const addNumbersBtn = $('[data-pe-add-numbers]');
  const clearNumbersBtn = $('[data-pe-clear-numbers]');
  const nameInput = $('[data-pe-name]');
  const downloadBtn = $('[data-pe-download]');
  const outputNote = $('[data-pe-output-note]');

  const MAX_BYTES = 50 * 1024 * 1024;
  const MAX_PAGES = 300;
  const MAX_OVERLAYS = 24;

  // Anchor for a stamp, in displayed page coordinates: u from the left, v from
  // the top, and how the line is aligned against that anchor.
  const POSITIONS = {
    'top-left': { u: 0.06, v: 0.08, h: 'left' },
    'top-center': { u: 0.5, v: 0.08, h: 'center' },
    'top-right': { u: 0.94, v: 0.08, h: 'right' },
    'middle-left': { u: 0.06, v: 0.5, h: 'left' },
    'middle-center': { u: 0.5, v: 0.5, h: 'center' },
    'middle-right': { u: 0.94, v: 0.5, h: 'right' },
    'bottom-left': { u: 0.06, v: 0.92, h: 'left' },
    'bottom-center': { u: 0.5, v: 0.92, h: 'center' },
    'bottom-right': { u: 0.94, v: 0.92, h: 'right' },
  };

  /** Loaded documents, keyed by an id that page items refer to. */
  const docs = new Map();
  /** The output order: one entry per page, including duplicates and blanks. */
  const pages = [];
  let selectedId = null;
  let nextId = 1;
  let nextOverlayId = 1;
  let pdfLibPromise = null;
  let pdfjsPromise = null;
  let renderTask = null;
  let previewToken = 0;
  let lastPreview = null;
  let statusTimer = 0;

  const thumbQueue = [];
  let thumbActive = 0;

  const visible = (el, on) => { if (el) el.hidden = !on; };
  const normalizeAngle = (angle) => ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  const sizeText = (bytes) => (bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
  const selectedIndex = () => pages.findIndex((p) => p.id === selectedId);
  const selectedItem = () => pages.find((p) => p.id === selectedId) || null;

  function loadPdfLib() {
    if (!pdfLibPromise) pdfLibPromise = import('../vendor/pdf-lib/pdf-lib.esm.min.js');
    return pdfLibPromise;
  }

  function loadPdfjs() {
    if (!pdfjsPromise) {
      pdfjsPromise = import('../vendor/pdfjs/pdf.min.mjs').then((mod) => {
        mod.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs';
        return mod;
      });
    }
    return pdfjsPromise;
  }

  function setStatus(text, temporary = false) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    clearTimeout(statusTimer);
    if (temporary && text) {
      statusTimer = setTimeout(() => { statusEl.textContent = ''; }, 3200);
    }
  }

  function showError(messages) {
    if (!errorsEl) return;
    errorsEl.replaceChildren(...messages.map((message) => {
      const p = document.createElement('p');
      p.textContent = message;
      return p;
    }));
    visible(errorsEl, messages.length > 0);
  }

  function clearError() {
    visible(errorsEl, false);
    if (errorsEl) errorsEl.replaceChildren();
  }

  function totalRotation(item) {
    return normalizeAngle((item.baseRotation || 0) + (item.rotation || 0));
  }

  function displaySize(item) {
    const total = totalRotation(item);
    return total % 180 === 90
      ? { width: item.height, height: item.width }
      : { width: item.width, height: item.height };
  }

  function overlayText(overlay, index) {
    if (overlay.kind === 'text') return overlay.text;
    const n = (Number(overlay.start) || 1) + index;
    const total = pages.length;
    if (overlay.format === 'page-n') return `Page ${n}`;
    if (overlay.format === 'n-of-total') return `${n} of ${total}`;
    if (overlay.format === 'dash-n-dash') return `- ${n} -`;
    return String(n);
  }

  function overlayLabel(overlay, index) {
    const position = (positionSelect?.querySelector(`option[value="${overlay.position}"]`)?.textContent)
      || overlay.position;
    if (overlay.kind === 'pageNumber') {
      return `Page number “${overlayText(overlay, index)}” at ${position.toLowerCase()}`;
    }
    return `Text “${overlay.text}” at ${position.toLowerCase()}`;
  }

  // ---- Reading files --------------------------------------------------------

  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    clearError();
    setStatus('Opening PDF');

    const errors = [];
    const firstPageCount = pages.length;
    let added = 0;
    let firstNewId = null;

    for (const file of files) {
      if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
        errors.push(`${file.name} is not a PDF.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        errors.push(`${file.name} is ${sizeText(file.size)}. The limit is 50 MB per PDF.`);
        continue;
      }
      if (pages.length + 1 > MAX_PAGES) {
        errors.push(`The document already has ${pages.length} pages. The limit is ${MAX_PAGES}.`);
        break;
      }

      let bytes;
      let libDoc;
      let pdfDoc;
      try {
        bytes = new Uint8Array(await file.arrayBuffer());
        const { PDFDocument } = await loadPdfLib();
        libDoc = await PDFDocument.load(bytes, { updateMetadata: false });
      } catch (err) {
        const encrypted = /encrypted|password/i.test(String(err?.message || ''));
        errors.push(encrypted
          ? `${file.name} is password-protected. Remove the password before editing it here.`
          : `${file.name} could not be read as a PDF. It may be damaged or use an unsupported feature.`);
        continue;
      }

      const pageCount = libDoc.getPageCount();
      if (pageCount === 0) {
        errors.push(`${file.name} has no pages.`);
        continue;
      }
      if (pages.length + pageCount > MAX_PAGES) {
        errors.push(`${file.name} has ${pageCount} pages, which would pass the ${MAX_PAGES}-page limit.`);
        continue;
      }

      try {
        const pdfjs = await loadPdfjs();
        pdfDoc = await pdfjs.getDocument({
          data: bytes.slice(),
          cMapUrl: '/vendor/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/vendor/pdfjs/standard_fonts/',
          useWorkerFetch: false,
        }).promise;
      } catch (err) {
        errors.push(`${file.name} could not be prepared for the page preview. It may be encrypted or damaged.`);
        continue;
      }

      const docId = `doc-${nextId++}`;
      docs.set(docId, {
        id: docId,
        name: file.name,
        bytes,
        size: file.size,
        libDoc,
        pdfDoc,
        pageCount,
      });

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        const libPage = libDoc.getPage(pageIndex);
        const { width, height } = libPage.getSize();
        const baseRotation = normalizeAngle(libPage.getRotation().angle || 0);
        const item = {
          id: `page-${nextId++}`,
          docId,
          pageIndex,
          baseRotation,
          rotation: 0,
          width,
          height,
          overlays: [],
          thumb: null,
          thumbQueued: false,
        };
        pages.push(item);
        if (!firstNewId) firstNewId = item.id;
      }

      added += 1;
    }

    if (!selectedId) selectedId = firstNewId || pages[0]?.id || null;
    if (added) {
      const addedPages = pages.length - firstPageCount;
      renderAll();
      setStatus(`${addedPages} page${addedPages === 1 ? '' : 's'} added from ${added} PDF${added === 1 ? '' : 's'}.`, true);
    } else {
      setStatus('');
    }
    if (errors.length) showError(errors);
    else if (!added) showError(['No PDF was opened.']);
    input.value = '';
  }

  // ---- Page thumbnails -----------------------------------------------------

  function queueThumb(item) {
    if (!item.docId || item.thumb || item.thumbQueued) return;
    item.thumbQueued = true;
    thumbQueue.push(item);
    pumpThumbs();
  }

  function pumpThumbs() {
    if (thumbActive >= 2) return;
    const item = thumbQueue.shift();
    if (!item) return;
    thumbActive += 1;
    renderThumb(item)
      .then((dataUrl) => {
        if (!dataUrl || !pages.includes(item)) return;
        item.thumb = dataUrl;
        const card = pagesEl?.querySelector(`[data-pe-page-id="${item.id}"] .pe-thumb`);
        if (card) {
          const img = document.createElement('img');
          img.src = dataUrl;
          img.alt = '';
          card.replaceChildren(img);
        }
      })
      .catch(() => { /* a thumbnail that fails leaves the numbered placeholder */ })
      .finally(() => {
        item.thumbQueued = false;
        thumbActive -= 1;
        pumpThumbs();
      });
  }

  async function renderThumb(item) {
    if (!item.docId) return null;
    const doc = docs.get(item.docId);
    if (!doc) return null;
    const pdfjs = await loadPdfjs();
    const page = await doc.pdfDoc.getPage(item.pageIndex + 1);
    const rotation = totalRotation(item);
    const base = page.getViewport({ scale: 1, rotation });
    const scale = Math.min(150 / base.width, 190 / base.height, 1.5);
    const viewport = page.getViewport({ scale, rotation });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = Math.max(1, Math.floor(viewport.width * dpr));
    thumbCanvas.height = Math.max(1, Math.floor(viewport.height * dpr));
    const context = thumbCanvas.getContext('2d');
    await page.render({
      canvasContext: context,
      viewport,
      transform: dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0],
    }).promise;
    return thumbCanvas.toDataURL('image/jpeg', 0.82);
  }

  // ---- Rendering the interface --------------------------------------------

  function renderAll() {
    const hasPages = pages.length > 0;
    visible(emptyEl, !hasPages);
    visible(workspaceEl, hasPages);
    if (!pages.some((p) => p.id === selectedId)) selectedId = pages[0]?.id || null;
    renderPageList();
    updateChrome();
    renderPreview();
    renderOverlays();
  }

  function renderPageList() {
    if (!pagesEl) return;
    const cards = pages.map((item, index) => {
      const li = document.createElement('li');
      li.className = 'pe-page';
      li.dataset.pePageId = item.id;
      li.draggable = true;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pe-page-btn';
      button.dataset.peSelect = item.id;
      button.setAttribute('aria-current', item.id === selectedId ? 'page' : 'false');
      button.setAttribute(
        'aria-label',
        `Page ${index + 1}${item.rotation ? `, rotated ${totalRotation(item)} degrees` : ''}${item.overlays.length ? `, ${item.overlays.length} stamp${item.overlays.length === 1 ? '' : 's'}` : ''}`,
      );

      const thumb = document.createElement('span');
      thumb.className = 'pe-thumb';
      if (item.thumb) {
        const img = document.createElement('img');
        img.src = item.thumb;
        img.alt = '';
        thumb.append(img);
      } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'pe-thumb-empty';
        placeholder.textContent = item.docId ? String(index + 1) : 'Blank';
        thumb.append(placeholder);
        queueThumb(item);
      }

      const meta = document.createElement('span');
      meta.className = 'pe-page-meta';
      const number = document.createElement('b');
      number.textContent = `Page ${index + 1}`;
      meta.append(number);
      if (item.rotation) {
        const rotated = document.createElement('span');
        rotated.textContent = `${totalRotation(item)}°`;
        meta.append(rotated);
      }
      if (item.overlays.length) {
        const stamped = document.createElement('span');
        stamped.textContent = `${item.overlays.length} stamp${item.overlays.length === 1 ? '' : 's'}`;
        meta.append(stamped);
      }

      button.append(thumb, meta);
      li.append(button);
      return li;
    });
    pagesEl.replaceChildren(...cards);
  }

  function syncSelection() {
    if (!pagesEl) return;
    for (const li of pagesEl.querySelectorAll('[data-pe-page-id]')) {
      const active = li.dataset.pePageId === selectedId;
      const button = li.querySelector('[data-pe-select]');
      if (button) button.setAttribute('aria-current', active ? 'page' : 'false');
    }
  }

  function updateChrome() {
    const index = selectedIndex();
    const item = selectedItem();
    const activeDocIds = new Set(pages.map((page) => page.docId).filter(Boolean));
    const activeDocs = [...activeDocIds].map((id) => docs.get(id)).filter(Boolean);
    const docCount = activeDocs.length;
    const totalBytes = activeDocs.reduce((sum, doc) => sum + doc.size, 0);

    if (fileEl) {
      if (!pages.length) fileEl.textContent = '';
      else if (docCount === 1) {
        const doc = activeDocs[0];
        fileEl.textContent = `${doc.name} · ${sizeText(totalBytes)}`;
      } else if (docCount > 1) {
        fileEl.textContent = `${docCount} PDFs · ${sizeText(totalBytes)}`;
      } else {
        fileEl.textContent = 'Blank pages only';
      }
    }

    if (pageSummaryEl) {
      pageSummaryEl.textContent = pages.length
        ? `${pages.length} page${pages.length === 1 ? '' : 's'}`
        : '';
    }

    if (currentLabelEl) {
      currentLabelEl.textContent = item ? `Page ${index + 1} of ${pages.length}` : 'No page selected';
    }

    if (rotationEl) {
      const angle = item ? totalRotation(item) : 0;
      visible(rotationEl, Boolean(item && angle));
      rotationEl.textContent = angle ? `Rotated ${angle}°` : 'Rotated';
    }

    if (canvas) canvas.setAttribute('aria-label', item ? `Preview of page ${index + 1}` : 'PDF preview');

    if (prevBtn) prevBtn.disabled = index <= 0;
    if (nextBtn) nextBtn.disabled = index < 0 || index >= pages.length - 1;
    if (moveEarlierBtn) moveEarlierBtn.disabled = index <= 0;
    if (moveLaterBtn) moveLaterBtn.disabled = index < 0 || index >= pages.length - 1;
    if (rotateLeftBtn) rotateLeftBtn.disabled = !item;
    if (rotateRightBtn) rotateRightBtn.disabled = !item;
    if (duplicateBtn) duplicateBtn.disabled = !item;
    if (blankBtn) blankBtn.disabled = !item;
    if (deleteBtn) deleteBtn.disabled = !item;
    if (clearOverlaysBtn) clearOverlaysBtn.disabled = !item || !item.overlays.length;
    if (addTextBtn) addTextBtn.disabled = !item || !textInput?.value.trim();
    if (addNumbersBtn) addNumbersBtn.disabled = !pages.length;
    if (clearNumbersBtn) clearNumbersBtn.disabled = !pages.some((p) => p.overlays.some((o) => o.kind === 'pageNumber'));
    if (downloadBtn) downloadBtn.disabled = !pages.length;

    if (outputNote) {
      outputNote.textContent = pages.length
        ? `${pages.length} page${pages.length === 1 ? '' : 's'} will be written into the new PDF. The original is left untouched.`
        : 'The new file is built from the pages you arranged. The original is left untouched.';
    }
  }

  function clearCanvas() {
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;
    canvas.width = 1;
    canvas.height = 1;
    canvas.style.width = '';
    canvas.style.height = '';
    canvasWrapEl?.classList.add('is-empty');
  }

  async function renderPreview() {
    const item = selectedItem();
    const token = ++previewToken;
    lastPreview = null;
    if (!item) {
      clearCanvas();
      return;
    }

    canvasWrapEl?.classList.remove('is-empty');
    visible(previewStatus, true);
    if (renderTask) {
      try { renderTask.cancel(); } catch { /* already finished */ }
      renderTask = null;
    }

    try {
      const rotation = totalRotation(item);
      let viewport;
      let page = null;
      let doc = null;

      if (item.docId) {
        doc = docs.get(item.docId);
        if (!doc) return;
        const pdfjs = await loadPdfjs();
        page = await doc.pdfDoc.getPage(item.pageIndex + 1);
        if (token !== previewToken) return;
        const base = page.getViewport({ scale: 1, rotation });
        const available = Math.max(240, (stageEl?.clientWidth || 680) - 8);
        const scale = Math.min(available / base.width, 760 / base.height);
        viewport = page.getViewport({ scale, rotation });
      } else {
        const size = displaySize(item);
        const available = Math.max(240, (stageEl?.clientWidth || 680) - 8);
        const scale = Math.min(available / size.width, 760 / size.height);
        viewport = { width: size.width * scale, height: size.height * scale, scale };
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
      canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const context = canvas.getContext('2d');
      context.setTransform(1, 0, 0, 1, 0, 0);
      if (!page) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#e4dfef';
        context.lineWidth = 1;
        context.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
      } else {
        const task = page.render({
          canvasContext: context,
          viewport,
          transform: dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0],
        });
        renderTask = task;
        await task.promise;
        if (token !== previewToken) return;
        renderTask = null;
      }

      const size = displaySize(item);
      lastPreview = {
        pageWidth: size.width,
        pageHeight: size.height,
        cssWidth: viewport.width,
        cssHeight: viewport.height,
      };
      renderOverlays();
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException' && token === previewToken) {
        showError(['That page could not be drawn. The file may use a feature this browser does not support.']);
      }
    } finally {
      if (token === previewToken) visible(previewStatus, false);
    }
  }

  // ---- Overlay preview and list -------------------------------------------

  function renderOverlays() {
    if (!overlaysEl) return;
    const item = selectedItem();
    overlaysEl.replaceChildren();
    renderOverlayList();
    if (!item || !lastPreview) return;
    const index = selectedIndex();
    const scale = lastPreview.cssWidth / lastPreview.pageWidth;

    for (const overlay of item.overlays) {
      const text = overlayText(overlay, index);
      if (!text) continue;
      const anchor = POSITIONS[overlay.position] || POSITIONS['middle-center'];
      const node = document.createElement('span');
      node.className = 'pe-stamp';
      node.textContent = text;
      node.style.left = `${anchor.u * 100}%`;
      node.style.top = `${anchor.v * 100}%`;
      node.style.color = overlay.color;
      node.style.opacity = String(overlay.opacity);
      node.style.fontSize = `${Math.max(5, overlay.size * scale)}px`;
      const shiftX = anchor.h === 'center' ? '-50%' : anchor.h === 'right' ? '-100%' : '0';
      const shiftY = anchor.v === 0.5 ? '-50%' : anchor.v > 0.5 ? '-100%' : '0';
      node.style.transform = `translate(${shiftX}, ${shiftY})`;
      overlaysEl.append(node);
    }
  }

  function renderOverlayList() {
    if (!overlaysListEl) return;
    const item = selectedItem();
    const index = selectedIndex();
    if (!item || !item.overlays.length) {
      const li = document.createElement('li');
      li.className = 'pe-overlay-none';
      li.textContent = 'No stamps on this page yet.';
      overlaysListEl.replaceChildren(li);
      return;
    }

    overlaysListEl.replaceChildren(...item.overlays.map((overlay) => {
      const li = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = overlayLabel(overlay, index);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'linkish';
      remove.dataset.peOverlayRemove = overlay.id;
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${text.textContent}`);
      li.append(text, remove);
      return li;
    }));
  }

  // ---- Page actions --------------------------------------------------------

  function selectPage(id) {
    if (!pages.some((p) => p.id === id)) return;
    selectedId = id;
    syncSelection();
    updateChrome();
    renderPreview();
    renderOverlays();
  }

  function selectRelative(delta) {
    const index = selectedIndex();
    const next = pages[index + delta];
    if (next) selectPage(next.id);
  }

  function movePage(delta) {
    const index = selectedIndex();
    const to = index + delta;
    if (index < 0 || to < 0 || to >= pages.length) return;
    const [moved] = pages.splice(index, 1);
    pages.splice(to, 0, moved);
    selectedId = moved.id;
    renderAll();
    setStatus(delta < 0 ? 'Page moved earlier.' : 'Page moved later.', true);
  }

  function rotatePage(delta) {
    const item = selectedItem();
    if (!item) return;
    item.rotation = normalizeAngle((item.rotation || 0) + delta);
    item.thumb = null;
    item.thumbQueued = false;
    renderPageList();
    updateChrome();
    renderPreview();
    renderOverlays();
  }

  function invalidateThumb(item) {
    item.thumb = null;
    item.thumbQueued = false;
  }

  function duplicatePage() {
    const item = selectedItem();
    if (!item) return;
    if (pages.length >= MAX_PAGES) {
      showError([`The document is at the ${MAX_PAGES}-page limit. Delete a page before duplicating one.`]);
      return;
    }
    const index = selectedIndex();
    const copy = {
      ...item,
      id: `page-${nextId++}`,
      overlays: item.overlays.map((overlay) => ({ ...overlay, id: `stamp-${nextOverlayId++}` })),
      thumb: item.thumb,
      thumbQueued: false,
    };
    pages.splice(index + 1, 0, copy);
    selectedId = copy.id;
    renderAll();
    setStatus('Page duplicated.', true);
  }

  function insertBlank() {
    const item = selectedItem();
    if (!item) return;
    if (pages.length >= MAX_PAGES) {
      showError([`The document is at the ${MAX_PAGES}-page limit. Delete a page before inserting one.`]);
      return;
    }
    const index = selectedIndex();
    const blank = {
      id: `page-${nextId++}`,
      docId: null,
      pageIndex: null,
      baseRotation: 0,
      rotation: 0,
      width: item.width,
      height: item.height,
      overlays: [],
      thumb: null,
      thumbQueued: false,
    };
    pages.splice(index + 1, 0, blank);
    selectedId = blank.id;
    renderAll();
    setStatus('Blank page inserted.', true);
  }

  function deletePage() {
    const index = selectedIndex();
    if (index < 0) return;
    pages.splice(index, 1);
    selectedId = pages[Math.min(index, pages.length - 1)]?.id || null;
    renderAll();
    setStatus('Page deleted.', true);
  }

  function clearOverlaysOnPage() {
    const item = selectedItem();
    if (!item || !item.overlays.length) return;
    item.overlays = [];
    renderPageList();
    updateChrome();
    renderOverlays();
    setStatus('Stamps cleared from this page.', true);
  }

  // ---- Adding stamps -------------------------------------------------------

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.round(number)));
  }

  function addTextStamp() {
    const item = selectedItem();
    if (!item) return;
    const text = textInput?.value.trim() || '';
    if (!text) {
      showError(['Type the text you want to stamp.']);
      textInput?.focus();
      return;
    }
    if ([...text].some((char) => char.codePointAt(0) > 0xff)) {
      showError(['Text stamps support Latin characters only. The PDF font used here cannot draw other scripts.']);
      return;
    }
    if (item.overlays.length >= MAX_OVERLAYS) {
      showError([`This page already has ${MAX_OVERLAYS} stamps. Remove one before adding another.`]);
      return;
    }

    const overlay = {
      id: `stamp-${nextOverlayId++}`,
      kind: 'text',
      text,
      size: clampNumber(sizeInput?.value, 8, 96, 18),
      color: colourInput?.value || '#4b2fe0',
      opacity: clampNumber(opacityInput?.value, 10, 100, 100) / 100,
      position: positionSelect?.value || 'middle-center',
    };

    if (applySelect?.value === 'all') {
      let added = 0;
      for (const page of pages) {
        if (page.overlays.length >= MAX_OVERLAYS) continue;
        page.overlays.push({ ...overlay, id: `stamp-${nextOverlayId++}` });
        added += 1;
      }
      if (!added) {
        showError([`Every page already has ${MAX_OVERLAYS} stamps. Remove one before adding another.`]);
        return;
      }
      setStatus(`Text stamp added to ${added} page${added === 1 ? '' : 's'}.`, true);
    } else {
      item.overlays.push(overlay);
      setStatus('Text stamp added.', true);
    }

    clearError();
    textInput.value = '';
    renderPageList();
    updateChrome();
    renderOverlays();
    say('Text stamp added');
  }

  function addPageNumbers() {
    if (!pages.length) return;
    const start = clampNumber(numberStart?.value, 1, 9999, 1);
    const format = numberFormat?.value || 'n';
    const position = numberPosition?.value || 'bottom-center';

    let numbered = 0;
    for (const page of pages) {
      page.overlays = page.overlays.filter((overlay) => overlay.kind !== 'pageNumber');
      if (page.overlays.length >= MAX_OVERLAYS) continue;
      page.overlays.push({
        id: `stamp-${nextOverlayId++}`,
        kind: 'pageNumber',
        format,
        position,
        start,
        size: 11,
        color: '#1b1533',
        opacity: 1,
      });
      numbered += 1;
    }

    clearError();
    renderPageList();
    updateChrome();
    renderOverlays();
    if (!numbered) {
      showError([`Every page already has ${MAX_OVERLAYS} stamps. Remove one before adding page numbers.`]);
      return;
    }
    setStatus(`Page numbers added to ${numbered} page${numbered === 1 ? '' : 's'}.`, true);
    say('Page numbers added');
  }

  function clearPageNumbers() {
    let changed = false;
    for (const page of pages) {
      const before = page.overlays.length;
      page.overlays = page.overlays.filter((overlay) => overlay.kind !== 'pageNumber');
      if (page.overlays.length !== before) changed = true;
    }
    if (!changed) return;
    renderPageList();
    updateChrome();
    renderOverlays();
    setStatus('Page numbers removed.', true);
  }

  function removeOverlay(id) {
    const item = selectedItem();
    if (!item) return;
    const before = item.overlays.length;
    item.overlays = item.overlays.filter((overlay) => overlay.id !== id);
    if (item.overlays.length === before) return;
    renderPageList();
    updateChrome();
    renderOverlays();
  }

  // ---- Download ------------------------------------------------------------

  function hexToRgb(hex) {
    const match = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!match) return { r: 0.29, g: 0.18, b: 0.88 };
    const value = parseInt(match[1], 16);
    return {
      r: ((value >> 16) & 255) / 255,
      g: ((value >> 8) & 255) / 255,
      b: (value & 255) / 255,
    };
  }

  function displayToPage(dx, dy, width, height, rotation) {
    if (rotation === 90) return { x: dy, y: dx };
    if (rotation === 180) return { x: width - dx, y: dy };
    if (rotation === 270) return { x: width - dy, y: height - dx };
    return { x: dx, y: height - dy };
  }

  function safeFileName(value) {
    let name = String(value || '').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ');
    if (!name) name = 'edited';
    if (!/\.pdf$/i.test(name)) name += '.pdf';
    return name;
  }

  async function downloadPdf() {
    if (!pages.length) return;
    clearError();
    setStatus('Building the PDF');
    downloadBtn.disabled = true;

    try {
      const lib = await loadPdfLib();
      const output = await lib.PDFDocument.create();
      const font = await output.embedFont(lib.StandardFonts.Helvetica);

      for (let index = 0; index < pages.length; index += 1) {
        const item = pages[index];
        let page;

        if (item.docId) {
          const doc = docs.get(item.docId);
          if (!doc) throw new Error('A source PDF is no longer in memory.');
          const [copied] = await output.copyPages(doc.libDoc, [item.pageIndex]);
          page = output.addPage(copied);
        } else {
          page = output.addPage([item.width, item.height]);
        }

        const baseAngle = normalizeAngle(page.getRotation().angle || 0);
        const rotation = normalizeAngle(baseAngle + (item.rotation || 0));
        page.setRotation(lib.degrees(rotation));

        const { width, height } = page.getSize();
        const display = rotation % 180 === 90
          ? { width: height, height: width }
          : { width, height };

        for (const overlay of item.overlays) {
          const text = overlayText(overlay, index);
          if (!text) continue;

          let textWidth;
          try {
            textWidth = font.widthOfTextAtSize(text, overlay.size);
          } catch {
            throw new Error(`The stamp “${text}” uses a character the built-in PDF font cannot draw. Use Latin text for stamps.`);
          }

          const anchor = POSITIONS[overlay.position] || POSITIONS['middle-center'];
          let dx = anchor.u * display.width;
          if (anchor.h === 'center') dx -= textWidth / 2;
          else if (anchor.h === 'right') dx -= textWidth;
          const dy = anchor.v * display.height;
          const point = displayToPage(dx, dy, width, height, rotation);
          const colour = hexToRgb(overlay.color);

          page.drawText(text, {
            x: point.x,
            y: point.y,
            size: overlay.size,
            font,
            color: lib.rgb(colour.r, colour.g, colour.b),
            opacity: overlay.opacity,
            rotate: lib.degrees(rotation),
          });
        }
      }

      const bytes = await output.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeFileName(nameInput?.value);
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setStatus(`Downloaded ${link.download} (${sizeText(bytes.byteLength)}).`, true);
      say('PDF downloaded');
    } catch (err) {
      showError([String(err?.message || 'The PDF could not be built. Try removing large stamps and downloading again.')]);
      setStatus('');
    } finally {
      if (downloadBtn) downloadBtn.disabled = !pages.length;
    }
  }

  // ---- Resetting -----------------------------------------------------------

  function clearAll() {
    if (renderTask) {
      try { renderTask.cancel(); } catch { /* already finished */ }
      renderTask = null;
    }
    for (const doc of docs.values()) {
      try { doc.pdfDoc?.destroy?.(); } catch { /* already gone */ }
    }
    docs.clear();
    pages.length = 0;
    selectedId = null;
    thumbQueue.length = 0;
    lastPreview = null;
    previewToken += 1;
    clearCanvas();
    clearError();
    renderAll();
    setStatus('', false);
    if (input) input.value = '';
    if (textInput) textInput.value = '';
    if (nameInput) nameInput.value = 'edited.pdf';
  }

  // ---- Events --------------------------------------------------------------

  input?.addEventListener('change', (event) => { addFiles(event.target.files); });
  addBtn?.addEventListener('click', () => input?.click());

  resetBtn?.addEventListener('click', () => {
    if (pages.length && !window.confirm('Clear the PDF and any changes? The original file is not affected.')) return;
    clearAll();
  });

  for (const eventName of ['dragenter', 'dragover']) {
    zone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add('is-over');
    });
  }
  zone?.addEventListener('dragleave', (event) => {
    if (zone.contains(event.relatedTarget)) return;
    zone.classList.remove('is-over');
  });
  zone?.addEventListener('dragend', () => zone.classList.remove('is-over'));
  zone?.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('is-over');
    if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files);
  });

  // A file dropped a few pixels outside the zone would otherwise navigate away
  // and take every arranged page with it.
  for (const eventName of ['dragover', 'drop']) {
    window.addEventListener(eventName, (event) => {
      if (event.target && zone?.contains(event.target)) return;
      event.preventDefault();
    });
  }

  pagesEl?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pe-select]');
    if (!button) return;
    selectPage(button.dataset.peSelect);
  });

  let dragId = null;
  pagesEl?.addEventListener('dragstart', (event) => {
    const card = event.target.closest('[data-pe-page-id]');
    if (!card) return;
    dragId = card.dataset.pePageId;
    card.classList.add('is-dragging');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', dragId);
    }
  });
  pagesEl?.addEventListener('dragover', (event) => {
    if (!dragId) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    for (const card of pagesEl.querySelectorAll('.is-drop-target')) card.classList.remove('is-drop-target');
    const target = event.target.closest('[data-pe-page-id]');
    if (target && target.dataset.pePageId !== dragId) target.classList.add('is-drop-target');
  });
  pagesEl?.addEventListener('drop', (event) => {
    if (!dragId) return;
    event.preventDefault();
    const target = event.target.closest('[data-pe-page-id]');
    const from = pages.findIndex((page) => page.id === dragId);
    const targetId = target?.dataset.pePageId;
    let to = pages.findIndex((page) => page.id === targetId);
    if (from >= 0 && to >= 0 && from !== to) {
      const rect = target.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      const [moved] = pages.splice(from, 1);
      if (from < to) to -= 1;
      pages.splice(to + (after ? 1 : 0), 0, moved);
      selectedId = moved.id;
      renderAll();
      setStatus('Page moved.', true);
    }
    dragId = null;
    for (const card of pagesEl.querySelectorAll('.is-drop-target')) card.classList.remove('is-drop-target');
  });
  pagesEl?.addEventListener('dragend', () => {
    dragId = null;
    for (const card of pagesEl?.querySelectorAll('.is-dragging, .is-drop-target') || []) {
      card.classList.remove('is-dragging', 'is-drop-target');
    }
  });

  prevBtn?.addEventListener('click', () => selectRelative(-1));
  nextBtn?.addEventListener('click', () => selectRelative(1));
  moveEarlierBtn?.addEventListener('click', () => movePage(-1));
  moveLaterBtn?.addEventListener('click', () => movePage(1));
  rotateLeftBtn?.addEventListener('click', () => rotatePage(-90));
  rotateRightBtn?.addEventListener('click', () => rotatePage(90));
  duplicateBtn?.addEventListener('click', duplicatePage);
  blankBtn?.addEventListener('click', insertBlank);
  deleteBtn?.addEventListener('click', deletePage);
  clearOverlaysBtn?.addEventListener('click', clearOverlaysOnPage);

  opacityInput?.addEventListener('input', () => {
    if (opacityOut) opacityOut.textContent = `${opacityInput.value}%`;
  });
  textInput?.addEventListener('input', () => {
    if (addTextBtn) addTextBtn.disabled = !textInput.value.trim() || !selectedItem();
  });
  textInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addTextStamp();
  });
  addTextBtn?.addEventListener('click', addTextStamp);
  addNumbersBtn?.addEventListener('click', addPageNumbers);
  clearNumbersBtn?.addEventListener('click', clearPageNumbers);

  overlaysListEl?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pe-overlay-remove]');
    if (button) removeOverlay(button.dataset.peOverlayRemove);
  });

  downloadBtn?.addEventListener('click', downloadPdf);

  // A page assembled at one width has to be redrawn when the window changes:
  // the canvas is sized in CSS pixels, and the stamps are positioned as a
  // percentage of it.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!pages.length) return;
      renderPreview();
      renderOverlays();
    }, 160);
  });

  // The empty state is the server HTML; this only wires the initial buttons.
  updateChrome();
}
