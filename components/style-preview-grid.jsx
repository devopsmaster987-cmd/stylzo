// Compact showcase card for a curated style.
//
// Deliberately not a StyleRow. The generator above already renders up to
// PAGE_SIZE interactive rows with copy buttons, and duplicating that markup for
// every curated style triples the page weight for no benefit: these are visual
// samples that link through to the full style page. Keeping them free of
// `data-style-id` also keeps the generator's row count honest, which
// tests/integration/features.test.js guards.

import { getStyle } from '@/services/catalog.js';
import { applyStyle } from '@/services/unicode/engine.js';
import { env } from '@/config/environment.js';
import { SUPPORT_LABEL } from '@/lib/pages.js';

export function stylePreviews(slugs, text) {
  return slugs
    .map(getStyle)
    .filter((s) => s && s.indexable)
    .map((s) => ({
      id: s.id,
      name: s.name,
      href: `/fonts/${s.slug}`,
      supportLabel: SUPPORT_LABEL[s.support],
      output: applyStyle(text, s, { maxLength: env.ssrTextLimit }),
    }));
}

export function StylePreviewGrid({ items }) {
  if (!items.length) return null;
  return (
    <ul className="preview-grid">
      {items.map((s) => (
        <li key={s.id} className="preview-card">
          <h3 className="preview-name"><a href={s.href}>{s.name}</a></h3>
          <p className="preview-out" aria-hidden="true">{s.output}</p>
          <p className="preview-support">
            <a href={s.href}>{s.supportLabel}</a>
          </p>
        </li>
      ))}
    </ul>
  );
}