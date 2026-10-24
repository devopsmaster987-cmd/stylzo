import { copyText, say } from './lib.js';

const root = document.querySelector('[data-pa-tool]');
if (root) {
  const zone = root.querySelector('[data-pa-zone]');
  const input = root.querySelector('[data-pa-input]');
  const errorsEl = root.querySelector('[data-pa-errors]');
  const statusEl = root.querySelector('[data-pa-status]');
  const emptyEl = root.querySelector('[data-pa-empty]');
  const fileEl = root.querySelector('[data-pa-file]');
  const resultsEl = root.querySelector('[data-pa-results]');
  const scoreEl = root.querySelector('[data-pa-score]');
  const gradeEl = root.querySelector('[data-pa-grade]');
  const summaryEl = root.querySelector('[data-pa-summary]');
  const factsEl = root.querySelector('[data-pa-facts]');
  const checksEl = root.querySelector('[data-pa-checks]');
  const copyBtn = root.querySelector('[data-pa-copy]');
  const resetBtn = root.querySelector('[data-pa-reset]');

  const MAX_BYTES = 50 * 1024 * 1024;
  let report = '';

  const visible = (el, on) => { if (el) el.hidden = !on; };
  const count = (text, re) => (text.match(re) || []).length;
  const sizeText = (bytes) => (bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

  function latin1(bytes) {
    let out = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return out;
  }

  async function inflate(bytes, format) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function decodedStreams(bytes, raw) {
    const chunks = [];
    const re = /(?<!end)stream\r?\n/g;
    let total = 0;
    let m;
    let seen = 0;
    while ((m = re.exec(raw)) !== null && seen < 800 && total < 80 * 1024 * 1024) {
      const start = m.index + m[0].length;
      const end = raw.indexOf('endstream', start);
      if (end < 0) break;
      re.lastIndex = end + 9;
      seen++;
      const dict = raw.slice(Math.max(0, m.index - 2500), m.index);
      if (!/FlateDecode/.test(dict)) continue;
      const slice = bytes.subarray(start, end);
      if (slice.length === 0 || slice.length > 12 * 1024 * 1024) continue;
      let inflated = null;
      try {
        inflated = await inflate(slice, 'deflate');
      } catch {
        try {
          inflated = await inflate(slice, 'deflate-raw');
        } catch {
          inflated = null;
        }
      }
      if (inflated) {
        total += inflated.length;
        chunks.push(latin1(inflated));
      }
    }
    return chunks.join('\n');
  }

  function pickTitle(raw, decoded) {
    const info = raw.match(/\/Title\s*\(((?:\\.|[^)])*)\)/);
    if (info && info[1].trim()) return info[1].replace(/\\([()\\])/g, '$1').trim();
    const xmp = decoded.match(/<dc:title>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i);
    if (xmp && xmp[1].trim()) return xmp[1].replace(/<[^>]+>/g, '').trim();
    const pdfTitle = decoded.match(/<pdf:Title>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i);
    if (pdfTitle && pdfTitle[1].trim()) return pdfTitle[1].replace(/<[^>]+>/g, '').trim();
    return '';
  }

  function pickLang(raw, decoded) {
    const info = raw.match(/\/Lang\s*\(([^)]*)\)/);
    if (info && info[1].trim()) return info[1].trim();
    const xmp = decoded.match(/<dc:language>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i);
    if (xmp && xmp[1].trim()) return xmp[1].replace(/<[^>]+>/g, '').trim();
    const attr = decoded.match(/xml:lang="([^"]+)"/i) || raw.match(/\/Lang\s*\/?([A-Za-z-]+)/);
    return attr ? attr[1] : '';
  }

  function buildChecks(raw, decoded, facts) {
    const haystack = `${raw}\n${decoded}`;
    const checks = [];
    const add = (id, label, level, detail, fix) => checks.push({ id, label, level, detail, fix });

    const marked = /\/Marked\s+true\b/.test(haystack);
    const structTree = /\/StructTreeRoot\b/.test(haystack);
    if (structTree && marked) {
      add('tagged', 'Tagged document', 'pass',
        'The file declares itself marked and carries a structure tree, so a screen reader can follow its reading order.',
        'No change needed.');
    } else if (structTree || marked) {
      add('tagged', 'Tagged document', 'warn',
        structTree ? 'A structure tree is present, but the document is not declared as marked.' : 'The file is marked but no structure tree was found.',
        'Re-export the PDF with "tagged PDF" or "accessible PDF" enabled so both the Marked flag and the structure tree are written.');
    } else {
      add('tagged', 'Tagged document', 'fail',
        'No structure tree or Marked flag was found. Screen readers will read the page without headings, lists or a defined reading order.',
        'Export again with tagging enabled, or add tags in the original application before exporting.');
    }

    if (facts.language) {
      add('lang', 'Document language', 'pass',
        `The document declares its language as "${facts.language}", so a screen reader can pick the right pronunciation.`,
        'No change needed.');
    } else {
      add('lang', 'Document language', 'fail',
        'No document language was found. A screen reader may read the text with the wrong pronunciation rules.',
        'Set the language in the document properties or the export dialog (for example en-GB or en-US).');
    }

    if (facts.title) {
      add('title', 'Document title', 'pass',
        `The document is titled "${facts.title}". Assistants and screen readers announce this instead of the file name.`,
        'No change needed.');
    } else {
      add('title', 'Document title', 'fail',
        'No title was found in the file information or the XMP metadata. Readers fall back to the file name.',
        'Add a title in the document properties and re-export.');
    }

    if (facts.displayDocTitle) {
      add('display-title', 'Title shown in the window', 'pass',
        'The viewer is asked to show the document title rather than the file name.',
        'No change needed.');
    } else {
      add('display-title', 'Title shown in the window', 'warn',
        'The viewer is not asked to display the document title in its window bar.',
        'Enable "Display document title" in the initial view settings before exporting.');
    }

    if (/pdfuaid|PDF\/UA/i.test(decoded) || /pdfuaid/i.test(raw)) {
      add('pdfua', 'PDF/UA identifier', 'pass',
        'The file carries a PDF/UA identifier, a claim to the universal accessibility standard.',
        'No change needed.');
    } else {
      add('pdfua', 'PDF/UA identifier', 'warn',
        'No PDF/UA identifier is present. That is not a failure on its own, but it means no accessibility standard is claimed.',
        'If the document is meant to conform, validate it against PDF/UA and add the identifier.');
    }

    if (!facts.encrypted && facts.fonts > 0 && facts.toUnicode > 0) {
      add('fonts', 'Readable fonts', 'pass',
        `${facts.fonts} font reference${facts.fonts === 1 ? '' : 's'} found with a ToUnicode map, so the text can be read aloud and copied correctly.`,
        'No change needed.');
    } else if (facts.fonts > 0) {
      add('fonts', 'Readable fonts', 'fail',
        `${facts.fonts} font references were found but none declares a ToUnicode map. Text may copy as gibberish or read as unknown glyphs.`,
        'Embed the fonts and enable Unicode mapping when exporting; avoid subsetting that drops the ToUnicode table.');
    } else if (facts.images > 0) {
      add('fonts', 'Readable fonts', 'fail',
        'No fonts were found, only images. This looks like a scanned or image-only PDF, which has no text a screen reader can read.',
        'Run the file through OCR and tag the result, or export from the original source rather than scanning.');
    } else {
      add('fonts', 'Readable fonts', 'warn',
        'No font information was found in the file.',
        'Check that the PDF was exported from the original document rather than flattened.');
    }

    if (facts.images === 0) {
      add('alt', 'Images have alt text', 'pass',
        'No images were found, so there is no missing alternative text.',
        'No change needed.');
    } else if (facts.alts > 0) {
      add('alt', 'Images have alt text', 'pass',
        `${facts.alts} alternative-text entr${facts.alts === 1 ? 'y' : 'ies'} found for ${facts.images} image${facts.images === 1 ? '' : 's'}. Check each one actually describes its image.`,
        'A structural scan cannot judge whether the alt text is meaningful; read it through with a screen reader once.');
    } else {
      add('alt', 'Images have alt text', 'warn',
        `${facts.images} image${facts.images === 1 ? '' : 's'} found with no alternative text in the file. Decorative images can be exempt, but meaningful ones cannot.`,
        'Mark decorative images as artefacts and give every meaningful image a short alt text description.');
    }

    if (facts.links === 0) {
      add('links', 'Labelled links', 'pass',
        'No links were found, so there is nothing unlabelled to focus.',
        'No change needed.');
    } else if (facts.structParents > 0) {
      add('links', 'Labelled links', 'pass',
        `${facts.links} link or annotation${facts.links === 1 ? '' : 's'} found inside the structure tree, so they can be reached and announced.`,
        'Check that each link text describes its destination ("download the report", not "click here").');
    } else {
      add('links', 'Labelled links', 'warn',
        `${facts.links} link or annotation${facts.links === 1 ? '' : 's'} found outside the structure tree. A screen reader may skip or mis-announce them.`,
        'Tag the links and give each one descriptive link text.');
    }

    if (facts.fields === 0) {
      add('fields', 'Labelled form fields', 'pass',
        'No form fields were found, so no field is missing an accessible name.',
        'No change needed.');
    } else if (facts.tooltips >= facts.fields) {
      add('fields', 'Labelled form fields', 'pass',
        `${facts.fields} form field${facts.fields === 1 ? '' : 's'} found with a tooltip name, so each can be announced.`,
        'Check the tab order and that the tooltip text makes sense out of context.');
    } else {
      add('fields', 'Labelled form fields', 'fail',
        `${facts.fields} form field${facts.fields === 1 ? '' : 's'} found but only ${facts.tooltips} accessible name${facts.tooltips === 1 ? '' : 's'}. Unnamed fields read as blank edits.`,
        'Give every field a tooltip or accessible name in the form editor.');
    }

    if (facts.xfa) {
      add('xfa', 'XFA form', 'fail',
        'This PDF contains an XFA form. XFA is not supported by most screen readers and browsers, even where the file opens.',
        'Convert the form to AcroForm, or publish an HTML form instead.');
    }

    if (facts.textOps > 0) {
      add('text', 'Selectable text', 'pass',
        'The content streams contain real text-drawing commands, so the text is selectable and searchable.',
        'No change needed.');
    } else {
      add('text', 'Selectable text', 'fail',
        'No text-drawing commands were found. The page content is likely a picture of text, which cannot be selected or read aloud.',
        'Export the PDF from its source, or OCR the scan and tag the result.');
    }

    if (facts.encrypted) {
      add('encrypt', 'File is encrypted', 'warn',
        'The file is encrypted. Some screen readers refuse to open protected files, and text extraction may be blocked.',
        'If the file must be protected, use an open password rather than a permissions password that blocks accessibility.');
    } else {
      add('encrypt', 'File is encrypted', 'pass',
        'The file is not encrypted, so accessibility tools can read it without a password.',
        'No change needed.');
    }

    if (facts.pages > 0 && !facts.outlines) {
      add('outlines', 'Bookmarks for navigation', 'warn',
        `${facts.pages} page${facts.pages === 1 ? '' : 's'} and no bookmarks were found. Long documents are easier to navigate with an outline.`,
        'Generate bookmarks from the headings when exporting, or add an outline in the authoring tool.');
    } else if (facts.outlines) {
      add('outlines', 'Bookmarks for navigation', 'pass',
        'The document carries an outline, so readers can jump between sections.',
        'No change needed.');
    }

    if (/\/Type\s*\/Metadata\b/.test(raw) || /<x:xmpmeta/i.test(decoded)) {
      add('metadata', 'XMP metadata', 'pass',
        'The file carries XMP metadata, which is where title, language and accessibility identifiers live.',
        'No change needed.');
    } else {
      add('metadata', 'XMP metadata', 'warn',
        'No XMP metadata was found. Title and language then depend on the older info dictionary alone.',
        'Enable XMP metadata when exporting.');
    }

    return checks;
  }

  function render(results) {
    if (!results) return;
    const { facts, checks, score, grade } = results;
    visible(emptyEl, false);
    visible(resultsEl, true);

    if (scoreEl) scoreEl.textContent = String(score);
    if (gradeEl) {
      gradeEl.textContent = grade;
      gradeEl.className = `pa-grade is-${score >= 90 ? 'ok' : score >= 70 ? 'warn' : 'bad'}`;
    }
    const failCount = checks.filter((c) => c.level === 'fail').length;
    const warnCount = checks.filter((c) => c.level === 'warn').length;
    const passCount = checks.filter((c) => c.level === 'pass').length;
    if (summaryEl) {
      summaryEl.textContent = `${passCount} passed · ${warnCount} warnings · ${failCount} failed`;
    }

    if (factsEl) {
      factsEl.replaceChildren();
      const rows = [
        ['File', `${facts.name} (${sizeText(facts.bytes)})`],
        ['Pages', facts.pages ? String(facts.pages) : 'Not found'],
        ['PDF version', facts.version || 'Unknown'],
        ['Tagged', facts.structTree ? 'Yes' : 'No'],
        ['Language', facts.language || 'Not set'],
        ['Title', facts.title || 'Not set'],
        ['Fonts', String(facts.fonts)],
        ['Images', String(facts.images)],
        ['Form fields', String(facts.fields)],
        ['Encrypted', facts.encrypted ? 'Yes' : 'No'],
        ['Producer', facts.producer || 'Unknown'],
      ];
      for (const [term, value] of rows) {
        const dt = document.createElement('dt');
        dt.textContent = term;
        const dd = document.createElement('dd');
        dd.textContent = value;
        factsEl.append(dt, dd);
      }
    }

    if (checksEl) {
      checksEl.replaceChildren();
      for (const check of [...checks].sort((a, b) => {
        const rank = { fail: 0, warn: 1, pass: 2 };
        return rank[a.level] - rank[b.level];
      })) {
        const li = document.createElement('li');
        li.className = `pa-check is-${check.level}`;
        const head = document.createElement('div');
        head.className = 'pa-check-head';
        const badge = document.createElement('span');
        badge.className = `badge ${check.level === 'pass' ? 'ok' : check.level === 'warn' ? 'warn' : 'bad'}`;
        badge.textContent = check.level === 'pass' ? 'Pass' : check.level === 'warn' ? 'Warning' : 'Fail';
        const h3 = document.createElement('h3');
        h3.textContent = check.label;
        head.append(badge, h3);
        const body = document.createElement('p');
        body.textContent = check.detail;
        li.append(head, body);
        if (check.level !== 'pass' && check.fix) {
          const fix = document.createElement('p');
          fix.className = 'pa-fix';
          fix.textContent = `How to fix: ${check.fix}`;
          li.append(fix);
        }
        checksEl.appendChild(li);
      }
    }

    report = [
      `PDF accessibility report for ${facts.name}`,
      `Score: ${score}/100 (${grade})`,
      `Pages: ${facts.pages || 'unknown'} | Tagged: ${facts.structTree ? 'yes' : 'no'} | Language: ${facts.language || 'not set'} | Title: ${facts.title || 'not set'}`,
      '',
      ...checks.map((c) => `[${c.level.toUpperCase()}] ${c.label}: ${c.detail}${c.level !== 'pass' ? ` Fix: ${c.fix}` : ''}`),
      '',
      'Checked in the browser. This is a structural scan, not a full accessibility audit.',
    ].join('\n');
    copyBtn.disabled = false;
  }

  function showError(messages) {
    errorsEl.replaceChildren(...messages.map((m) => {
      const p = document.createElement('p');
      p.textContent = m;
      return p;
    }));
    visible(errorsEl, messages.length > 0);
  }

  async function analyse(file) {
    showError([]);
    visible(emptyEl, false);
    visible(resultsEl, false);
    if (file.size > MAX_BYTES) {
      showError([`${file.name} is ${sizeText(file.size)}; the limit is 50 MB.`]);
      visible(emptyEl, true);
      return;
    }
    if (fileEl) fileEl.textContent = file.name;
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const raw = latin1(bytes);
      const versionMatch = raw.slice(0, 1024).match(/%PDF-(\d\.\d)/);
      if (!versionMatch) throw new Error('This does not look like a PDF file.');
      const decoded = await decodedStreams(bytes, raw);

      const counts = {
        fonts: Math.max(
          count(raw, /\/BaseFont\b/g) + count(decoded, /\/BaseFont\b/g),
          count(raw, /\/(?:Type0|TrueType|Type1|Type3)\b/g) + count(decoded, /\/(?:Type0|TrueType|Type1|Type3)\b/g),
        ),
        toUnicode: count(raw, /\/ToUnicode\b/g) + count(decoded, /\/ToUnicode\b/g),
        images: count(raw, /\/Subtype\s*\/Image\b/g) + count(decoded, /\/Subtype\s*\/Image\b/g),
        alts: count(raw, /\/Alt\b/g) + count(decoded, /\/Alt\b/g),
        links: count(raw, /\/Subtype\s*\/Link\b/g) + count(decoded, /\/Subtype\s*\/Link\b/g),
        structParents: count(raw, /\/StructParent\b/g) + count(decoded, /\/StructParent\b/g),
        fields: count(raw, /\/FT\s*\/(?:Tx|Ch|Sig|Btn)\b/g) + count(decoded, /\/FT\s*\/(?:Tx|Ch|Sig|Btn)\b/g),
        tooltips: count(raw, /\/TU\b/g) + count(decoded, /\/TU\b/g),
        textOps: count(decoded, /\bTJ\b|\bTj\b/g),
      };

      const pageCounts = [
        count(raw, /\/Type\s*\/Page[^s]/g),
        count(decoded, /\/Type\s*\/Page[^s]/g),
        ...[...raw.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1])),
      ];
      const facts = {
        name: file.name,
        bytes: file.size,
        version: versionMatch[1],
        pages: Math.max(...pageCounts, 0),
        encrypted: /\/Encrypt\b/.test(raw) || /\/Encrypt\b/.test(decoded),
        structTree: /\/StructTreeRoot\b/.test(raw) || /\/StructTreeRoot\b/.test(decoded),
        displayDocTitle: /\/DisplayDocTitle\s+true\b/.test(raw) || /\/DisplayDocTitle\s+true\b/.test(decoded),
        outlines: /\/Outlines\b/.test(raw) || /\/Outlines\b/.test(decoded),
        xfa: /\/XFA\b/.test(raw) || /\/XFA\b/.test(decoded),
        language: pickLang(raw, decoded),
        title: pickTitle(raw, decoded),
        producer: (raw.match(/\/Producer\s*\(((?:\\.|[^)])*)\)/) || [])[1] || '',
        ...counts,
      };

      const checks = buildChecks(raw, decoded, facts);
      const penalty = checks.reduce((sum, c) => sum + (c.level === 'fail' ? 15 : c.level === 'warn' ? 5 : 0), 0);
      const score = Math.max(0, 100 - penalty);
      const grade = score >= 90 ? 'Looks accessible'
        : score >= 70 ? 'Minor issues'
          : score >= 45 ? 'Needs work' : 'Not accessible';

      render({ facts, checks, score, grade });
    } catch (error) {
      showError([error && error.message ? error.message : 'The PDF could not be read.']);
      visible(emptyEl, true);
    } finally {
      setBusy(false);
    }
  }

  function setBusy(on) {
    if (statusEl) statusEl.textContent = on ? 'Reading the PDF in your browser…' : '';
    root.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    input.value = '';
    if (file) analyse(file);
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
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) analyse(file);
  });

  copyBtn.addEventListener('click', async () => {
    const ok = await copyText(report);
    say(ok ? 'Copied the accessibility report' : 'Copy failed. Select the text and copy it manually.');
  });

  resetBtn.addEventListener('click', () => {
    report = '';
    if (fileEl) fileEl.textContent = '';
    visible(resultsEl, false);
    visible(emptyEl, true);
    showError([]);
    setBusy(false);
    copyBtn.disabled = true;
  });

  copyBtn.disabled = true;
}
