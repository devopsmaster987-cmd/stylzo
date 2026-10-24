import { copyText, say } from './lib.js';

const root = document.querySelector('[data-fix-tool]');
if (root) {
  const input = root.querySelector('[data-fix-input]');
  const out = root.querySelector('[data-fix-out]');
  const summary = root.querySelector('[data-fix-summary]');
  const copyBtn = root.querySelector('[data-fix-copy]');
  const resetBtn = root.querySelector('[data-fix-reset]');
  const runBtn = root.querySelector('[data-fix-run]');
  const options = Array.from(root.querySelectorAll('[data-fix-option]'));

  const TYPOS = {
    teh: 'the', adn: 'and', alot: 'a lot', incase: 'in case', infront: 'in front',
    eachother: 'each other', noone: 'no one', atleast: 'at least', aslong: 'as long',
    recieve: 'receive', recieved: 'received', seperate: 'separate', seperated: 'separated',
    definately: 'definitely', occured: 'occurred', occuring: 'occurring', untill: 'until',
    wierd: 'weird', thier: 'their', sucess: 'success', succesful: 'successful',
    accross: 'across', arguement: 'argument', begining: 'beginning', beleive: 'believe',
    calender: 'calendar', cemetary: 'cemetery', changable: 'changeable', comming: 'coming',
    enviroment: 'environment', existance: 'existence', familar: 'familiar', finaly: 'finally',
    foriegn: 'foreign', goverment: 'government', gaurd: 'guard', happend: 'happened',
    harrass: 'harass', immediatly: 'immediately', independant: 'independent',
    knowlege: 'knowledge', liesure: 'leisure', liason: 'liaison', maintainance: 'maintenance',
    neccessary: 'necessary', noticable: 'noticeable', occassion: 'occasion', pasttime: 'pastime',
    peice: 'piece', posession: 'possession', prefered: 'preferred', priviledge: 'privilege',
    publically: 'publicly', recomend: 'recommend', refered: 'referred', relevent: 'relevant',
    religous: 'religious', rember: 'remember', responsability: 'responsibility', rythm: 'rhythm',
    supress: 'suppress', tatoo: 'tattoo', tendancy: 'tendency', threshhold: 'threshold',
    tommorrow: 'tomorrow', twelth: 'twelfth', unneccessary: 'unnecessary', usualy: 'usually',
    vaccuum: 'vacuum', vegtable: 'vegetable', vehical: 'vehicle', visable: 'visible',
  };

  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const preserve = (match, replacement) => {
    if (match === match.toUpperCase() && match.length > 1) return replacement.toUpperCase();
    if (match[0] === match[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }
    return replacement;
  };
  const count = (text, re) => (text.match(re) || []).length;

  const RULES = {
    invisible(text) {
      const re = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\uFEFF\u00AD]/g;
      const n = count(text, re);
      return { text: text.replace(re, ''), n, label: 'invisible characters removed' };
    },
    spaces(text) {
      let n = 0;
      const next = text
        .replace(/[ \t]+/g, (m) => (m.length > 1 ? (n += m.length - 1, ' ') : m))
        .replace(/[ \t]+\n/g, (m) => (n += m.length - 1, '\n'))
        .replace(/\n{3,}/g, (m) => (n += m.length - 2, '\n\n'))
        .replace(/^\s+|\s+$/g, (m) => (m ? (n += m.length, '') : m));
      return { text: next, n, label: 'spacing and blank lines tidied' };
    },
    punctuation(text) {
      let n = 0;
      let next = text
        .replace(/[‘’‚‛]/g, () => (n++, "'"))
        .replace(/[“”„‟]/g, () => (n++, '"'))
        .replace(/[–—−]/g, () => (n++, '-'))
        .replace(/…/g, () => (n++, '...'))
        .replace(/(\S)[ \t]+([,.;:!?])/g, (m, a, b) => (n++, a + b))
        .replace(/([,;:])(?=[^\s\d])/g, (m) => (n++, m + ' '));
      next = next.replace(/([!?.,]){3,}/g, (m) => {
        n += m.length - 1;
        return m[0].repeat(Math.min(m.length, 3));
      });
      return { text: next, n, label: 'punctuation and quotes normalised' };
    },
    casing(text) {
      let n = 0;
      const next = text
        .replace(/(^|[.!?]\s+)([a-z])/g, (m, lead, ch) => (n++, lead + ch.toUpperCase()))
        .replace(/\bi\b/g, () => (n++, 'I'));
      return { text: next, n, label: 'sentence capitalisation applied' };
    },
    duplicates(text) {
      let n = 0;
      const next = text
        .replace(/\b(\w+)(\s+\1\b)+/gi, (m, word) => (n += m.trim().split(/\s+/).length - 1, word))
        .replace(/([,.;:!?])\1+/g, (m) => (n += m.length - 1, m[0]));
      return { text: next, n, label: 'repeated words and marks collapsed' };
    },
    typos(text) {
      let n = 0;
      let next = text;
      for (const [bad, good] of Object.entries(TYPOS)) {
        const re = new RegExp(`\\b${escape(bad)}\\b`, 'gi');
        next = next.replace(re, (m) => (n++, preserve(m, good)));
      }
      next = next
        .replace(/\b(could|should|would)\s+of\b/gi, (m, verb) => (n++, `${verb} have`));
      return { text: next, n, label: 'common misspellings fixed' };
    },
  };

  const ORDER = ['invisible', 'spaces', 'punctuation', 'casing', 'duplicates', 'typos'];
  const enabled = () => new Set(options.filter((o) => o.checked).map((o) => o.value));

  let lastOutput = '';

  function run() {
    const source = input.value;
    const active = enabled();
    let text = source;
    const parts = [];
    for (const id of ORDER) {
      if (!active.has(id)) continue;
      const result = RULES[id](text);
      text = result.text;
      if (result.n > 0) parts.push(`${result.n} ${result.label}`);
    }
    lastOutput = text;
    out.value = text;
    copyBtn.disabled = !text;
    if (!source) {
      summary.textContent = 'Paste or type some text to fix it.';
    } else if (!parts.length) {
      summary.textContent = 'Nothing to fix — the text already looks clean.';
    } else {
      summary.textContent = `Fixed ${parts.join(', ')}.`;
    }
  }

  let timer = 0;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, 150);
  };

  input.addEventListener('input', schedule);
  for (const option of options) option.addEventListener('change', run);
  runBtn.addEventListener('click', run);
  resetBtn.addEventListener('click', () => {
    input.value = '';
    out.value = '';
    lastOutput = '';
    for (const option of options) option.checked = true;
    copyBtn.disabled = true;
    summary.textContent = 'Paste or type some text to fix it.';
    input.focus();
  });
  copyBtn.addEventListener('click', async () => {
    const ok = await copyText(out.value);
    say(ok ? 'Copied the fixed text' : 'Copy failed. Select the text and copy it manually.');
  });

  run();
}
