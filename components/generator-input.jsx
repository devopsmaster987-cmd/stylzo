import { env } from '@/config/environment.js';

export function GeneratorInput({ formAction = '/', text = '' }) {
  return (
    <form className="gen" method="get" action={formAction} role="search" aria-label="Text to style">
      <label className="gen-label" htmlFor="text-input">Your text</label>
      <textarea
        id="text-input"
        name="text"
        data-input
        rows="2"
        maxLength={env.maxInputLength}
        spellCheck="false"
        autoComplete="off"
        data-sample={text}
        defaultValue={text}
        placeholder="Type or paste text"
      />
      <div className="gen-tools">
        <span className="count"><span data-count>{Array.from(text).length}</span> / {env.maxInputLength} characters</span>
        <button type="button" className="btn ghost" data-paste hidden>Paste</button>
        <button type="button" className="btn ghost" data-clear hidden>Clear</button>
        <noscript><button type="submit" className="btn">Generate</button></noscript>
      </div>
    </form>
  );
}