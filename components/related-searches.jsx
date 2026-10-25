// The visible "related searches" block.
//
// Semantic keywords earn their place by being useful to a reader, not by being
// present in a tag. This renders them as a browsable list where every linked
// term goes somewhere real, and unlinked terms are plain suggestions rather
// than targets the site claims to rank for.
//
// It is deliberately not a meta keywords tag and not a hidden div. A keyword
// list that exists only to be read by a crawler is the thing the original brief
// ruled out, and it does not survive a manual action.

import { semanticGroups } from '@/lib/semantic-keywords.js';

/**
 * @param path  the site path whose terms to show
 * @param title optional heading override
 * @param excludeRelations relation keys to leave out
 */
export function RelatedSearches({ path, title = 'Related searches', excludeRelations = [] }) {
  const groups = semanticGroups(path).filter((g) => !excludeRelations.includes(g.relation));
  if (!groups.length) return null;

  return (
    <section className="related-searches" aria-labelledby="related-searches-heading">
      <h2 id="related-searches-heading">{title}</h2>
      {groups.map((g) => (
        <div key={g.relation}>
          <h3>{g.label}</h3>
          <ul className="chip-list">
            {g.terms.map((t) => (
              <li key={t.term}>
                {t.href ? <a href={t.href}>{t.term}</a> : t.term}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}