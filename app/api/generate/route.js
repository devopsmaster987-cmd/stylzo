import { getStyle } from '@/services/catalog.js';
import { cleanText, httpError, SLUG_RE } from '@/lib/validation.js';
import { applyStyle } from '@/services/unicode/engine.js';
import { handle, readJson, rateLimit, jsonResponse } from '@/lib/api.js';

// Server-side generation for batch/compare and clients without the engine.
export const POST = handle(async (request) => {
  const rl = rateLimit(request);
  const body = await readJson(request);
  const text = cleanText(body.text, { required: true });

  let ids = body.styles;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50) {
    throw httpError(400, 'styles_invalid', 'Send between 1 and 50 style ids.');
  }
  if (!ids.every((id) => typeof id === 'string' && SLUG_RE.test(id))) {
    throw httpError(400, 'styles_invalid', 'Style ids must be slugs.');
  }
  ids = [...new Set(ids)];

  const results = ids.map((id) => {
    const style = getStyle(id);
    return style ? { id, output: applyStyle(text, style) } : { id, error: 'unknown_style' };
  });

  return jsonResponse({ results }, { headers: rl });
});