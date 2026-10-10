// Builds the derived catalog shape: every index the request path needs, derived once.
// Shared by scripts/build-catalog.js (which persists it) and services/catalog.js (which
// rebuilds it if the persisted artifact is missing), so the two can never drift.
//
// Indexes are stored as *positions* into `styles` rather than copies of the records.
// JSON cannot express shared references, so duplicating records would triple the
// artifact's size; positions stay tiny and get re-linked into Maps at boot.

// Fields the request path actually reads. `example` is asserted by the tests only.
const KEEP = [
  'isPopular', 'isActive', 'indexable', 'id', 'slug', 'name', 'category',
  'type', 'pipeline', 'support', 'description', 'parent', 'marks', 'mapping', 'tags',
];

export function buildCache(fonts, categories, pages) {
  const styles = fonts.styles.filter((s) => s.isActive).map((s) => {
    const out = {};
    for (const k of KEEP) if (s[k] !== undefined) out[k] = s[k];
    return out;
  });

  const bySlug = {};
  const byCategory = {};
  const counts = {};
  const indexable = [];
  const popularIndexable = [];

  styles.forEach((s, i) => {
    bySlug[s.slug] = i;
    (byCategory[s.category] ||= []).push(i);
    counts[s.category] = (counts[s.category] || 0) + 1;
    if (s.indexable) {
      indexable.push(i);
      if (s.isPopular) popularIndexable.push(i);
    }
  });

  return {
    sample: fonts.sample,
    styles,
    bySlug,
    byCategory,
    counts,
    indexable,
    popularIndexable,
    categories,
    pages,
  };
}