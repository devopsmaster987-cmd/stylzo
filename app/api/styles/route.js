import { catalog, getStyle, pageStyles, apiStylesPayload } from '@/services/catalog.js';
import { cleanText, SLUG_RE } from '@/lib/validation.js';
import { env } from '@/config/environment.js';
import { applyStyle } from '@/services/unicode/engine.js';
import { handle, jsonResponse, rawJsonResponse } from '@/lib/api.js';

const asInt = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);

// Compact style list for the browser engine: id + resolved pipeline only.
// Also serves paginated pages (?category&offset&limit&text) and id batches (?ids=).
export const GET = handle((request) => {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids');
  const category = searchParams.get('category');
  const offset = searchParams.get('offset');
  const limit = searchParams.get('limit');
  const text = searchParams.get('text');

  if (ids) {
    const list = String(ids).split(',').filter((id) => SLUG_RE.test(id)).slice(0, 120);
    const found = list.map((id) => getStyle(id)).filter(Boolean).map((s) => ({ id: s.id, pipeline: s.pipeline }));
    return jsonResponse({ styles: found }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  }

  if (category !== null || offset !== null || limit !== null) {
    if (category && !catalog().categories[category]) {
      const err = new Error('Unknown category.');
      err.status = 404;
      err.code = 'not_found';
      throw err;
    }
    const off = Math.max(0, asInt(offset, 0));
    const lim = Math.min(200, Math.max(1, asInt(limit, 48)));
    const { total, items } = pageStyles({ category, offset: off, limit: lim });
    const value = cleanText(text, { max: env.maxInputLength }) || catalog().sample;
    const cache = text ? 'private, max-age=0' : 'public, max-age=300, stale-while-revalidate=86400';
    return jsonResponse(
      {
        total,
        offset: off,
        limit: lim,
        sample: catalog().sample,
        styles: items.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          category: s.category,
          support: s.support,
          output: applyStyle(value, s, { maxLength: env.ssrTextLimit }),
          pipeline: s.pipeline,
        })),
      },
      { headers: { 'Cache-Control': cache } },
    );
  }

  // Whole-catalog payload. Identical on every request, so it was serialized once at
  // process start rather than re-encoding 0.8 MB per hit.
  return rawJsonResponse(
    apiStylesPayload(),
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400' } },
  );
});