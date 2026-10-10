export function StyleRow({ s }) {
  // The keyword board renders the same row in 25 styles. `word` is the sample the row
  // falls back to and `emojiBefore`/`emojiAfter` is the decoration split around it, so
  // the live script can wrap typed text without re-deriving which emoji goes where.
  const before = s.emojiBefore;
  const after = s.emojiAfter;
  return (
    <li className="row" data-style-id={s.id} data-word={s.word || undefined}>
      <div className="row-meta">
        <h3 className="row-name"><a href={`/fonts/${s.slug}`}>{s.name}</a></h3>
        <p className="row-support" data-support={s.support}>{s.supportLabel}</p>
      </div>
      <p className="out" data-output data-emoji-before={before ? before.join(' ') : undefined} data-emoji-after={after ? after.join(' ') : undefined}>{s.output}</p>
      <div className="row-actions">
        <button type="button" className="btn" data-copy data-copy-text={s.copyText || s.output} aria-label={`Copy ${s.name}`}>Copy</button>
      </div>
    </li>
  );
}