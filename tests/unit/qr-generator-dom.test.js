import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

// This runs public/js/qr-code-generator.js for real, against a hand-written DOM
// stub.
//
// It exists because of a bug that shipped. The module called `applyLogoEcl`
// where the function was `applyLogoEcc` — one character. `node --check` passed,
// the build passed, the integration suite passed, and the page rendered perfectly
// with every control in place. Nothing generated, because the reference threw a
// ReferenceError the first time anybody typed. Every test in the suite was
// satisfied by a file that could not do its one job.
//
// The lesson is that a static check cannot find this. Reading the module for the
// strings it looks for proves the page and the script agree about naming; it
// says nothing about whether the script runs. So this harness supplies the slice
// of DOM the module actually touches and executes it, and a typo becomes a
// failing test instead of a broken page.
//
// No dependency is added for it. A full DOM library would mean one, and this
// project has none by design.

const CALLS = { fillRect: 0, drawImage: 0, bg: null, dark: 0, toBlob: 0 };
const resetCalls = () => { for (const key of Object.keys(CALLS)) CALLS[key] = 0; };

const FIELD_NAMES = {
  url: ['url'],
  text: ['text'],
  wifi: ['ssid', 'wifiSecurity', 'password', 'wifiHidden'],
  email: ['emailAddress', 'emailSubject', 'emailBody'],
  phone: ['phoneNumber'],
  sms: ['phoneNumber', 'smsBody'],
  whatsapp: ['phoneNumber', 'whatsappMessage'],
  vcard: ['vFirst', 'vLast', 'vOrg', 'vTitle', 'vPhone', 'vEmail', 'vUrl', 'vAddress', 'vNote'],
  location: ['latitude', 'longitude', 'locationLabel', 'mapsProvider'],
  event: ['eventSummary', 'eventLocation', 'eventStart', 'eventEnd', 'eventDescription'],
};

class El {
  constructor(tag = 'div', attrs = {}) {
    this.tagName = tag.toUpperCase();
    this.dataset = {};
    this.attrs = { ...attrs };
    this.listeners = new Map();
    this.children = [];
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.value = '';
    this.type = 'text';
    this.ownText = '';
    this.className = '';
    this.style = {};
    this.files = null;
    this.width = 0;
    this.height = 0;
    this.fillStyle = '';
    // A panel has to really contain fields: the module reads a panel's values
    // with $$('[data-qr-field]', panel), and returning an empty list here would
    // make every payload empty and the harness would pass for the wrong reason.
    this.fields = [];

    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith('data-')) {
        this.dataset[key.slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = value;
      }
    }
  }

  /**
   * Setting it clears the children, and reading it returns everything inside.
   *
   * The module builds its error list by appending <p> elements, and the tests
   * assert on the result. A plain string property would report "" for markup the
   * browser would render, so the assertions would be checking nothing.
   */
  get textContent() {
    return this.ownText + this.children.map((child) => child.textContent).join('');
  }

  set textContent(value) {
    this.ownText = String(value);
    this.children = [];
  }

  setAttribute(name, value) { this.attrs[name] = String(value); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  hasAttribute(name) { return name in this.attrs; }
  appendChild(node) { this.children.push(node); return node; }
  remove() {}
  focus() {}
  scrollIntoView() {}
  /** Returns this element when it carries the hook the selector asks for. */
  closest(selector) {
    const hook = /data-([a-z-]+)/.exec(String(selector));
    if (!hook) return null;
    const key = hook[1].replace(/-(\w)/g, (_, c) => c.toUpperCase());
    return key in this.dataset ? this : null;
  }

  matches() { return false; }

  querySelector(selector) {
    return String(selector).includes('data-qr-field') ? this.fields[0] || null : null;
  }

  querySelectorAll(selector) {
    return String(selector).includes('data-qr-field') ? this.fields : [];
  }

  getContext() {
    const self = this;
    return {
      set fillStyle(value) { self.fillStyle = value; },
      get fillStyle() { return self.fillStyle; },
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      fillRect(x, y, w, h) {
        CALLS.fillRect += 1;
        if (x === 0 && y === 0 && w === self.width && h === self.height) CALLS.bg = self.fillStyle;
        else if (self.fillStyle === '#1b1533') CALLS.dark += 1;
      },
      drawImage() { CALLS.drawImage += 1; },
    };
  }

  toBlob(callback) { CALLS.toBlob += 1; callback({ type: 'image/png', size: 1024 }); }
  toDataURL() { return 'data:image/png;base64,AAAA'; }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }

  /** Fire the handlers this element registered, as a descendant's event would. */
  fireFrom(origin, type) {
    for (const handler of this.listeners.get(type) || []) {
      handler.call(origin, {
        type, bubbles: true, target: origin, preventDefault() {},
      });
    }
  }

  fire(type) {
    for (const handler of this.listeners.get(type) || []) {
      handler.call(this, { type, bubbles: true, target: this, preventDefault() {} });
    }
  }
}

/**
 * A document whose selectors resolve to real elements, auto-vivified.
 *
 * Auto-vivification is deliberate: the module's `$('[data-qr-canvas]')` finds an
 * element whether or not the page renders one, so the "is this hook on the page"
 * question stays in the integration suite and this harness stays about whether
 * the code runs.
 */
function makeDocument() {
  const registry = new Map();
  const elementFor = (selector) => {
    if (!registry.has(selector)) {
      const attrs = {};
      const hook = /data-qr-([a-z-]+)/.exec(selector);
      if (hook) attrs[`data-qr-${hook[1]}`] = '';
      registry.set(selector, new El(hook && selector.includes('canvas') ? 'canvas' : 'div', attrs));
    }
    return registry.get(selector);
  };

  for (const [type, names] of Object.entries(FIELD_NAMES)) {
    elementFor(`[data-qr-panel="${type}"]`).fields = names.map((name) => {
      const field = new El('input', { 'data-qr-field': name });
      field.type = name.endsWith('Hidden') ? 'checkbox' : 'text';
      return field;
    });
  }

  const document = {
    querySelector: (s) => elementFor(s),
    querySelectorAll: (s) => [elementFor(s)],
    createElement: (tag) => new El(tag),
    addEventListener() {},
  };
  return { document, elementFor };
}

let bootCount = 0;

/** Stand the module up against a fresh stub and return handles for the tests. */
async function boot() {
  resetCalls();
  const { document, elementFor } = makeDocument();
  const errors = [];

  const overrides = {
    document,
    window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
    navigator: { clipboard: null },
    // The module debounces its preview by 120ms; the stub collapses that so a
    // test does not have to wait for it.
    setTimeout: (fn) => { fn(); return 0; },
    clearTimeout() {},
    Image: class {},
    FileReader: class {},
    Blob: class {},
  };
  const saved = {};
  for (const [key, value] of Object.entries(overrides)) {
    saved[key] = globalThis[key];
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  }

  const onError = (error) => errors.push((error && error.stack) || String(error));
  process.on('uncaughtException', onError);
  process.on('unhandledRejection', onError);

  try {
    bootCount += 1;
    await import(`file:///C:/Users/LENOVO/.ssh/stylzo/public/js/qr-code-generator.js?boot=${bootCount}`);
  } catch (error) {
    errors.push(`import failed: ${error.stack || error}`);
  }

  return {
    errors,
    elementFor,
    /** Switch tabs the way the tab bar does, so state.type actually changes. */
    switchTo(type) {
      const button = elementFor(`[data-qr-type="${type}"]`);
      button.dataset.qrType = type;
      elementFor('[data-qr-tabs]').fireFrom(button, 'click');
    },
    /** Type into a QR type's fields, the way a visitor would. */
    fill(type, values) {
      const panel = elementFor(`[data-qr-panel="${type}"]`);
      for (const field of panel.fields) {
        const name = field.dataset.qrField;
        if (!(name in values)) continue;
        if (field.type === 'checkbox') field.checked = values[name];
        else field.value = values[name];
      }
      elementFor('[data-qr-panels]').fireFrom(panel, 'input');
    },
    teardown() {
      process.off('uncaughtException', onError);
      process.off('unhandledRejection', onError);
      for (const [key, value] of Object.entries(saved)) {
        Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
      }
    },
  };
}

const flush = () => new Promise((resolve) => { setImmediate(resolve); });

describe('qr generator interface', () => {
  test('loads without throwing', async () => {
    const app = await boot();
    try {
      assert.deepEqual(app.errors, [], 'the module threw while loading');
    } finally {
      app.teardown();
    }
  });

  test('an empty form shows the empty state rather than an error', async () => {
    const app = await boot();
    try {
      // Nobody has typed anything yet. A red "enter a web address" on arrival
      // reads as a broken tool rather than as an invitation.
      assert.equal(app.elementFor('[data-qr-canvas]').hidden, true);
      assert.equal(app.elementFor('[data-qr-errors]').hidden, true);
      assert.deepEqual(app.errors, []);
    } finally {
      app.teardown();
    }
  });

  test('typing a URL paints the code', async () => {
    const app = await boot();
    try {
      const canvas = app.elementFor('[data-qr-canvas]');
      app.fill('url', { url: 'https://example.com' });
      await flush();

      assert.deepEqual(app.errors, [], `the module threw: ${app.errors[0] || ''}`);
      assert.equal(canvas.hidden, false, 'the canvas is still hidden after typing');
      assert.equal(canvas.width, 512, 'the canvas was not sized to the export size');
      assert.equal(app.elementFor('[data-qr-payload]').textContent, 'https://example.com/',
        'the wrong payload was encoded');
      // A version 2 symbol is 25 modules square. Counting the dark fills is what
      // proves it drew, rather than merely unhiding an empty canvas.
      assert.ok(CALLS.dark > 100 && CALLS.dark < 700,
        `expected a few hundred dark modules, drew ${CALLS.dark}`);
      assert.equal(CALLS.bg, '#ffffff', 'the background was not filled first');
      assert.equal(app.elementFor('[data-qr-download-png]').disabled, false,
        'the download did not become available');
      assert.match(app.elementFor('[data-qr-status]').textContent, /version \d+/);
    } finally {
      app.teardown();
    }
  });

  test('an empty required field is reported, and no code is shown', async () => {
    const app = await boot();
    try {
      app.fill('url', { url: '' });
      await flush();
      assert.equal(app.elementFor('[data-qr-errors]').hidden, false);
      assert.match(app.elementFor('[data-qr-errors]').textContent, /web address/i);
      assert.equal(app.elementFor('[data-qr-canvas]').hidden, true,
        'a code was shown for input that has an error');
      assert.deepEqual(app.errors, []);
    } finally {
      app.teardown();
    }
  });

  test('a value too long for a QR code is reported, not silently truncated', async () => {
    const app = await boot();
    try {
      app.switchTo('text');
      app.fill('text', { text: 'x'.repeat(4000) });
      await flush();
      assert.deepEqual(app.errors, []);
      assert.match(app.elementFor('[data-qr-errors]').textContent, /too long/i);
      assert.equal(app.elementFor('[data-qr-canvas]').hidden, true);
    } finally {
      app.teardown();
    }
  });

  test('Generate rebuilds the code and moves focus to the download', async () => {
    const app = await boot();
    try {
      app.fill('url', { url: 'https://example.com' });
      await flush();
      CALLS.dark = 0;
      app.elementFor('[data-qr-generate]').fire('click');
      await flush();
      assert.deepEqual(app.errors, [], `Generate threw: ${app.errors[0] || ''}`);
      assert.ok(CALLS.dark > 100, 'Generate did not redraw the code');
      assert.equal(app.elementFor('[data-qr-canvas]').hidden, false);
    } finally {
      app.teardown();
    }
  });

  test('every function the module calls is one it declares', async () => {
    // The check that would have caught applyLogoEcl / applyLogoEcc on its own,
    // without a DOM: reading the file for strings cannot, because both spellings
    // are plausible identifiers and only execution proves which one resolves.
    const { readFileSync } = await import('node:fs');
    const raw = readFileSync(
      new URL('../../public/js/qr-code-generator.js', import.meta.url), 'utf8',
    );

    // Comments and parameter lists are handled first. A naive scan reads
    // "the QR encoder (" in a comment and "resolve, reject" in a promise as
    // undefined functions, and a check that cries wolf is one nobody runs.
    const source = raw
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:'"])\/\/[^\n]*/g, '$1 ');

    const words = (text) => [...text.matchAll(/[A-Za-z_$][\w$]*/g)].map((m) => m[0]);
    const capture = (pattern) => [...source.matchAll(pattern)].flatMap((m) => words(m[1]));

    const declared = new Set([
      ...[...source.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]),
      ...[...source.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)].map((m) => m[1]),
      ...[...source.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]),
      // Destructuring, which this file uses throughout.
      ...capture(/\b(?:const|let|var)\s*\{([^}]*)\}/g),
      // Imported bindings.
      ...[...source.matchAll(/import\s*\{([^}]*)\}/g)]
        .flatMap((m) => m[1].split(',').map((n) => n.trim())),
      // Every parameter binding anywhere.
      ...capture(/\(([^()]*)\)\s*=>/g),
      ...capture(/function[^()]*\(([^()]*)\)\s*\{/g),
      ...capture(/\bcatch\s*\(([^)]*)\)/g),
      // The platform.
      ...['console', 'window', 'document', 'navigator', 'Math', 'Number', 'String',
        'Boolean', 'Array', 'Object', 'JSON', 'Promise', 'Error', 'Set', 'Map',
        'Uint8Array', 'TextEncoder', 'Image', 'FileReader', 'Blob', 'URL', 'CustomEvent',
        'setTimeout', 'clearTimeout', 'parseInt', 'isFinite', 'encodeURIComponent',
        'decodeURIComponent', 'Intl', 'queueMicrotask'],
    ]);

    const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'typeof',
      'function', 'await', 'async', 'new', 'do', 'else', 'try', 'throw', 'of', 'in',
      'delete', 'void', 'yield', 'instanceof', 'case', 'break', 'continue', 'const',
      'let', 'var', 'class', 'extends', 'this', 'null', 'undefined', 'true', 'false']);

    const called = new Set(
      [...source.matchAll(/(?<![.\w$])([a-z_$][\w$]*)\s*\(/g)]
        .map((m) => m[1])
        .filter((name) => !KEYWORDS.has(name)),
    );

    const undeclared = [...called].filter((name) => !declared.has(name));
    assert.deepEqual(undeclared, [],
      `the module calls ${undeclared.join(', ')}, which it never declares. A typo here is a `
      + 'runtime ReferenceError the first time anyone uses the tool, and no other check catches it');
  });
});
