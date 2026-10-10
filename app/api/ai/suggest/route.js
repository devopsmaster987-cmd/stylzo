import { catalog, getStyle } from '@/services/catalog.js';
import { cleanText } from '@/lib/validation.js';
import { env } from '@/config/environment.js';
import { applyStyle } from '@/services/unicode/engine.js';
import { suggestStyles } from '@/services/ai.js';
import { handle, rateLimit, jsonResponse } from '@/lib/api.js';

// M7 - AI stylist recommendations.
export const GET = handle(async (request) => {
  const rl = rateLimit(request);
  const { searchParams } = new URL(request.url);
  const text = cleanText(searchParams.get('text'), { max: env.maxInputLength });
  const vibe = typeof searchParams.get('vibe') === 'string' ? searchParams.get('vibe') : '';

  const out = await suggestStyles({ text, vibe });
  const styles = [...out.ids, ...out.extra]
    .map((id) => getStyle(id))
    .filter(Boolean)
    .map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      category: s.category,
      support: s.support,
      output: applyStyle(text || catalog().sample, s, { maxLength: env.ssrTextLimit }),
    }));

  return jsonResponse(
    { engine: out.engine, reasons: out.reasons, styles },
    { headers: { ...rl, 'Cache-Control': 'no-store' } },
  );
});